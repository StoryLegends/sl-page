import apiClient from './client';
import type { User, UpdateProfileData, Badge } from './users';

export interface BadgeCreateData {
    name: string;
    color: string;
    svgIcon: string;
    discordRoleId: string;
}

export interface WarningResponse {
    id: number;
    userId: number;
    username: string;
    reason: string;
    issuedById: number;
    issuedByUsername: string;
    createdAt: string;
    active: boolean;
    expiresAt?: string;
}

export interface SiteSettings {
    maxWarningsBeforeBan: number;
    autoBanOnMaxWarnings: boolean;
    sendEmailOnWarning: boolean;
    sendDiscordDmOnWarning: boolean;
    sendEmailOnBan: boolean;
    sendDiscordDmOnBan: boolean;
    sendEmailOnApplicationApproved: boolean;
    sendEmailOnApplicationRejected: boolean;
    applicationsOpen: boolean;
    registrationOpen: boolean;
    maintenanceMode: boolean;
    seasonStatus: string;
    seasonTitle: string;
    seasonDescription: string;
    seasonDate: string;
}

export interface DashboardStats {
    totalUsers: number;
    pendingApplications: number;
    activePlayers: number;
    bannedUsers: number;
    playerMessagesCount?: number;
    unreadMessagesCount?: number;
    activeWarningsCount?: number;
}

export const adminApi = {
    getStats: async (): Promise<DashboardStats> => {
        const response = await apiClient.get('/api/admin/stats');
        return response.data;
    },

    // Users
    resetSeason: async (totpCode?: string): Promise<void> => {
        await apiClient.post('/api/admin/reset-season', { totpCode });
    },

    getAllUsers: async (page = 0, size = 50, query?: string, role?: string, status?: string): Promise<{ content: User[], totalElements: number, totalPages: number }> => {
        const params: any = { page, size };
        if (query) params.query = query;
        if (role) params.role = role;
        if (status) params.status = status;
        const response = await apiClient.get('/api/admin/users', {
            params
        });
        return response.data;
    },

    getUser: async (id: number): Promise<User> => {
        const response = await apiClient.get(`/api/admin/users/${id}`);
        return response.data;
    },

    getRelatedAccounts: async (id: number): Promise<User[]> => {
        const response = await apiClient.get(`/api/admin/users/${id}/related-accounts`);
        return response.data;
    },

    createUser: async (data: any): Promise<User> => {
        const response = await apiClient.post('/api/admin/users', data);
        return response.data;
    },

    updateUser: async (id: number, data: UpdateProfileData): Promise<User> => {
        const response = await apiClient.patch(`/api/admin/users/${id}`, data);
        return response.data;
    },

    deleteUser: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/admin/users/${id}`);
    },

    banUser: async (id: number, reason: string, silent?: boolean, durationDays?: number): Promise<User> => {
        const response = await apiClient.post(`/api/admin/users/${id}/ban`, { reason, silent, durationDays });
        return response.data;
    },

    unbanUser: async (id: number): Promise<User> => {
        const response = await apiClient.post(`/api/admin/users/${id}/unban`);
        return response.data;
    },

    resetUserPassword: async (id: number): Promise<{ status: string, message: string }> => {
        const response = await apiClient.post(`/api/admin/users/${id}/reset-password`);
        return response.data;
    },

    resetUserMinecraftPassword: async (id: number): Promise<{ status: string, message: string }> => {
        const response = await apiClient.post(`/api/admin/users/${id}/reset-minecraft-password`);
        return response.data;
    },

    // Badges
    getBadges: async (): Promise<Badge[]> => {
        const response = await apiClient.get('/api/admin/badges');
        return response.data;
    },

    createBadge: async (data: BadgeCreateData): Promise<Badge> => {
        const response = await apiClient.post('/api/admin/badges', data);
        return response.data;
    },

    updateBadge: async (id: number, data: Partial<BadgeCreateData>): Promise<Badge> => {
        const response = await apiClient.patch(`/api/admin/badges/${id}`, data);
        return response.data;
    },

    deleteBadge: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/admin/badges/${id}`);
    },

    assignBadge: async (userId: number, badgeId: number): Promise<void> => {
        await apiClient.post(`/api/admin/users/${userId}/badges/${badgeId}`);
    },

    removeBadge: async (userId: number, badgeId: number): Promise<void> => {
        await apiClient.delete(`/api/admin/users/${userId}/badges/${badgeId}`);
    },

    // Warnings
    getWarnings: async (userId: number): Promise<WarningResponse[]> => {
        const response = await apiClient.get(`/api/admin/users/${userId}/warnings`);
        return response.data;
    },

    issueWarning: async (userId: number, reason: string, durationDays?: number): Promise<WarningResponse> => {
        const response = await apiClient.post(`/api/admin/users/${userId}/warnings`, { reason, durationDays });
        return response.data;
    },

    revokeWarning: async (warningId: number): Promise<WarningResponse> => {
        const response = await apiClient.patch(`/api/admin/warnings/${warningId}/revoke`);
        return response.data;
    },

    deleteWarning: async (warningId: number): Promise<void> => {
        await apiClient.delete(`/api/admin/warnings/${warningId}`);
    },

    // Settings
    getSettings: async (): Promise<SiteSettings> => {
        const response = await apiClient.get('/api/admin/settings');
        return response.data;
    },

    getPublicSettings: async (): Promise<{ 
        applicationsOpen: boolean; 
        registrationOpen: boolean; 
        maintenanceMode: boolean;
        seasonStatus: string;
        seasonTitle: string;
        seasonDescription: string;
        seasonDate: string;
    }> => {
        const response = await apiClient.get('/api/admin/settings/public');
        return response.data;
    },

    updateSettings: async (data: Partial<SiteSettings>): Promise<SiteSettings> => {
        const response = await apiClient.patch('/api/admin/settings', data);
        return response.data;
    },

    // Database
    downloadBackup: async (): Promise<Blob> => {
        const response = await apiClient.get('/api/admin/db/backup', { responseType: 'blob' });
        return response.data;
    },

    restoreBackup: async (file: File): Promise<void> => {
        const formData = new FormData();
        formData.append('file', file);
        await apiClient.post('/api/admin/db/restore', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Logs
    getLogs: async (query?: string, page = 0, size = 50): Promise<{ content: AuditLog[], totalElements: number, totalPages: number }> => {
        const response = await apiClient.get('/api/admin/logs', {
            params: { query, page, size }
        });
        return response.data;
    },

    getUserAuditLogs: async (userId: number, page = 0, size = 20): Promise<{ content: AuditLog[], totalElements: number, totalPages: number }> => {
        const response = await apiClient.get(`/api/admin/users/${userId}/audit-logs`, {
            params: { page, size }
        });
        return response.data;
    },

    logDossierView: async (userId: number): Promise<void> => {
        await apiClient.post(`/api/admin/users/${userId}/log-dossier-view`);
    }
};

export interface AuditLog {
    id: number;
    actorId: number | null;
    actorUsername: string;
    actionType: string;
    details: string;
    targetUserId: number | null;
    targetUsername: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
}

// ==================== Anticheat ====================

export interface ProcessInfo {
    imageName: string;
    pid: string;
    memUsage: string;
    status: string;
    windowTitle: string;
}

export interface ModEntry {
    name: string;
    /** "TRUSTED" | "SUSPICIOUS" | "UNKNOWN" */
    status: string;
}

export interface AnticheatSnapshot {
    id: number;
    playerName: string;
    playerUuid: string;
    launcherName: string;
    launcherBrand: string;
    mods: ModEntry[];
    resourcePacks: string[];
    processes: ProcessInfo[];
    createdAt: string;
    anomalyScore?: number;
    suspicious?: boolean;
    anomalyDetails?: string;
}


export const anticheatApi = {
    getAllSnapshots: async (query?: string, page = 0, size = 20): Promise<{ content: AnticheatSnapshot[], totalElements: number, totalPages: number }> => {
        const params: any = { page, size };
        if (query) params.query = query;
        const response = await apiClient.get('/api/admin/anticheat/snapshots', { params });
        return response.data;
    },

    getPlayerSnapshots: async (playerName: string, page = 0, size = 20): Promise<{ content: AnticheatSnapshot[], totalElements: number, totalPages: number }> => {
        const response = await apiClient.get(`/api/admin/anticheat/players/${encodeURIComponent(playerName)}`, {
            params: { page, size }
        });
        return response.data;
    },

    getSnapshot: async (id: number, log: boolean = false): Promise<AnticheatSnapshot> => {
        const response = await apiClient.get(`/api/admin/anticheat/snapshots/${id}`, {
            params: { log }
        });
        return response.data;
    },

    requestSnapshot: async (playerName: string): Promise<{ status: string, message: string }> => {
        const response = await apiClient.post(`/api/admin/anticheat/request/${encodeURIComponent(playerName)}`);
        return response.data;
    }
};

// ==================== Known Mods ====================

export type KnownModStatus = 'TRUSTED' | 'SUSPICIOUS';

export interface KnownMod {
    id: number;
    name: string;
    status: KnownModStatus;
    addedBy: string;
    notes: string | null;
    createdAt: string;
}

export interface KnownModRequest {
    name: string;
    status: KnownModStatus;
    notes?: string;
}

export const knownModsApi = {
    getAll: async (): Promise<KnownMod[]> => {
        const response = await apiClient.get('/api/admin/anticheat/known-mods');
        return response.data;
    },

    save: async (data: KnownModRequest): Promise<KnownMod> => {
        const response = await apiClient.post('/api/admin/anticheat/known-mods', data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/admin/anticheat/known-mods/${id}`);
    },

    deleteByName: async (name: string): Promise<void> => {
        await apiClient.delete(`/api/admin/anticheat/known-mods/name/${encodeURIComponent(name)}`);
    },
};

