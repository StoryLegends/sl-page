package com.datapeice.slbackend.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Controller;

import java.util.*;

@Controller
public class MinecraftWebSocketController {

    private static final Logger logger = LoggerFactory.getLogger(MinecraftWebSocketController.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final MinecraftServerController minecraftServerController;

    public MinecraftWebSocketController(SimpMessagingTemplate messagingTemplate, MinecraftServerController minecraftServerController) {
        this.messagingTemplate = messagingTemplate;
        this.minecraftServerController = minecraftServerController;
    }

    /**
     * Broadcast live server status & metrics over WebSocket every 3 seconds
     */
    @Scheduled(fixedRate = 3000)
    public void broadcastStatusAndMetrics() {
        List<Map<String, Object>> servers = minecraftServerController.getRegisteredServersList();
        if (servers == null || servers.isEmpty()) {
            return;
        }

        for (Map<String, Object> server : servers) {
            String serverId = String.valueOf(server.get("id"));
            try {
                var statusResp = minecraftServerController.getStatus(serverId).getBody();
                if (statusResp != null) {
                    messagingTemplate.convertAndSend("/topic/minecraft/status/" + serverId, statusResp);
                    messagingTemplate.convertAndSend("/topic/minecraft/status", statusResp);
                }

                var logsResp = minecraftServerController.getConsoleLogs(serverId).getBody();
                if (logsResp != null && logsResp.containsKey("logs")) {
                    messagingTemplate.convertAndSend("/topic/minecraft/logs/" + serverId, logsResp);
                    messagingTemplate.convertAndSend("/topic/minecraft/logs", logsResp);
                }
            } catch (Exception e) {
                logger.warn("WebSocket broadcast error for server {}: {}", serverId, e.getMessage());
            }
        }
    }

    /**
     * Handle RCON commands sent via WebSocket
     */
    @MessageMapping("/minecraft/command")
    public void handleWebSocketCommand(@Payload Map<String, String> payload) {
        String serverId = payload.getOrDefault("serverId", "server-1");
        String command = payload.getOrDefault("command", "");

        try {
            var response = minecraftServerController.executeCommand(payload).getBody();
            if (response != null) {
                messagingTemplate.convertAndSend("/topic/minecraft/logs/" + serverId, Map.of(
                    "command", command,
                    "output", response.getOrDefault("output", "")
                ));
            }
        } catch (Exception e) {
            logger.error("Error executing WebSocket command", e);
        }
    }
}
