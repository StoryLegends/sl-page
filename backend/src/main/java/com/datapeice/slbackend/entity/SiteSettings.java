package com.datapeice.slbackend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "site_settings")
@Data
public class SiteSettings {
    @Id
    private Long id = 1L; // singleton row

    // Warning settings
    private int maxWarningsBeforeBan = 3;
    private boolean autoBanOnMaxWarnings = true;
    private boolean sendEmailOnWarning = true;
    private boolean sendDiscordDmOnWarning = true;

    // Ban settings
    private boolean sendEmailOnBan = true;
    private boolean sendDiscordDmOnBan = true;

    // Application settings
    private boolean sendEmailOnApplicationApproved = true;
    private boolean sendEmailOnApplicationRejected = true;
    private boolean applicationsOpen = true;

    // Registration settings
    private boolean registrationOpen = true;

    // Maintenance settings
    @Column(columnDefinition = "boolean default false")
    private boolean maintenanceMode = false;

    // Season settings
    @Column(columnDefinition = "varchar(255) default 'closed'")
    private String seasonStatus = "closed";

    @Column(columnDefinition = "varchar(255) default 'StoryLegends Island'")
    private String seasonTitle = "StoryLegends Island";

    @Column(columnDefinition = "text")
    private String seasonDescription = "Сезон подошел к концу! Спасибо всем за участие. Следите за новостями в нашем Discord, чтобы не пропускать новости об сервере!.";

    @Column(columnDefinition = "varchar(255) default ''")
    private String seasonDate = "";

    // Sponsorship goal and top donators configurator
    @Column(columnDefinition = "boolean default false")
    private boolean sponsorshipGoalEnabled = false;

    @Column(columnDefinition = "integer default 5000")
    private int sponsorshipGoalTarget = 5000;

    @Column(columnDefinition = "integer default 0")
    private int sponsorshipGoalCurrent = 0;

    @Column(columnDefinition = "varchar(255) default 'На оплату хостинга'")
    private String sponsorshipGoalText = "На оплату хостинга";

    @Column(columnDefinition = "varchar(255) default 'Игрок 1'")
    private String topDonatorName1 = "Игрок 1";

    @Column(columnDefinition = "integer default 1500")
    private int topDonatorAmount1 = 1500;

    @Column(columnDefinition = "varchar(255) default 'Игрок 2'")
    private String topDonatorName2 = "Игрок 2";

    @Column(columnDefinition = "integer default 1000")
    private int topDonatorAmount2 = 1000;

    @Column(columnDefinition = "varchar(255) default 'Игрок 3'")
    private String topDonatorName3 = "Игрок 3";

    @Column(columnDefinition = "integer default 500")
    private int topDonatorAmount3 = 500;

    @Column(name = "sponsorship_history_migrated", nullable = false, columnDefinition = "boolean default false")
    private boolean sponsorshipHistoryMigrated = false;

    // Review reminder bot event settings (Default OFF)
    @Column(columnDefinition = "boolean default false")
    private boolean reviewReminderAppAccepted = false;

    @Column(columnDefinition = "integer default 7")
    private int reviewReminderAppAcceptedDays = 7;

    @Column(columnDefinition = "boolean default false")
    private boolean reviewReminderSponsorshipPurchased = false;

    @Column(columnDefinition = "integer default 3")
    private int reviewReminderSponsorshipDays = 3;
}

