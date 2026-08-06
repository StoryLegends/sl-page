package com.datapeice.slbackend.dto;

import lombok.Data;

@Data
public class SiteSettingsRequest {
    private Integer maxWarningsBeforeBan;
    private Boolean autoBanOnMaxWarnings;
    private Boolean sendEmailOnWarning;
    private Boolean sendDiscordDmOnWarning;
    private Boolean sendEmailOnBan;
    private Boolean sendDiscordDmOnBan;
    private Boolean sendEmailOnApplicationApproved;
    private Boolean sendEmailOnApplicationRejected;
    private Boolean applicationsOpen;
    private Boolean registrationOpen;
    private Boolean maintenanceMode;
    private String seasonStatus;
    private String seasonTitle;
    private String seasonDescription;
    private String seasonDate;
    private Boolean sponsorshipGoalEnabled;
    private Integer sponsorshipGoalTarget;
    private Integer sponsorshipGoalCurrent;
    private String sponsorshipGoalText;
    private String topDonatorName1;
    private Integer topDonatorAmount1;
    private String topDonatorName2;
    private Integer topDonatorAmount2;
    private String topDonatorName3;
    private Integer topDonatorAmount3;
    private Boolean announcementEnabled;
    private String announcementText;
    private String announcementType;
}

