import api from './client';

export interface Review {
    id: number;
    userId: number;
    username: string;
    userAvatarUrl?: string;
    rating: number;
    content: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    edited: boolean;
    editedAt?: string;
    adminReply?: string;
    adminReplyAuthorName?: string;
    adminRepliedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReviewEditHistory {
    id: number;
    reviewId: number;
    rating: number;
    content: string;
    createdAt: string;
}

export interface ReviewReminderSettings {
    reviewReminderAppAccepted: boolean;
    reviewReminderAppAcceptedDays: number;
    reviewReminderSponsorshipPurchased: boolean;
    reviewReminderSponsorshipDays: number;
}

export const reviewsApi = {
    getPublicReviews: async (): Promise<Review[]> => {
        const response = await api.get('/reviews/public');
        return response.data;
    },

    getReviewHistory: async (reviewId: number): Promise<ReviewEditHistory[]> => {
        const response = await api.get(`/reviews/history/${reviewId}`);
        return response.data;
    },

    getMyReview: async (): Promise<Review | null> => {
        try {
            const response = await api.get('/reviews/my');
            return response.data;
        } catch {
            return null;
        }
    },

    submitOrUpdateReview: async (rating: number, content: string): Promise<Review> => {
        const response = await api.post('/reviews', { rating, content });
        return response.data;
    },

    getAdminReviews: async (status?: string): Promise<Review[]> => {
        const response = await api.get('/admin/reviews', { params: { status } });
        return response.data;
    },

    updateReviewStatus: async (id: number, status: 'APPROVED' | 'REJECTED' | 'PENDING'): Promise<Review> => {
        const response = await api.post(`/admin/reviews/${id}/status`, { status });
        return response.data;
    },

    addAdminReply: async (id: number, reply: string): Promise<Review> => {
        const response = await api.post(`/admin/reviews/${id}/reply`, { reply });
        return response.data;
    },

    deleteReview: async (id: number): Promise<void> => {
        await api.delete(`/admin/reviews/${id}`);
    },

    getReminderSettings: async (): Promise<ReviewReminderSettings> => {
        const response = await api.get('/admin/reviews/reminder-settings');
        return response.data;
    },

    updateReminderSettings: async (settings: Partial<ReviewReminderSettings>): Promise<ReviewReminderSettings> => {
        const response = await api.post('/admin/reviews/reminder-settings', settings);
        return response.data;
    }
};
