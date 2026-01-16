import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCookieConsent } from '../context/CookieConsentContext';
import { X, Settings, Check } from 'lucide-react';
import clsx from 'clsx';

const CookieBanner: React.FC = () => {
    const { bannerVisible, acceptAll, rejectAll, updateConsent, consent } = useCookieConsent();
    const [showSettings, setShowSettings] = useState(false);

    // Local state for the settings modal
    const [tempConsent, setTempConsent] = useState({
        analytics: consent?.analytics || false
    });

    const handleSaveSettings = () => {
        updateConsent({
            necessary: true,
            analytics: tempConsent.analytics
        });
        setShowSettings(false);
    };

    const handleCustomize = () => {
        setTempConsent({
            analytics: consent?.analytics || false
        });
        setShowSettings(true);
    };

    return (
        <>
            <AnimatePresence>
                {bannerVisible && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed bottom-0 left-0 right-0 z-[100] bg-[#111] border-t-4 border-[#333] shadow-[0_-4px_20px_rgba(0,0,0,0.8)]"
                    >
                        {/* Main Container */}
                        <div className="max-w-7xl mx-auto px-4 py-4 md:py-0">

                            {/* Wrapper for Flex Behavior */}
                            <div className="w-full">

                                {/* MOBILE LAYOUT - UNCHANGED */}
                                <div className="flex flex-col md:hidden w-full pb-4 px-4">
                                    <div className="flex flex-row items-center gap-4">
                                        {/* Image */}
                                        <div className="w-20 h-20 shrink-0 relative">
                                            <img
                                                src="/images/cookie.webp"
                                                alt="Cookie"
                                                className="w-full h-full object-contain drop-shadow-2xl"
                                            />
                                        </div>
                                        {/* Text */}
                                        <div className="flex flex-col items-start gap-2">
                                            <h2 className="text-xl font-black text-white uppercase tracking-tighter drop-shadow-sm font-minecraft leading-none">
                                                Держи печеньку!
                                            </h2>
                                            <p className="text-[#888] font-medium text-xs leading-snug text-left">
                                                Мы используем куки (cookies) для улучшения работы сайта и аналитики.
                                                Вы можете принять все, отклонить все или настроить их.
                                            </p>
                                        </div>
                                    </div>
                                    {/* Buttons */}
                                    <div className="mt-4 flex flex-col gap-2 w-full">
                                        <div className="flex gap-2 w-full">
                                            <button
                                                onClick={handleCustomize}
                                                className="flex-1 px-3 py-2 border-2 border-[#444] hover:bg-[#222] text-gray-300 rounded-lg font-bold transition-all text-xs text-center"
                                            >
                                                Настроить
                                            </button>
                                            <button
                                                onClick={rejectAll}
                                                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold text-white transition-all shadow-lg hover:shadow-red-600/50 text-xs text-center whitespace-nowrap"
                                            >
                                                Отклонить все
                                            </button>
                                        </div>
                                        <button
                                            onClick={acceptAll}
                                            className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white transition-all shadow-lg hover:shadow-green-600/50 flex items-center justify-center gap-2 text-xs"
                                        >
                                            <Check size={16} />
                                            Принять все
                                        </button>
                                    </div>
                                </div>

                                {/* DESKTOP LAYOUT - CENTERED, IMAGE FLUSH BOTTOM */}
                                <div className="hidden md:flex flex-row items-end justify-center gap-10 max-w-6xl mx-auto">
                                    {/* Image - Flush at bottom with negative margin to "pop out" */}
                                    <div className="w-80 h-80 shrink-0 relative md:-mb-12">
                                        <img
                                            src="/images/cookie.webp"
                                            alt="Cookie"
                                            className="w-full h-full object-contain drop-shadow-2xl"
                                        />
                                    </div>

                                    {/* Content Column - Centered vertically mostly, but respecting bottom alignment */}
                                    <div className="flex flex-col items-start pb-8">
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-sm font-minecraft leading-none mb-4">
                                            Держи печеньку!
                                        </h2>
                                        <p className="text-[#888] font-medium text-base leading-snug max-w-xl text-left mb-6">
                                            Мы используем куки (cookies) для улучшения работы сайта и аналитики.
                                            Вы можете принять все, отклонить все или настроить их.
                                        </p>

                                        <div className="flex flex-row gap-4">
                                            <button
                                                onClick={handleCustomize}
                                                className="px-6 py-3 border-2 border-[#444] hover:bg-[#222] text-gray-300 rounded-xl font-bold transition-all text-base"
                                            >
                                                Настроить
                                            </button>
                                            <button
                                                onClick={rejectAll}
                                                className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-red-600/50 text-base"
                                            >
                                                Отклонить все
                                            </button>
                                            <button
                                                onClick={acceptAll}
                                                className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-green-600/50 flex items-center justify-center gap-2 text-base"
                                            >
                                                <Check size={20} />
                                                Принять все
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSettings && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowSettings(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-lg bg-[#111] border-4 border-[#333] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
                        >
                            <div className="p-6 border-b-4 border-[#333] flex justify-between items-center bg-[#1a1a1a]">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2 font-minecraft text-2xl tracking-tight">
                                    <Settings className="w-6 h-6 text-story-gold" />
                                    Настройки печенек
                                </h3>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="p-2 hover:bg-[#333] rounded-lg transition-colors border-2 border-transparent hover:border-[#444]"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 bg-[#111]">
                                {/* Essential */}
                                <div className="flex items-start justify-between gap-4 p-4 bg-[#0a0a0a] rounded-xl border-2 border-[#222]">
                                    <div>
                                        <div className="font-bold text-white mb-1 font-minecraft text-lg">Технические</div>
                                        <div className="text-sm text-gray-400 leading-relaxed">Необходимы для работы сайта. Нельзя выключить.</div>
                                    </div>
                                    <div className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-green-900/40 transition-colors">
                                        <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white/30 shadow ring-0" />
                                    </div>
                                </div>

                                {/* Analytics */}
                                <div className="flex items-start justify-between gap-4 p-4 bg-[#0a0a0a] rounded-xl border-2 border-[#222]">
                                    <div>
                                        <div className="font-bold text-white mb-1 font-minecraft text-lg">Аналитика</div>
                                        <div className="text-sm text-gray-400 leading-relaxed">Помогают нам понять, как вы используете сайт, чтобы сделать его лучше.</div>
                                    </div>
                                    <button
                                        onClick={() => setTempConsent(prev => ({ ...prev, analytics: !prev.analytics }))}
                                        className={clsx(
                                            tempConsent.analytics ? 'bg-green-600' : 'bg-gray-800',
                                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                                        )}
                                    >
                                        <span
                                            className={clsx(
                                                tempConsent.analytics ? 'translate-x-5' : 'translate-x-0',
                                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                                            )}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 border-t-4 border-[#333] bg-[#1a1a1a] flex justify-end gap-3">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="px-6 py-2 rounded-xl border-2 border-[#444] hover:bg-[#333] text-gray-300 transition-colors font-bold"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleSaveSettings}
                                    className="px-8 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-all shadow-lg hover:shadow-green-600/50"
                                >
                                    Сохранить
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default CookieBanner;
