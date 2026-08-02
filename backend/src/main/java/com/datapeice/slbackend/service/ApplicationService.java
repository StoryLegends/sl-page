package com.datapeice.slbackend.service;

import com.datapeice.slbackend.dto.ApplicationResponse;
import com.datapeice.slbackend.dto.CreateApplicationRequest;
import com.datapeice.slbackend.dto.MyApplicationsResponse;
import com.datapeice.slbackend.dto.UpdateApplicationStatusRequest;
import com.datapeice.slbackend.entity.Application;
import com.datapeice.slbackend.entity.ApplicationStatus;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.repository.ApplicationRepository;
import com.datapeice.slbackend.repository.UserRepository;
import com.datapeice.slbackend.entity.SiteSettings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
public class ApplicationService {

    private static final Logger logger = LoggerFactory.getLogger(ApplicationService.class);

    private final ApplicationRepository applicationRepository;
    private final RecaptchaService recaptchaService;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final DiscordService discordService;

    private final SiteSettingsService siteSettingsService;
    private final AuditLogService auditLogService;
    private final RconService rconService;

    public ApplicationService(ApplicationRepository applicationRepository, RecaptchaService recaptchaService,
            UserRepository userRepository, EmailService emailService, DiscordService discordService,
            SiteSettingsService siteSettingsService, AuditLogService auditLogService, RconService rconService) {
        this.applicationRepository = applicationRepository;
        this.recaptchaService = recaptchaService;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.discordService = discordService;
        this.siteSettingsService = siteSettingsService;
        this.auditLogService = auditLogService;
        this.rconService = rconService;
    }

    @Transactional
    public ApplicationResponse createApplication(User user, CreateApplicationRequest request) {
        logger.info("Application creation attempt by user: {}", user.getUsername());


        if (!siteSettingsService.getSettings().isApplicationsOpen()) {
            logger.warn("User {} tried to create application while applications are closed", user.getUsername());
            throw new IllegalStateException("Прием заявок в данный момент закрыт. Пожалуйста, следите за новостями.");
        }

        // Проверяем не забанен ли пользователь
        if (user.isBanned()) {
            logger.warn("Banned user {} tried to create application", user.getUsername());
            throw new IllegalStateException("Ваш аккаунт заблокирован. Вы не можете подавать заявки.");
        }

        // Проверяем не получал ли пользователь уже вердикт в текущем сезоне
        if (user.isInSeason()) {
            logger.warn("User {} already received a verdict in this season, cannot submit application",
                    user.getUsername());
            throw new IllegalStateException(
                    "Вам уже вынесли вердикт в этом сезоне (приняты или отказаны). Подайте новую заявку в следующем сезоне.");
        }

        // Проверяем подтвержден ли email
        if (!user.isEmailVerified()) {
            logger.warn("User {} tried to create application without verifying email", user.getUsername());
            throw new IllegalStateException("Вы должны подтвердить свой email перед подачей заявки");
        }

        // Проверяем верифицирован ли Discord аккаунт
        if (!user.isDiscordVerified()) {
            logger.warn("User {} tried to create application without Discord verification", user.getUsername());
            throw new IllegalStateException("Вы должны подтвердить свой Discord аккаунт перед подачей заявки");
        }

        // Проверяем reCAPTCHA
        String recaptchaToken = request.getRecaptchaToken();
        if (recaptchaToken == null || recaptchaToken.isBlank()) {
            logger.warn("reCAPTCHA token missing for user: {}", user.getUsername());
            throw new IllegalStateException("reCAPTCHA token обязателен для отправки заявки");
        }

        if (!recaptchaService.verifyRecaptcha(recaptchaToken, "submit_application")) {
            logger.warn("reCAPTCHA verification failed for user: {}", user.getUsername());
            throw new IllegalStateException("reCAPTCHA проверка не пройдена. Возможно, вы робот или токен истек");
        }

        logger.info("reCAPTCHA verified successfully for user: {}", user.getUsername());

        // Проверяем наличие пользователя в Discord сервере
        if (discordService.isEnabled()) {
            boolean inGuild = discordService.isMemberInGuild(user.getDiscordNickname());
            if (!inGuild) {
                logger.warn("User {} is not in Discord guild", user.getUsername());
                throw new IllegalStateException(
                        "Вы должны быть участником нашего Discord сервера, чтобы подать заявку. Ник: "
                                + user.getDiscordNickname());
            }
            // Try to save Discord user ID for future notifications
            if (user.getDiscordUserId() == null) {
                Optional<String> discordId = discordService.findDiscordUserId(user.getDiscordNickname());
                discordId.ifPresent(id -> {
                    user.setDiscordUserId(id);
                    userRepository.save(user);
                });
            }
        }

        // Проверяем, нет ли уже активной заявки
        List<Application> existingPending = applicationRepository.findAllByUserIdAndStatus(
                user.getId(), ApplicationStatus.PENDING);

        if (!existingPending.isEmpty()) {
            throw new IllegalStateException("У вас уже есть активная заявка в статусе PENDING");
        }

        Application application = new Application();
        application.setUser(user);
        application.setFirstName(request.getFirstName());
        application.setAge(request.getAge());
        application.setWhyUs(request.getWhyUs());
        application.setSource(request.getSource());
        application.setMakeContent(request.isMakeContent());
        application.setAdditionalInfo(request.getAdditionalInfo());
        application.setSelfRating(request.getSelfRating());
        application.setStatus(ApplicationStatus.PENDING);

        Application saved = applicationRepository.save(application);
        auditLogService.logAction(user.getId(), user.getUsername(), "USER_SUBMIT_APPLICATION",
                "Отправил заявку на сервер", null, null);

        // Notify user via Discord DM
        if (user.getDiscordUserId() != null) {
            discordService.sendDirectMessage(user.getDiscordUserId(),
                    "**StoryLegends** — Ваша заявка на вступление была успешно отправлена! " +
                            "Мы рассмотрим её в ближайшее время.\n"
                            + "***С уважением, <:slteam:1244336090928906351>***");
        }

        // Notify admins
        discordService.notifyAdminsAboutNewApplication(user.getUsername());

        return mapToResponse(saved);
    }

    public MyApplicationsResponse getMyApplications(User user) {
        List<Application> applications = applicationRepository.findAllByUserId(user.getId());

        List<ApplicationResponse> history = applications.stream()
                .sorted((a1, a2) -> a2.getCreatedAt().compareTo(a1.getCreatedAt()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        MyApplicationsResponse result = new MyApplicationsResponse();
        result.setHistory(history);
        result.setCurrent(history.isEmpty() ? null : history.getFirst());
        return result;
    }

    public Page<ApplicationResponse> getAllApplications(String query, Pageable pageable) {
        if (query != null && !query.isBlank()) {
            return applicationRepository.findBySearch(null, query, pageable)
                    .map(this::mapToSummaryResponse);
        }
        return applicationRepository.findAll(pageable)
                .map(this::mapToSummaryResponse);
    }

    public Page<ApplicationResponse> getApplicationsByStatus(ApplicationStatus status, String query, Pageable pageable) {
        if (query != null && !query.isBlank()) {
            return applicationRepository.findBySearch(status, query, pageable)
                    .map(this::mapToSummaryResponse);
        }
        return applicationRepository.findAllByStatus(status, pageable)
                .map(this::mapToSummaryResponse);
    }

    public long countApplicationsByStatus(ApplicationStatus status) {
        return applicationRepository.countByStatus(status);
    }

    public ApplicationResponse getApplicationById(Long id) {
        return applicationRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
    }

    @Transactional
    public ApplicationResponse updateApplicationStatus(Long applicationId, UpdateApplicationStatusRequest request,
            Long adminId, String adminName) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));

        application.setStatus(request.getStatus());
        application.setAdminComment(request.getAdminComment());
        application.setHandledBy(adminName);

        SiteSettings settings = siteSettingsService.getSettings();

        if (request.getStatus() == ApplicationStatus.ACCEPTED) {
            User user = application.getUser();
            String reason = request.getAdminComment() != null ? request.getAdminComment() : "Отсутствует";

            user.setPlayer(true);
            // Resolve Discord user ID if not set (for DM)
            if (user.getDiscordUserId() == null && discordService.isEnabled()) {
                discordService.findDiscordUserId(user.getDiscordNickname())
                        .ifPresent(user::setDiscordUserId);
            }
            user.setInSeason(true);
            userRepository.save(user);

            if (settings.isSendEmailOnApplicationApproved()) {
                emailService.sendApplicationAcceptedEmail(user.getEmail(), user.getUsername(),
                        user.getDiscordNickname());
            }

            if (user.getDiscordUserId() != null) {
                // Выдаем роль @SL при принятии заявки
                discordService.assignSlRole(user.getDiscordUserId());

                // Отправляем личное сообщение
                discordService.sendDirectMessage(user.getDiscordUserId(),
                        "**Приветствую!**\n" +
                                "Ваша заявка на вступление на сервер **StoryLegends** была принята!\n" +
                                "Комментарий от администрации: *" + reason + "*\n" +
                                "**Администратор:** " + adminName + "\n\n" +
                                "Добро пожаловать на наш сервер, дабы **начать играть** вам нужно **прочитать** канал <#1229044440178626660>.\n"
                                +
                                "Так-же если вы ещё не ознакомилсь с [правилами](https://www.storylegends.xyz/rules) сервера, то обязательно это сделайте!\n"
                                +
                                "**Удачной игры**\n" +
                                "***С уважением, <:slteam:1244336090928906351>***");
            }
            // Выполняем RCON команду
            rconService.addPlayerToWhitelist(user.getMinecraftNickname());
        } else if (request.getStatus() == ApplicationStatus.REJECTED) {
            User user = application.getUser();

            if (settings.isSendEmailOnApplicationRejected()) {
                emailService.sendApplicationRejectedEmail(user.getEmail(), user.getUsername(),
                        request.getAdminComment());
            }

            // Send rejection DM
            if (user.getDiscordUserId() != null) {
                String reason = request.getAdminComment() != null ? request.getAdminComment() : "Причина не указана";
                discordService.sendDirectMessage(user.getDiscordUserId(),
                        "**Приветствую!**\n" +
                                "Ваша заявка на вступление на сервер **StoryLegends** к сожелению была **отклонена**!\n"
                                +
                                "Комментарий от администрации: *" + reason + "*\n" +
                                "\n**Администратор:** " + adminName + "\n" +
                                "***С уважением, <:slteam:1244336090928906351>***");

                // Remove @SL role if exists
                discordService.removeSlRole(user.getDiscordUserId());
            }
            user.setPlayer(false);
            user.setInSeason(true);
            userRepository.save(user);

            // Выполняем RCON команду
            rconService.removePlayerFromWhitelist(user.getMinecraftNickname());
        }

        Application updated = applicationRepository.save(application);
        auditLogService.logAction(adminId, adminName, "ADMIN_UPDATE_APPLICATION",
                "Изменил статус заявки на " + request.getStatus() + ". Комментарий: " + request.getAdminComment(),
                application.getUser().getId(), application.getUser().getUsername());
        return mapToResponse(updated);
    }

    private ApplicationResponse mapToResponse(Application application) {
        ApplicationResponse response = new ApplicationResponse();
        response.setId(application.getId());
        response.setFirstName(application.getFirstName());
        response.setAge(application.getAge());
        response.setWhyUs(application.getWhyUs());
        response.setSource(application.getSource());
        response.setMakeContent(application.isMakeContent());
        response.setAdditionalInfo(application.getAdditionalInfo());
        response.setSelfRating(application.getSelfRating());
        response.setStatus(application.getStatus());
        response.setAdminComment(application.getAdminComment());
        response.setHandledBy(application.getHandledBy());
        response.setCreatedAt(application.getCreatedAt());

        ApplicationResponse.UserSummary userSummary = new ApplicationResponse.UserSummary();
        userSummary.setId(application.getUser().getId());
        userSummary.setUsername(application.getUser().getUsername());
        userSummary.setEmail(application.getUser().getEmail());
        userSummary.setDiscordNickname(application.getUser().getDiscordNickname());
        userSummary.setMinecraftNickname(application.getUser().getMinecraftNickname());
        userSummary.setAvatarUrl(application.getUser().getAvatarUrl());
        userSummary.setDiscordVerified(application.getUser().isDiscordVerified());
        userSummary.setInDiscordServer(application.getUser().isInDiscord() ||
                discordService.isMemberInGuildCached(application.getUser().getDiscordUserId(),
                        application.getUser().getDiscordNickname()));
        response.setUser(userSummary);

        return response;
    }

    private ApplicationResponse mapToSummaryResponse(Application application) {
        ApplicationResponse response = mapToResponse(application);
        response.setWhyUs(null);
        response.setSource(null);
        response.setAdditionalInfo(null);
        response.setAdminComment(null);
        return response;
    }
}
