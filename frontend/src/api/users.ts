import apiClient from './client';

export interface Badge {
    id: number;
    name: string;
    color: string;
    svgIcon: string;
    createdAt: string;
}

export interface User {
    id: number;
    username: string;
    email?: string;
    discordNickname: string;
    minecraftNickname: string;
    role: 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_MODERATOR';
    avatarUrl: string | null;
    banned?: boolean;
    banReason?: string | null;
    emailVerified?: boolean;
    discordVerified?: boolean;
    totpEnabled?: boolean;
    bio?: string | null;
    isPlayer?: boolean;
    inSeason?: boolean;
    discordUserId?: string;
    inDiscordServer?: boolean;
    badges?: Badge[];
    isBoosted?: boolean;
    // Admin-only security fields
    registrationIp?: string;
    registrationUserAgent?: string;
    lastLoginIp1?: string;
    lastLoginUserAgent1?: string;
    lastLoginIp2?: string;
    lastLoginUserAgent2?: string;
    lastLoginTime1?: string;
    lastLoginTime2?: string;
        // Browser Fingerprints
    registrationCanvas?: string;
    registrationWebgl?: string;
    registrationTimezone?: string;
    registrationLanguage?: string;
    registrationHardware?: number;
    registrationResolution?: string;
    registrationMemory?: string;
    registrationPixelRatio?: string;
    registrationTouchPoints?: string;
    lastLoginCanvas1?: string;
    lastLoginWebgl1?: string;
    lastLoginTimezone1?: string;
    lastLoginLanguage1?: string;
    lastLoginHardware1?: number;
    lastLoginResolution1?: string;
    lastLoginMemory1?: string;
    lastLoginPixelRatio1?: string;
    lastLoginTouchPoints1?: string;
    lastLoginCanvas2?: string;
    lastLoginWebgl2?: string;
    lastLoginTimezone2?: string;
    lastLoginLanguage2?: string;
    lastLoginHardware2?: number;
    lastLoginResolution2?: string;
    lastLoginMemory2?: string;
    lastLoginPixelRatio2?: string;
    lastLoginTouchPoints2?: string;
    // Warnings count
    warningsCount?: number;
    hasCoincidences?: boolean;
    hasBannedCoincidences?: boolean;
    hasSuspiciousMods?: boolean;
    createdAt?: string;
    sponsorshipLevel?: number;
    sponsorshipExpiresAt?: string | null;
    stripeSubscriptionId?: string | null;
    subscriptionRecurring?: boolean;
    totalDonated?: number;
}

export interface UpdateProfileData {
    username?: string;
    email?: string;
    discordNickname?: string;
    minecraftNickname?: string;
    avatarUrl?: string;
    bio?: string;
    isPlayer?: boolean;
    role?: string;
    oldPassword?: string;
    newPassword?: string;
    unlinkDiscord?: boolean;
    silent?: boolean;
}

export const usersApi = {
    // Get current user profile
    getMe: async (): Promise<User> => {
        const response = await apiClient.get('/api/users/me');
        return response.data;
    },

    // Update profile
    updateMe: async (data: UpdateProfileData): Promise<User> => {
        const response = await apiClient.patch('/api/users/me', data);
        return response.data;
    },

    // Get all verified users (public)
    getAll: async (): Promise<User[]> => {
        const response = await apiClient.get('/api/users');
        return response.data;
    },

    // Get user by ID (public)
    getById: async (id: number): Promise<User> => {
        const response = await apiClient.get(`/api/users/${id}`);
        return response.data;
    },

    // Get active feature flags for current user
    getActiveFeatureFlags: async (): Promise<string[]> => {
        const response = await apiClient.get('/api/feature-flags/active');
        return response.data;
    },

    // Cancel Stripe subscription auto-renewal
    cancelSubscription: async (): Promise<any> => {
        const response = await apiClient.post('/api/sponsorship/cancel');
        return response.data;
    },

    // Resume Stripe subscription auto-renewal
    resumeSubscription: async (): Promise<any> => {
        const response = await apiClient.post('/api/sponsorship/resume');
        return response.data;
    },
};
