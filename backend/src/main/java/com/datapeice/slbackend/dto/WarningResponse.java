package com.datapeice.slbackend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class WarningResponse {
    private Long id;
    private Long userId;
    private String username;
    private String reason;
    private Long issuedById;
    private String issuedByUsername;
    private LocalDateTime createdAt;
    private boolean active;
    private LocalDateTime expiresAt;
}

