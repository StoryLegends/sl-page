package com.datapeice.slbackend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BadgeResponse {
    private Long id;
    private String name;
    private String color;
    private String svgIcon;
    private String discordRoleId;
    private LocalDateTime createdAt;
}

