package com.datapeice.slbackend.controller;

import com.datapeice.slbackend.entity.SiteSettings;
import com.datapeice.slbackend.entity.User;
import com.datapeice.slbackend.service.SiteSettingsService;
import com.datapeice.slbackend.service.UserService;
import com.datapeice.slbackend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/settings")
public class PublicSettingsController {
    private final SiteSettingsService siteSettingsService;
    private final UserRepository userRepository;
    private final UserService userService;

    public PublicSettingsController(SiteSettingsService siteSettingsService, UserRepository userRepository, UserService userService) {
        this.siteSettingsService = siteSettingsService;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @GetMapping("/public")
    public ResponseEntity<Map<String, Object>> getPublicSettings() {
        SiteSettings settings = siteSettingsService.getSettings();
        Map<String, Object> map = new HashMap<>();
        map.put("applicationsOpen", settings.isApplicationsOpen());
        map.put("registrationOpen", settings.isRegistrationOpen());
        map.put("maintenanceMode", settings.isMaintenanceMode());
        map.put("seasonStatus", settings.getSeasonStatus() != null ? settings.getSeasonStatus() : "closed");
        map.put("seasonTitle", settings.getSeasonTitle() != null ? settings.getSeasonTitle() : "StoryLegends Island");
        map.put("seasonDescription", settings.getSeasonDescription() != null ? settings.getSeasonDescription() : "");
        map.put("seasonDate", settings.getSeasonDate() != null ? settings.getSeasonDate() : "");

        map.put("sponsorshipGoalEnabled", settings.isSponsorshipGoalEnabled());
        map.put("sponsorshipGoalTarget", settings.getSponsorshipGoalTarget());
        map.put("sponsorshipGoalCurrent", settings.getSponsorshipGoalCurrent());
        map.put("sponsorshipGoalText", settings.getSponsorshipGoalText() != null ? settings.getSponsorshipGoalText() : "На оплату хостинга");

        // Dynamically fetch top 3 donators from database
        List<User> topUsers = userRepository.findTop3Donators(PageRequest.of(0, 3));
        
        String tName1 = "Игрок 1"; int tAmount1 = 0; String tAvatar1 = null;
        String tName2 = "Игрок 2"; int tAmount2 = 0; String tAvatar2 = null;
        String tName3 = "Игрок 3"; int tAmount3 = 0; String tAvatar3 = null;
        
        if (topUsers.size() > 0) {
            User u = topUsers.get(0);
            tName1 = u.getMinecraftNickname() != null && !u.getMinecraftNickname().isBlank() ? u.getMinecraftNickname() : u.getUsername();
            tAmount1 = u.getTotalDonated() != null ? u.getTotalDonated() : 0;
            tAvatar1 = userService.resolveAvatarUrl(u.getAvatarUrl(), u.getUsername());
        }
        if (topUsers.size() > 1) {
            User u = topUsers.get(1);
            tName2 = u.getMinecraftNickname() != null && !u.getMinecraftNickname().isBlank() ? u.getMinecraftNickname() : u.getUsername();
            tAmount2 = u.getTotalDonated() != null ? u.getTotalDonated() : 0;
            tAvatar2 = userService.resolveAvatarUrl(u.getAvatarUrl(), u.getUsername());
        }
        if (topUsers.size() > 2) {
            User u = topUsers.get(2);
            tName3 = u.getMinecraftNickname() != null && !u.getMinecraftNickname().isBlank() ? u.getMinecraftNickname() : u.getUsername();
            tAmount3 = u.getTotalDonated() != null ? u.getTotalDonated() : 0;
            tAvatar3 = userService.resolveAvatarUrl(u.getAvatarUrl(), u.getUsername());
        }

        map.put("topDonatorName1", tName1);
        map.put("topDonatorAmount1", tAmount1);
        map.put("topDonatorAvatar1", tAvatar1);
        
        map.put("topDonatorName2", tName2);
        map.put("topDonatorAmount2", tAmount2);
        map.put("topDonatorAvatar2", tAvatar2);
        
        map.put("topDonatorName3", tName3);
        map.put("topDonatorAmount3", tAmount3);
        map.put("topDonatorAvatar3", tAvatar3);

        return ResponseEntity.ok(map);
    }
}
