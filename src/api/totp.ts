import apiClient from './client';

export interface TotpSetupResponse {
    secret: string;
    qrCodeDataUri: string;
}

export const totpApi = {
    // Start TOTP setup
    setup: async (): Promise<TotpSetupResponse> => {
        const response = await apiClient.post('/api/totp/setup');
        return response.data;
    },

    // Verify and enable TOTP
    verify: async (code: string): Promise<{ status: string; message: string }> => {
        const response = await apiClient.post('/api/totp/verify', { code });
        return response.data;
    },

    // Disable TOTP
    disable: async (code: string): Promise<{ status: string; message: string }> => {
        const response = await apiClient.post('/api/totp/disable', { code });
        return response.data;
    },

    // Check TOTP status (if needed separately)
    status: async (): Promise<{ totpEnabled: boolean }> => {
        const response = await apiClient.get('/api/totp/status');
        return response.data;
    },
};
