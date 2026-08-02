package com.datapeice.slbackend.dto;

import com.datapeice.slbackend.entity.UserRole;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String discordNickname;
    private String minecraftNickname;
    private UserRole role;
    private String avatarUrl;
    private boolean banned;
    private String banReason;
    private LocalDateTime banExpiresAt;
    private boolean emailVerified;
    private boolean totpEnabled;
    private String bio;
    @JsonProperty("isPlayer")
    private boolean isPlayer;
    private boolean inSeason;
    private String discordUserId;
    private boolean discordVerified;
    private boolean inDiscordServer;
    @JsonProperty("isBoosted")
    private boolean isBoosted;

    private Integer sponsorshipLevel;
    private LocalDateTime sponsorshipExpiresAt;
    private String stripeSubscriptionId;
    private boolean subscriptionRecurring;
    private Integer totalDonated;

    private LocalDateTime createdAt;

    // Badges (without @SL role)
    private List<BadgeResponse> badges;

    // Warnings count (active only)
    private long warningsCount;

    private boolean hasCoincidences;
    private boolean hasBannedCoincidences;
    private boolean hasSuspiciousMods;

    // Security info (admin-only fields, populated only for admin endpoint)
    private String registrationIp;
    private String registrationUserAgent;
    private String lastLoginIp1;
    private String lastLoginUserAgent1;
    private String lastLoginIp2;
    private String lastLoginUserAgent2;
    private LocalDateTime lastLoginTime1;
    private LocalDateTime lastLoginTime2;

    // Browser Fingerprints
    private String registrationCanvas;
    private String registrationWebgl;
    private String registrationTimezone;
    private String registrationLanguage;
    private Integer registrationHardware;
    private String registrationResolution;
    private String registrationMemory;
    private String registrationPixelRatio;
    private String registrationTouchPoints;

    private String lastLoginCanvas1;
    private String lastLoginWebgl1;
    private String lastLoginTimezone1;
    private String lastLoginLanguage1;
    private Integer lastLoginHardware1;
    private String lastLoginResolution1;
    private String lastLoginMemory1;
    private String lastLoginPixelRatio1;
    private String lastLoginTouchPoints1;

    private String lastLoginCanvas2;
    private String lastLoginWebgl2;
    private String lastLoginTimezone2;
    private String lastLoginLanguage2;
    private Integer lastLoginHardware2;
    private String lastLoginResolution2;
    private String lastLoginMemory2;
    private String lastLoginPixelRatio2;
    private String lastLoginTouchPoints2;
}
