package com.datapeice.slbackend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BotMessageRequest {
    @NotNull
    private Long recipientUserId;

    private String content;

    private String mediaUrl;
}
