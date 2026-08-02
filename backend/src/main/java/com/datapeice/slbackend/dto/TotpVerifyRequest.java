package com.datapeice.slbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TotpVerifyRequest {
    @NotBlank
    private String code;
}

