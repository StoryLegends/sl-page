package com.datapeice.slbackend.service;

import com.datapeice.slbackend.entity.AuditLog;
import com.datapeice.slbackend.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Async
    public void logAction(Long actorId, String actorUsername, String actionType, String details, Long targetUserId,
            String targetUsername) {
        logAction(actorId, actorUsername, actionType, details, targetUserId, targetUsername, null, null);
    }

    @Async
    public void logAction(Long actorId, String actorUsername, String actionType, String details, Long targetUserId,
            String targetUsername, String ipAddress, String userAgent) {
        AuditLog log = new AuditLog();
        log.setActorId(actorId);
        log.setActorUsername(actorUsername);
        log.setActionType(actionType);
        log.setDetails(details);
        log.setTargetUserId(targetUserId);
        log.setTargetUsername(targetUsername);
        log.setIpAddress(ipAddress);
        log.setUserAgent(userAgent != null && userAgent.length() > 512 ? userAgent.substring(0, 512) : userAgent);
        log.setCreatedAt(LocalDateTime.now());

        auditLogRepository.save(log);
    }

    /**
     * Special method for security-related events.
     */
    @Async
    public void logSecurityIncident(String actorUsername, String actionType, String details, String ip, String ua) {
        logAction(null, actorUsername, "SECURITY_" + actionType, details, null, null, ip, ua);
    }

    public Page<AuditLog> getLogs(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return auditLogRepository.findAll(pageable);
        } else {
            return auditLogRepository.searchLogs(query.trim(), pageable);
        }
    }

    public Page<AuditLog> getLogsForUser(Long userId, String username, java.util.List<Long> relatedIds, Pageable pageable) {
        boolean hasRelated = relatedIds != null && !relatedIds.isEmpty();
        java.util.List<Long> safeRelated = hasRelated ? relatedIds : java.util.List.of(-1L);
        return auditLogRepository.findUserRelatedLogs(userId, username != null ? username : "", safeRelated, hasRelated, pageable);
    }
}
