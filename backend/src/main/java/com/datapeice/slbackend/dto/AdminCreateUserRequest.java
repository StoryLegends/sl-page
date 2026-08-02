package com.datapeice.slbackend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminCreateUserRequest {
    @NotBlank
    @Size(min = 3, max = 20)
    private String username;

    @NotBlank
    @Size(min = 8)
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[\\p{Ll}])(?=.*[\\p{Lu}])(?=.*[\\p{P}\\p{S}]).*$", message = "Password must contain at least one digit, one lowercase, one uppercase letter and one special character")
    private String password;

    @Email
    @NotBlank
    private String email;

    private String discordNickname;

    private String minecraftNickname;

    private String bio;

    private String role;

    private Boolean isPlayer;

    private boolean emailVerified = true; // Admin-created accounts are pre-verified
}
