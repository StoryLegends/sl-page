package com.datapeice.slbackend.controller;

import com.datapeice.slbackend.dto.SignInBody;
import com.datapeice.slbackend.dto.SignUpBody;
import com.datapeice.slbackend.dto.VerifyEmailRequest;
import com.datapeice.slbackend.dto.ForgotPasswordRequest;
import com.datapeice.slbackend.dto.ResetPasswordRequest;
import com.datapeice.slbackend.entity.SiteSettings;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.entity.UserRole;
import com.datapeice.slbackend.repository.UserRepository;
import com.datapeice.slbackend.security.JwtCore;
import com.datapeice.slbackend.service.DiscordOAuthService;
import com.datapeice.slbackend.service.DiscordOAuthService.DiscordUserInfo;
import com.datapeice.slbackend.service.DiscordService;
import com.datapeice.slbackend.service.EmailService;
import com.datapeice.slbackend.service.GeoIpService;
import com.datapeice.slbackend.service.RecaptchaService;
import com.datapeice.slbackend.service.RateLimitService;
import com.datapeice.slbackend.service.TotpService;
import com.datapeice.slbackend.service.UserService;
import com.datapeice.slbackend.service.SiteSettingsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.security.SecureRandom;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final JwtCore jwtCore;
    private final EmailService emailService;
    private final RecaptchaService recaptchaService;
    private final RateLimitService rateLimitService;
    private final TotpService totpService;
    private final UserService userService;
    private final GeoIpService geoIpService;
    private final DiscordOAuthService discordOAuthService;
    private final DiscordService discordService;
    private final SiteSettingsService siteSettingsService;
    private final com.datapeice.slbackend.service.AuditLogService auditLogService;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${email.verification.expiration}")
    private long emailVerificationExpiration;

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.recaptcha.enabled:true}")
    private boolean recaptchaEnabled;

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    @Value("${app.auto-verify-email:false}")
    private boolean autoVerifyEmail;

    public AuthController(AuthenticationManager authenticationManager,
            UserRepository userRepository,
            BCryptPasswordEncoder bCryptPasswordEncoder,
            JwtCore jwtCore,
            EmailService emailService,
            RecaptchaService recaptchaService,
            RateLimitService rateLimitService,
            TotpService totpService,
            UserService userService,
            GeoIpService geoIpService,
            DiscordOAuthService discordOAuthService,
            DiscordService discordService,
            SiteSettingsService siteSettingsService,
            com.datapeice.slbackend.service.AuditLogService auditLogService,
            SimpMessagingTemplate messagingTemplate) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.bCryptPasswordEncoder = bCryptPasswordEncoder;
        this.jwtCore = jwtCore;
        this.emailService = emailService;
        this.recaptchaService = recaptchaService;
        this.rateLimitService = rateLimitService;
        this.totpService = totpService;
        this.userService = userService;
        this.geoIpService = geoIpService;
        this.discordOAuthService = discordOAuthService;
        this.discordService = discordService;
        this.siteSettingsService = siteSettingsService;
        this.auditLogService = auditLogService;
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping("/public/settings")
    public ResponseEntity<?> getPublicSettings() {
        SiteSettings settings = siteSettingsService.getSettings();
        return ResponseEntity.ok(Map.of(
                "registrationOpen", settings.isRegistrationOpen(),
                "applicationsOpen", settings.isApplicationsOpen(),
                "maintenanceMode", settings.isMaintenanceMode(),
                "announcementEnabled", settings.isAnnouncementEnabled(),
                "announcementText", settings.getAnnouncementText() != null ? settings.getAnnouncementText() : "",
                "announcementType", settings.getAnnouncementType() != null ? settings.getAnnouncementType() : "info"));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody SignUpBody body, HttpServletRequest request) {
        String ipAddress = getClientIP(request);
        String userAgent = request.getHeader("User-Agent");

        if (siteSettingsService.getSettings().isMaintenanceMode()) {
            return ResponseEntity.status(503).body(Map.of("error", "MAINTENANCE_MODE", "message", "На сайте ведутся технические работы. Регистрация закрыта."));
        }

        // Check if registration is open
        if (!siteSettingsService.getSettings().isRegistrationOpen()) {
            return ResponseEntity.status(403).body(Map.of("error", "Регистрация временно закрыта"));
        }

        // Проверка User-Agent
        if (userAgent == null || userAgent.isBlank() || userAgent.length() < 10) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid User-Agent"));
        }

        // Rate limiting
        if (!rateLimitService.checkAuthRateLimit(ipAddress)) {
            return ResponseEntity.status(429).body(Map.of("error", "Слишком много попыток. Попробуйте позже."));
        }

        // Проверка reCAPTCHA
        if (recaptchaEnabled) {
            String token = body.getRecaptchaToken();
            if (token == null || token.isBlank()) {
                logger.warn("reCAPTCHA token is missing. Request from IP: {}", ipAddress);
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "reCAPTCHA token обязателен",
                        "hint", "Frontend должен получить токен через grecaptcha.execute()"));
            }

            if (!recaptchaService.verifyRecaptcha(token, "register")) {
                logger.warn("reCAPTCHA verification failed for IP: {}", ipAddress);
                auditLogService.logSecurityIncident(body.getUsername(), "RECAPTCHA_FAIL",
                        "Ошибка проверки reCAPTCHA при регистрации", ipAddress, userAgent);
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "reCAPTCHA проверка не пройдена",
                        "hint", "Возможно, вы робот или токен истек"));
            }
        }

        // Email rate limiting
        if (emailEnabled && !rateLimitService.checkEmailRateLimit(ipAddress)) {
            return ResponseEntity.status(429).body(Map.of("error", "Превышен лимит отправки email. Попробуйте позже."));
        }

        if (userRepository.existsByUsername(body.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Имя пользователя уже занято"));
        }

        if (userRepository.existsByEmail(body.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email уже используется"));
        }

        if (userRepository.existsByMinecraftNickname(body.getMinecraftNickname())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Minecraft никнейм уже используется"));
        }

        User user = new User();
        user.setUsername(body.getUsername());
        user.setPassword(bCryptPasswordEncoder.encode(body.getPassword()));
        user.setEmail(body.getEmail());
        user.setMinecraftNickname(body.getMinecraftNickname());
        user.setRole(UserRole.ROLE_USER);
        // Security logging
        user.setRegistrationIp(geoIpService.formatIpWithGeo(ipAddress));
        user.setRegistrationUserAgent(
                userAgent != null && userAgent.length() > 255 ? userAgent.substring(0, 255) : userAgent);

        user.setRegistrationCanvas(request.getHeader("X-Fingerprint-Canvas"));
        user.setRegistrationWebgl(request.getHeader("X-Fingerprint-WebGL"));
        user.setRegistrationTimezone(request.getHeader("X-Fingerprint-Timezone"));
        user.setRegistrationLanguage(request.getHeader("X-Fingerprint-Language"));
        String regHardware = request.getHeader("X-Fingerprint-Hardware");
        if (regHardware != null && !regHardware.isBlank()) {
            try {
                user.setRegistrationHardware(Integer.parseInt(regHardware));
            } catch (NumberFormatException e) {
                // Ignore
            }
        }
        user.setRegistrationResolution(request.getHeader("X-Fingerprint-Resolution"));
        user.setRegistrationMemory(request.getHeader("X-Fingerprint-Memory"));
        user.setRegistrationPixelRatio(request.getHeader("X-Fingerprint-PixelRatio"));
        user.setRegistrationTouchPoints(request.getHeader("X-Fingerprint-TouchPoints"));

        // В dev режиме автоматически верифицируем email
        if (autoVerifyEmail) {
            user.setEmailVerified(true);
        } else {
            user.setEmailVerified(false);
            // Генерируем токен подтверждения email
            String verificationToken = generateVerificationToken();
            user.setEmailVerificationToken(verificationToken);
            user.setEmailVerificationTokenExpiry(System.currentTimeMillis() + emailVerificationExpiration);

            userRepository.save(user);
            auditLogService.logAction(user.getId(), user.getUsername(), "USER_REGISTER",
                    String.format("Зарегистрировался (MC: %s)", user.getMinecraftNickname()),
                    user.getId(), user.getUsername());
                    
            messagingTemplate.convertAndSend("/topic/admin/users", userService.getUserByIdForAdmin(user.getId()));

            // Отправляем письмо подтверждения
            if (emailEnabled) {
                try {
                    emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), verificationToken);
                } catch (Exception e) {
                    // Логируем ошибку, но не удаляем пользователя
                    // В dev режиме это не критично
                }
            }

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Регистрация успешна! Проверьте ваш email для подтверждения аккаунта."));
        }

        // Если auto-verify включен, сразу логиним пользователя
        userRepository.save(user);
        auditLogService.logAction(user.getId(), user.getUsername(), "USER_REGISTER",
                String.format("Зарегистрировался (MC: %s)", user.getMinecraftNickname()),
                user.getId(), user.getUsername());
                
        messagingTemplate.convertAndSend("/topic/admin/users", userService.getUserByIdForAdmin(user.getId()));

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user, null, user.getAuthorities());
        String jwtToken = jwtCore.generateToken(authentication, ipAddress, userAgent);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Регистрация успешна!",
                "token", jwtToken));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody VerifyEmailRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = getClientIP(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        logger.info("Email verification attempt with token: {}", request.getToken());

        User user = userRepository.findByEmailVerificationToken(request.getToken())
                .orElse(null);

        if (user == null) {
            logger.warn("Token not found in database: {}", request.getToken());

            // Проверяем, может быть email уже подтвержден (токен был использован ранее)
            // Это нормальная ситуация при повторных запросах от frontend
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Неверный токен подтверждения",
                    "code", "INVALID_TOKEN",
                    "hint", "Возможно, email уже подтвержден. Попробуйте войти."));
        }

        logger.info("User found for token: {}, expiry: {}, current time: {}",
                user.getUsername(), user.getEmailVerificationTokenExpiry(), System.currentTimeMillis());

        // Проверяем, не подтвержден ли уже email
        if (user.isEmailVerified()) {
            logger.info("Email already verified for user: {}, returning success", user.getUsername());

            // Возвращаем успех, генерируем новый токен
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    user, null, user.getAuthorities());
            String jwtToken = jwtCore.generateToken(authentication, ipAddress, userAgent);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Email уже подтвержден",
                    "token", jwtToken,
                    "alreadyVerified", true));
        }

        if (user.getEmailVerificationTokenExpiry() < System.currentTimeMillis()) {
            logger.warn("Token expired for user: {}", user.getUsername());
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Токен подтверждения истек",
                    "code", "TOKEN_EXPIRED",
                    "hint", "Запросите новое письмо подтверждения"));
        }

        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationTokenExpiry(null);
        userRepository.save(user);

        auditLogService.logAction(user.getId(), user.getUsername(), "USER_VERIFY_EMAIL",
                "Успешно подтвердил email", user.getId(), user.getUsername());

        logger.info("Email verified successfully for user: {}", user.getUsername());

        // Автоматический вход после подтверждения
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user, null, user.getAuthorities());
        String jwtToken = jwtCore.generateToken(authentication, ipAddress, userAgent);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Email подтвержден успешно!",
                "token", jwtToken,
                "alreadyVerified", false));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody SignInBody body, HttpServletRequest request) {
        String ipAddress = getClientIP(request);
        String userAgent = request.getHeader("User-Agent");

        // Проверка User-Agent
        if (userAgent == null || userAgent.isBlank() || userAgent.length() < 10) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid User-Agent"));
        }

        // Rate limiting
        if (!rateLimitService.checkAuthRateLimit(ipAddress)) {
            return ResponseEntity.status(429).body(Map.of("error", "Слишком много попыток. Попробуйте позже."));
        }

        try {
            // Сначала загружаем пользователя для проверки TOTP
            User user = userRepository.findByUsername(body.getUsername())
                    .orElseThrow(() -> new RuntimeException("Неверное имя пользователя или пароль"));

            // Проверяем режим техобслуживания
            if (siteSettingsService.getSettings().isMaintenanceMode()) {
                if (user.getRole() != UserRole.ROLE_ADMIN && user.getRole() != UserRole.ROLE_MODERATOR) {
                    return ResponseEntity.status(503).body(Map.of(
                            "error", "MAINTENANCE_MODE",
                            "message", "На сайте ведутся технические работы. Вход разрешен только администраторам."
                    ));
                }
            }

            // Проверяем TOTP если включен
            if (user.isTotpEnabled()) {
                if (body.getTotpCode() == null || body.getTotpCode().isBlank()) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "error", "TOTP code required",
                            "totpRequired", true));
                }

                if (!totpService.verifyCode(user.getTotpSecret(), body.getTotpCode())) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Неверный TOTP код"));
                }
            }

            // Аутентификация (даже для неподтвержденных пользователей)
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(body.getUsername(), body.getPassword()));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwtToken = jwtCore.generateToken(authentication, ipAddress, userAgent);

            // Record login IP/UA for security logging (includes audit log)
            final String finalUa = userAgent != null && userAgent.length() > 255 ? userAgent.substring(0, 255)
                    : userAgent;
            java.util.Map<String, String> fp = new java.util.HashMap<>();
            fp.put("canvas", request.getHeader("X-Fingerprint-Canvas"));
            fp.put("webgl", request.getHeader("X-Fingerprint-WebGL"));
            fp.put("timezone", request.getHeader("X-Fingerprint-Timezone"));
            fp.put("language", request.getHeader("X-Fingerprint-Language"));
            fp.put("hardware", request.getHeader("X-Fingerprint-Hardware"));
            fp.put("resolution", request.getHeader("X-Fingerprint-Resolution"));
            fp.put("memory", request.getHeader("X-Fingerprint-Memory"));
            fp.put("pixelRatio", request.getHeader("X-Fingerprint-PixelRatio"));
            fp.put("touchPoints", request.getHeader("X-Fingerprint-TouchPoints"));

            userService.recordLogin(user.getUsername(), ipAddress, finalUa, fp);

            // Возвращаем токен + статус верификации
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "token", jwtToken,
                    "emailVerified", user.isEmailVerified(),
                    "username", user.getUsername(),
                    "isPlayer", user.isPlayer()));
        } catch (Exception e) {
            logger.error("Authentication failed for user: {}", body.getUsername());
            auditLogService.logSecurityIncident(body.getUsername(), "LOGIN_FAIL",
                    String.format("Неверный пароль или имя пользователя"), ipAddress, userAgent);
            return ResponseEntity.badRequest().body(Map.of("error", "Неверное имя пользователя или пароль"));
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        String email = request.get("email");
        String ipAddress = getClientIP(httpRequest);

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email обязателен"));
        }

        // Rate limiting для email
        if (emailEnabled && !rateLimitService.checkEmailRateLimit(ipAddress)) {
            return ResponseEntity.status(429).body(Map.of("error", "Превышен лимит отправки email. Попробуйте позже."));
        }

        User user = userRepository.findByEmail(email)
                .orElse(null);

        if (user == null) {
            // Не раскрываем, существует ли email
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Если email существует, письмо будет отправлено."));
        }

        if (user.isEmailVerified()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email уже подтвержден"));
        }

        // Генерируем новый токен
        String verificationToken = generateVerificationToken();
        user.setEmailVerificationToken(verificationToken);
        user.setEmailVerificationTokenExpiry(System.currentTimeMillis() + emailVerificationExpiration);
        userRepository.save(user);

        auditLogService.logAction(user.getId(), user.getUsername(), "USER_RESEND_VERIFICATION",
                "Запросил повторное письмо подтверждения email", user.getId(), user.getUsername());

        // Отправляем письмо
        if (emailEnabled) {
            try {
                emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), verificationToken);
            } catch (Exception e) {
                // Логируем, но не показываем ошибку пользователю
            }
        }

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Письмо подтверждения отправлено на ваш email"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        userService.processForgotPassword(request.getEmail());
        // Always return OK to avoid user enumeration
        return ResponseEntity
                .ok(Map.of("message", "Если аккаунт с таким email существует, письмо для сброса пароля отправлено."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        logger.info("Resetting password for token: {}", request.getToken());
        try {
            userService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Пароль успешно изменен."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/discord/authorize")
    public ResponseEntity<?> getDiscordAuthorizeUrl(@AuthenticationPrincipal User currentUser) {
        String state = java.util.UUID.randomUUID().toString();

        // Re-load to attach to current session safely
        User user = userRepository.findById(currentUser.getId()).orElseThrow();
        user.setDiscordOauthState(state);
        userRepository.save(user);

        String authUrl = discordOAuthService.buildAuthorizationUrl(state);
        return ResponseEntity.ok(Map.of("url", authUrl));
    }

    /**
     * GET /api/auth/discord/callback
     * Discord redirects here after user authorizes.
     * Exchanges the code, links Discord to the user identified by the state param
     * (JWT),
     * then redirects the browser to the frontend.
     */
    @GetMapping("/discord/callback")
    public jakarta.servlet.http.HttpServletResponse discordCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {

        if (error != null || code == null || state == null) {
            response.sendRedirect(frontendUrl + "/profile?discord=error&reason=" +
                    (error != null ? error : "missing_params"));
            return response;
        }

        String redirectBase = frontendUrl + "/profile?discord=";

        try {
            User user = userRepository.findByDiscordOauthState(state).orElse(null);

            if (user == null) {
                response.sendRedirect(redirectBase + "error&reason=invalid_state_or_user_not_found");
                return response;
            }

            // Clear state immediately to avoid reuse
            user.setDiscordOauthState(null);
            userRepository.save(user);

            if (user.isDiscordVerified()) {
                response.sendRedirect(redirectBase + "already_connected");
                return response;
            }

            // Exchange code for access token
            String accessToken = discordOAuthService.exchangeCodeForToken(code);
            if (accessToken == null) {
                response.sendRedirect(redirectBase + "error&reason=token_exchange_failed");
                return response;
            }

            // Fetch Discord user info
            DiscordUserInfo discordUser = discordOAuthService.fetchUserInfo(accessToken);
            if (discordUser == null) {
                response.sendRedirect(redirectBase + "error&reason=user_info_failed");
                return response;
            }

            // Check if this Discord account is already linked to another user
            boolean alreadyLinked = userRepository.findByDiscordUserId(discordUser.id())
                    .map(existing -> !existing.getId().equals(user.getId()))
                    .orElse(false);
            if (alreadyLinked) {
                response.sendRedirect(redirectBase + "error&reason=discord_already_linked");
                return response;
            }

            // If user already has a discord nickname set, verify it matches the OAuth
            // account
            String existingNick = user.getDiscordNickname();
            if (existingNick != null && !existingNick.isBlank()) {
                if (!existingNick.equalsIgnoreCase(discordUser.displayName())
                        && !existingNick.equalsIgnoreCase(discordUser.username())) {
                    response.sendRedirect(redirectBase + "error&reason=discord_nickname_mismatch&expected=" +
                            java.net.URLEncoder.encode(existingNick, java.nio.charset.StandardCharsets.UTF_8) +
                            "&got=" +
                            java.net.URLEncoder.encode(discordUser.displayName(),
                                    java.nio.charset.StandardCharsets.UTF_8));
                    return response;
                }
            }

            // Update user
            user.setDiscordUserId(discordUser.id());
            user.setDiscordNickname(discordUser.displayName());
            user.setDiscordVerified(true);
            user.setInDiscord(discordService.checkMemberRest(discordUser.id()));

            // Sync avatar from Discord if no avatar set
            if (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) {
                String avatarUrl = discordService.syncDiscordAvatar(discordUser.id());
                if (avatarUrl != null) {
                    user.setAvatarUrl(avatarUrl);
                }
            }

            userRepository.save(user);

            auditLogService.logAction(user.getId(), user.getUsername(), "USER_CONNECT_DISCORD",
                    "Привязал Discord через OAuth: " + discordUser.displayName(), user.getId(), user.getUsername());

            logger.info("Discord account connected via OAuth callback for user {} -> discordId={}, nick={}",
                    user.getUsername(), discordUser.id(), discordUser.displayName());

            response.sendRedirect(redirectBase + "success&discordName=" +
                    java.net.URLEncoder.encode(discordUser.displayName(), java.nio.charset.StandardCharsets.UTF_8));

        } catch (Exception ex) {
            logger.error("Discord OAuth callback error: {}", ex.getMessage());
            response.sendRedirect(redirectBase + "error&reason=server_error");
        }
        return response;
    }

    /**
     * POST /api/auth/discord/connect
     * Authenticated users call this with the Discord OAuth2 authorization code.
     * It exchanges the code for an access token, fetches the Discord user info,
     * and marks the account as discordVerified.
     *
     * Body: { "code": "..." }
     */
    @PostMapping("/discord/connect")
    public ResponseEntity<?> connectDiscord(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, String> body) {

        String code = body.get("code");
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Discord OAuth code is required"));
        }

        // Re-load user from DB
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isDiscordVerified()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Discord уже подтверждён"));
        }

        // Exchange code for access token
        String accessToken = discordOAuthService.exchangeCodeForToken(code);
        if (accessToken == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Не удалось получить токен Discord. Попробуйте снова."));
        }

        // Fetch Discord user info
        DiscordUserInfo discordUser = discordOAuthService.fetchUserInfo(accessToken);
        if (discordUser == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Не удалось получить информацию о пользователе Discord."));
        }

        // Check that this Discord account is not already linked to another site user
        userRepository.findByDiscordUserId(discordUser.id()).ifPresent(existing -> {
            if (!existing.getId().equals(user.getId())) {
                throw new IllegalArgumentException("Этот Discord аккаунт уже привязан к другому пользователю.");
            }
        });

        // If user already has a discord nickname set, verify it matches the OAuth
        // account
        String existingNick = user.getDiscordNickname();
        if (existingNick != null && !existingNick.isBlank()) {
            if (!existingNick.equalsIgnoreCase(discordUser.displayName())
                    && !existingNick.equalsIgnoreCase(discordUser.username())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Discord аккаунт не совпадает с указанным никнеймом. " +
                                "Ожидается: " + existingNick + ", получен: " + discordUser.displayName()));
            }
        }

        // Update user
        user.setDiscordUserId(discordUser.id());
        user.setDiscordNickname(discordUser.displayName());
        user.setDiscordVerified(true);
        user.setInDiscord(discordService.checkMemberRest(discordUser.id()));

        // Sync avatar from Discord if no avatar set
        if (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) {
            String avatarUrl = discordService.syncDiscordAvatar(discordUser.id());
            if (avatarUrl != null) {
                user.setAvatarUrl(avatarUrl);
            }
        }

        userRepository.save(user);

        auditLogService.logAction(user.getId(), user.getUsername(), "USER_CONNECT_DISCORD",
                "Привязал Discord аккаунт: " + discordUser.displayName(), user.getId(), user.getUsername());

        logger.info("Discord account connected for user {} -> discordId={}, nick={}",
                user.getUsername(), discordUser.id(), discordUser.displayName());

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Discord аккаунт успешно подтверждён!",
                "discordUsername", discordUser.displayName(),
                "discordId", discordUser.id()));
    }

    /**
     * DELETE /api/auth/discord/disconnect
     * Removes Discord link from the current user's account.
     */
    @DeleteMapping("/discord/disconnect")
    public ResponseEntity<?> disconnectDiscord(@AuthenticationPrincipal User currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isPlayer()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Действующим игрокам запрещено отвязывать Discord."));
        }

        user.setDiscordVerified(false);
        user.setDiscordUserId(null);
        userRepository.save(user);

        auditLogService.logAction(user.getId(), user.getUsername(), "USER_DISCONNECT_DISCORD",
                "Отвязал Discord аккаунт", user.getId(), user.getUsername());

        return ResponseEntity.ok(Map.of("status", "success", "message", "Discord аккаунт отвязан."));
    }

    private String getClientIP(HttpServletRequest request) {
        // Cloudflare passes real IP in CF-Connecting-IP
        String cfIp = request.getHeader("CF-Connecting-IP");
        if (cfIp != null && !cfIp.isBlank()) {
            return cfIp.trim();
        }
        // Fallback: X-Forwarded-For (other proxies/load balancers)
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isBlank()) {
            return xfHeader.split(",")[0].trim();
        }
        // Last resort: direct connection IP
        return request.getRemoteAddr();
    }

    private String generateVerificationToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        StringBuilder token = new StringBuilder();
        for (byte b : bytes) {
            token.append(String.format("%02x", b));
        }
        return token.toString();
    }
}
