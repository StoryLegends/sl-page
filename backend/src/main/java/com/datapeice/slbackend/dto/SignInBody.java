package com.datapeice.slbackend.dto;

import lombok.Data;

@Data
public class SignInBody {
    private String username;
    private String password;
    private String totpCode; // Optional: only required if user has TOTP enabled
}
