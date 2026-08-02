package com.datapeice.slbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminResetPasswordRequest {
    @NotBlank
    @Size(min = 8, max = 50)
    private String newPassword;
}

