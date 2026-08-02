package com.datapeice.slbackend.service;

import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class SponsorshipNotificationScheduler {

    private static final Logger logger = LoggerFactory.getLogger(SponsorshipNotificationScheduler.class);

    private final UserRepository userRepository;
    private final DiscordService discordService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public SponsorshipNotificationScheduler(UserRepository userRepository, DiscordService discordService) {
        this.userRepository = userRepository;
        this.discordService = discordService;
    }

    /**
     * Runs every day at 12:00 PM (noon) to check for sponsorships expiring in exactly 7 days
     * and send them a reminder via Discord DM.
     */
    @Scheduled(cron = "0 0 12 * * ?")
    public void sendSponsorshipExpiryReminders() {
        logger.info("Starting scheduled sponsorship expiration check...");
        
        List<User> users = userRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");

        int reminderCount = 0;

        for (User user : users) {
            if (user.getSponsorshipLevel() != null && user.getSponsorshipLevel() > 0 
                    && user.getSponsorshipExpiresAt() != null 
                    && user.getSponsorshipExpiresAt().isAfter(now)
                    && user.getDiscordUserId() != null && !user.getDiscordUserId().isBlank()) {
                
                long daysUntilExpiry = ChronoUnit.DAYS.between(now.toLocalDate(), user.getSponsorshipExpiresAt().toLocalDate());
                
                if (daysUntilExpiry == 7) {
                    String formattedDate = user.getSponsorshipExpiresAt().format(formatter);
                    String message;

                    if (user.isSubscriptionRecurring()) {
                        message = String.format(
                                "Привет, %s! Твоя спонсорская подписка Уровня %d будет автоматически продлена через 7 дней (%s). Спасибо за поддержку нашего сервера! 💖",
                                user.getUsername(), user.getSponsorshipLevel(), formattedDate
                        );
                    } else {
                        message = String.format(
                                "Привет, %s! Твое спонсорство Уровня %d закончится через 7 дней (%s). Ты можешь продлить его в личном кабинете на сайте: %s/sponsorship. Спасибо за поддержку нашего сервера! 💖",
                                user.getUsername(), user.getSponsorshipLevel(), formattedDate, frontendUrl
                        );
                    }

                    try {
                        logger.info("Sending 7-day sponsorship reminder to user {} (Discord ID: {})", user.getUsername(), user.getDiscordUserId());
                        discordService.sendDirectMessage(user.getDiscordUserId(), message);
                        reminderCount++;
                    } catch (Exception e) {
                        logger.error("Failed to send Discord reminder to user {}: {}", user.getUsername(), e.getMessage());
                    }
                }
            }
        }

        logger.info("Sponsorship expiration check completed. Sent {} reminders.", reminderCount);
    }
}
