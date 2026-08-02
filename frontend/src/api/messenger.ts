import apiClient from './client';
import type { User } from './users';

export interface BotMessage {
    id: number;
    recipientUserId: number;
    recipientUsername: string;
    senderAdminName: string;
    content: string;
    mediaUrl?: string | null;
    isEdited: boolean;
    isFromPlayer?: boolean;
    reactions?: string | null;
    createdAt: string;
    updatedAt?: string | null;
}

export interface ConversationItem {
    user: User;
    lastMessage?: string | null;
    lastMessageTime?: string | null;
    lastMessageIsEdited?: boolean;
}

export interface ConversationResponse {
    activeConversations: ConversationItem[];
    uncontactedPlayers: ConversationItem[];
}

export const messengerApi = {
    getConversations: async (): Promise<ConversationResponse> => {
        const response = await apiClient.get('/api/admin/messenger/conversations');
        return response.data;
    },

    getMessages: async (userId: number): Promise<BotMessage[]> => {
        const response = await apiClient.get(`/api/admin/messenger/messages/${userId}`);
        return response.data;
    },

    sendMessage: async (recipientUserId: number, content: string, mediaUrl?: string): Promise<BotMessage> => {
        const response = await apiClient.post('/api/admin/messenger/messages', {
            recipientUserId,
            content,
            mediaUrl
        });
        return response.data;
    },

    editMessage: async (messageId: number, content: string, mediaUrl?: string): Promise<BotMessage> => {
        const response = await apiClient.patch(`/api/admin/messenger/messages/${messageId}`, {
            content,
            mediaUrl
        });
        return response.data;
    },

    deleteMessage: async (messageId: number): Promise<void> => {
        await apiClient.delete(`/api/admin/messenger/messages/${messageId}`);
    },

    toggleReaction: async (messageId: number, emoji: string): Promise<BotMessage> => {
        const response = await apiClient.post(`/api/admin/messenger/messages/${messageId}/react`, null, {
            params: { emoji }
        });
        return response.data;
    },

    uploadFile: async (file: File): Promise<{ url: string; key: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/api/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};
