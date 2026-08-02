package com.datapeice.slbackend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminUpdateUserRequest {
    @Size(min = 3, max = 20)
    private String username;

    @Email
    private String email;

    @Size(max = 50)
    private String discordNickname;

    @Size(max = 50)
    private String minecraftNickname;

    private String bio;

    private Boolean isPlayer;

    private String role;

    private Boolean unlinkDiscord;

    private Boolean silent;
}
