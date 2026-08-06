package com.datapeice.slbackend.config;

import com.datapeice.slbackend.websocket.AdminWebSocketHandler;
import com.datapeice.slbackend.websocket.AdminWebSocketHandshakeInterceptor;
import com.datapeice.slbackend.websocket.CustomSimpMessagingTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final AdminWebSocketHandler adminWebSocketHandler;

    public WebSocketConfig(AdminWebSocketHandler adminWebSocketHandler) {
        this.adminWebSocketHandler = adminWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(adminWebSocketHandler, "/api/ws/admin", "/api/ws/admin/websocket", "/ws/admin", "/ws/admin/websocket")
                .addInterceptors(new AdminWebSocketHandshakeInterceptor())
                .setAllowedOriginPatterns("*");
    }

    @Bean
    public SimpMessagingTemplate simpMessagingTemplate() {
        return new CustomSimpMessagingTemplate(adminWebSocketHandler);
    }
}