import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import type { MinecraftStatus } from '../api/minecraft';

export function useMinecraftWebSocket(serverId: string = 'server-1') {
    const [status, setStatus] = useState<MinecraftStatus | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const stompClientRef = useRef<Client | null>(null);

    useEffect(() => {
        if (!serverId) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const brokerURL = `${protocol}//${host}/api/ws/admin/websocket`;

        const client = new Client({
            brokerURL,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                setIsConnected(true);

                // 1. Subscribe to real-time status stream
                client.subscribe(`/topic/minecraft/status/${serverId}`, (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        setStatus(data);
                    } catch (e) {}
                });

                client.subscribe('/topic/minecraft/status', (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        if (data.serverId === serverId) {
                            setStatus(data);
                        }
                    } catch (e) {}
                });

                // 2. Subscribe to real-time console log stream
                client.subscribe(`/topic/minecraft/logs/${serverId}`, (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        if (data.logs && Array.isArray(data.logs)) {
                            setLogs(data.logs);
                        } else if (data.output) {
                            setLogs((prev) => [...prev, data.output]);
                        }
                    } catch (e) {}
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
            },
            onStompError: () => {
                setIsConnected(false);
            }
        });

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
        };
    }, [serverId]);

    const sendCommand = (cmd: string) => {
        if (stompClientRef.current && stompClientRef.current.connected) {
            stompClientRef.current.publish({
                destination: '/app/minecraft/command',
                body: JSON.stringify({ serverId, command: cmd })
            });
        }
    };

    return { status, logs, isConnected, sendCommand };
}
