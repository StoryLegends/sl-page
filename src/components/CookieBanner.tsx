import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

const CookieBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'true');
        setIsVisible(false);
    };

    const handleReject = () => {
        window.location.href = 'https://google.com';
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] flex flex-col md:flex-row items-center md:items-end justify-center gap-4 md:gap-12 p-1 pb-0 bg-[#111] border-t-4 border-[#333] shadow-[0_-4px_20px_rgba(0,0,0,0.8)] animate-[slide-up_0.5s_ease-out] ">
            {/* Image */}
            <div className="w-64 h-64 md:w-72 md:h-72 shrink-0 relative overflow-hidden md:-mb-10">
                <img
                    src="/images/cookie.webp"
                    alt="Cookie"
                    className="w-full h-full object-contain drop-shadow-2xl"
                />
                {/* Bottom fade layer - only at the very bottom edge */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#111] to-transparent pointer-events-none" />
            </div>

            {/* Text and Buttons */}
            <div className="flex flex-col items-center md:items-start gap-4 text-center md:text-left pb-8">
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter drop-shadow-sm font-minecraft">
                    Держи печеньку!
                </h2>
                <p className="text-[#888] font-medium max-w-xl text-sm md:text-base">
                    Мы используем куки (cookies) для улучшения работы сайта и аналитики. Продолжая использовать сайт, вы соглашаетесь с нашей политикой.
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                    <button
                        onClick={handleAccept}
                        className="flex items-center gap-2 px-8 py-3 bg-emerald-600/80 hover:bg-emerald-500 rounded-xl font-bold text-white transition-all hover:scale-105 shadow-lg hover:shadow-emerald-600/30 backdrop-blur-sm"
                    >
                        <Check size={20} />
                        Принять
                    </button>
                    <button
                        onClick={handleReject}
                        className="flex items-center gap-2 px-6 py-3 bg-rose-600/80 hover:bg-rose-500 rounded-xl font-bold text-white transition-all hover:scale-105 shadow-lg hover:shadow-rose-600/30 backdrop-blur-sm"
                    >
                        <X size={20} />
                        Покинуть сайт
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default CookieBanner;
