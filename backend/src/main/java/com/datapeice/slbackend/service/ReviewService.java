package com.datapeice.slbackend.service;

import com.datapeice.slbackend.dto.ReviewRequest;
import com.datapeice.slbackend.dto.ReviewResponse;
import com.datapeice.slbackend.entity.Review;
import com.datapeice.slbackend.entity.ReviewEditHistory;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.repository.ReviewEditHistoryRepository;
import com.datapeice.slbackend.repository.ReviewRepository;
import com.datapeice.slbackend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewEditHistoryRepository reviewEditHistoryRepository;
    private final UserRepository userRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         ReviewEditHistoryRepository reviewEditHistoryRepository,
                         UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.reviewEditHistoryRepository = reviewEditHistoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ReviewResponse submitOrUpdateReview(User user, ReviewRequest request) {
        if (!user.isPlayer()) {
            throw new IllegalArgumentException("Оставлять отзывы могут только игроки сервера со статусом игрока.");
        }
        if (request.getContent() == null || request.getContent().trim().length() < 50) {
            throw new IllegalArgumentException("Отзыв должен содержать минимум 50 символов.");
        }
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Оценка должна быть от 1 до 5 звезд.");
        }

        Optional<Review> existingOpt = reviewRepository.findByUser(user);
        Review review;
        LocalDateTime now = LocalDateTime.now();

        if (existingOpt.isPresent()) {
            review = existingOpt.get();

            // Save old content to edit history
            ReviewEditHistory history = new ReviewEditHistory();
            history.setReviewId(review.getId());
            history.setRating(review.getRating());
            history.setContent(review.getContent());
            history.setCreatedAt(review.getUpdatedAt() != null ? review.getUpdatedAt() : review.getCreatedAt());
            reviewEditHistoryRepository.save(history);

            review.setRating(request.getRating());
            review.setContent(request.getContent().trim());
            review.setStatus("PENDING");
            review.setEdited(true);
            review.setEditedAt(now);
            review.setUpdatedAt(now);
        } else {
            review = new Review();
            review.setUser(user);
            review.setRating(request.getRating());
            review.setContent(request.getContent().trim());
            review.setStatus("PENDING");
            review.setCreatedAt(now);
            review.setUpdatedAt(now);
        }

        Review saved = reviewRepository.save(review);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public ReviewResponse getUserReview(User user) {
        return reviewRepository.findByUser(user)
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getPublicApprovedReviews() {
        return reviewRepository.findByStatusOrderByCreatedAtDesc("APPROVED")
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getAdminReviews(String status) {
        List<Review> reviews;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            reviews = reviewRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase());
        } else {
            reviews = reviewRepository.findAllByOrderByCreatedAtDesc();
        }
        return reviews.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReviewEditHistory> getReviewEditHistory(Long reviewId) {
        return reviewEditHistoryRepository.findByReviewIdOrderByCreatedAtDesc(reviewId);
    }

    @Transactional
    public ReviewResponse updateStatus(Long reviewId, String newStatus) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Отзыв не найден"));
        review.setStatus(newStatus.toUpperCase());
        review.setUpdatedAt(LocalDateTime.now());
        return mapToResponse(reviewRepository.save(review));
    }

    @Transactional
    public ReviewResponse addAdminReply(Long reviewId, String replyText, String adminUsername) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Отзыв не найден"));
        review.setAdminReply(replyText);
        review.setAdminReplyAuthorName(adminUsername);
        review.setAdminRepliedAt(LocalDateTime.now());
        review.setUpdatedAt(LocalDateTime.now());
        return mapToResponse(reviewRepository.save(review));
    }

    @Transactional
    public void deleteReview(Long reviewId) {
        reviewRepository.deleteById(reviewId);
    }

    public ReviewResponse mapToResponse(Review review) {
        ReviewResponse dto = new ReviewResponse();
        dto.setId(review.getId());
        dto.setUserId(review.getUser().getId());
        dto.setUsername(review.getUser().getUsername());
        dto.setUserAvatarUrl(review.getUser().getAvatarUrl());
        dto.setRating(review.getRating());
        dto.setContent(review.getContent());
        dto.setStatus(review.getStatus());
        dto.setEdited(review.isEdited());
        dto.setEditedAt(review.getEditedAt());
        dto.setAdminReply(review.getAdminReply());
        dto.setAdminReplyAuthorName(review.getAdminReplyAuthorName());
        dto.setAdminRepliedAt(review.getAdminRepliedAt());
        dto.setCreatedAt(review.getCreatedAt());
        dto.setUpdatedAt(review.getUpdatedAt());
        return dto;
    }
}
