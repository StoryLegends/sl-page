import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

if (typeof window !== 'undefined' && !(window as any).global) {
    (window as any).global = window;
}

export const useAdminWebSocket = (subscriptions: { [topic: string]: (data: any) => void }) => {
    const subsRef = useRef(subscriptions);
    subsRef.current = subscriptions;

    useEffect(() => {
        const baseUrl = import.meta.env.VITE_API_URL || 'https://slbackend-7a8596651d0c.herokuapp.com';
        const wsScheme = baseUrl.startsWith('https') ? 'wss:' : 'ws:';
        const hostPath = baseUrl.replace(/^https?:\/\//, '');
        
        const wsBrokerUrl = `${wsScheme}//${hostPath}/ws/admin`;
        const sockJsUrl = `${baseUrl.replace(/\/$/, '')}/ws/admin`;

        const client = new Client({
            brokerURL: wsBrokerUrl,
            webSocketFactory: () => new SockJS(sockJsUrl),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                Object.keys(subsRef.current).forEach((topic) => {
                    client.subscribe(topic, (message) => {
                        try {
                            const body = JSON.parse(message.body);
                            if (subsRef.current[topic]) {
                                subsRef.current[topic](body);
                            }
                        } catch (err) {
                            console.error('Failed to parse WS message body:', err);
                        }
                    });
                });
            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame);
            }
        });

        client.activate();

        return () => {
            client.deactivate();
        };
    }, []);
};