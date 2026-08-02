package com.datapeice.slbackend.service;

import com.datapeice.slbackend.entity.SponsorshipPlan;
import com.datapeice.slbackend.repository.SponsorshipPlanRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class SponsorshipPlanService {

    private final SponsorshipPlanRepository sponsorshipPlanRepository;
    private final AuditLogService auditLogService;

    public SponsorshipPlanService(SponsorshipPlanRepository sponsorshipPlanRepository, AuditLogService auditLogService) {
        this.sponsorshipPlanRepository = sponsorshipPlanRepository;
        this.auditLogService = auditLogService;
    }

    @PostConstruct
    public void seedDefaultPlans() {
        if (sponsorshipPlanRepository.count() == 0) {
            // Level 1
            sponsorshipPlanRepository.save(new SponsorshipPlan(1, 30, 199L, true, "199 ₽ / месяц (Автопродление)"));
            sponsorshipPlanRepository.save(new SponsorshipPlan(1, 60, 349L, false, "349 ₽ (Разовый платёж)"));
            sponsorshipPlanRepository.save(new SponsorshipPlan(1, 90, 499L, false, "499 ₽ (Разовый платёж)"));

            // Level 2
            sponsorshipPlanRepository.save(new SponsorshipPlan(2, 30, 349L, true, "349 ₽ / месяц (Автопродление)"));
            sponsorshipPlanRepository.save(new SponsorshipPlan(2, 60, 629L, false, "629 ₽ (Разовый платёж)"));
            sponsorshipPlanRepository.save(new SponsorshipPlan(2, 90, 899L, false, "899 ₽ (Разовый платёж)"));

            // Level 3
            sponsorshipPlanRepository.save(new SponsorshipPlan(3, 30, 599L, true, "599 ₽ / месяц (Автопродление)"));
            sponsorshipPlanRepository.save(new SponsorshipPlan(3, 60, 1049L, false, "1049 ₽ (Разовый платёж)"));
            sponsorshipPlanRepository.save(new SponsorshipPlan(3, 90, 1499L, false, "1499 ₽ (Разовый платёж)"));
        }
    }

    @Transactional(readOnly = true)
    public List<SponsorshipPlan> getAllPlans() {
        return sponsorshipPlanRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<SponsorshipPlan> getActivePlans() {
        return sponsorshipPlanRepository.findByActiveTrue();
    }

    @Transactional(readOnly = true)
    public Optional<SponsorshipPlan> getPlanById(Long id) {
        return sponsorshipPlanRepository.findById(id);
    }

    @Transactional
    public SponsorshipPlan savePlan(SponsorshipPlan plan, Long adminId, String adminUsername) {
        boolean isNew = plan.getId() == null;
        SponsorshipPlan saved = sponsorshipPlanRepository.save(plan);

        auditLogService.logAction(adminId, adminUsername, 
            isNew ? "ADMIN_SPONSORSHIP_PLAN_CREATE" : "ADMIN_SPONSORSHIP_PLAN_UPDATE",
            String.format("Создан/изменен тариф спонсорства: Уровень %d, %d дней, цена %d руб, подписка: %b, активен: %b", 
                saved.getLevel(), saved.getDays(), saved.getPrice(), saved.getIsSubscription(), saved.getActive()), 
            saved.getId(), "SponsorshipPlan Level " + saved.getLevel());

        return saved;
    }

    @Transactional
    public void deletePlan(Long id, Long adminId, String adminUsername) {
        sponsorshipPlanRepository.findById(id).ifPresent(plan -> {
            sponsorshipPlanRepository.delete(plan);
            auditLogService.logAction(adminId, adminUsername, "ADMIN_SPONSORSHIP_PLAN_DELETE",
                    String.format("Удален тариф спонсорства: Уровень %d, %d дней, цена %d руб", 
                        plan.getLevel(), plan.getDays(), plan.getPrice()), 
                    id, "SponsorshipPlan Level " + plan.getLevel());
        });
    }

    @Transactional(readOnly = true)
    public long getVerifiedPriceInCents(int level, int days, boolean isRecurring) {
        Optional<SponsorshipPlan> planOpt = sponsorshipPlanRepository.findByLevelAndDaysAndIsSubscriptionAndActive(
                level, days, isRecurring, true
        );
        if (planOpt.isPresent()) {
            return planOpt.get().getPrice() * 100;
        }

        throw new IllegalArgumentException("Выбран недопустимый тариф или период спонсорства");
    }
}
