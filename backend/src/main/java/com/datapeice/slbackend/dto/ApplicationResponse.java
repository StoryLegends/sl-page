package com.datapeice.slbackend.dto;

import com.datapeice.slbackend.entity.ApplicationStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ApplicationResponse {
    private Long id;
    private String firstName;
    private Integer age;
    private String whyUs;
    private String source;
    private boolean makeContent;
    private String additionalInfo;
    private Integer selfRating;
    private ApplicationStatus status;
    private String adminComment;
    private String handledBy;
    private LocalDateTime createdAt;
    private UserSummary user;

    @Data
    public static class UserSummary {
        private Long id;
        private String username;
        private String email;
        private String discordNickname;
        private String minecraftNickname;
        private String avatarUrl;
        private boolean discordVerified;
        private boolean inDiscordServer;
    }
}
