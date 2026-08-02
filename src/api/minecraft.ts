import apiClient from './client';

export interface MinecraftStatus {
    status: 'ONLINE' | 'OFFLINE' | 'STARTING' | 'STOPPING';
    containerName: string;
    version: string;
    motd: string;
    tps: number;
    onlinePlayers: number;
    maxPlayers: number;
    memoryUsedMb: number;
    memoryMaxMb: number;
    cpuUsagePercent: number;
}

export interface MinecraftPlugin {
    filename: string;
    sizeBytes: number;
    enabled: boolean;
}

export interface MinecraftPlayer {
    name: string;
    avatarUrl: string;
    ping: number;
}

export const minecraftApi = {
    getStatus: async (): Promise<MinecraftStatus> => {
        const res = await apiClient.get('/api/admin/minecraft/status');
        return res.data;
    },
    powerAction: async (action: 'start' | 'stop' | 'restart' | 'kill') => {
        const res = await apiClient.post('/api/admin/minecraft/power', { action });
        return res.data;
    },
    sendCommand: async (command: string) => {
        const res = await apiClient.post('/api/admin/minecraft/command', { command });
        return res.data;
    },
    getLogs: async (): Promise<string[]> => {
        const res = await apiClient.get('/api/admin/minecraft/console');
        return res.data.logs || [];
    },
    getPlugins: async (): Promise<MinecraftPlugin[]> => {
        const res = await apiClient.get('/api/admin/minecraft/plugins');
        return res.data;
    },
    uploadPlugin: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiClient.post('/api/admin/minecraft/plugins/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },
    getPlayers: async (): Promise<MinecraftPlayer[]> => {
        const res = await apiClient.get('/api/admin/minecraft/players');
        return res.data;
    },
    getConfig: async (): Promise<string> => {
        const res = await apiClient.get('/api/admin/minecraft/config');
        return res.data.content;
    },
    saveConfig: async (content: string) => {
        const res = await apiClient.post('/api/admin/minecraft/config', { content });
        return res.data;
    }
};
