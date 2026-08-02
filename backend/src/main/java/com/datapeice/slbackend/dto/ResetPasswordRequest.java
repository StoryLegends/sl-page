package com.datapeice.slbackend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = "Token is required")
    private String token;

    @NotBlank(message = "New password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Pattern(
            regexp = "^(?=.*[0-9])(?=.*[\\p{Ll}])(?=.*[\\p{Lu}])(?=.*[\\p{P}\\p{S}]).*$",
            message = "Password must contain at least one digit, one lowercase, one uppercase letter and one special character"
    )
    @JsonAlias("password")
    private String newPassword;
}
