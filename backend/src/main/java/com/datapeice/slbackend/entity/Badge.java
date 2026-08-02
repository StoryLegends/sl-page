package com.datapeice.slbackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "badges")
@Getter
@Setter
public class Badge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    private String color;

    @Column(columnDefinition = "TEXT")
    private String svgIcon;

    // Discord role ID to sync with
    private String discordRoleId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}

