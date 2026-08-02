package com.datapeice.slbackend.controller;

import com.datapeice.slbackend.dto.ReviewRequest;
import com.datapeice.slbackend.dto.ReviewResponse;
import com.datapeice.slbackend.entity.ReviewEditHistory;
import com.datapeice.slbackend.entity.SiteSettings;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.service.ReviewService;
import com.datapeice.slbackend.service.SiteSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class ReviewController {

    private final ReviewService reviewService;
    private final SiteSettingsService siteSettingsService;

    public ReviewController(ReviewService reviewService, SiteSettingsService siteSettingsService) {
        this.reviewService = reviewService;
        this.siteSettingsService = siteSettingsService;
    }

    // Public API
    @GetMapping("/api/reviews/public")
    public ResponseEntity<List<ReviewResponse>> getPublicApprovedReviews() {
        return ResponseEntity.ok(reviewService.getPublicApprovedReviews());
    }

    @GetMapping("/api/reviews/history/{reviewId}")
    public ResponseEntity<List<ReviewEditHistory>> getReviewHistory(@PathVariable Long reviewId) {
        return ResponseEntity.ok(reviewService.getReviewEditHistory(reviewId));
    }

    // User API
    @GetMapping("/api/reviews/my")
    public ResponseEntity<ReviewResponse> getMyReview(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(reviewService.getUserReview(user));
    }

    @PostMapping("/api/reviews")
    public ResponseEntity<?> submitOrUpdateReview(@AuthenticationPrincipal User user,
                                                    @RequestBody ReviewRequest request) {
        if (user == null) return ResponseEntity.status(401).build();
        try {
            return ResponseEntity.ok(reviewService.submitOrUpdateReview(user, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Admin API
    @GetMapping("/api/admin/reviews")
    public ResponseEntity<List<ReviewResponse>> getAdminReviews(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(reviewService.getAdminReviews(status));
    }

    @PostMapping("/api/admin/reviews/{id}/status")
    public ResponseEntity<ReviewResponse> updateReviewStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        return ResponseEntity.ok(reviewService.updateStatus(id, newStatus));
    }

    @PostMapping("/api/admin/reviews/{id}/reply")
    public ResponseEntity<ReviewResponse> addAdminReply(@PathVariable Long id,
                                                         @RequestBody Map<String, String> body,
                                                         @AuthenticationPrincipal User admin) {
        String replyText = body.get("reply");
        String adminName = admin != null ? admin.getUsername() : "Администрация";
        return ResponseEntity.ok(reviewService.addAdminReply(id, replyText, adminName));
    }

    @DeleteMapping("/api/admin/reviews/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.ok().build();
    }

    // Admin Bot Reminder Settings
    @GetMapping("/api/admin/reviews/reminder-settings")
    public ResponseEntity<Map<String, Object>> getReminderSettings() {
        SiteSettings s = siteSettingsService.getSettings();
        return ResponseEntity.ok(Map.of(
                "reviewReminderAppAccepted", s.isReviewReminderAppAccepted(),
                "reviewReminderAppAcceptedDays", s.getReviewReminderAppAcceptedDays(),
                "reviewReminderSponsorshipPurchased", s.isReviewReminderSponsorshipPurchased(),
                "reviewReminderSponsorshipDays", s.getReviewReminderSponsorshipDays()
        ));
    }

    @PostMapping("/api/admin/reviews/reminder-settings")
    public ResponseEntity<Map<String, Object>> updateReminderSettings(@RequestBody Map<String, Object> body) {
        SiteSettings s = siteSettingsService.getSettings();
        if (body.containsKey("reviewReminderAppAccepted")) {
            s.setReviewReminderAppAccepted(Boolean.TRUE.equals(body.get("reviewReminderAppAccepted")));
        }
        if (body.containsKey("reviewReminderAppAcceptedDays")) {
            s.setReviewReminderAppAcceptedDays(((Number) body.get("reviewReminderAppAcceptedDays")).intValue());
        }
        if (body.containsKey("reviewReminderSponsorshipPurchased")) {
            s.setReviewReminderSponsorshipPurchased(Boolean.TRUE.equals(body.get("reviewReminderSponsorshipPurchased")));
        }
        if (body.containsKey("reviewReminderSponsorshipDays")) {
            s.setReviewReminderSponsorshipDays(((Number) body.get("reviewReminderSponsorshipDays")).intValue());
        }
        siteSettingsService.saveRawSettings(s);
        return getReminderSettings();
    }
}
