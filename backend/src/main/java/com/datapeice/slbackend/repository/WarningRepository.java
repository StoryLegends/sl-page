package com.datapeice.slbackend.repository;

import com.datapeice.slbackend.entity.Warning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarningRepository extends JpaRepository<Warning, Long> {
    List<Warning> findByUserId(Long userId);

    List<Warning> findByUserIdAndActiveTrue(Long userId);

    long countByUserIdAndActiveTrue(Long userId);

    long countByActiveTrue();

    void deleteAllByUserId(Long userId);

    void deleteAllByIssuedById(Long issuedById);
}
