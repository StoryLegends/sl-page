package com.datapeice.slbackend.service;

import com.datapeice.slbackend.entity.SiteSettings;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.repository.ReviewRepository;
import com.datapeice.slbackend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReviewReminderScheduler.class);

    private final SiteSettingsService siteSettingsService;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final DiscordService discordService;

    public ReviewReminderScheduler(SiteSettingsService siteSettingsService,
                                   UserRepository userRepository,
                                   ReviewRepository reviewRepository,
                                   DiscordService discordService) {
        this.siteSettingsService = siteSettingsService;
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
        this.discordService = discordService;
    }

    // Run every day at 12:00 PM
    @Scheduled(cron = "0 0 12 * * *")
    public void processReviewReminders() {
        SiteSettings settings = siteSettingsService.getSettings();
        if (!settings.isReviewReminderAppAccepted() && !settings.isReviewReminderSponsorshipPurchased()) {
            return;
        }

        List<User> users = userRepository.findAll();
        for (User user : users) {
            if (user.getDiscordUserId() == null || user.getDiscordUserId().isBlank()) {
                continue;
            }

            boolean hasReview = reviewRepository.findByUser(user).isPresent();
            if (hasReview) {
                continue;
            }

            if (settings.isReviewReminderAppAccepted() && user.isPlayer()) {
                String message = String.format("Привет, %s! 👋\nТы уже некоторая время играешь на нашем сервере StoryLegends!\nПоделись своим мнением и оставь отзыв о сервере в своём профиле на сайте: https://storylegends.xyz/profile", user.getUsername());
                discordService.sendDirectMessage(user.getDiscordUserId(), message);
            } else if (settings.isReviewReminderSponsorshipPurchased() && user.getSponsorshipLevel() != null && user.getSponsorshipLevel() > 0) {
                String message = String.format("Привет, %s! ✨ Спасибо за поддержку сервера StoryLegends!\nБудем рады, если ты оставишь честный отзыв в своем профиле: https://storylegends.xyz/profile", user.getUsername());
                discordService.sendDirectMessage(user.getDiscordUserId(), message);
            }
        }
    }
}
