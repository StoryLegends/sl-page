package com.datapeice.slbackend.controller;

import com.datapeice.slbackend.entity.SponsorshipPlan;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.entity.AuditLog;
import com.datapeice.slbackend.service.SponsorshipPlanService;
import com.datapeice.slbackend.service.UserService;
import com.datapeice.slbackend.repository.AuditLogRepository;
import com.datapeice.slbackend.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/admin/sponsorship-plans")
@PreAuthorize("hasRole('ADMIN')")
public class SponsorshipPlanAdminController {

    private final SponsorshipPlanService sponsorshipPlanService;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public SponsorshipPlanAdminController(SponsorshipPlanService sponsorshipPlanService,
                                         AuditLogRepository auditLogRepository,
                                         UserRepository userRepository,
                                         UserService userService) {
        this.sponsorshipPlanService = sponsorshipPlanService;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<SponsorshipPlan>> getAllPlans() {
        return ResponseEntity.ok(sponsorshipPlanService.getAllPlans());
    }

    @PostMapping
    public ResponseEntity<SponsorshipPlan> createPlan(
            @Valid @RequestBody SponsorshipPlan plan,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(sponsorshipPlanService.savePlan(plan, admin.getId(), admin.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SponsorshipPlan> updatePlan(
            @PathVariable Long id,
            @Valid @RequestBody SponsorshipPlan planDetails,
            @AuthenticationPrincipal User admin) {
        
        return sponsorshipPlanService.getPlanById(id)
                .map(plan -> {
                    plan.setLevel(planDetails.getLevel());
                    plan.setDays(planDetails.getDays());
                    plan.setPrice(planDetails.getPrice());
                    plan.setIsSubscription(planDetails.getIsSubscription());
                    plan.setNote(planDetails.getNote());
                    plan.setActive(planDetails.getActive());
                    
                    SponsorshipPlan updated = sponsorshipPlanService.savePlan(plan, admin.getId(), admin.getUsername());
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlan(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        
        sponsorshipPlanService.deletePlan(id, admin.getId(), admin.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/history")
    public ResponseEntity<Page<Map<String, Object>>> getPurchaseHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<AuditLog> logs = auditLogRepository.findByActionTypeIn(
            List.of("USER_SPONSORSHIP_PAYMENT_SUCCESS", "USER_SPONSORSHIP_SUBSCRIPTION_CREATED", "USER_SPONSORSHIP_RECURRING_BILLING_SUCCESS"),
            pageable
        );

        Page<Map<String, Object>> mapped = logs.map(log -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", log.getId());
            m.put("actorId", log.getActorId());
            m.put("actorUsername", log.getActorUsername());
            m.put("actionType", log.getActionType());
            m.put("details", log.getDetails());
            m.put("createdAt", log.getCreatedAt());

            String avatarUrl = null;
            if (log.getActorId() != null) {
                avatarUrl = userRepository.findById(log.getActorId())
                    .map(u -> userService.resolveAvatarUrl(u.getAvatarUrl(), u.getUsername()))
                    .orElse(null);
            }
            m.put("avatarUrl", avatarUrl);
            return m;
        });

        return ResponseEntity.ok(mapped);
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        List<AuditLog> allSponsorshipLogs = auditLogRepository.findByActionTypeIn(
            List.of("USER_SPONSORSHIP_PAYMENT_SUCCESS", "USER_SPONSORSHIP_SUBSCRIPTION_CREATED", "USER_SPONSORSHIP_RECURRING_BILLING_SUCCESS"),
            Pageable.unpaged()
        ).getContent();

        List<SponsorshipPlan> plans = sponsorshipPlanService.getAllPlans();
        int totalRevenue = 0;
        int monthlyRevenue = 0;
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);

        Map<LocalDate, Integer> dailyRevenueMap = new HashMap<>();
        LocalDate today = LocalDate.now();
        for (int i = 29; i >= 0; i--) {
            dailyRevenueMap.put(today.minusDays(i), 0);
        }

        for (AuditLog log : allSponsorshipLogs) {
            int price = getPriceForLog(log.getDetails(), plans);
            totalRevenue += price;
            
            LocalDate logDate = log.getCreatedAt().toLocalDate();
            if (!logDate.isBefore(thirtyDaysAgo)) {
                monthlyRevenue += price;
            }
            
            if (dailyRevenueMap.containsKey(logDate)) {
                dailyRevenueMap.put(logDate, dailyRevenueMap.get(logDate) + price);
            }
        }

        List<Map<String, Object>> dailyRevenueList = new ArrayList<>();
        LocalDate start = LocalDate.now().minusDays(29);
        for (int i = 0; i < 30; i++) {
            LocalDate date = start.plusDays(i);
            Map<String, Object> item = new HashMap<>();
            item.put("date", date.toString());
            item.put("amount", dailyRevenueMap.get(date));
            dailyRevenueList.add(item);
        }

        long activeSubscribers = userRepository.countActiveSubscribers();

        Map<String, Object> response = new HashMap<>();
        response.put("totalRevenue", totalRevenue);
        response.put("monthlyRevenue", monthlyRevenue);
        response.put("activeSubscribers", activeSubscribers);
        response.put("dailyRevenue", dailyRevenueList);

        return ResponseEntity.ok(response);
    }

    private int getPriceForLog(String details, List<SponsorshipPlan> plans) {
        if (details == null) return 0;
        int level = 0;
        int days = 0;
        if (details.contains("Уровень ")) {
            int idx = details.indexOf("Уровень ") + 8;
            if (idx < details.length()) {
                level = Character.getNumericValue(details.charAt(idx));
            }
        }
        if (details.contains(" на ")) {
            int idx = details.indexOf(" на ") + 4;
            int spaceIdx = details.indexOf(" дней", idx);
            if (spaceIdx > idx) {
                try {
                    days = Integer.parseInt(details.substring(idx, spaceIdx).trim());
                } catch (Exception e) {}
            }
        }
        
        // Find matching plan in database
        for (SponsorshipPlan plan : plans) {
            if (plan.getLevel() == level && plan.getDays() == days) {
                return plan.getPrice().intValue();
            }
        }
        
        // Fallbacks
        if (level == 1) {
            if (days == 60) return 349;
            if (days == 90) return 499;
            return 199; // default 30 days
        } else if (level == 2) {
            if (days == 60) return 629;
            if (days == 90) return 899;
            return 349; // default 30 days
        } else if (level == 3) {
            if (days == 60) return 1049;
            if (days == 90) return 1499;
            return 599; // default 30 days
        }
        return 0;
    }
}
