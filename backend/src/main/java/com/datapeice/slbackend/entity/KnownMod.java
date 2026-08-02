package com.datapeice.slbackend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "known_mods", indexes = {
        @Index(name = "idx_known_mod_name", columnList = "name")
})
@Data
public class KnownMod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Keyword to match against mod filename (case-insensitive substring match).
     * Example: "xray", "wurst", "sodium"
     */
    @Column(nullable = false, unique = true)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KnownModStatus status;

    /** Admin username who added this entry */
    private String addedBy;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
