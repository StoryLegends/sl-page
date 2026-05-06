import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const useAdminWebSocket = (onApplicationUpdate: (app: any) => void, onUserUpdate: (user: any) => void) => {
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws/admin'),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            onConnect: () => {
                setConnected(true);
                
                client.subscribe('/topic/admin/applications', (message) => {
                    if (message.body) {
                        onApplicationUpdate(JSON.parse(message.body));
                    }
                });

                client.subscribe('/topic/admin/users', (message) => {
                    if (message.body) {
                        onUserUpdate(JSON.parse(message.body));
                    }
                });
            },
            onDisconnect: () => {
                setConnected(false);
            },
        });

        client.activate();

        return () => {
            client.deactivate();
        };
    }, []);

    return { connected };
};