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
    status?: string;
}

export type AdminWSMessage = ServerLogMessage | ServerMetricsMessage;

export function useAdminWebSocket(
    serverIdOrTopicMap: string | null | Record<string, Function> = 'server-1'
) {
    const [logs, setLogs] = useState<string[]>([]);
    const [metrics, setMetrics] = useState<ServerMetricsMessage | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    const isTopicMap = typeof serverIdOrTopicMap === 'object' && serverIdOrTopicMap !== null;
    const serverId = typeof serverIdOrTopicMap === 'string' ? serverIdOrTopicMap : (isTopicMap ? 'admin' : null);

    // Keep latest topic map reference in a ref so connect() stays stable across renders
    const topicMapRef = useRef(serverIdOrTopicMap);
    useEffect(() => {
        topicMapRef.current = serverIdOrTopicMap;
    }, [serverIdOrTopicMap]);

    const connect = useCallback(() => {
        if (!serverId) {
            return;
        }

        // Avoid re-connecting if already connected or connecting
        if (wsRef.current) {
            if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
                return;
            }
        }

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
                    const data = JSON.parse(event.data);
                    
                    // Route logs and metrics to local hooks if it's for current server
                    if (data.type === 'log') {
                        setLogs((prev) => [...prev, data.message]);
                    } else if (data.type === 'metrics') {
                        setMetrics(data);
                    }

                    const currentTopicMap = topicMapRef.current;
                    if (typeof currentTopicMap === 'object' && currentTopicMap !== null) {
                        if (data.topic) {
                            const callback = currentTopicMap[data.topic];
                            if (typeof callback === 'function') {
                                callback(data.data || data);
                            }
                        } else {
                            Object.values(currentTopicMap).forEach(fn => {
                                if (typeof fn === 'function') fn(event.data);
                            });
                        }
                    }
                } catch {
                    const currentTopicMap = topicMapRef.current;
                    if (typeof currentTopicMap === 'object' && currentTopicMap !== null) {
                        Object.values(currentTopicMap).forEach(fn => {
                            if (typeof fn === 'function') fn(event.data);
                        });
                    }
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
    }, [serverId]);

    useEffect(() => {
        connect();
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [connect]);

    const sendCommand = useCallback((command: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'command', command }));
        }
    }, []);

    return { logs, setLogs, metrics, setMetrics, isConnected, sendCommand };
}