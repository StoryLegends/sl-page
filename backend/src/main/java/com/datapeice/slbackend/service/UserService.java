package com.datapeice.slbackend.service;

import com.datapeice.slbackend.dto.AdminCreateUserRequest;
import com.datapeice.slbackend.dto.AdminUpdateUserRequest;
import com.datapeice.slbackend.dto.BadgeResponse;
import com.datapeice.slbackend.dto.UpdateUserRequest;
import com.datapeice.slbackend.dto.UserResponse;
import com.datapeice.slbackend.dto.PublicUserResponse;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.entity.UserRole;
import com.datapeice.slbackend.entity.SiteSettings;
import com.datapeice.slbackend.repository.UserRepository;
import com.datapeice.slbackend.repository.ApplicationRepository;
import com.datapeice.slbackend.repository.WarningRepository;
import com.datapeice.slbackend.repository.AnticheatSnapshotRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.util.HtmlUtils;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final DiscordService discordService;
    private final GeoIpService geoIpService;
    private final FileStorageService fileStorageService;
    private final SiteSettingsService siteSettingsService;
    private final AuditLogService auditLogService;
    private final ModerationService moderationService;
    private final ApplicationRepository applicationRepository;
    private final WarningRepository warningRepository;
    private final RconService rconService;
    private final AnticheatSnapshotRepository anticheatSnapshotRepository;

    public UserService(UserRepository userRepository,
            AuditLogService auditLogService,
            DiscordService discordService,
            FileStorageService fileStorageService,
            EmailService emailService,
            SiteSettingsService siteSettingsService,
            ModerationService moderationService,
            GeoIpService geoIpService,
            PasswordEncoder passwordEncoder,
            ApplicationRepository applicationRepository,
            WarningRepository warningRepository,
            RconService rconService,
            AnticheatSnapshotRepository anticheatSnapshotRepository) {
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.discordService = discordService;
        this.fileStorageService = fileStorageService;
        this.emailService = emailService;
        this.siteSettingsService = siteSettingsService;
        this.moderationService = moderationService;
        this.geoIpService = geoIpService;
        this.passwordEncoder = passwordEncoder;
        this.applicationRepository = applicationRepository;
        this.warningRepository = warningRepository;
        this.rconService = rconService;
        this.anticheatSnapshotRepository = anticheatSnapshotRepository;
    }

    private SiteSettings getSiteSettings() {
        return siteSettingsService.getSettings();
    }

    @Transactional
    public UserResponse getUserProfile(User user) {
        // Re-fetch from DB to ensure session is open for EAGER collections
        User fresh = userRepository.findById(user.getId()).orElse(user);
        // Auto-sync Discord avatar if missing or if it's a broken local path (storage
        // disabled)
        boolean isLocalPath = fresh.getAvatarUrl() != null && !fresh.getAvatarUrl().startsWith("http");
        if ((fresh.getAvatarUrl() == null || fresh.getAvatarUrl().isBlank()
                || (isLocalPath && !fileStorageService.isEnabled()))
                && fresh.getDiscordUserId() != null) {
            syncDiscordAvatarForUser(fresh);
        }
        return mapToResponse(fresh, true); // User sees their own full info
    }

    @Transactional
    public void syncDiscordAvatarForUser(User user) {
        if (user.getDiscordUserId() == null)
            return;
        String url = discordService.syncDiscordAvatar(user.getDiscordUserId());
        if (url != null) {
            String oldAvatar = user.getAvatarUrl();
            if (url != null && !url.equals(oldAvatar)) {
                if (oldAvatar != null && !oldAvatar.startsWith("http")) {
                    fileStorageService.deleteFile(oldAvatar);
                }
                user.setAvatarUrl(url);
                userRepository.save(user);
                auditLogService.logAction(user.getId(), user.getUsername(), "USER_UPDATE_AVATAR",
                        "Синхронизировал аватар из Discord", user.getId(), user.getUsername());
            }
        }
    }

    @Transactional
    public void syncDiscordBoostStatusForUser(User user) {
        if (user.getDiscordUserId() == null || !discordService.isEnabled())
            return;
        boolean isBoosting = discordService.isMemberBoosting(user.getDiscordUserId());
        if (user.isBoosted() != isBoosting) {
            user.setBoosted(isBoosting);
            userRepository.save(user);
            auditLogService.logAction(user.getId(), user.getUsername(), "USER_UPDATE_BOOST",
                    "Синхронизировал статус буста Discord (" + isBoosting + ")", user.getId(), user.getUsername());
        }
    }

    @Transactional
    public UserResponse updateUserProfile(User user, UpdateUserRequest request) {
        // Если request null - обновляем только то что уже изменено в user (например
        // аватар)
        if (request == null) {
            User updated = userRepository.save(user);
            return mapToResponse(updated);
        }

        java.util.List<String> changes = new java.util.ArrayList<>();

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email уже используется");
            }
            changes.add("Email: " + user.getEmail() + " -> " + request.getEmail());
            user.setEmail(request.getEmail());
        }

        if (request.getDiscordNickname() != null && !request.getDiscordNickname().equals(user.getDiscordNickname())) {
            if (user.isPlayer()) {
                throw new IllegalArgumentException(
                        "Игрокам запрещено изменять Discord никнейм вручную. Используйте только кнопку привязки (OAuth2).");
            }
            if (!request.getDiscordNickname().isBlank()
                    && userRepository.existsByDiscordNickname(request.getDiscordNickname())) {
                throw new IllegalArgumentException("Discord никнейм уже используется");
            }
            changes.add("Discord Nick: " + user.getDiscordNickname() + " -> " + request.getDiscordNickname());
            user.setDiscordNickname(request.getDiscordNickname().isBlank() ? null : request.getDiscordNickname());
            // When discord nickname changes, reset verification - user must re-verify via
            // OAuth
            user.setDiscordVerified(false);
            user.setDiscordUserId(null);
        }

        if (request.getMinecraftNickname() != null
                && !request.getMinecraftNickname().equals(user.getMinecraftNickname())) {
            if (user.isPlayer()) {
                throw new IllegalArgumentException(
                        "Игрокам запрещено изменять Minecraft никнейм. Обратитесь к администратору.");
            }
            if (!request.getMinecraftNickname().isBlank()
                    && userRepository.existsByMinecraftNickname(request.getMinecraftNickname())) {
                throw new IllegalArgumentException("Minecraft никнейм уже используется");
            }
            changes.add("Minecraft Nick: " + user.getMinecraftNickname() + " -> " + request.getMinecraftNickname());
            user.setMinecraftNickname(request.getMinecraftNickname().isBlank() ? null
                    : HtmlUtils.htmlEscape(request.getMinecraftNickname()));
        }

        if (request.getBio() != null && !request.getBio().equals(user.getBio())) {
            if (moderationService.isTextToxic(request.getBio())) {
                throw new IllegalArgumentException(
                        "Текст 'О себе' нарушает правила платформы (токсичность/недопустимый контент). Пожалуйста, напишите другой текст.");
            }
            String sanitizedBio = HtmlUtils.htmlEscape(request.getBio());
            changes.add(String.format("Bio updated (%d characters)", sanitizedBio.length()));
            user.setBio(sanitizedBio);
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getOldPassword() == null || request.getOldPassword().isBlank()) {
                throw new IllegalArgumentException("Для смены пароля необходимо ввести старый пароль");
            }
            if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
                throw new IllegalArgumentException("Неверный старый пароль");
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            changes.add("Password changed");
        }

        User updated = userRepository.save(user);

        if (!changes.isEmpty()) {
            auditLogService.logAction(user.getId(), user.getUsername(), "USER_UPDATE_PROFILE",
                    "Обновил профиль: " + String.join(", ", changes), user.getId(), user.getUsername());
        }

        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<PublicUserResponse> getAllUsers() {
        // Возвращаем только пользователей с подтвержденным email И принятой заявкой
        // (isPlayer = true) И находящихся на сервере Discord
        return userRepository.findAll().stream()
                .filter(User::isPlayer)
                .filter(u -> u.isInDiscord()
                        || discordService.isMemberInGuildCached(u.getDiscordUserId(), u.getDiscordNickname()))
                .map(this::mapToPublicResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsersForAdmin(String query, String role, String status, Pageable pageable) {
        UserRole userRole = null;
        if (role != null && !role.isBlank()) {
            try {
                userRole = UserRole.valueOf(role);
            } catch (IllegalArgumentException ignored) {}
        }

        Page<User> users = userRepository.findBySearchAndStatus(
                query != null && !query.isBlank() ? query : null,
                userRole,
                status != null && !status.isBlank() ? status : null,
                pageable
        );

        return users.map(u -> {
            UserResponse r = mapToResponse(u, false);
            r.setBio(null);
            r.setEmail(u.getEmail());
            return r;
        });
    }

    public long getTotalUsersCount() {
        return userRepository.count();
    }

    public long countActivePlayers() {
        return userRepository.countActivePlayers();
    }

    public long countBannedUsers() {
        return userRepository.countBannedUsers();
    }

    public UserResponse getUserByIdForAdmin(Long userId) {
        return userRepository.findById(userId)
                .map(u -> mapToResponse(u, true))
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }

    @Transactional
    public UserResponse banUser(Long userId, String reason, Long adminId, String adminName) {
        return banUser(userId, reason, adminId, adminName, false, null);
    }

    @Transactional
    public UserResponse banUser(Long userId, String reason, Long adminId, String adminName, boolean silent) {
        return banUser(userId, reason, adminId, adminName, silent, null);
    }

    @Transactional
    public UserResponse banUser(Long userId, String reason, Long adminId, String adminName, boolean silent, Integer durationDays) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        String normalizedReason = (reason == null || reason.isBlank()) ? "Причина не указана" : reason.trim();

        user.setBanned(true);
        user.setBanReason(normalizedReason);
        user.setPlayer(false);

        if (durationDays != null && durationDays > 0) {
            user.setBanExpiresAt(java.time.LocalDateTime.now().plusDays(durationDays));
        } else {
            user.setBanExpiresAt(null);
        }

        rconService.kickPlayerWithBanMessage(user.getMinecraftNickname(), normalizedReason);
        rconService.removePlayerFromWhitelist(user.getMinecraftNickname());

        // Resolve Discord user ID if needed
        if (user.getDiscordUserId() == null && discordService.isEnabled()) {
            discordService.findDiscordUserId(user.getDiscordNickname())
                    .ifPresent(user::setDiscordUserId);
        }

        User updated = userRepository.save(user);

        SiteSettings settings = getSiteSettings();

        String durationStr = (durationDays != null && durationDays > 0) ? (durationDays + " дней") : "Навсегда";

        if (!silent && settings.isSendDiscordDmOnBan() && user.getDiscordUserId() != null && discordService.isEnabled()) {
            discordService.removeSlRole(user.getDiscordUserId());
            discordService.sendDirectMessage(user.getDiscordUserId(),
                    "🚫 **StoryLegends** — Ваш аккаунт был **заблокирован** администрацией.\n" +
                            "**Причина:** " + normalizedReason + "\n" +
                            "**Срок:** " + durationStr + "\n" +
                            "**Модератор:** " + adminName + "\n" +
                            "***С уважением, <:slteam:1244336090928906351>***");
        } else if (user.getDiscordUserId() != null && discordService.isEnabled()) {
            discordService.removeSlRole(user.getDiscordUserId());
        }

        if (settings.isSendEmailOnBan()) {
            emailService.sendBanEmail(user.getEmail(), user.getUsername(), normalizedReason);
        }

        auditLogService.logAction(adminId, adminName, "ADMIN_BAN_USER",
                "Забанил пользователя. Причина: " + normalizedReason + ", Срок: " + durationStr + (silent ? " (без уведомления в Discord)" : ""),
                user.getId(), user.getUsername());

        return mapToResponse(updated);
    }

    @Transactional
    public UserResponse unbanUser(Long userId, Long adminId, String adminName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        user.setBanned(false);
        user.setBanReason(null);
        user.setPlayer(true);
        rconService.addPlayerToWhitelist(user.getMinecraftNickname());

        // Resolve Discord user ID if needed
        if (user.getDiscordUserId() == null && discordService.isEnabled()) {
            discordService.findDiscordUserId(user.getDiscordNickname())
                    .ifPresent(user::setDiscordUserId);
        }

        User updated = userRepository.save(user);

        if (user.getDiscordUserId() != null && discordService.isEnabled()) {
            discordService.assignSlRole(user.getDiscordUserId());
            discordService.sendDirectMessage(user.getDiscordUserId(),
                    "✅ **StoryLegends** — Ваш аккаунт был **разблокирован** администрацией.\n" +
                            "**Модератор:** " + adminName + "\n" +
                            "Добро пожаловать обратно!\n" +
                            "***С уважением, <:slteam:1244336090928906351>***");
        }

        auditLogService.logAction(adminId, adminName, "ADMIN_UNBAN_USER", "Разбанил пользователя", user.getId(),
                user.getUsername());

        return mapToResponse(updated);
    }

    // Admin methods

    @Transactional
    public void resetUserPassword(Long userId, Long adminId, String adminName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        String newPassword = generateRandomPassword();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Отправляем email с новым паролем
        emailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), newPassword);

        auditLogService.logAction(adminId, adminName, "ADMIN_RESET_PASSWORD", "Сброшен пароль пользователя",
                user.getId(), user.getUsername());
    }

    @Transactional
    public void resetUserMinecraftPassword(Long userId, Long adminId, String adminName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        if (user.getRole() == UserRole.ROLE_ADMIN || user.getRole() == UserRole.ROLE_MODERATOR) {
            throw new IllegalArgumentException("Нельзя сбросить пароль администратору или модератору");
        }

        if (user.getMinecraftNickname() == null || user.getMinecraftNickname().isBlank()) {
            throw new IllegalArgumentException("У пользователя не указан Minecraft никнейм");
        }

        rconService.resetPlayerPassword(user.getMinecraftNickname());

        auditLogService.logAction(adminId, adminName, "ADMIN_RESET_MINECRAFT_PASSWORD",
                "Сброшен пароль Minecraft через RCON", user.getId(), user.getUsername());
    }

    @Transactional
    public void resetAllUsersSeason(Long adminId, String adminName) {
        userRepository.resetSeasonForAll();
        auditLogService.logAction(adminId, adminName, "ADMIN_RESET_SEASON",
                "Сброшен статус сезона. Все игроки могут снова подать заявки.", null, null);
    }

    @Transactional
    public UserResponse adminUpdateUser(Long userId, AdminUpdateUserRequest request, Long adminId, String adminName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        java.util.List<String> changes = new java.util.ArrayList<>();

        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new IllegalArgumentException("Имя пользователя уже занято");
            }
            changes.add("Username: " + user.getUsername() + " -> " + request.getUsername());
            user.setUsername(request.getUsername());
        }

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email уже используется");
            }
            changes.add("Email: " + user.getEmail() + " -> " + request.getEmail());
            user.setEmail(request.getEmail());
            // Reset email verification — user must confirm new email
            user.setEmailVerified(false);
            String verificationToken = java.util.UUID.randomUUID().toString();
            user.setEmailVerificationToken(verificationToken);
            user.setEmailVerificationTokenExpiry(System.currentTimeMillis() + 86400000L); // 24h
            emailService.sendVerificationEmail(request.getEmail(), user.getUsername(), verificationToken);
        }

        // Discord Sync Logic
        if (request.getDiscordNickname() != null) {
            boolean nickChanged = !request.getDiscordNickname().equals(user.getDiscordNickname());
            if (nickChanged) {
                if (request.getDiscordNickname() != null && !request.getDiscordNickname().isBlank()
                        && userRepository.existsByDiscordNickname(request.getDiscordNickname())) {
                    throw new IllegalArgumentException("Discord никнейм уже используется");
                }
                changes.add("Discord Nick: " + user.getDiscordNickname() + " -> " + request.getDiscordNickname());
                user.setDiscordNickname(request.getDiscordNickname() == null || request.getDiscordNickname().isBlank()
                        ? null
                        : request.getDiscordNickname());
            }

            if (discordService.isEnabled()) {
                // If ID is missing or nick changed, try to find current ID
                if (user.getDiscordUserId() == null || nickChanged) {
                    discordService.findDiscordUserId(user.getDiscordNickname())
                            .ifPresent(user::setDiscordUserId);
                }

                if (user.getDiscordUserId() != null) {
                    // Sync avatar if it's not a local file, OR if it's currently a placeholder/null
                    String currentAvatar = user.getAvatarUrl();
                    boolean isLocalFile = currentAvatar != null && !currentAvatar.startsWith("http")
                            && currentAvatar.length() > 5;

                    if (!isLocalFile || currentAvatar == null || currentAvatar.isBlank()) {
                        syncDiscordAvatarForUser(user);
                    }
                }
            }
        }

        if (request.getMinecraftNickname() != null
                && !request.getMinecraftNickname().equals(user.getMinecraftNickname())) {
            if (!request.getMinecraftNickname().isBlank()
                    && userRepository.existsByMinecraftNickname(request.getMinecraftNickname())) {
                throw new IllegalArgumentException("Minecraft никнейм уже используется");
            }
            rconService.removePlayerFromWhitelist(user.getMinecraftNickname());
            rconService.addPlayerToWhitelist(request.getMinecraftNickname());
            changes.add("Minecraft Nick: " + user.getMinecraftNickname() + " -> " + request.getMinecraftNickname());
            user.setMinecraftNickname(request.getMinecraftNickname().isBlank() ? null
                    : HtmlUtils.htmlEscape(request.getMinecraftNickname()));
        }

        if (Boolean.TRUE.equals(request.getUnlinkDiscord())) {
            if (user.getDiscordUserId() != null && discordService.isEnabled()) {
                discordService.removeSlRole(user.getDiscordUserId());
            }
            changes.add("Unlinked Discord (" + user.getDiscordNickname() + ")");
            user.setDiscordNickname(null);
            user.setDiscordUserId(null);
            user.setDiscordVerified(false);
        }

        if (request.getBio() != null && !request.getBio().equals(user.getBio())) {
            changes.add(String.format("Bio updated (%d characters)", request.getBio().length()));
            user.setBio(request.getBio());
        }

        if (request.getRole() != null) {
            try {
                UserRole newRole = UserRole.valueOf(request.getRole());
                if (newRole != user.getRole()) {
                    changes.add("Role: " + user.getRole() + " -> " + newRole);
                    user.setRole(newRole);
                }
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Неверная роль");
            }
        }

        if (request.getIsPlayer() != null) {
            boolean wasPlayer = user.isPlayer();
            boolean nowPlayer = request.getIsPlayer();
            boolean isSilent = request.getSilent() != null && request.getSilent();

            if (wasPlayer != nowPlayer) {
                changes.add("IsPlayer: " + wasPlayer + " -> " + nowPlayer + (isSilent ? " (Silent)" : ""));
                user.setPlayer(nowPlayer);
                if (nowPlayer) {
                    rconService.addPlayerToWhitelist(user.getMinecraftNickname());
                } else {
                    rconService.removePlayerFromWhitelist(user.getMinecraftNickname());
                    rconService.kickPlayerWithBanMessage(user.getMinecraftNickname(), "Ваш статус игрока был отозван администратором " + adminName);
                }

                // Sync @SL Discord role
                if (discordService.isEnabled()) {
                    // Resolve Discord user ID if not yet saved
                    if (user.getDiscordUserId() == null) {
                        discordService.findDiscordUserId(user.getDiscordNickname())
                                .ifPresent(user::setDiscordUserId);
                    }
                    if (user.getDiscordUserId() != null) {
                        if (nowPlayer) {
                            discordService.assignSlRole(user.getDiscordUserId());
                            if (!isSilent) {
                                discordService.sendDirectMessage(user.getDiscordUserId(),
                                        "**Приветствую!**\n" +
                                                "Вам выдана роль @SL на сервере StoryLegends\n" +
                                                "Добро пожаловать на наш сервер, дабы **начать играть** вам нужно **прочитать** канал <#1229044440178626660>.\n"
                                                +
                                                "Так-же если вы ещё не ознакомилсь с [правилами](https://www.storylegends.xyz/rules) сервера, то обязательно это сделайте!\n"
                                                +
                                                "**Модератор:** " + adminName + "\n" +
                                                "***С уважением, <:slteam:1244336090928906351>***");
                            }
                        } else {
                            discordService.removeSlRole(user.getDiscordUserId());
                            if (!isSilent) {
                                discordService.sendDirectMessage(user.getDiscordUserId(),
                                        "**StoryLegends** — Ваш статус игрока был отозван администрацией. Роль @SL удалена.\n"
                                                +
                                                "**Модератор:** " + adminName + "\n" +
                                                "**С уважением, <:slteam:1244336090928906351>**");
                            }
                        }
                    }
                }
            }
        }

        User updated = userRepository.save(user);

        if (!changes.isEmpty()) {
            auditLogService.logAction(adminId, adminName, "ADMIN_UPDATE_USER",
                    "Админ обновил данные: " + String.join(", ", changes),
                    user.getId(), user.getUsername());
        }

        return mapToResponse(updated, true);
    }

    @Transactional
    public void deleteUser(Long userId, Long adminId, String adminName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        // Delete related entities manually to avoid FK violations
        applicationRepository.deleteAllByUserId(userId);
        warningRepository.deleteAllByUserId(userId);
        warningRepository.deleteAllByIssuedById(userId);

        userRepository.delete(user);
        auditLogService.logAction(adminId, adminName, "ADMIN_DELETE_USER", "Админ удалил пользователя", user.getId(),
                user.getUsername());
    }

    @Transactional
    public UserResponse createUser(AdminCreateUserRequest request, Long adminId, String adminName) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Имя пользователя уже занято");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email уже используется");
        }

        if (request.getDiscordNickname() != null && !request.getDiscordNickname().isBlank()
                && userRepository.existsByDiscordNickname(request.getDiscordNickname())) {
            throw new IllegalArgumentException("Discord никнейм уже используется");
        }
        if (request.getMinecraftNickname() != null && !request.getMinecraftNickname().isBlank()
                && userRepository.existsByMinecraftNickname(request.getMinecraftNickname())) {
            throw new IllegalArgumentException("Minecraft никнейм уже используется");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setDiscordNickname(request.getDiscordNickname() != null && !request.getDiscordNickname().isBlank()
                ? request.getDiscordNickname()
                : null);
        user.setMinecraftNickname(request.getMinecraftNickname() != null && !request.getMinecraftNickname().isBlank()
                ? HtmlUtils.htmlEscape(request.getMinecraftNickname())
                : null);
        user.setBio(request.getBio() != null && !request.getBio().isBlank()
                ? HtmlUtils.htmlEscape(request.getBio())
                : null);

        if (request.getRole() != null) {
            try {
                user.setRole(UserRole.valueOf(request.getRole()));
            } catch (IllegalArgumentException e) {
                user.setRole(UserRole.ROLE_USER);
            }
        } else {
            user.setRole(UserRole.ROLE_USER);
        }

        user.setPlayer(request.getIsPlayer() != null ? request.getIsPlayer() : false);
        if (user.isPlayer()) {
            rconService.addPlayerToWhitelist(user.getMinecraftNickname());
        }
        user.setEmailVerified(request.isEmailVerified());

        User saved = userRepository.save(user);

        // Sync Discord Avatar & Role if available
        if (saved.getDiscordNickname() != null && discordService.isEnabled()) {
            discordService.findDiscordUserId(saved.getDiscordNickname())
                    .ifPresent(discordId -> {
                        saved.setDiscordUserId(discordId);
                        userRepository.save(saved);
                        syncDiscordAvatarForUser(saved);

                        if (saved.isPlayer()) {
                            discordService.assignSlRole(discordId);
                            discordService.sendDirectMessage(discordId,
                                    "**Приветствую!**\n" +
                                            "Вам выдана роль @SL на сервере StoryLegends\n" +
                                            "Добро пожаловать на наш сервер, дабы **начать играть** вам нужно **прочитать** канал <#1229044440178626660>.\n"
                                            +
                                            "Так-же если вы ещё не ознакомилсь с [правилами](https://www.storylegends.xyz/rules) сервера, то обязательно это сделайте!\n"
                                            +
                                            "**Модератор:** " + adminName + "\n" +
                                            "***С уважением, <:slteam:1244336090928906351>***");
                        }
                    });
        }

        auditLogService.logAction(adminId, adminName, "ADMIN_CREATE_USER", "Админ создал нового пользователя",
                saved.getId(), saved.getUsername());
        return mapToResponse(saved, true);
    }

    @Transactional
    public void processForgotPassword(String email) {
        // Find user by email
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = java.util.UUID.randomUUID().toString();
            user.setResetPasswordToken(token);
            // 1 hour expiry
            user.setResetPasswordTokenExpiry(System.currentTimeMillis() + 3600000);
            userRepository.save(user);

            emailService.sendForgotPasswordEmail(user.getEmail(), user.getUsername(), token);

            auditLogService.logAction(user.getId(), user.getUsername(), "USER_FORGOT_PASSWORD",
                    "Запросил восстановление пароля через email", user.getId(), user.getUsername());
        });
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Неверный или истекший токен восстановления"));

        if (user.getResetPasswordTokenExpiry() == null
                || user.getResetPasswordTokenExpiry() < System.currentTimeMillis()) {
            throw new IllegalArgumentException("Срок действия токена истек");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        userRepository.save(user);

        auditLogService.logAction(user.getId(), user.getUsername(), "USER_RESET_PASSWORD",
                "Успешно изменил пароль через токен восстановления", user.getId(), user.getUsername());
    }

    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&+=";
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder();

        for (int i = 0; i < 12; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }

        return password.toString();
    }

    private UserResponse mapToResponse(User user) {
        return mapToResponse(user, false);
    }

    private PublicUserResponse mapToPublicResponse(User user) {
        PublicUserResponse response = new PublicUserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setDiscordNickname(user.getDiscordNickname());
        response.setMinecraftNickname(user.getMinecraftNickname());
        response.setRole(user.getRole());
        response.setAvatarUrl(resolveAvatarUrl(user.getAvatarUrl(), user.getUsername()));
        response.setBio(user.getBio());

        if (user.getBadges() != null) {
            List<BadgeResponse> badges = user.getBadges().stream()
                    .map(b -> {
                        BadgeResponse br = new BadgeResponse();
                        br.setId(b.getId());
                        br.setName(b.getName());
                        br.setColor(b.getColor());
                        br.setSvgIcon(b.getSvgIcon());
                        return br;
                    })
                    .collect(Collectors.toList());
            response.setBadges(badges);
        }

        response.setBoosted(user.isBoosted());

        return response;
    }

    public PublicUserResponse getPublicUser(Long userId) {
        return userRepository.findById(userId)
                .map(this::mapToPublicResponse)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }

    public UserResponse getUserById(Long userId) {
        return userRepository.findById(userId)
                .map(this::mapToResponse)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }

    /**
     * Resolves an avatar URL or object key to a viewable URL.
     * - Plain object key (e.g., "avatars/uuid.png") → generates presigned/public
     * URL
     * - Old full S3/MinIO URL → extracts object key, then generates fresh URL
     * - External URL (Discord CDN etc.) → returned as-is
     */
    public String resolveAvatarUrl(String avatarUrl, String username) {
        if (avatarUrl == null || avatarUrl.isBlank()) {
            return username != null && !username.isBlank() ? username.substring(0, 1).toUpperCase() : null;
        }

        String resolved = avatarUrl;
        if (!avatarUrl.startsWith("http://") && !avatarUrl.startsWith("https://")) {
            // Stored as object key — generate fresh URL
            try {
                resolved = fileStorageService.resolveUrl(avatarUrl);
                // If storage is disabled, resolveUrl returns objectKey (e.g. "avatars/...")
                // which leads to 404. In this case, we prefer null/letter fallback.
                if (resolved != null && !resolved.startsWith("http")) {
                    resolved = null;
                }
            } catch (Exception e) {
                resolved = null;
            }
        } else {
            // It's a full URL — try to extract object key and re-resolve (handles expired
            // presigned URLs)
            try {
                String objectKey = fileStorageService.extractObjectKey(avatarUrl);
                if (objectKey != null) {
                    resolved = fileStorageService.resolveUrl(objectKey);
                }
            } catch (Exception ignored) {
            }
        }

        if (resolved == null || resolved.isBlank() || (!resolved.startsWith("http") && resolved.length() > 1)) {
            return username != null && !username.isBlank() ? username.substring(0, 1).toUpperCase() : null;
        }

        return resolved;
    }

    private UserResponse mapToResponse(User user, boolean includeSecurityInfo) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setDiscordNickname(user.getDiscordNickname());
        response.setMinecraftNickname(user.getMinecraftNickname());
        response.setRole(user.getRole());
        response.setAvatarUrl(resolveAvatarUrl(user.getAvatarUrl(), user.getUsername()));
        if (user.isBanned() && user.getBanExpiresAt() != null && java.time.LocalDateTime.now().isAfter(user.getBanExpiresAt())) {
            user.setBanned(false);
            user.setBanReason(null);
            user.setBanExpiresAt(null);
            userRepository.save(user);
        }
        response.setBanned(user.isBanned());
        response.setBanReason(user.getBanReason());
        response.setBanExpiresAt(user.getBanExpiresAt());
        response.setEmailVerified(user.isEmailVerified());
        response.setTotpEnabled(user.isTotpEnabled());
        response.setBio(user.getBio());
        response.setPlayer(user.isPlayer());
        response.setInSeason(user.isInSeason());
        response.setDiscordUserId(user.getDiscordUserId());
        response.setDiscordVerified(user.isDiscordVerified());
        response.setSponsorshipLevel(user.getSponsorshipLevel() != null ? user.getSponsorshipLevel() : 0);
        response.setSponsorshipExpiresAt(user.getSponsorshipExpiresAt());
        
        if (includeSecurityInfo) {
            response.setStripeSubscriptionId(user.getStripeSubscriptionId());
        }
        
        response.setSubscriptionRecurring(user.isSubscriptionRecurring());
        response.setTotalDonated(user.getTotalDonated() != null ? user.getTotalDonated() : 0);
        response.setCreatedAt(user.getCreatedAt());

        response.setInDiscordServer(user.isInDiscord() ||
                discordService.isMemberInGuildCached(user.getDiscordUserId(), user.getDiscordNickname()));

        // Badges (no @SL role - that's internal Discord only)
        if (user.getBadges() != null) {
            List<BadgeResponse> badges = user.getBadges().stream()
                    .map(b -> {
                        BadgeResponse br = new BadgeResponse();
                        br.setId(b.getId());
                        br.setName(b.getName());
                        br.setColor(b.getColor());
                        br.setSvgIcon(b.getSvgIcon());
                        // discordRoleId not exposed to public
                        br.setCreatedAt(b.getCreatedAt());
                        return br;
                    })
                    .collect(Collectors.toList());
            response.setBadges(badges);
        }

        // Security info - only for admin view or current user viewing self
        if (includeSecurityInfo) {
            response.setEmail(user.getEmail());
            response.setRegistrationIp(user.getRegistrationIp());
            response.setRegistrationUserAgent(user.getRegistrationUserAgent());
            response.setLastLoginIp1(user.getLastLoginIp1());
            response.setLastLoginUserAgent1(user.getLastLoginUserAgent1());
            response.setLastLoginIp2(user.getLastLoginIp2());
            response.setLastLoginUserAgent2(user.getLastLoginUserAgent2());
            response.setLastLoginTime1(user.getLastLoginTime1());
            response.setLastLoginTime2(user.getLastLoginTime2());

            response.setRegistrationCanvas(user.getRegistrationCanvas());
            response.setRegistrationWebgl(user.getRegistrationWebgl());
            response.setRegistrationTimezone(user.getRegistrationTimezone());
            response.setRegistrationLanguage(user.getRegistrationLanguage());
            response.setRegistrationHardware(user.getRegistrationHardware());
            response.setRegistrationResolution(user.getRegistrationResolution());
            response.setRegistrationMemory(user.getRegistrationMemory());
            response.setRegistrationPixelRatio(user.getRegistrationPixelRatio());
            response.setRegistrationTouchPoints(user.getRegistrationTouchPoints());

            response.setLastLoginCanvas1(user.getLastLoginCanvas1());
            response.setLastLoginWebgl1(user.getLastLoginWebgl1());
            response.setLastLoginTimezone1(user.getLastLoginTimezone1());
            response.setLastLoginLanguage1(user.getLastLoginLanguage1());
            response.setLastLoginHardware1(user.getLastLoginHardware1());
            response.setLastLoginResolution1(user.getLastLoginResolution1());
            response.setLastLoginMemory1(user.getLastLoginMemory1());
            response.setLastLoginPixelRatio1(user.getLastLoginPixelRatio1());
            response.setLastLoginTouchPoints1(user.getLastLoginTouchPoints1());

            response.setLastLoginCanvas2(user.getLastLoginCanvas2());
            response.setLastLoginWebgl2(user.getLastLoginWebgl2());
            response.setLastLoginTimezone2(user.getLastLoginTimezone2());
            response.setLastLoginLanguage2(user.getLastLoginLanguage2());
            response.setLastLoginHardware2(user.getLastLoginHardware2());
            response.setLastLoginResolution2(user.getLastLoginResolution2());
            response.setLastLoginMemory2(user.getLastLoginMemory2());
            response.setLastLoginPixelRatio2(user.getLastLoginPixelRatio2());
            response.setLastLoginTouchPoints2(user.getLastLoginTouchPoints2());
        }

        response.setWarningsCount(warningRepository.countByUserIdAndActiveTrue(user.getId()));
        response.setBoosted(user.isBoosted());

        // Calculate dossier warning status indicators (IP matches, suspicious mods)
        boolean hasCoincidences = false;
        boolean hasBannedCoincidences = false;
        try {
            String rawIp1 = extractRawIp(user.getRegistrationIp());
            String rawIp2 = extractRawIp(user.getLastLoginIp1());
            String rawIp3 = extractRawIp(user.getLastLoginIp2());

            String subnet1 = getSubnetPrefix(rawIp1);
            String subnet2 = getSubnetPrefix(rawIp2);
            String subnet3 = getSubnetPrefix(rawIp3);

            String qIp1 = subnet1 != null ? subnet1 : (rawIp1 != null ? rawIp1 : "DUMMY_IP_NO_MATCH");
            String qIp2 = subnet2 != null ? subnet2 : (rawIp2 != null ? rawIp2 : "DUMMY_IP_NO_MATCH");
            String qIp3 = subnet3 != null ? subnet3 : (rawIp3 != null ? rawIp3 : "DUMMY_IP_NO_MATCH");

            java.util.Set<User> candidates = new java.util.HashSet<>();
            if (!qIp1.equals("DUMMY_IP_NO_MATCH") || !qIp2.equals("DUMMY_IP_NO_MATCH") || !qIp3.equals("DUMMY_IP_NO_MATCH")) {
                candidates.addAll(userRepository.findRelatedAccountsByRawIps(user.getId(), qIp1, qIp2, qIp3));
            }

            for (User other : candidates) {
                int score = calculateSimilarityScore(user, other);
                if (score >= 40) {
                    hasCoincidences = true;
                    if (other.isBanned()) {
                        hasBannedCoincidences = true;
                    }
                }
            }
        } catch (Exception e) {
            // Safe fallback
        }
        response.setHasCoincidences(hasCoincidences);
        response.setHasBannedCoincidences(hasBannedCoincidences);

        boolean hasSuspiciousMods = false;
        try {
            String mcNick = user.getMinecraftNickname();
            if (mcNick == null || mcNick.isBlank()) {
                mcNick = user.getUsername();
            }
            if (mcNick != null && !mcNick.isBlank()) {
                hasSuspiciousMods = anticheatSnapshotRepository.existsByPlayerNameIgnoreCaseAndSuspiciousTrue(mcNick);
            }
        } catch (Exception e) {
            // Safe fallback
        }
        response.setHasSuspiciousMods(hasSuspiciousMods);

        return response;
    }

    @Transactional
    public void recordLogin(String username, String ip, String userAgent, java.util.Map<String, String> fp) {
        userRepository.findByUsername(username).ifPresent(user -> {
            String geoIp = geoIpService.formatIpWithGeo(ip);

            // Shift: 1->2, new->1
            user.setLastLoginIp2(user.getLastLoginIp1());
            user.setLastLoginUserAgent2(user.getLastLoginUserAgent1());
            user.setLastLoginTime2(user.getLastLoginTime1());

            user.setLastLoginCanvas2(user.getLastLoginCanvas1());
            user.setLastLoginWebgl2(user.getLastLoginWebgl1());
            user.setLastLoginTimezone2(user.getLastLoginTimezone1());
            user.setLastLoginLanguage2(user.getLastLoginLanguage1());
            user.setLastLoginHardware2(user.getLastLoginHardware1());
            user.setLastLoginResolution2(user.getLastLoginResolution1());
            user.setLastLoginMemory2(user.getLastLoginMemory1());
            user.setLastLoginPixelRatio2(user.getLastLoginPixelRatio1());
            user.setLastLoginTouchPoints2(user.getLastLoginTouchPoints1());

            user.setLastLoginIp1(geoIp);
            user.setLastLoginUserAgent1(userAgent);
            user.setLastLoginTime1(java.time.LocalDateTime.now());

            if (fp != null) {
                user.setLastLoginCanvas1(fp.get("canvas"));
                user.setLastLoginWebgl1(fp.get("webgl"));
                user.setLastLoginTimezone1(fp.get("timezone"));
                user.setLastLoginLanguage1(fp.get("language"));
                if (fp.get("hardware") != null && !fp.get("hardware").isBlank()) {
                    try {
                        user.setLastLoginHardware1(Integer.parseInt(fp.get("hardware")));
                    } catch (NumberFormatException e) {
                        // Ignore
                    }
                }
                user.setLastLoginResolution1(fp.get("resolution"));
                user.setLastLoginMemory1(fp.get("memory"));
                user.setLastLoginPixelRatio1(fp.get("pixelRatio"));
                user.setLastLoginTouchPoints1(fp.get("touchPoints"));
            }

            // Resolve Discord user ID if not set
            if (user.getDiscordUserId() == null && discordService.isEnabled()) {
                discordService.findDiscordUserId(user.getDiscordNickname())
                        .ifPresent(user::setDiscordUserId);
            }

            // Auto-sync Discord avatar if missing
            if ((user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) && user.getDiscordUserId() != null) {
                String avatarUrl = discordService.syncDiscordAvatar(user.getDiscordUserId());
                if (avatarUrl != null) {
                    user.setAvatarUrl(avatarUrl);
                }
            }

            syncDiscordBoostStatusForUser(user);

            userRepository.save(user);

            // Log login action
            auditLogService.logAction(user.getId(), user.getUsername(), "USER_LOGIN",
                    String.format("Вход в систему (IP: %s, UA: %s)", geoIp, userAgent),
                    user.getId(), user.getUsername());
        });
    }

    private String extractRawIp(String ipString) {
        if (ipString == null || ipString.isBlank()) return null;
        
        // Match IPv4
        java.util.regex.Pattern ipv4Pattern = java.util.regex.Pattern.compile("\\b(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})\\b");
        java.util.regex.Matcher ipv4Matcher = ipv4Pattern.matcher(ipString);
        if (ipv4Matcher.find()) {
            return ipv4Matcher.group(1);
        }
        
        // Match IPv6
        java.util.regex.Pattern ipv6Pattern = java.util.regex.Pattern.compile("\\b([0-9a-fA-F:]+:[0-9a-fA-F:]+)\\b");
        java.util.regex.Matcher ipv6Matcher = ipv6Pattern.matcher(ipString);
        if (ipv6Matcher.find()) {
            return ipv6Matcher.group(1);
        }
        
        // Fallback
        if (ipString.contains(",")) {
            String[] parts = ipString.split(",");
            String last = parts[parts.length - 1].trim();
            if (last.contains(" ")) {
                return last.split(" ")[0].trim();
            }
            return last;
        }
        return ipString.split(" ")[0].trim();
    }

    private String getSubnetPrefix(String ip) {
        if (ip == null || ip.isBlank()) return null;
        String[] parts = ip.split("\\.");
        if (parts.length == 4) {
            return parts[0] + "." + parts[1] + "." + parts[2] + ".";
        }
        return null;
    }

    private boolean shareSubnet(String ip1, String ip2) {
        if (ip1 == null || ip2 == null) return false;
        if (ip1.equals(ip2)) return true;
        String[] parts1 = ip1.split("\\.");
        String[] parts2 = ip2.split("\\.");
        if (parts1.length == 4 && parts2.length == 4) {
            return parts1[0].equals(parts2[0]) && parts1[1].equals(parts2[1]) && parts1[2].equals(parts2[2]);
        }
        return false;
    }

    public List<UserResponse> getRelatedAccounts(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        String rawIp1 = extractRawIp(user.getRegistrationIp());
        String rawIp2 = extractRawIp(user.getLastLoginIp1());
        String rawIp3 = extractRawIp(user.getLastLoginIp2());

        String subnet1 = getSubnetPrefix(rawIp1);
        String subnet2 = getSubnetPrefix(rawIp2);
        String subnet3 = getSubnetPrefix(rawIp3);

        String qIp1 = subnet1 != null ? subnet1 : (rawIp1 != null ? rawIp1 : "DUMMY_IP_NO_MATCH");
        String qIp2 = subnet2 != null ? subnet2 : (rawIp2 != null ? rawIp2 : "DUMMY_IP_NO_MATCH");
        String qIp3 = subnet3 != null ? subnet3 : (rawIp3 != null ? rawIp3 : "DUMMY_IP_NO_MATCH");

        String c1 = user.getRegistrationCanvas();
        String c2 = user.getLastLoginCanvas1();
        String c3 = user.getLastLoginCanvas2();

        String qc1 = (c1 != null && !c1.isBlank() && !c1.equals("unknown")) ? c1 : "DUMMY_CANVAS_NO_MATCH";
        String qc2 = (c2 != null && !c2.isBlank() && !c2.equals("unknown")) ? c2 : "DUMMY_CANVAS_NO_MATCH";
        String qc3 = (c3 != null && !c3.isBlank() && !c3.equals("unknown")) ? c3 : "DUMMY_CANVAS_NO_MATCH";

        java.util.Set<User> candidates = new java.util.HashSet<>();
        if (!qIp1.equals("DUMMY_IP_NO_MATCH") || !qIp2.equals("DUMMY_IP_NO_MATCH") || !qIp3.equals("DUMMY_IP_NO_MATCH")) {
            candidates.addAll(userRepository.findRelatedAccountsByRawIps(user.getId(), qIp1, qIp2, qIp3));
        }
        if (!qc1.equals("DUMMY_CANVAS_NO_MATCH") || !qc2.equals("DUMMY_CANVAS_NO_MATCH") || !qc3.equals("DUMMY_CANVAS_NO_MATCH")) {
            candidates.addAll(userRepository.findRelatedAccountsByCanvas(user.getId(), qc1, qc2, qc3));
        }

        List<UserResponse> related = new java.util.ArrayList<>();
        for (User other : candidates) {
            int score = calculateSimilarityScore(user, other);
            if (score >= 40) {
                related.add(mapToResponse(other, true));
            }
        }
        return related;
    }

    private int calculateSimilarityScore(User u1, User u2) {
        // Extract raw IPs
        String u1RegIp = extractRawIp(u1.getRegistrationIp());
        String u1LoginIp1 = extractRawIp(u1.getLastLoginIp1());
        String u1LoginIp2 = extractRawIp(u1.getLastLoginIp2());

        String u2RegIp = extractRawIp(u2.getRegistrationIp());
        String u2LoginIp1 = extractRawIp(u2.getLastLoginIp1());
        String u2LoginIp2 = extractRawIp(u2.getLastLoginIp2());

        boolean hasIpOrSubnetMatch = false;

        java.util.List<String> u1Ips = java.util.Arrays.asList(u1RegIp, u1LoginIp1, u1LoginIp2);
        java.util.List<String> u2Ips = java.util.Arrays.asList(u2RegIp, u2LoginIp1, u2LoginIp2);

        for (String ip1 : u1Ips) {
            if (ip1 == null || ip1.isBlank()) continue;
            for (String ip2 : u2Ips) {
                if (ip2 == null || ip2.isBlank()) continue;
                if (ip1.equals(ip2) || shareSubnet(ip1, ip2)) {
                    hasIpOrSubnetMatch = true;
                    break;
                }
            }
            if (hasIpOrSubnetMatch) break;
        }

        // Extract timezones
        String u1Tz = u1.getRegistrationTimezone();
        String u1Tz1 = u1.getLastLoginTimezone1();
        String u1Tz2 = u1.getLastLoginTimezone2();

        String u2Tz = u2.getRegistrationTimezone();
        String u2Tz1 = u2.getLastLoginTimezone1();
        String u2Tz2 = u2.getLastLoginTimezone2();

        boolean hasTzMatch = false;
        java.util.List<String> u1Timezones = java.util.Arrays.asList(u1Tz, u1Tz1, u1Tz2);
        java.util.List<String> u2Timezones = java.util.Arrays.asList(u2Tz, u2Tz1, u2Tz2);

        for (String tz1 : u1Timezones) {
            if (tz1 == null || tz1.isBlank() || tz1.equalsIgnoreCase("unknown")) continue;
            for (String tz2 : u2Timezones) {
                if (tz2 == null || tz2.isBlank() || tz2.equalsIgnoreCase("unknown")) continue;
                if (tz1.equalsIgnoreCase(tz2)) {
                    hasTzMatch = true;
                    break;
                }
            }
            if (hasTzMatch) break;
        }

        if (hasIpOrSubnetMatch && hasTzMatch) {
            return 50; // Threshold is 40, so this triggers related account match
        }

        return 0;
    }

    @Transactional
    public UserResponse updateSponsorshipManual(Long userId, Integer level, java.time.LocalDateTime expiresAt, Integer totalDonated, Boolean subscriptionRecurring, Long adminId, String adminName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        Integer oldLevel = user.getSponsorshipLevel() != null ? user.getSponsorshipLevel() : 0;
        java.time.LocalDateTime oldExpires = user.getSponsorshipExpiresAt();
        Integer oldTotalDonated = user.getTotalDonated() != null ? user.getTotalDonated() : 0;
        boolean oldRecurring = user.isSubscriptionRecurring();

        user.setSponsorshipLevel(level);
        user.setSponsorshipExpiresAt(expiresAt);
        if (totalDonated != null) {
            user.setTotalDonated(totalDonated);
        }
        if (subscriptionRecurring != null) {
            user.setSubscriptionRecurring(subscriptionRecurring);
        }
        User saved = userRepository.save(user);

        auditLogService.logAction(adminId, adminName, "ADMIN_MANUAL_SPONSORSHIP",
                String.format("Вручную изменено спонсорство пользователя %s: Уровень %d -> %d, Истекает: %s -> %s, Донат (руб): %d -> %d, Автопродление: %b -> %b",
                        user.getUsername(), oldLevel, level, 
                        oldExpires != null ? oldExpires.toString() : "нет",
                        expiresAt != null ? expiresAt.toString() : "нет",
                        oldTotalDonated, user.getTotalDonated(),
                        oldRecurring, user.isSubscriptionRecurring()),
                userId, user.getUsername());

        return mapToResponse(saved, true);
    }
}
