package com.datapeice.slbackend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "anticheat_snapshots", indexes = {
        @Index(name = "idx_anticheat_player_name", columnList = "playerName"),
        @Index(name = "idx_anticheat_created_at", columnList = "createdAt")
})
@Data
public class AnticheatSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String playerName;

    private String playerUuid;

    private String launcherName;

    private String launcherBrand;

    @Column(columnDefinition = "TEXT")
    private String processes;

    @Column(columnDefinition = "TEXT")
    private String mods;

    @Column(columnDefinition = "TEXT")
    private String resourcePacks;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private Double anomalyScore = 0.0;

    private Boolean suspicious = false;

    @Column(columnDefinition = "TEXT")
    private String anomalyDetails;
}

