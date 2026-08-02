package com.datapeice.slbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users")
@Data
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    private String password;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true)
    private String discordNickname;

    @Column(unique = true)
    private String minecraftNickname;

    @Enumerated(EnumType.STRING)
    private UserRole role = UserRole.ROLE_USER;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    private boolean banned = false;

    private boolean inSeason = false;

    private boolean isBoosted = false;


    private String banReason;

    @Column(name = "ban_expires_at")
    private java.time.LocalDateTime banExpiresAt;

    // Email verification
    private boolean emailVerified = false;

    private String emailVerificationToken;

    private Long emailVerificationTokenExpiry;

    // TOTP (2FA)
    private boolean totpEnabled = false;

    private String totpSecret;

    // Password Reset
    private String resetPasswordToken;

    private Long resetPasswordTokenExpiry;

    // Bio
    @Column(columnDefinition = "TEXT")
    private String bio;

    // Is accepted player
    private boolean isPlayer = false;

    // Discord User ID for DM notifications and role management
    private String discordUserId;

    // Discord OAuth verification - account is active only when discord is verified
    private boolean discordVerified = false;

    // Discord OAuth state to prevent JWT leakage
    private String discordOauthState;

    // Is the user currently a member of the linked Discord server
    @Column(columnDefinition = "boolean default false")
    private boolean inDiscord = false;

    // Security logging
    private String registrationIp;
    private String registrationUserAgent;

    private String lastLoginIp1;
    private String lastLoginUserAgent1;
    private String lastLoginIp2;
    private String lastLoginUserAgent2;

    private java.time.LocalDateTime lastLoginTime1;
    private java.time.LocalDateTime lastLoginTime2;

    // Browser Fingerprints
    private String registrationCanvas;
    @Column(columnDefinition = "TEXT")
    private String registrationWebgl;
    private String registrationTimezone;
    private String registrationLanguage;
    private Integer registrationHardware;
    private String registrationResolution;
    private String registrationMemory;
    private String registrationPixelRatio;
    private String registrationTouchPoints;

    private String lastLoginCanvas1;
    @Column(columnDefinition = "TEXT")
    private String lastLoginWebgl1;
    private String lastLoginTimezone1;
    private String lastLoginLanguage1;
    private Integer lastLoginHardware1;
    private String lastLoginResolution1;
    private String lastLoginMemory1;
    private String lastLoginPixelRatio1;
    private String lastLoginTouchPoints1;

    private String lastLoginCanvas2;
    @Column(columnDefinition = "TEXT")
    private String lastLoginWebgl2;
    private String lastLoginTimezone2;
    private String lastLoginLanguage2;
    private Integer lastLoginHardware2;
    private String lastLoginResolution2;
    private String lastLoginMemory2;
    private String lastLoginPixelRatio2;
    private String lastLoginTouchPoints2;

    // JWT Token Version for instant invalidation on security events
    @Column(nullable = false, columnDefinition = "integer default 0")
    private Integer tokenVersion = 0;

    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();

    // Sponsorship Info
    @Column(name = "sponsorship_level", columnDefinition = "integer default 0")
    private Integer sponsorshipLevel = 0;

    @Column(name = "sponsorship_expires_at")
    private java.time.LocalDateTime sponsorshipExpiresAt;

    @Column(name = "stripe_subscription_id")
    private String stripeSubscriptionId;

    @Column(name = "subscription_recurring", columnDefinition = "boolean default false")
    private boolean subscriptionRecurring = false;

    @Column(name = "total_donated", nullable = false, columnDefinition = "integer default 0")
    private Integer totalDonated = 0;

    // Badges
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_badges", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "badge_id"))
    private Set<Badge> badges = new HashSet<>();

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
