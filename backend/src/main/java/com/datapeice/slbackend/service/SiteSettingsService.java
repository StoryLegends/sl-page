package com.datapeice.slbackend.service;

import com.datapeice.slbackend.dto.SiteSettingsRequest;
import com.datapeice.slbackend.entity.SiteSettings;
import com.datapeice.slbackend.repository.SiteSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SiteSettingsService {

    private final SiteSettingsRepository siteSettingsRepository;
    private final AuditLogService auditLogService;

    private SiteSettings cachedSettings;

    public SiteSettingsService(SiteSettingsRepository siteSettingsRepository, AuditLogService auditLogService) {
        this.siteSettingsRepository = siteSettingsRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public SiteSettings getSettings() {
        if (cachedSettings != null) {
            return cachedSettings;
        }
        SiteSettings settings = siteSettingsRepository.findById(1L).orElseGet(() -> {
            SiteSettings defaults = new SiteSettings();
            return siteSettingsRepository.save(defaults);
        });
        cachedSettings = settings;
        return settings;
    }

    @Transactional
    public SiteSettings updateSettings(SiteSettingsRequest request, Long adminId, String adminName) {
        SiteSettings settings = siteSettingsRepository.findById(1L).orElseGet(() -> new SiteSettings());
        java.util.List<String> changes = new java.util.ArrayList<>();

        if (request.getMaxWarningsBeforeBan() != null
                && !request.getMaxWarningsBeforeBan().equals(settings.getMaxWarningsBeforeBan())) {
            changes.add(
                    "Max Warnings: " + settings.getMaxWarningsBeforeBan() + " -> " + request.getMaxWarningsBeforeBan());
            settings.setMaxWarningsBeforeBan(request.getMaxWarningsBeforeBan());
        }
        if (request.getAutoBanOnMaxWarnings() != null
                && !request.getAutoBanOnMaxWarnings().equals(settings.isAutoBanOnMaxWarnings())) {
            changes.add("Auto Ban: " + settings.isAutoBanOnMaxWarnings() + " -> " + request.getAutoBanOnMaxWarnings());
            settings.setAutoBanOnMaxWarnings(request.getAutoBanOnMaxWarnings());
        }
        if (request.getSendEmailOnWarning() != null
                && !request.getSendEmailOnWarning().equals(settings.isSendEmailOnWarning())) {
            changes.add(
                    "Email on Warning: " + settings.isSendEmailOnWarning() + " -> " + request.getSendEmailOnWarning());
            settings.setSendEmailOnWarning(request.getSendEmailOnWarning());
        }
        if (request.getSendDiscordDmOnWarning() != null
                && !request.getSendDiscordDmOnWarning().equals(settings.isSendDiscordDmOnWarning())) {
            changes.add("Discord DM on Warning: " + settings.isSendDiscordDmOnWarning() + " -> "
                     + request.getSendDiscordDmOnWarning());
            settings.setSendDiscordDmOnWarning(request.getSendDiscordDmOnWarning());
        }
        if (request.getSendEmailOnBan() != null && !request.getSendEmailOnBan().equals(settings.isSendEmailOnBan())) {
            changes.add("Email on Ban: " + settings.isSendEmailOnBan() + " -> " + request.getSendEmailOnBan());
            settings.setSendEmailOnBan(request.getSendEmailOnBan());
        }
        if (request.getSendDiscordDmOnBan() != null
                && !request.getSendDiscordDmOnBan().equals(settings.isSendDiscordDmOnBan())) {
            changes.add(
                    "Discord DM on Ban: " + settings.isSendDiscordDmOnBan() + " -> " + request.getSendDiscordDmOnBan());
            settings.setSendDiscordDmOnBan(request.getSendDiscordDmOnBan());
        }
        if (request.getSendEmailOnApplicationApproved() != null
                && !request.getSendEmailOnApplicationApproved().equals(settings.isSendEmailOnApplicationApproved())) {
            changes.add("Email (App Approved): " + settings.isSendEmailOnApplicationApproved() + " -> "
                    + request.getSendEmailOnApplicationApproved());
            settings.setSendEmailOnApplicationApproved(request.getSendEmailOnApplicationApproved());
        }
        if (request.getSendEmailOnApplicationRejected() != null
                && !request.getSendEmailOnApplicationRejected().equals(settings.isSendEmailOnApplicationRejected())) {
            changes.add("Email (App Rejected): " + settings.isSendEmailOnApplicationRejected() + " -> "
                    + request.getSendEmailOnApplicationRejected());
            settings.setSendEmailOnApplicationRejected(request.getSendEmailOnApplicationRejected());
        }
        if (request.getApplicationsOpen() != null
                && !request.getApplicationsOpen().equals(settings.isApplicationsOpen())) {
            changes.add("Apps Open: " + settings.isApplicationsOpen() + " -> " + request.getApplicationsOpen());
            settings.setApplicationsOpen(request.getApplicationsOpen());
        }
        if (request.getRegistrationOpen() != null
                && !request.getRegistrationOpen().equals(settings.isRegistrationOpen())) {
            changes.add("Reg Open: " + settings.isRegistrationOpen() + " -> " + request.getRegistrationOpen());
            settings.setRegistrationOpen(request.getRegistrationOpen());
        }
        if (request.getMaintenanceMode() != null
                && !request.getMaintenanceMode().equals(settings.isMaintenanceMode())) {
            changes.add("Maintenance Mode: " + settings.isMaintenanceMode() + " -> " + request.getMaintenanceMode());
            settings.setMaintenanceMode(request.getMaintenanceMode());
        }
        if (request.getSeasonStatus() != null
                && !request.getSeasonStatus().equals(settings.getSeasonStatus())) {
            changes.add("Season Status: " + settings.getSeasonStatus() + " -> " + request.getSeasonStatus());
            settings.setSeasonStatus(request.getSeasonStatus());
        }
        if (request.getSeasonTitle() != null
                && !request.getSeasonTitle().equals(settings.getSeasonTitle())) {
            changes.add("Season Title: " + settings.getSeasonTitle() + " -> " + request.getSeasonTitle());
            settings.setSeasonTitle(request.getSeasonTitle());
        }
        if (request.getSeasonDescription() != null
                && !request.getSeasonDescription().equals(settings.getSeasonDescription())) {
            changes.add("Season Description Updated");
            settings.setSeasonDescription(request.getSeasonDescription());
        }
        if (request.getSeasonDate() != null
                && !request.getSeasonDate().equals(settings.getSeasonDate())) {
            changes.add("Season Date: " + settings.getSeasonDate() + " -> " + request.getSeasonDate());
            settings.setSeasonDate(request.getSeasonDate());
        }

        // Sponsorship goal settings
        if (request.getSponsorshipGoalEnabled() != null
                && !request.getSponsorshipGoalEnabled().equals(settings.isSponsorshipGoalEnabled())) {
            changes.add("Sponsorship Goal Enabled: " + settings.isSponsorshipGoalEnabled() + " -> " + request.getSponsorshipGoalEnabled());
            settings.setSponsorshipGoalEnabled(request.getSponsorshipGoalEnabled());
        }
        if (request.getSponsorshipGoalTarget() != null
                && !request.getSponsorshipGoalTarget().equals(settings.getSponsorshipGoalTarget())) {
            changes.add("Sponsorship Goal Target: " + settings.getSponsorshipGoalTarget() + " -> " + request.getSponsorshipGoalTarget());
            settings.setSponsorshipGoalTarget(request.getSponsorshipGoalTarget());
        }
        if (request.getSponsorshipGoalCurrent() != null
                && !request.getSponsorshipGoalCurrent().equals(settings.getSponsorshipGoalCurrent())) {
            changes.add("Sponsorship Goal Current: " + settings.getSponsorshipGoalCurrent() + " -> " + request.getSponsorshipGoalCurrent());
            settings.setSponsorshipGoalCurrent(request.getSponsorshipGoalCurrent());
        }
        if (request.getSponsorshipGoalText() != null
                && !request.getSponsorshipGoalText().equals(settings.getSponsorshipGoalText())) {
            changes.add("Sponsorship Goal Text: " + settings.getSponsorshipGoalText() + " -> " + request.getSponsorshipGoalText());
            settings.setSponsorshipGoalText(request.getSponsorshipGoalText());
        }

        // Top donators settings
        if (request.getTopDonatorName1() != null
                && !request.getTopDonatorName1().equals(settings.getTopDonatorName1())) {
            changes.add("Top Donator 1 Name: " + settings.getTopDonatorName1() + " -> " + request.getTopDonatorName1());
            settings.setTopDonatorName1(request.getTopDonatorName1());
        }
        if (request.getTopDonatorAmount1() != null
                && !request.getTopDonatorAmount1().equals(settings.getTopDonatorAmount1())) {
            changes.add("Top Donator 1 Amount: " + settings.getTopDonatorAmount1() + " -> " + request.getTopDonatorAmount1());
            settings.setTopDonatorAmount1(request.getTopDonatorAmount1());
        }
        if (request.getTopDonatorName2() != null
                && !request.getTopDonatorName2().equals(settings.getTopDonatorName2())) {
            changes.add("Top Donator 2 Name: " + settings.getTopDonatorName2() + " -> " + request.getTopDonatorName2());
            settings.setTopDonatorName2(request.getTopDonatorName2());
        }
        if (request.getTopDonatorAmount2() != null
                && !request.getTopDonatorAmount2().equals(settings.getTopDonatorAmount2())) {
            changes.add("Top Donator 2 Amount: " + settings.getTopDonatorAmount2() + " -> " + request.getTopDonatorAmount2());
            settings.setTopDonatorAmount2(request.getTopDonatorAmount2());
        }
        if (request.getTopDonatorName3() != null
                && !request.getTopDonatorName3().equals(settings.getTopDonatorName3())) {
            changes.add("Top Donator 3 Name: " + settings.getTopDonatorName3() + " -> " + request.getTopDonatorName3());
            settings.setTopDonatorName3(request.getTopDonatorName3());
        }
        if (request.getTopDonatorAmount3() != null
                && !request.getTopDonatorAmount3().equals(settings.getTopDonatorAmount3())) {
            changes.add("Top Donator 3 Amount: " + settings.getTopDonatorAmount3() + " -> " + request.getTopDonatorAmount3());
            settings.setTopDonatorAmount3(request.getTopDonatorAmount3());
        }

        // Announcement Banner settings
        if (request.getAnnouncementEnabled() != null
                && !request.getAnnouncementEnabled().equals(settings.isAnnouncementEnabled())) {
            changes.add("Announcement Enabled: " + settings.isAnnouncementEnabled() + " -> " + request.getAnnouncementEnabled());
            settings.setAnnouncementEnabled(request.getAnnouncementEnabled());
        }
        if (request.getAnnouncementText() != null
                && !request.getAnnouncementText().equals(settings.getAnnouncementText())) {
            changes.add("Announcement Text Updated");
            settings.setAnnouncementText(request.getAnnouncementText());
        }
        if (request.getAnnouncementType() != null
                && !request.getAnnouncementType().equals(settings.getAnnouncementType())) {
            changes.add("Announcement Type: " + settings.getAnnouncementType() + " -> " + request.getAnnouncementType());
            settings.setAnnouncementType(request.getAnnouncementType());
        }

        SiteSettings saved = siteSettingsRepository.save(settings);
        cachedSettings = saved;

        if (!changes.isEmpty()) {
            auditLogService.logAction(adminId, adminName, "ADMIN_UPDATE_SETTINGS",
                    "Изменил настройки: " + String.join(", ", changes), null, null);
        }

        return saved;
    }

    @Transactional
    public void incrementSponsorshipGoal(int amount) {
        SiteSettings settings = getSettings();
        settings.setSponsorshipGoalCurrent(settings.getSponsorshipGoalCurrent() + amount);
        siteSettingsRepository.save(settings);
        cachedSettings = settings;
    }

    @Transactional
    public SiteSettings saveRawSettings(SiteSettings settings) {
        SiteSettings saved = siteSettingsRepository.save(settings);
        cachedSettings = saved;
        return saved;
    }
}
