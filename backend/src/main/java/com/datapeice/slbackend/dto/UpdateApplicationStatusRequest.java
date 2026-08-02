package com.datapeice.slbackend.dto;

import com.datapeice.slbackend.entity.ApplicationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateApplicationStatusRequest {
    @NotNull(message = "Статус обязателен")
    private ApplicationStatus status;

    private String adminComment;
}

