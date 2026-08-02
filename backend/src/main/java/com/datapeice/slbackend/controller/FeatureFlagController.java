package com.datapeice.slbackend.controller;

import com.datapeice.slbackend.entity.FeatureFlag;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.service.FeatureFlagService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api")
public class FeatureFlagController {
    private final FeatureFlagService featureFlagService;

    public FeatureFlagController(FeatureFlagService featureFlagService) {
        this.featureFlagService = featureFlagService;
    }

    // Public / authenticated user endpoint to check their active features
    @GetMapping("/feature-flags/active")
    public ResponseEntity<Set<String>> getActiveFeatures(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(featureFlagService.getActiveFeaturesForUser(user));
    }

    // Admin-only endpoints
    @GetMapping("/admin/feature-flags")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<List<FeatureFlag>> getAllFlags() {
        return ResponseEntity.ok(featureFlagService.getAllFlags());
    }

    @PostMapping("/admin/feature-flags")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<FeatureFlag> saveFlag(
            @RequestBody FeatureFlag flag,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(featureFlagService.saveFlag(flag, admin.getId(), admin.getUsername()));
    }

    @DeleteMapping("/admin/feature-flags/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<?> deleteFlag(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        featureFlagService.deleteFlag(id, admin.getId(), admin.getUsername());
        return ResponseEntity.ok().build();
    }
}
