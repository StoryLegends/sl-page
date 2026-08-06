package com.datapeice.slbackend.websocket;

import com.datapeice.slbackend.controller.MinecraftServerController;
import com.datapeice.slbackend.entity.MinecraftServer;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.entity.UserRole;
import com.datapeice.slbackend.repository.UserRepository;
import com.datapeice.slbackend.security.JwtCore;
import com.datapeice.slbackend.service.CustomUserDetailsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AdminWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(AdminWebSocketHandler.class);

    private final JwtCore jwtCore;
    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final MinecraftServerController minecraftServerController;

    // Active WebSocket sessions
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public AdminWebSocketHandler(JwtCore jwtCore, 
                                 CustomUserDetailsService userDetailsService, 
                                 UserRepository userRepository, 
                                 ObjectMapper objectMapper,
                                 @Lazy MinecraftServerController minecraftServerController) {
        this.jwtCore = jwtCore;
        this.userDetailsService = userDetailsService;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.minecraftServerController = minecraftServerController;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        URI uri = session.getUri();
        if (uri == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        Map<String, String> params = parseQueryParams(uri.getQuery());
        String token = params.get("token");
        String serverId = params.getOrDefault("serverId", "server-1");

        if (token == null || token.isBlank()) {
            logger.warn("WebSocket connection rejected: Missing token");
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        try {
            String username = jwtCore.getUsernameFromToken(token);
            if (username == null) {
                session.close(CloseStatus.POLICY_VIOLATION);
                return;
            }

            User user = (User) userDetailsService.loadUserByUsername(username);
            
            String ipAddress = (String) session.getAttributes().getOrDefault("ipAddress", "127.0.0.1");
            String userAgent = (String) session.getAttributes().getOrDefault("userAgent", "Unknown");

            if (!jwtCore.validateToken(token, ipAddress, userAgent, user.getTokenVersion())) {
                logger.warn("WebSocket connection rejected: Token validation failed for user {}", username);
                session.close(CloseStatus.POLICY_VIOLATION);
                return;
            }

            if (user.getRole() != UserRole.ROLE_ADMIN && user.getRole() != UserRole.ROLE_MODERATOR) {
                logger.warn("WebSocket connection rejected: User {} is not an admin/moderator", username);
                session.close(CloseStatus.POLICY_VIOLATION);
                return;
            }

            session.getAttributes().put("username", username);
            session.getAttributes().put("serverId", serverId);
            
            sessions.put(session.getId(), session);
            logger.info("WebSocket connection established for admin: {}, session: {}, serverId: {}", 
                    username, session.getId(), serverId);

        } catch (Exception e) {
            logger.error("Error during WebSocket handshake/auth: {}", e.getMessage());
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session.getId());
        logger.info("WebSocket connection closed for session: {}, reason: {}", session.getId(), status.getReason());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        try {
            Map<String, Object> request = objectMapper.readValue(payload, Map.class);
            String type = (String) request.get("type");
            
            if ("command".equals(type)) {
                String cmd = (String) request.get("command");
                String serverId = (String) session.getAttributes().getOrDefault("serverId", "server-1");
                logger.info("Command received from session {}: {} for server {}", session.getId(), cmd, serverId);
                
                Map<String, String> cmdBody = Map.of("command", cmd, "serverId", serverId);
                minecraftServerController.executeCommand(cmdBody);
            }
        } catch (Exception e) {
            logger.warn("Failed to parse incoming WebSocket message: {}", payload);
        }
    }

    /**
     * Broadcast live server status & metrics over WebSocket every 3 seconds to active sessions
     */
    @Scheduled(fixedRate = 3000)
    public void broadcastStatusAndMetrics() {
        if (sessions.isEmpty()) {
            return;
        }

        List<MinecraftServer> servers = minecraftServerController.getRegisteredServersList();
        if (servers == null || servers.isEmpty()) {
            return;
        }

        for (MinecraftServer server : servers) {
            String serverId = server.getServerId();
            try {
                var statusResp = minecraftServerController.getStatus(serverId).getBody();
                if (statusResp != null) {
                    broadcastToTopic("/topic/minecraft/status/" + serverId, statusResp);
                    broadcastToTopic("/topic/minecraft/status", statusResp);
                }

                var logsResp = minecraftServerController.getConsoleLogs(serverId).getBody();
                if (logsResp != null && logsResp.containsKey("logs")) {
                    broadcastToTopic("/topic/minecraft/logs/" + serverId, logsResp);
                    broadcastToTopic("/topic/minecraft/logs", logsResp);
                }
            } catch (Exception e) {
                logger.warn("WebSocket status broadcast error for server {}: {}", serverId, e.getMessage());
            }
        }
    }

    /**
     * Broadcast a message to all connected admin sessions subscribed to a specific topic.
     */
    public void broadcastToTopic(String topic, Object data) {
        Map<String, Object> message = new HashMap<>();
        message.put("topic", topic);
        message.put("data", data);

        // Standardize format for legacy React useAdminWebSocket wrapper
        if (topic.startsWith("/topic/minecraft/status")) {
            message.put("type", "metrics");
            if (data instanceof Map) {
                Map<?, ?> dataMap = (Map<?, ?>) data;
                for (Map.Entry<?, ?> entry : dataMap.entrySet()) {
                    message.put(String.valueOf(entry.getKey()), entry.getValue());
                }
                message.put("cpu", dataMap.getOrDefault("cpuUsagePercent", 0.0));
                message.put("ramUsedMb", dataMap.getOrDefault("memoryUsedMb", 0));
                message.put("ramMaxMb", dataMap.getOrDefault("memoryMaxMb", 4096));
                message.put("tps", dataMap.getOrDefault("tps", 20.0));
                message.put("onlinePlayers", dataMap.getOrDefault("onlinePlayers", 0));
                message.put("status", dataMap.getOrDefault("status", "OFFLINE"));
            }
        } else if (topic.startsWith("/topic/minecraft/logs")) {
            message.put("type", "log");
            if (data instanceof Map && ((Map<?, ?>) data).containsKey("logs")) {
                List<?> logs = (List<?>) ((Map<?, ?>) data).get("logs");
                for (Object logLine : logs) {
                    sendJsonToAllSessions(Map.of("type", "log", "message", String.valueOf(logLine)), null);
                }
                return;
            } else if (data instanceof Map && ((Map<?, ?>) data).containsKey("output")) {
                message.put("message", ((Map<?, ?>) data).get("output"));
            } else {
                message.put("message", String.valueOf(data));
            }
        }

        sendJsonToAllSessions(message, topic);
    }

    private void sendJsonToAllSessions(Object messageObj, String topic) {
        String json;
        try {
            json = objectMapper.writeValueAsString(messageObj);
        } catch (Exception e) {
            logger.error("Failed to serialize WebSocket message to JSON", e);
            return;
        }

        TextMessage textMessage = new TextMessage(json);
        for (WebSocketSession session : sessions.values()) {
            if (session.isOpen()) {
                if (topic != null && topic.contains("/minecraft/")) {
                    String sessionServerId = (String) session.getAttributes().getOrDefault("serverId", "server-1");
                    if (!topic.contains("/" + sessionServerId)) {
                        continue;
                    }
                }
                try {
                    session.sendMessage(textMessage);
                } catch (IOException e) {
                    logger.debug("Failed to send message to session: {}", session.getId());
                }
            }
        }
    }

    public Map<String, WebSocketSession> getSessions() {
        return sessions;
    }

    private Map<String, String> parseQueryParams(String query) {
        Map<String, String> params = new HashMap<>();
        if (query == null || query.isBlank()) {
            return params;
        }
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf("=");
            if (idx > 0 && idx < pair.length() - 1) {
                params.put(pair.substring(0, idx), pair.substring(idx + 1));
            }
        }
        return params;
    }
}
