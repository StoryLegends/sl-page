import { useEffect, useRef, useState, useCallback } from 'react';

export interface ServerLogMessage {
    type: 'log';
    message: string;
}

export interface ServerMetricsMessage {
    type: 'metrics';
    cpu: number;
    ramUsedMb: number;
    ramMaxMb: number;
    tps: number;
    onlinePlayers: number;
}

export type AdminWSMessage = ServerLogMessage | ServerMetricsMessage;

export function useAdminWebSocket(
    serverIdOrTopicMap: string | Record<string, Function> = 'server-1'
) {
    const [logs, setLogs] = useState<string[]>([]);
    const [metrics, setMetrics] = useState<ServerMetricsMessage | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    const serverId = typeof serverIdOrTopicMap === 'string' ? serverIdOrTopicMap : 'server-1';

    const connect = useCallback(() => {
        const baseUrl = import.meta.env.VITE_API_URL || '';
        let wsUrl: string;

        if (baseUrl) {
            const parsed = new URL(baseUrl);
            const protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
            wsUrl = `${protocol}//${parsed.host}/api/ws/admin`;
        } else {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            wsUrl = `${protocol}//${window.location.host}/api/ws/admin`;
        }

        const token = localStorage.getItem('token');
        if (token) {
            wsUrl += `?token=${encodeURIComponent(token)}&serverId=${encodeURIComponent(serverId)}`;
        }

        try {
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const data: AdminWSMessage = JSON.parse(event.data);
                    if (data.type === 'log') {
                        setLogs((prev) => [...prev, data.message]);
                    } else if (data.type === 'metrics') {
                        setMetrics(data);
                    }
                } catch {
                    setLogs((prev) => [...prev, event.data]);
                }

                if (typeof serverIdOrTopicMap === 'object' && serverIdOrTopicMap !== null) {
                    Object.values(serverIdOrTopicMap).forEach(fn => {
                        if (typeof fn === 'function') fn(event.data);
                    });
                }
            };

            ws.onclose = () => {
                setIsConnected(false);
            };

            ws.onerror = () => {
                setIsConnected(false);
            };

            wsRef.current = ws;
        } catch {
            setIsConnected(false);
        }
    }, [serverId, serverIdOrTopicMap]);

    useEffect(() => {
        connect();
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    const sendCommand = useCallback((command: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'command', command }));
        }
    }, []);

    return { logs, metrics, isConnected, sendCommand };
}