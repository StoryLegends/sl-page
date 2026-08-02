package com.datapeice.slbackend.controller;

import com.datapeice.slbackend.dto.*;
import com.datapeice.slbackend.entity.ApplicationStatus;
import com.datapeice.slbackend.entity.SiteSettings;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.service.ApplicationService;
import com.datapeice.slbackend.service.BadgeService;
import com.datapeice.slbackend.service.SiteSettingsService;
import com.datapeice.slbackend.service.UserService;
import com.datapeice.slbackend.service.WarningService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.util.List;
import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
public class AdminController {
    private final ApplicationService applicationService;
    private final UserService userService;
    private final BadgeService badgeService;
    private final WarningService warningService;
    private final SiteSettingsService siteSettingsService;
    private final com.datapeice.slbackend.service.AuditLogService auditLogService;
    private final com.datapeice.slbackend.service.TotpService totpService;
    private final com.datapeice.slbackend.repository.BotMessageRepository botMessageRepository;
    private final com.datapeice.slbackend.repository.WarningRepository warningRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public AdminController(ApplicationService applicationService, UserService userService,
            BadgeService badgeService, WarningService warningService,
            SiteSettingsService siteSettingsService,
            com.datapeice.slbackend.service.AuditLogService auditLogService,
            com.datapeice.slbackend.service.TotpService totpService,
            SimpMessagingTemplate messagingTemplate,
            com.datapeice.slbackend.repository.BotMessageRepository botMessageRepository,
            com.datapeice.slbackend.repository.WarningRepository warningRepository) {
        this.applicationService = applicationService;
        this.userService = userService;
        this.badgeService = badgeService;
        this.warningService = warningService;
        this.siteSettingsService = siteSettingsService;
        this.auditLogService = auditLogService;
        this.totpService = totpService;
        this.messagingTemplate = messagingTemplate;
        this.botMessageRepository = botMessageRepository;
        this.warningRepository = warningRepository;
    }

    @GetMapping("/applications")
    public ResponseEntity<Page<ApplicationResponse>> getAllApplications(
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal User admin) {

        // Sort by id descending (newest first)
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

        Page<ApplicationResponse> result;
        if (status != null) {
            result = applicationService.getApplicationsByStatus(status, query, pageable);
        } else {
            result = applicationService.getAllApplications(query, pageable);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/applications/{id}")
    public ResponseEntity<ApplicationResponse> getApplicationById(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.getApplicationById(id));
    }

    @PatchMapping("/applications/{id}/status")
    public ResponseEntity<?> updateApplicationStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateApplicationStatusRequest request,
            @AuthenticationPrincipal User admin) {
        try {
            ApplicationResponse response = applicationService.updateApplicationStatus(id, request, admin.getId(),
                    admin.getUsername());
            messagingTemplate.convertAndSend("/topic/admin/applications", response);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reset-season")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resetSeason(
            @AuthenticationPrincipal User admin,
            @RequestBody(required = false) ResetSeasonRequest request) {

        if (admin.isTotpEnabled()) {
            if (request == null || request.getTotpCode() == null || request.getTotpCode().isBlank()) {
                return ResponseEntity.status(403).body(Map.of(
                        "error", "TOTP_REQUIRED",
                        "message", "Для этого действия требуется 2FA подтверждение"));
            }
            if (!totpService.verifyCode(admin.getTotpSecret(), request.getTotpCode())) {
                return ResponseEntity.status(400).body(Map.of(
                        "error", "INVALID_TOTP",
                        "message", "Неверный код 2FA"));
            }
        }

        userService.resetAllUsersSeason(admin.getId(), admin.getUsername());
        return ResponseEntity.ok().body("{\"message\": \"Сезон успешно сброшен, все игроки могут подать заявки.\"}");
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminDashboardStatsResponse> getDashboardStats() {
        AdminDashboardStatsResponse stats = new AdminDashboardStatsResponse(
            userService.getTotalUsersCount(),
            applicationService.countApplicationsByStatus(ApplicationStatus.PENDING),
            userService.countActivePlayers(),
            userService.countBannedUsers(),
            botMessageRepository.countByIsFromPlayerTrueAndIsReadFalse(),
            warningRepository.countByActiveTrue()
        );
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        // Sort by id descending (newest first)
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        return ResponseEntity.ok(userService.getAllUsersForAdmin(query, role, status, pageable));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserByIdForAdmin(id));
    }

    @PostMapping("/users/{id}/ban")
    public ResponseEntity<?> banUser(
            @PathVariable Long id,
            @Valid @RequestBody BanUserRequest request,
            @AuthenticationPrincipal User admin) {
        try {
            boolean silent = request.getSilent() != null && request.getSilent();
            UserResponse response = userService.banUser(id, request.getReason(), admin.getId(), admin.getUsername(), silent, request.getDurationDays());
            messagingTemplate.convertAndSend("/topic/admin/users", response);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/users/{id}/unban")
    public ResponseEntity<?> unbanUser(@PathVariable Long id, @AuthenticationPrincipal User admin) {
        try {
            UserResponse response = userService.unbanUser(id, admin.getId(), admin.getUsername());
            messagingTemplate.convertAndSend("/topic/admin/users", response);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<?> resetUserPassword(@PathVariable Long id, @AuthenticationPrincipal User admin) {
        try {
            userService.resetUserPassword(id, admin.getId(), admin.getUsername());
            return ResponseEntity.ok(java.util.Map.of(
                    "status", "success",
                    "message", "Пароль сброшен и отправлен на email пользователя"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/users/{id}/reset-minecraft-password")
    public ResponseEntity<?> resetUserMinecraftPassword(@PathVariable Long id, @AuthenticationPrincipal User admin) {
        try {
            userService.resetUserMinecraftPassword(id, admin.getId(), admin.getUsername());
            return ResponseEntity.ok(java.util.Map.of(
                    "status", "success",
                    "message", "Minecraft пароль пользователя сброшен"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRequest request,
            @AuthenticationPrincipal User admin) {
        try {
            UserResponse response = userService.adminUpdateUser(id, request, admin.getId(), admin.getUsername());
            messagingTemplate.convertAndSend("/topic/admin/users", response);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, @AuthenticationPrincipal User admin) {
        try {
            userService.deleteUser(id, admin.getId(), admin.getUsername());
            messagingTemplate.convertAndSend("/topic/admin/users", Map.of("deletedUserId", id));
            return ResponseEntity.ok(java.util.Map.of(
                    "status", "success",
                    "message", "Пользователь удален"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody AdminCreateUserRequest request,
            @AuthenticationPrincipal User admin) {
        try {
            UserResponse response = userService.createUser(request, admin.getId(), admin.getUsername());
            messagingTemplate.convertAndSend("/topic/admin/users", response);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ==================== Badge Management ====================

    @GetMapping("/badges")
    public ResponseEntity<List<BadgeResponse>> getAllBadges() {
        return ResponseEntity.ok(badgeService.getAllBadges());
    }

    @PostMapping("/badges")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createBadge(@Valid @RequestBody BadgeRequest request,
            @AuthenticationPrincipal User admin) {
        try {
            BadgeResponse response = badgeService.createBadge(request, admin.getId(), admin.getUsername());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/badges/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateBadge(@PathVariable Long id, @RequestBody BadgeRequest request,
            @AuthenticationPrincipal User admin) {
        try {
            BadgeResponse response = badgeService.updateBadge(id, request, admin.getId(), admin.getUsername());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/badges/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteBadge(@PathVariable Long id, @AuthenticationPrincipal User admin) {
        try {
            badgeService.deleteBadge(id, admin.getId(), admin.getUsername());
            return ResponseEntity.ok(java.util.Map.of("status", "success", "message", "Badge deleted"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/users/{userId}/badges/{badgeId}")
    public ResponseEntity<?> assignBadgeToUser(@PathVariable Long userId, @PathVariable Long badgeId,
            @AuthenticationPrincipal User admin) {
        try {
            badgeService.assignBadgeToUser(userId, badgeId, admin.getId(), admin.getUsername());
            return ResponseEntity.ok(java.util.Map.of("status", "success", "message", "Badge assigned"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/users/{userId}/badges/{badgeId}")
    public ResponseEntity<?> removeBadgeFromUser(@PathVariable Long userId, @PathVariable Long badgeId,
            @AuthenticationPrincipal User admin) {
        try {
            badgeService.removeBadgeFromUser(userId, badgeId, admin.getId(), admin.getUsername());
            return ResponseEntity.ok(java.util.Map.of("status", "success", "message", "Badge removed"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ==================== Warnings ====================

    @PostMapping("/users/{userId}/warnings")
    public ResponseEntity<?> issueWarning(@PathVariable Long userId,
            @Valid @RequestBody IssueWarningRequest request,
            @AuthenticationPrincipal User admin) {
        try {
            WarningResponse response = warningService.issueWarning(userId, request.getReason(), admin, request.getDurationDays());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/users/{userId}/warnings")
    public ResponseEntity<?> getUserWarnings(@PathVariable Long userId) {
        try {
            List<WarningResponse> warnings = warningService.getUserWarnings(userId);
            return ResponseEntity.ok(warnings);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/warnings/{warningId}/revoke")
    public ResponseEntity<?> revokeWarning(@PathVariable Long warningId, @AuthenticationPrincipal User admin) {
        try {
            WarningResponse response = warningService.revokeWarning(warningId, admin.getId(), admin.getUsername());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/warnings/{warningId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteWarning(@PathVariable Long warningId, @AuthenticationPrincipal User admin) {
        try {
            warningService.deleteWarning(warningId, admin.getId(), admin.getUsername());
            return ResponseEntity.ok(java.util.Map.of("status", "success", "message", "Предупреждение удалено"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SiteSettings> getSettings() {
        return ResponseEntity.ok(siteSettingsService.getSettings());
    }

    @PatchMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SiteSettings> updateSettings(@RequestBody SiteSettingsRequest request,
            @AuthenticationPrincipal User admin) {
        SiteSettings updated = siteSettingsService.updateSettings(request, admin.getId(), admin.getUsername());
        return ResponseEntity.ok(updated);
    }

    // logiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii

    @GetMapping("/logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<org.springframework.data.domain.Page<com.datapeice.slbackend.entity.AuditLog>> getLogs(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size,
                org.springframework.data.domain.Sort.by("createdAt").descending());
        return ResponseEntity.ok(auditLogService.getLogs(query, pageable));
    }

    @GetMapping("/users/{userId}/audit-logs")
    public ResponseEntity<org.springframework.data.domain.Page<com.datapeice.slbackend.entity.AuditLog>> getUserAuditLogs(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size,
                org.springframework.data.domain.Sort.by("createdAt").descending());
        try {
            UserResponse user = userService.getUserById(userId);
            java.util.List<UserResponse> related = userService.getRelatedAccounts(userId);
            java.util.List<Long> relatedIds = (related != null) ? related.stream().map(UserResponse::getId).collect(java.util.stream.Collectors.toList()) : java.util.Collections.emptyList();
            return ResponseEntity.ok(auditLogService.getLogsForUser(userId, user.getUsername(), relatedIds, pageable));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/users/{userId}/log-dossier-view")
    public ResponseEntity<?> logDossierView(@PathVariable Long userId, @AuthenticationPrincipal User admin) {
        String targetUsername = "Unknown";
        try {
            targetUsername = userService.getUserById(userId).getUsername();
        } catch (Exception e) {
            // ignore
        }
        auditLogService.logAction(admin.getId(), admin.getUsername(), "ADMIN_VIEW_DOSSIER",
                "Открыл Security Dossier пользователя", userId, targetUsername);
        return ResponseEntity.ok().build();
    }

    // ==================== Database ====================

    @GetMapping("/db/backup")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> backupDatabase(
            @org.springframework.beans.factory.annotation.Value("${spring.datasource.url:}") String url,
            @org.springframework.beans.factory.annotation.Value("${spring.datasource.username:}") String username,
            @org.springframework.beans.factory.annotation.Value("${spring.datasource.password:}") String password,
            @AuthenticationPrincipal User admin) {
        try {
            java.util.List<String> command = new java.util.ArrayList<>();
            command.add("pg_dump");

            String connectionString = url;
            if (url.startsWith("jdbc:")) {
                connectionString = url.substring(5);
            }
            command.add("--dbname=" + connectionString);

            if (username != null && !username.isEmpty()) {
                command.add("--username=" + username);
            }
            command.add("--no-owner");
            command.add("--no-acl");

            ProcessBuilder pb = new ProcessBuilder(command);
            if (password != null && !password.isEmpty()) {
                pb.environment().put("PGPASSWORD", password);
            }

            Process process = pb.start();
            byte[] dump = process.getInputStream().readAllBytes();
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                byte[] error = process.getErrorStream().readAllBytes();
                throw new RuntimeException("pg_dump failed: " + new String(error));
            }

            auditLogService.logAction(admin.getId(), admin.getUsername(), "ADMIN_DB_BACKUP",
                    String.format("Админ %s скачал бэкап базы данных в %s", admin.getUsername(),
                            java.time.LocalDateTime.now()),
                    null, null);

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"backup.sql\"")
                    .body(dump);
        } catch (Exception e) {
            // TODO: Use proper logging framework instead of printStackTrace
            return ResponseEntity.status(500).body(("Ошибка при создании бэкапа: " + e.getMessage()
                    + "\nУбедитесь, что pg_dump установлен и доступен в PATH.").getBytes());
        }
    }

    @PostMapping("/users/{userId}/sponsorship")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateSponsorshipManual(
            @PathVariable Long userId,
            @RequestBody java.util.Map<String, Object> request,
            @AuthenticationPrincipal User admin) {
        try {
            Integer level = request.get("level") != null ? ((Number) request.get("level")).intValue() : 0;
            String expiresAtStr = request.get("expiresAt") != null ? (String) request.get("expiresAt") : null;
            Integer totalDonated = request.get("totalDonated") != null ? ((Number) request.get("totalDonated")).intValue() : null;
            Boolean subscriptionRecurring = request.get("subscriptionRecurring") != null ? (Boolean) request.get("subscriptionRecurring") : null;
            java.time.LocalDateTime expiresAt = null;
            if (expiresAtStr != null && !expiresAtStr.isBlank()) {
                // Handle different potential datetime formats from ISO strings
                if (expiresAtStr.contains("Z")) {
                    expiresAt = java.time.ZonedDateTime.parse(expiresAtStr).toLocalDateTime();
                } else {
                    expiresAt = java.time.LocalDateTime.parse(expiresAtStr.substring(0, 19));
                }
            }
            UserResponse response = userService.updateSponsorshipManual(userId, level, expiresAt, totalDonated, subscriptionRecurring, admin.getId(), admin.getUsername());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/users/{id}/related-accounts")
    public ResponseEntity<List<UserResponse>> getRelatedAccounts(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(userService.getRelatedAccounts(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
