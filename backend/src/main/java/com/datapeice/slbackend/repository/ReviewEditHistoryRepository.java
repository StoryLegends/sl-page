package com.datapeice.slbackend.repository;

import com.datapeice.slbackend.entity.ReviewEditHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewEditHistoryRepository extends JpaRepository<ReviewEditHistory, Long> {
    List<ReviewEditHistory> findByReviewIdOrderByCreatedAtDesc(Long reviewId);
}
