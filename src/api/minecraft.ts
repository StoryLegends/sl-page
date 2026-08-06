import apiClient from './client';

export interface MinecraftServerInfo {
    id: string;
    name: string;
    containerName: string;
    version: string;
    type: string;
    port: number;
    memory: string;
    javaVersion?: string;
    cpuLimit?: number;
    swapMemory?: string;
    diskSpace?: string;
    motd?: string;
    onlineMode?: boolean;
    maxPlayers?: number;
    autoRestart?: string;
    path: string;
    rconIp?: string;
    rconPort?: number;
    rconPassword?: string;
    rconEnabled?: boolean;
}

export interface MinecraftStatus {
    serverId: string;
    serverName: string;
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

export interface ContainerFileItem {
    name: string;
    relativePath: string;
    isDir: boolean;
    sizeBytes: number;
    lastModified: number;
}

export interface MinecraftPlayer {
    name: string;
    avatarUrl: string;
    ping: number;
}

export const minecraftApi = {
    getVersions: async (): Promise<string[]> => {
        const res = await apiClient.get('/api/admin/minecraft/versions');
        return res.data;
    },
    getSystemResources: async (): Promise<{ totalRamMb: number; totalCores: number }> => {
        const res = await apiClient.get('/api/admin/minecraft/system-resources');
        return res.data;
    },
    getServers: async (): Promise<MinecraftServerInfo[]> => {
        const res = await apiClient.get('/api/admin/minecraft/servers');
        return res.data;
    },
    deleteServer: async (id: string) => {
        const res = await apiClient.delete(`/api/admin/minecraft/servers/${id}`);
        return res.data;
    },
    createServer: async (data: { 
        name: string; 
        version: string; 
        type: string; 
        memory: string;
        javaVersion?: string;
        cpuLimit?: number;
        swapMemory?: string;
        diskSpace?: string;
        motd?: string;
        onlineMode?: boolean;
        maxPlayers?: number;
        autoRestart?: string;
        port?: number;
        rconPort?: number;
        rconPassword?: string;
    }) => {
        const res = await apiClient.post('/api/admin/minecraft/servers', data);
        return res.data;
    },
    updateServerSettings: async (data: {
        serverId: string;
        name?: string;
        version?: string;
        type?: string;
        memory?: string;
        javaVersion?: string;
        cpuLimit?: number;
        swapMemory?: string;
        diskSpace?: string;
        motd?: string;
        onlineMode?: boolean;
        maxPlayers?: number;
        autoRestart?: string;
        rconIp?: string;
        rconPort?: number;
        rconPassword?: string;
        rconEnabled?: boolean;
    }) => {
        const res = await apiClient.post('/api/admin/minecraft/server/update', data);
        return res.data;
    },
    getStatus: async (serverId: string = 'server-1'): Promise<MinecraftStatus> => {
        const res = await apiClient.get(`/api/admin/minecraft/status?serverId=${serverId}`);
        return res.data;
    },
    powerAction: async (action: 'start' | 'stop' | 'restart' | 'kill', serverId: string = 'server-1') => {
        const res = await apiClient.post('/api/admin/minecraft/power', { action, serverId });
        return res.data;
    },
    sendCommand: async (command: string, serverId: string = 'server-1') => {
        const res = await apiClient.post('/api/admin/minecraft/command', { command, serverId });
        return res.data;
    },
    getLogs: async (serverId: string = 'server-1'): Promise<string[]> => {
        const res = await apiClient.get(`/api/admin/minecraft/console?serverId=${serverId}`);
        return res.data.logs || [];
    },
    listFiles: async (serverId: string = 'server-1', path: string = ''): Promise<ContainerFileItem[]> => {
        const res = await apiClient.get(`/api/admin/minecraft/files/list?serverId=${serverId}&path=${encodeURIComponent(path)}`);
        return res.data;
    },
    readFile: async (serverId: string = 'server-1', path: string): Promise<string> => {
        const res = await apiClient.get(`/api/admin/minecraft/files/read?serverId=${serverId}&path=${encodeURIComponent(path)}`);
        return res.data.content;
    },
    writeFile: async (path: string, content: string, serverId: string = 'server-1') => {
        const res = await apiClient.post('/api/admin/minecraft/files/write', { path, content, serverId });
        return res.data;
    },
    uploadContainerFile: async (file: File, targetFolder: string = 'plugins', serverId: string = 'server-1') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('targetFolder', targetFolder);
        formData.append('serverId', serverId);
        const res = await apiClient.post('/api/admin/minecraft/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },
    deleteContainerFile: async (path: string, serverId: string = 'server-1') => {
        const res = await apiClient.delete(`/api/admin/minecraft/files?path=${encodeURIComponent(path)}&serverId=${serverId}`);
        return res.data;
    },
    getPlayers: async (serverId: string = 'server-1'): Promise<MinecraftPlayer[]> => {
        const res = await apiClient.get(`/api/admin/minecraft/players?serverId=${serverId}`);
        return res.data;
    }
};
