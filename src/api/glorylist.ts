import api from './client';

export interface GloryLink {
    name: string;
    url: string;
}

export interface GloryItem {
    id?: number;
    name: string;
    category: string;
    image?: string;
    description?: string;
    details?: string;
    discord?: string;
    linksJson?: string;
    links?: GloryLink[];
    sortOrder?: number;
    active?: boolean;
}

export interface GloryDataGrouped {
    [key: string]: GloryItem[];
}

export const glorylistApi = {
    getPublicGloryList: async (): Promise<GloryDataGrouped> => {
        const response = await api.get('/api/glorylist');
        return response.data;
    },

    getAdminGloryItems: async (): Promise<GloryItem[]> => {
        const response = await api.get('/api/admin/glorylist');
        return response.data;
    },

    saveGloryItem: async (item: Partial<GloryItem>): Promise<GloryItem> => {
        const response = await api.post('/api/admin/glorylist', item);
        return response.data;
    },

    deleteGloryItem: async (id: number): Promise<void> => {
        await api.delete(`/api/admin/glorylist/${id}`);
    }
};
