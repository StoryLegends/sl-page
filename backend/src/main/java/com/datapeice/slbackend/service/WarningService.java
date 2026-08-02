package com.datapeice.slbackend.service;

import com.datapeice.slbackend.dto.WarningResponse;
import com.datapeice.slbackend.entity.SiteSettings;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.entity.Warning;
import com.datapeice.slbackend.repository.SiteSettingsRepository;
import com.datapeice.slbackend.repository.UserRepository;
import com.datapeice.slbackend.repository.WarningRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WarningService {

    private final WarningRepository warningRepository;
    private final UserRepository userRepository;
    private final DiscordService discordService;
    private final EmailService emailService;
    private final UserService userService;
    private final SiteSettingsService siteSettingsService;
    private final AuditLogService auditLogService;

    public WarningService(WarningRepository warningRepository,
            UserRepository userRepository,
            DiscordService discordService,
            EmailService emailService,
            UserService userService,
            SiteSettingsService siteSettingsService,
            AuditLogService auditLogService) {
        this.warningRepository = warningRepository;
        this.userRepository = userRepository;
        this.discordService = discordService;
        this.emailService = emailService;
        this.userService = userService;
        this.siteSettingsService = siteSettingsService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public WarningResponse issueWarning(Long userId, String reason, User issuedBy) {
        return issueWarning(userId, reason, issuedBy, null);
    }

    @Transactional
    public WarningResponse issueWarning(Long userId, String reason, User issuedBy, Integer durationDays) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        Warning warning = new Warning();
        warning.setUser(user);
        warning.setReason(reason);
        warning.setIssuedBy(issuedBy);
        warning.setActive(true);
        if (durationDays != null && durationDays > 0) {
            warning.setExpiresAt(java.time.LocalDateTime.now().plusDays(durationDays));
        } else {
            warning.setExpiresAt(null);
        }

        Warning saved = warningRepository.save(warning);

        SiteSettings settings = siteSettingsService.getSettings();

        String durationStr = (durationDays != null && durationDays > 0) ? (durationDays + " дней") : "Навсегда";

        // Send notifications
        if (settings.isSendDiscordDmOnWarning() && user.getDiscordUserId() != null && discordService.isEnabled()) {
            long activeCount = warningRepository.countByUserIdAndActiveTrue(userId);
            discordService.sendDirectMessage(user.getDiscordUserId(),
                    "⚠️ **StoryLegends** — Вы получили предупреждение!\n" +
                            "**Причина:** " + reason + "\n" +
                            "**Срок:** " + durationStr + "\n" +
                            "**Модератор:** " + (issuedBy != null ? issuedBy.getUsername() : "Система") + "\n" +
                            "**Активных предупреждений:** " + activeCount + "/" + settings.getMaxWarningsBeforeBan()
                            + "\n" +
                            "***С уважением, <:slteam:1244336090928906351>***");
        }

        if (settings.isSendEmailOnWarning()) {
            emailService.sendWarningEmail(user.getEmail(), user.getUsername(), reason);
        }

        // Auto-ban if threshold reached
        if (settings.isAutoBanOnMaxWarnings()) {
            long activeCount = warningRepository.countByUserIdAndActiveTrue(userId);
            if (activeCount >= settings.getMaxWarningsBeforeBan()) {
                userService.banUser(userId,
                        "Автобан: превышен лимит предупреждений (" + settings.getMaxWarningsBeforeBan() + ")",
                        null, "Система");
            }
        }

        auditLogService.logAction(issuedBy != null ? issuedBy.getId() : null,
                issuedBy != null ? issuedBy.getUsername() : "Система",
                "ADMIN_ISSUE_WARNING", "Выдал предупреждение. Причина: " + reason + ", Срок: " + durationStr,
                user.getId(), user.getUsername());

        return mapToResponse(saved);
    }

    @Transactional
    public List<WarningResponse> getUserWarnings(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
        return warningRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public WarningResponse revokeWarning(Long warningId, Long adminId, String adminName) {
        Warning warning = warningRepository.findById(warningId)
                .orElseThrow(() -> new IllegalArgumentException("Предупреждение не найдено"));
        warning.setActive(false);
        Warning saved = warningRepository.save(warning);
        auditLogService.logAction(adminId, adminName, "ADMIN_REVOKE_WARNING", "Отозвал предупреждение",
                warning.getUser().getId(), warning.getUser().getUsername());
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteWarning(Long warningId, Long adminId, String adminName) {
        Warning warning = warningRepository.findById(warningId)
                .orElseThrow(() -> new IllegalArgumentException("Предупреждение не найдено"));
        warningRepository.delete(warning);
        auditLogService.logAction(adminId, adminName, "ADMIN_DELETE_WARNING", "Удалил предупреждение",
                warning.getUser().getId(), warning.getUser().getUsername());
    }

    private WarningResponse mapToResponse(Warning warning) {
        if (warning.isActive() && warning.getExpiresAt() != null && java.time.LocalDateTime.now().isAfter(warning.getExpiresAt())) {
            warning.setActive(false);
            warningRepository.save(warning);
        }
        WarningResponse response = new WarningResponse();
        response.setId(warning.getId());
        response.setUserId(warning.getUser().getId());
        response.setUsername(warning.getUser().getUsername());
        response.setReason(warning.getReason());
        if (warning.getIssuedBy() != null) {
            response.setIssuedById(warning.getIssuedBy().getId());
            response.setIssuedByUsername(warning.getIssuedBy().getUsername());
        }
        response.setCreatedAt(warning.getCreatedAt());
        response.setActive(warning.isActive());
        response.setExpiresAt(warning.getExpiresAt());
        return response;
    }
}
