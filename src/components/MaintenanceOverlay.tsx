import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Wrench, ShieldAlert, Lock } from 'lucide-react';

const MaintenanceOverlay: React.FC = () => {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const { user } = useAuth();
    const location = useLocation();

    useEffect(() => {
        const checkMaintenance = async () => {
            try {
                const res = await apiClient.get('/api/auth/public/settings');
                if (res.data && typeof res.data.maintenanceMode === 'boolean') {
                    setMaintenanceMode(res.data.maintenanceMode);
                }
            } catch (err) {
                // Ignore silent errors
            }
        };
        checkMaintenance();
        const interval = setInterval(checkMaintenance, 15000);
        return () => clearInterval(interval);
    }, []);

    // Do not show overlay if maintenance mode is disabled
    if (!maintenanceMode) return null;

    // Do not block admins or moderators
    if (user && (user.role === 'ROLE_ADMIN' || user.role === 'ROLE_MODERATOR')) {
        return null;
    }

    // Allow access to login page so admins can log in
    if (location.pathname === '/login' || location.pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[99999] bg-[#070d19] text-white flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
            {/* Background Glow Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-lg w-full bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-inner">
                    <Wrench className="w-10 h-10 text-amber-400 animate-pulse" />
                </div>

                <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/30 uppercase tracking-wider">
                        <ShieldAlert className="w-3.5 h-3.5" /> Техническое обслуживание
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                        Ведутся технические работы
                    </h1>
                    <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                        Мы обновляем систему и повышаем стабильность игровых серверов. Доступ к сайту и регистрации временно ограничен.
                    </p>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                        href="/login"
                        className="w-full sm:w-auto px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10"
                    >
                        <Lock className="w-4 h-4 text-amber-400" /> Вход для администрации
                    </a>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceOverlay;
