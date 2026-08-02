package com.datapeice.slbackend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BotMessageResponse {
    private Long id;
    private Long recipientUserId;
    private String recipientUsername;
    private String senderAdminName;
    private String content;
    private String mediaUrl;
    @JsonProperty("isEdited")
    private boolean isEdited;
    @JsonProperty("isFromPlayer")
    private boolean isFromPlayer;
    @JsonProperty("isRead")
    private boolean isRead;
    private String reactions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
