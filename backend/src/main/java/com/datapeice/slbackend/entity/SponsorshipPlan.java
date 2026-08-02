package com.datapeice.slbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "sponsorship_plans")
@Data
@NoArgsConstructor
public class SponsorshipPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Уровень спонсорства обязателен")
    @Min(value = 1, message = "Минимальный уровень спонсорства — 1")
    @Max(value = 3, message = "Максимальный уровень спонсорства — 3")
    @Column(nullable = false)
    private Integer level; // 1, 2, or 3

    @NotNull(message = "Количество дней обязательно")
    @Min(value = 1, message = "Минимальное количество дней — 1")
    @Column(nullable = false)
    private Integer days; // Duration in days (e.g. 30, 90, 360)

    @NotNull(message = "Цена обязательна")
    @Min(value = 1, message = "Минимальная цена — 1 рубль")
    @Column(nullable = false)
    private Long price; // Price in Rubles

    @NotNull(message = "Признак подписки обязателен")
    @Column(nullable = false)
    private Boolean isSubscription; // True if auto-renewing

    @Column(nullable = true)
    private String note; // Custom display text (e.g. "99 ₽ / месяц (Автопродление)")

    @Column(nullable = false)
    private Boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public SponsorshipPlan(Integer level, Integer days, Long price, Boolean isSubscription, String note) {
        this.level = level;
        this.days = days;
        this.price = price;
        this.isSubscription = isSubscription;
        this.note = note;
        this.active = true;
    }
}
