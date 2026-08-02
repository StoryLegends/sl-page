package com.datapeice.slbackend.service;

import com.datapeice.slbackend.dto.BadgeRequest;
import com.datapeice.slbackend.dto.BadgeResponse;
import com.datapeice.slbackend.entity.Badge;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.repository.BadgeRepository;
import com.datapeice.slbackend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserRepository userRepository;
    private final DiscordService discordService;
    private final AuditLogService auditLogService;

    public BadgeService(BadgeRepository badgeRepository, UserRepository userRepository, DiscordService discordService,
            AuditLogService auditLogService) {
        this.badgeRepository = badgeRepository;
        this.userRepository = userRepository;
        this.discordService = discordService;
        this.auditLogService = auditLogService;
    }

    public List<BadgeResponse> getAllBadges() {
        return badgeRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BadgeResponse createBadge(BadgeRequest request, Long adminId, String adminName) {
        if (badgeRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Badge with this name already exists");
        }
        Badge badge = new Badge();
        badge.setName(request.getName());
        badge.setColor(request.getColor());
        badge.setSvgIcon(request.getSvgIcon());
        badge.setDiscordRoleId(request.getDiscordRoleId());
        Badge saved = badgeRepository.save(badge);
        auditLogService.logAction(adminId, adminName, "ADMIN_CREATE_BADGE", "Создал новый значок: " + badge.getName(),
                null, badge.getName());
        return mapToResponse(saved);
    }

    @Transactional
    public BadgeResponse updateBadge(Long badgeId, BadgeRequest request, Long adminId, String adminName) {
        Badge badge = badgeRepository.findById(badgeId)
                .orElseThrow(() -> new IllegalArgumentException("Badge not found"));

        if (request.getName() != null)
            badge.setName(request.getName());
        if (request.getColor() != null)
            badge.setColor(request.getColor());
        if (request.getSvgIcon() != null)
            badge.setSvgIcon(request.getSvgIcon());
        if (request.getDiscordRoleId() != null)
            badge.setDiscordRoleId(request.getDiscordRoleId());

        Badge saved = badgeRepository.save(badge);
        auditLogService.logAction(adminId, adminName, "ADMIN_UPDATE_BADGE", "Обновил значок: " + badge.getName(),
                null, badge.getName());
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteBadge(Long badgeId, Long adminId, String adminName) {
        Badge badge = badgeRepository.findById(badgeId)
                .orElseThrow(() -> new IllegalArgumentException("Badge not found"));
        // Remove badge from all users that have it
        List<User> usersWithBadge = userRepository.findAllByBadgesContaining(badge);
        usersWithBadge.forEach(user -> user.getBadges().remove(badge));
        userRepository.saveAll(usersWithBadge);
        badgeRepository.delete(badge);
        auditLogService.logAction(adminId, adminName, "ADMIN_DELETE_BADGE", "Удалил значок: " + badge.getName(),
                null, badge.getName());
    }

    /**
     * Assign badge to user and sync Discord role
     */
    @Transactional
    public void assignBadgeToUser(Long userId, Long badgeId, Long adminId, String adminName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Badge badge = badgeRepository.findById(badgeId)
                .orElseThrow(() -> new IllegalArgumentException("Badge not found"));

        user.getBadges().add(badge);
        userRepository.save(user);

        // Sync Discord role
        if (badge.getDiscordRoleId() != null && user.getDiscordUserId() != null) {
            discordService.assignRole(user.getDiscordUserId(), badge.getDiscordRoleId());
        }

        auditLogService.logAction(adminId, adminName, "ADMIN_ASSIGN_BADGE",
                String.format("Выдал значок '%s' пользователю %s", badge.getName(), user.getUsername()),
                user.getId(), user.getUsername());
    }

    /**
     * Remove badge from user and sync Discord role
     */
    @Transactional
    public void removeBadgeFromUser(Long userId, Long badgeId, Long adminId, String adminName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Badge badge = badgeRepository.findById(badgeId)
                .orElseThrow(() -> new IllegalArgumentException("Badge not found"));

        user.getBadges().remove(badge);
        userRepository.save(user);

        // Sync Discord role
        if (badge.getDiscordRoleId() != null && user.getDiscordUserId() != null) {
            discordService.removeRole(user.getDiscordUserId(), badge.getDiscordRoleId());
        }

        auditLogService.logAction(adminId, adminName, "ADMIN_REMOVE_BADGE",
                String.format("Отозвал значок '%s' у пользователя %s", badge.getName(), user.getUsername()),
                user.getId(), user.getUsername());
    }

    public BadgeResponse mapToResponse(Badge badge) {
        BadgeResponse response = new BadgeResponse();
        response.setId(badge.getId());
        response.setName(badge.getName());
        response.setColor(badge.getColor());
        response.setSvgIcon(badge.getSvgIcon());
        response.setDiscordRoleId(badge.getDiscordRoleId());
        response.setCreatedAt(badge.getCreatedAt());
        return response;
    }
}
