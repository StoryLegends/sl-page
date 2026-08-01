import api from './client';

export interface ServerHistory {
    id?: number;
    title: string;
    description?: string;
    pathSlug: string;
    eventDate?: string;
    colorsJson?: string;
    colors?: string[];
    contentHtml?: string;
    photosJson?: string;
    photos?: any[];
    sortOrder?: number;
    published?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export const historyApi = {
    getPublicHistory: async (): Promise<ServerHistory[]> => {
        const response = await api.get('/history');
        return response.data;
    },

    getHistoryBySlug: async (slug: string): Promise<ServerHistory> => {
        const response = await api.get(`/history/${slug}`);
        return response.data;
    },

    getAdminHistory: async (): Promise<ServerHistory[]> => {
        const response = await api.get('/admin/history');
        return response.data;
    },

    saveHistory: async (history: Partial<ServerHistory>): Promise<ServerHistory> => {
        const response = await api.post('/admin/history', history);
        return response.data;
    },

    deleteHistory: async (id: number): Promise<void> => {
        await api.delete(`/admin/history/${id}`);
    }
};
