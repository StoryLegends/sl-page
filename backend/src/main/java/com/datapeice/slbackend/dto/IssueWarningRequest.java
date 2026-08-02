package com.datapeice.slbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class IssueWarningRequest {
    @NotBlank(message = "Причина обязательна")
    private String reason;

    private Integer durationDays;
}

