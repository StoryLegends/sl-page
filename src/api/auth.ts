import apiClient from './client';

export interface RegisterData {
    username: string;
    password: string;
    email: string;
    discordNickname?: string;
    minecraftNickname: string;
    recaptchaToken: string;
    bio?: string;
}

export interface LoginData {
    username: string;
    password: string;
    totpCode?: string;
    recaptchaToken?: string;
}

export interface LoginResponse {
    token: string;
    emailVerified: boolean;
    username: string;
    isPlayer: boolean;
    totpRequired?: boolean;
    discordVerified?: boolean;
}

export interface RegisterResponse {
    status: 'success';
}

export interface VerifyEmailResponse {
    status: 'success';
    token: string;
    alreadyVerified: boolean;
}

export interface ResetPasswordData {
    token: string;
    newPassword: string;
}

export const authApi = {
    // Register
    register: async (data: RegisterData): Promise<RegisterResponse> => {
        const response = await apiClient.post('/api/auth/register', data);
        return response.data;
    },

    // Login
    login: async (data: LoginData): Promise<LoginResponse> => {
        const response = await apiClient.post('/api/auth/login', data);
        return response.data;
    },

    // Verify email
    verifyEmail: async (token: string): Promise<VerifyEmailResponse> => {
        const response = await apiClient.post('/api/auth/verify-email', { token });
        return response.data;
    },

    // Resend verification email
    resendVerification: async (data: { email: string }): Promise<{ status: string }> => {
        const response = await apiClient.post('/api/auth/resend-verification', data);
        return response.data;
    },

    // Request password reset
    forgotPassword: async (email: string): Promise<{ message: string }> => {
        const response = await apiClient.post('/api/auth/forgot-password', { email });
        return response.data;
    },

    // Set new password
    resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
        const response = await apiClient.post('/api/auth/reset-password', data);
        return response.data;
    },

    // Discord OAuth2
    discordAuthorize: async (): Promise<{ url: string }> => {
        const response = await apiClient.get('/api/auth/discord/authorize');
        return response.data;
    },

    discordConnect: async (code: string): Promise<{ status: string; discordUsername: string; discordId: string }> => {
        const response = await apiClient.post('/api/auth/discord/connect', { code });
        return response.data;
    },

    discordDisconnect: async (): Promise<{ status: string }> => {
        const response = await apiClient.delete('/api/auth/discord/disconnect');
        return response.data;
    },
};

