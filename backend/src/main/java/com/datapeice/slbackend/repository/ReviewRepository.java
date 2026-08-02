package com.datapeice.slbackend.repository;

import com.datapeice.slbackend.entity.Review;
import com.datapeice.slbackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByUser(User user);

    List<Review> findByStatusOrderByCreatedAtDesc(String status);

    List<Review> findAllByOrderByCreatedAtDesc();

    long countByStatus(String status);
}
