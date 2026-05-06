import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const useAdminWebSocket = (onApplicationUpdate: (app: any) => void, onUserUpdate: (user: any) => void) => {
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const wsUrl = window.location.protocol === 'https:' 
            ? 'https://slbackend-7a8596651d0c.herokuapp.com/ws/admin' 
            : 'http://localhost:8080/ws/admin';

        // Add correct protocols for SockJS
        const client = new Client({
            webSocketFactory: () => new SockJS(wsUrl, null, {
                transports: ['websocket', 'xhr-streaming', 'xhr-polling']
            }),
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