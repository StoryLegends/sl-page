package com.datapeice.slbackend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserRequest {
    @Email(message = "Некорректный формат email")
    private String email;

    @Size(min = 3, max = 50)
    private String discordNickname;

    @Size(min = 3, max = 50)
    private String minecraftNickname;

    @Size(max = 1000, message = "Bio не может быть длиннее 1000 символов")
    private String bio;

    private String oldPassword;

    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[\\p{Ll}])(?=.*[\\p{Lu}])(?=.*[\\p{P}\\p{S}]).*$", message = "Password must contain at least one digit, one lowercase, one uppercase letter and one special character")
    private String newPassword;
}
