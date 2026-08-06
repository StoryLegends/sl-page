package com.datapeice.slbackend.websocket;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessagingTemplate;

public class CustomSimpMessagingTemplate extends SimpMessagingTemplate {
    private final AdminWebSocketHandler adminWebSocketHandler;

    public CustomSimpMessagingTemplate(AdminWebSocketHandler adminWebSocketHandler) {
        super(new MessageChannel() {
            @Override
            public boolean send(Message<?> message) {
                return true;
            }

            @Override
            public boolean send(Message<?> message, long timeout) {
                return true;
            }
        });
        this.adminWebSocketHandler = adminWebSocketHandler;
    }

    @Override
    public void convertAndSend(String destination, Object payload) {
        adminWebSocketHandler.broadcastToTopic(destination, payload);
    }
}
