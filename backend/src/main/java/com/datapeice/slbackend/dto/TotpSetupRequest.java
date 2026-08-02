package com.datapeice.slbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TotpSetupRequest {
    @NotBlank
    private String code;
}

