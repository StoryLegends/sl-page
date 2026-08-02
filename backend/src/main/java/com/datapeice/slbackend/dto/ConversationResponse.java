package com.datapeice.slbackend.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ConversationResponse {
    private List<ConversationItem> activeConversations;
    private List<ConversationItem> uncontactedPlayers;

    @Data
    public static class ConversationItem {
        private UserResponse user;
        private String lastMessage;
        private LocalDateTime lastMessageTime;
        private Boolean lastMessageIsEdited;
    }
}
