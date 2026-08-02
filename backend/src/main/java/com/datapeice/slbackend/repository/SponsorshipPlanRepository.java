package com.datapeice.slbackend.repository;

import com.datapeice.slbackend.entity.SponsorshipPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SponsorshipPlanRepository extends JpaRepository<SponsorshipPlan, Long> {
    List<SponsorshipPlan> findByActiveTrue();
    Optional<SponsorshipPlan> findByLevelAndDaysAndIsSubscriptionAndActive(Integer level, Integer days, Boolean isSubscription, Boolean active);
}
