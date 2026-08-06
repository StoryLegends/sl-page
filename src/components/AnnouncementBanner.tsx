import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { AlertCircle, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PublicSettings {
    announcementEnabled: boolean;
    announcementText: string;
    announcementType: 'info' | 'warning' | 'error' | 'success';
}

const AnnouncementBanner: React.FC = () => {
    const [settings, setSettings] = useState<PublicSettings | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await apiClient.get('/api/auth/public/settings');
                if (res.data) {
                    setSettings({
                        announcementEnabled: !!res.data.announcementEnabled,
                        announcementText: res.data.announcementText || '',
                        announcementType: res.data.announcementType || 'info'
                    });
                }
            } catch (err) {
                // Ignore silent errors
            }
        };
        fetchSettings();
    }, []);

    if (!settings || !settings.announcementEnabled || !settings.announcementText.trim()) {
        return null;
    }

    const typeStyles = {
        info: 'bg-blue-600/90 border-blue-400/30 text-blue-100 shadow-blue-900/40',
        warning: 'bg-amber-600/90 border-amber-400/30 text-amber-100 shadow-amber-900/40',
        error: 'bg-red-600/90 border-red-400/30 text-red-100 shadow-red-900/40',
        success: 'bg-emerald-600/90 border-emerald-400/30 text-emerald-100 shadow-emerald-900/40'
    };

    const icons = {
        info: <Info className="w-4 h-4 text-blue-200 shrink-0" />,
        warning: <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />,
        error: <AlertCircle className="w-4 h-4 text-red-200 shrink-0" />,
        success: <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
    };

    return (
        <div className={`w-full py-2.5 px-4 border-b backdrop-blur-md shadow-lg transition-all duration-300 relative z-50 ${typeStyles[settings.announcementType] || typeStyles.info}`}>
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2.5 text-xs sm:text-sm font-medium text-center">
                {icons[settings.announcementType] || icons.info}
                <span>{settings.announcementText}</span>
            </div>
        </div>
    );
};

export default AnnouncementBanner;
