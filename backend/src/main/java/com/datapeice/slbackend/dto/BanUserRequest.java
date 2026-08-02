package com.datapeice.slbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BanUserRequest {
    @NotBlank(message = "Укажите причину бана")
    private String reason;

    private Boolean silent = false;

    private Integer durationDays;
}

