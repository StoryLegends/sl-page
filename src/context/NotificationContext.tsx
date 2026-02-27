import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
    id: string;
    type: NotificationType;
    message: string;
}

interface NotificationContextType {
    showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications((prev) => [...prev, { id, type, message }]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div className="fixed top-12 left-4 right-4 sm:left-auto sm:right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none sm:max-w-md">
                <AnimatePresence mode="popLayout">
                    {notifications.map((n) => (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                            layout
                            className="pointer-events-auto"
                        >
                            <div className={`
                                relative overflow-hidden
                                flex items-start gap-3 p-3.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl
                                border
                                ${n.type === 'success' ? 'bg-[#064e3b]/80 text-green-300 border-green-500/30' :
                                    n.type === 'error' ? 'bg-[#7f1d1d]/80 text-red-300 border-red-500/30' :
                                        n.type === 'warning' ? 'bg-[#78350f]/80 text-story-gold border-story-gold/30' :
                                            'bg-[#1e1b4b]/80 text-blue-300 border-blue-500/30'}
                            `}>
                                {/* Inner glow */}
                                <div className={`absolute -inset-1 opacity-10 blur-2xl rounded-full ${n.type === 'success' ? 'bg-green-500' :
                                    n.type === 'error' ? 'bg-red-500' :
                                        n.type === 'warning' ? 'bg-story-gold' :
                                            'bg-blue-500'
                                    }`} />

                                <div className="flex-shrink-0 mt-0.5 relative z-10">
                                    {n.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
                                    {n.type === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
                                    {n.type === 'warning' && <AlertCircle className="w-5 h-5 text-story-gold" />}
                                    {n.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
                                </div>

                                <div className="flex-grow min-w-0 pr-6 relative z-10">
                                    <p className="text-sm font-semibold leading-relaxed break-words whitespace-pre-wrap tracking-wide">
                                        {n.message}
                                    </p>
                                </div>

                                <button
                                    onClick={() => removeNotification(n.id)}
                                    className="flex-shrink-0 hover:scale-110 transition-transform ml-auto relative z-20"
                                >
                                    <X className="w-4 h-4 opacity-40 hover:opacity-100 transition-opacity" />
                                </button>

                                {/* Progress bar */}
                                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-black/20">
                                    <motion.div
                                        initial={{ scaleX: 1 }}
                                        animate={{ scaleX: 0 }}
                                        transition={{ duration: 5, ease: 'linear' }}
                                        className={`h-full origin-left ${n.type === 'success' ? 'bg-green-400' :
                                            n.type === 'error' ? 'bg-red-400' :
                                                n.type === 'warning' ? 'bg-story-gold' :
                                                    'bg-blue-400'
                                            }`}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
