package com.datapeice.slbackend.repository;

import com.datapeice.slbackend.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a WHERE " +
            "LOWER(a.actorUsername) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.targetUsername) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.actionType) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.details) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<AuditLog> searchLogs(@Param("query") String query, Pageable pageable);

    @Query("SELECT DISTINCT a FROM AuditLog a WHERE " +
            "a.actorId = :userId OR a.targetUserId = :userId OR " +
            "LOWER(a.actorUsername) = LOWER(:username) OR LOWER(a.targetUsername) = LOWER(:username) OR " +
            "(:hasRelated = true AND (a.actorId IN :relatedIds OR a.targetUserId IN :relatedIds))")
    Page<AuditLog> findUserRelatedLogs(
            @Param("userId") Long userId,
            @Param("username") String username,
            @Param("relatedIds") java.util.List<Long> relatedIds,
            @Param("hasRelated") boolean hasRelated,
            Pageable pageable);

    boolean existsByDetailsContaining(String details);

    @Query("SELECT a FROM AuditLog a WHERE a.actionType IN :actionTypes")
    Page<AuditLog> findByActionTypeIn(@Param("actionTypes") java.util.List<String> actionTypes, Pageable pageable);
}
