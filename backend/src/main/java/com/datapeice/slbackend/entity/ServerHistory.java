package com.datapeice.slbackend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "server_histories")
@Data
public class ServerHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, unique = true)
    private String pathSlug;

    private String eventDate;

    private String featureOnline;

    private String featurePlatform;

    private String featureWorkTime;

    private String featureRuntime;

    @Column(columnDefinition = "TEXT")
    private String colorsJson; // JSON array of hex color strings e.g. ["#34383b", "#728697"]

    @Column(columnDefinition = "TEXT")
    private String contentHtml;

    @Column(columnDefinition = "TEXT")
    private String photosJson; // JSON array of photos/descriptions

    @Column(columnDefinition = "TEXT")
    private String logoJson;

    @Column(columnDefinition = "TEXT")
    private String mapsJson;

    private int sortOrder = 0;

    private boolean published = true;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();
}
