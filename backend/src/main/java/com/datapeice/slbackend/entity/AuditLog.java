package com.datapeice.slbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The user who performed the action (can be null for system actions or
    // anonymous actions)
    private Long actorId;
    private String actorUsername;

    // Action category or type (e.g., "USER_REGISTER", "ADMIN_VIEW_DOSSIER")
    @Column(nullable = false)
    private String actionType;

    // Human-readable details
    @Column(columnDefinition = "TEXT")
    private String details;

    // Optional: Affected user (if action targets another user)
    private Long targetUserId;
    private String targetUsername;

    private String ipAddress;

    @Column(length = 512)
    private String userAgent;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
