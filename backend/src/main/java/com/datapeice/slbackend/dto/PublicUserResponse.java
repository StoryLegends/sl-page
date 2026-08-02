package com.datapeice.slbackend.dto;

import com.datapeice.slbackend.entity.UserRole;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class PublicUserResponse {
    private Long id;
    private String username;
    private String discordNickname;
    private String minecraftNickname;
    private UserRole role;
    private String avatarUrl;
    private String bio;
    private List<BadgeResponse> badges;
    @JsonProperty("isBoosted")
    private boolean isBoosted;
}
