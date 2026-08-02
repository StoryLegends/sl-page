package com.datapeice.slbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class BadgeRequest {
    @NotBlank(message = "Badge name is required")
    private String name;

    @Pattern(regexp = "^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$", message = "Color must be a valid hex color")
    private String color;

    private String svgIcon;

    // Optional: if set, creates/links Discord role with this ID
    private String discordRoleId;
}

