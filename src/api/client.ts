import axios, { type AxiosInstance, type AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

import { getBrowserFingerprint } from '../utils/fingerprint';

// Get fingerprint once on client initialization to avoid any CPU load
const fingerprint = getBrowserFingerprint();

// Interceptor to add JWT token and browser fingerprints
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add browser fingerprint headers to help detect multi-accounts
        config.headers['X-Fingerprint-Canvas'] = fingerprint.canvas;
        config.headers['X-Fingerprint-WebGL'] = fingerprint.webgl;
        config.headers['X-Fingerprint-Timezone'] = fingerprint.timezone;
        config.headers['X-Fingerprint-Language'] = fingerprint.language;
        config.headers['X-Fingerprint-Hardware'] = fingerprint.hardware;
        config.headers['X-Fingerprint-Resolution'] = fingerprint.resolution;
        config.headers['X-Fingerprint-Memory'] = fingerprint.deviceMemory;
        config.headers['X-Fingerprint-PixelRatio'] = fingerprint.devicePixelRatio;
        config.headers['X-Fingerprint-TouchPoints'] = fingerprint.touchPoints;

        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor to handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            if (window.location.pathname !== '/login') {
                localStorage.removeItem('token');
                localStorage.removeItem('emailVerified');
                localStorage.removeItem('username');
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
