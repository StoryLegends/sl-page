package com.datapeice.slbackend.dto;

import lombok.Data;

@Data
public class TotpSetupResponse {
    private String secret;
    private String qrCodeDataUri;
}

