package com.datapeice.slbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminDashboardStatsResponse {
    private long totalUsers;
    private long pendingApplications;
    private long activePlayers;
    private long bannedUsers;
    private long playerMessagesCount;
    private long activeWarningsCount;
}
