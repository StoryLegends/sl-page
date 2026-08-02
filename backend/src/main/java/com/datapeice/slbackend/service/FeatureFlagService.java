package com.datapeice.slbackend.service;

import com.datapeice.slbackend.entity.FeatureFlag;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.entity.UserRole;
import com.datapeice.slbackend.repository.FeatureFlagRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
public class FeatureFlagService {
    private final FeatureFlagRepository featureFlagRepository;
    private final AuditLogService auditLogService;

    // Cache of feature flags to avoid DB hits
    private List<FeatureFlag> cachedFlags;

    public FeatureFlagService(FeatureFlagRepository featureFlagRepository, AuditLogService auditLogService) {
        this.featureFlagRepository = featureFlagRepository;
        this.auditLogService = auditLogService;
    }

    private synchronized void refreshCache() {
        this.cachedFlags = featureFlagRepository.findAll();
    }

    private synchronized List<FeatureFlag> getFlagsFromCache() {
        if (this.cachedFlags == null) {
            refreshCache();
        }
        return this.cachedFlags;
    }

    @Transactional(readOnly = true)
    public List<FeatureFlag> getAllFlags() {
        return getFlagsFromCache();
    }

    @Transactional
    public FeatureFlag saveFlag(FeatureFlag flag, Long adminId, String adminName) {
        boolean isNew = flag.getId() == null;
        FeatureFlag saved = featureFlagRepository.save(flag);
        refreshCache();

        auditLogService.logAction(adminId, adminName, 
            isNew ? "ADMIN_CREATE_FEATURE_FLAG" : "ADMIN_UPDATE_FEATURE_FLAG",
            String.format("Создан/изменен флаг фичи: %s (enabled: %b, allowAdmins: %b)", 
                saved.getName(), saved.isEnabled(), saved.isAllowAdmins()), 
            saved.getId(), saved.getName());

        return saved;
    }

    @Transactional
    public void deleteFlag(Long id, Long adminId, String adminName) {
        featureFlagRepository.findById(id).ifPresent(flag -> {
            featureFlagRepository.delete(flag);
            refreshCache();
            auditLogService.logAction(adminId, adminName, "ADMIN_DELETE_FEATURE_FLAG",
                    "Удален флаг фичи: " + flag.getName(), id, flag.getName());
        });
    }

    public Set<String> getActiveFeaturesForUser(User user) {
        List<FeatureFlag> flags = getFlagsFromCache();
        Set<String> activeFeatures = new HashSet<>();

        for (FeatureFlag flag : flags) {
            if (flag.isEnabled()) {
                activeFeatures.add(flag.getName());
                continue;
            }

            if (user != null) {
                // Check if admin allowance applies
                if (flag.isAllowAdmins() && (user.getRole() == UserRole.ROLE_ADMIN || user.getRole() == UserRole.ROLE_MODERATOR)) {
                    activeFeatures.add(flag.getName());
                    continue;
                }

                // Check allowed user IDs
                if (flag.getAllowedUserIds() != null && flag.getAllowedUserIds().contains(user.getId())) {
                    activeFeatures.add(flag.getName());
                    continue;
                }

                // Check allowed roles
                if (flag.getAllowedRoles() != null && flag.getAllowedRoles().contains(user.getRole().name())) {
                    activeFeatures.add(flag.getName());
                }
            }
        }

        return activeFeatures;
    }
}
