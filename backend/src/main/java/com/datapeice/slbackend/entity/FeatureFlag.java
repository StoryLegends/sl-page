package com.datapeice.slbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Set;
import java.util.HashSet;

@Entity
@Table(name = "feature_flags")
@Data
public class FeatureFlag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private boolean enabled = false;

    @Column(nullable = false)
    private boolean allowAdmins = true;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "feature_flag_allowed_users", joinColumns = @JoinColumn(name = "flag_id"))
    @Column(name = "user_id")
    private Set<Long> allowedUserIds = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "feature_flag_allowed_roles", joinColumns = @JoinColumn(name = "flag_id"))
    @Column(name = "role_name")
    private Set<String> allowedRoles = new HashSet<>();
}
