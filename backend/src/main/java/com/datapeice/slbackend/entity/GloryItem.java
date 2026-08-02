package com.datapeice.slbackend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "glory_items")
@Data
public class GloryItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category; // Legends, ContenMakers, Staff

    @Column(columnDefinition = "TEXT")
    private String image;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String details;

    private String discord;

    @Column(columnDefinition = "TEXT")
    private String linksJson; // JSON array string of {name, url}

    private int sortOrder = 0;

    private boolean active = true;
}
