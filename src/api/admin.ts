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
}

export const adminApi = {
    // Users
    resetSeason: async (totpCode?: string): Promise<void> => {
        await apiClient.post('/api/admin/reset-season', { totpCode });
    },

    getAllUsers: async (page = 0, size = 50): Promise<{ content: User[], totalElements: number, totalPages: number }> => {
        const response = await apiClient.get('/api/admin/users', {
            params: { page, size }
        });
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

    banUser: async (id: number, reason: string): Promise<User> => {
        const response = await apiClient.post(`/api/admin/users/${id}/ban`, { reason });
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

    issueWarning: async (userId: number, reason: string): Promise<WarningResponse> => {
        const response = await apiClient.post(`/api/admin/users/${userId}/warnings`, { reason });
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

    getPublicSettings: async (): Promise<{ applicationsOpen: boolean; registrationOpen: boolean }> => {
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

