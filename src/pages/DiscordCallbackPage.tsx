import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Loader from '../components/ui/Loader';

const DiscordCallbackPage = () => {
    const location = useLocation();

    useEffect(() => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const query = location.search;

        if (query) {
            // Redirect to backend callback endpoint
            window.location.href = `${API_URL}/api/auth/discord/callback${query}`;
        } else {
            // No query params - unexpected
            window.location.href = '/profile?discord=error&reason=invalid_state';
        }
    }, [location]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
            <div className="text-center space-y-4">
                <Loader />
                <p className="text-gray-400 font-medium animate-pulse">Связываем аккаунты Discord...</p>
            </div>
        </div>
    );
};

export default DiscordCallbackPage;
