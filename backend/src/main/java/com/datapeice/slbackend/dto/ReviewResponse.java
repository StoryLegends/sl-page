package com.datapeice.slbackend.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReviewResponse {
    private Long id;
    private Long userId;
    private String username;
    private String userAvatarUrl;
    private int rating;
    private String content;
    private String status;
    private boolean isEdited;
    private LocalDateTime editedAt;
    private String adminReply;
    private String adminReplyAuthorName;
    private LocalDateTime adminRepliedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
