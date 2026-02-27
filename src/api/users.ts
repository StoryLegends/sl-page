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
    email: string;
    discordNickname: string;
    minecraftNickname: string;
    role: 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_MODERATOR';
    avatarUrl: string | null;
    banned: boolean;
    banReason?: string | null;
    emailVerified: boolean;
    discordVerified: boolean;
    totpEnabled: boolean;
    bio?: string | null;
    isPlayer: boolean;
    inSeason: boolean;
    discordUserId?: string;
    inDiscordServer: boolean;
    badges?: Badge[];
    // Admin-only security fields
    registrationIp?: string;
    registrationUserAgent?: string;
    lastLoginIp1?: string;
    lastLoginUserAgent1?: string;
    lastLoginIp2?: string;
    lastLoginUserAgent2?: string;
}

export interface UpdateProfileData {
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
};
