import apiClient from './client';
import type { User } from './users';

export interface Application {
    id: number;
    firstName: string;
    age: number;
    whyUs: string;
    source: string;
    makeContent: boolean;
    additionalInfo: string;
    selfRating: number;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    adminComment?: string | null;
    createdAt: string;
    user: User;
}

export interface MyApplicationsResponse {
    current: Application | null;
    history: Application[];
}

export interface ApplicationCreateData {
    firstName: string;
    age: number;
    whyUs: string;
    source: string;
    makeContent: boolean;
    additionalInfo: string;
    selfRating: number;
    recaptchaToken: string;
}

export const applicationsApi = {
    create: async (data: ApplicationCreateData): Promise<Application> => {
        const response = await apiClient.post('/api/applications', data);
        return response.data;
    },

    getMy: async (): Promise<MyApplicationsResponse> => {
        const response = await apiClient.get('/api/applications/my');
        return response.data;
    },

    getAll: async (status?: string, page = 0, size = 50): Promise<{ content: Application[], totalElements: number, totalPages: number }> => {
        const params: any = { page, size };
        if (status) params.status = status;
        const response = await apiClient.get('/api/admin/applications', { params });
        return response.data;
    },

    updateStatus: async (id: number, status: string, adminComment?: string): Promise<Application> => {
        const response = await apiClient.patch(`/api/admin/applications/${id}/status`, { status, adminComment });
        return response.data;
    },
};

