package com.datapeice.slbackend.repository;

import com.datapeice.slbackend.entity.Application;
import com.datapeice.slbackend.entity.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findAllByUserId(Long userId);

    Page<Application> findAllByStatus(ApplicationStatus status, Pageable pageable);

    long countByStatus(ApplicationStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Application a WHERE " +
            "(:status IS NULL OR a.status = :status) AND " +
            "(CAST(a.id AS string) LIKE %:query% OR " +
            "LOWER(a.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "CAST(a.age AS string) LIKE %:query% OR " +
            "LOWER(a.user.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.user.minecraftNickname) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Application> findBySearch(
            @org.springframework.data.repository.query.Param("status") ApplicationStatus status,
            @org.springframework.data.repository.query.Param("query") String query,
            Pageable pageable);

    List<Application> findAllByUserIdAndStatus(Long userId, ApplicationStatus status);

    void deleteAllByUserId(Long userId);

}
