package com.datapeice.slbackend.controller;

import com.datapeice.slbackend.dto.TotpSetupRequest;
import com.datapeice.slbackend.dto.TotpSetupResponse;
import com.datapeice.slbackend.dto.TotpVerifyRequest;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.repository.UserRepository;
import com.datapeice.slbackend.service.TotpService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/totp")
public class TotpController {

    private final TotpService totpService;
    private final UserRepository userRepository;

    public TotpController(TotpService totpService, UserRepository userRepository) {
        this.totpService = totpService;
        this.userRepository = userRepository;
    }

    /**
     * Генерация QR-кода для настройки TOTP
     */
    @PostMapping("/setup")
    public ResponseEntity<?> setupTotp(@AuthenticationPrincipal User user) {
        try {
            String secret = totpService.generateSecret();
            String qrCodeDataUri = totpService.generateQrCodeDataUri(secret, user.getUsername());

            // Временно сохраняем секрет (пока пользователь не подтвердит)
            user.setTotpSecret(secret);
            user.setTotpEnabled(false); // Еще не активирован
            userRepository.save(user);

            TotpSetupResponse response = new TotpSetupResponse();
            response.setSecret(secret);
            response.setQrCodeDataUri(qrCodeDataUri);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Не удалось сгенерировать TOTP"));
        }
    }

    /**
     * Подтверждение и активация TOTP
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyTotp(@AuthenticationPrincipal User user,
                                       @Valid @RequestBody TotpVerifyRequest request) {
        if (user.getTotpSecret() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "TOTP не настроен. Сначала вызовите /setup"));
        }

        if (!totpService.verifyCode(user.getTotpSecret(), request.getCode())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Неверный код"));
        }

        // Активируем TOTP
        user.setTotpEnabled(true);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "TOTP успешно активирован"
        ));
    }

    /**
     * Отключение TOTP
     */
    @PostMapping("/disable")
    public ResponseEntity<?> disableTotp(@AuthenticationPrincipal User user,
                                        @Valid @RequestBody TotpVerifyRequest request) {
        if (!user.isTotpEnabled()) {
            return ResponseEntity.badRequest().body(Map.of("error", "TOTP уже отключен"));
        }

        if (!totpService.verifyCode(user.getTotpSecret(), request.getCode())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Неверный код"));
        }

        user.setTotpEnabled(false);
        user.setTotpSecret(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "TOTP отключен"
        ));
    }

    /**
     * Проверка статуса TOTP
     */
    @GetMapping("/status")
    public ResponseEntity<?> getTotpStatus(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of(
                "totpEnabled", user.isTotpEnabled()
        ));
    }
}

