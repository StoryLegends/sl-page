import React from 'react';

const Loader: React.FC = () => {
    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center relative z-50">
            <div className="relative w-24 h-24">
                {/* Outer Blue Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#00BFFF] border-r-[#00BFFF]/50 animate-spin" style={{ animationDuration: '1.5s' }} />

                {/* Inner Gold Ring */}
                <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-[#FFD700] border-l-[#FFD700]/50 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />

                {/* Center Glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FFD700]/20 to-[#00BFFF]/20 blur-xl animate-pulse" />

                {/* Center Static Dot/Logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-bounce" />
                </div>
            </div>

            {/* Loading Text */}
            <div className="mt-8 text-xl font-bold font-minecraft tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-story-gold via-white to-legends-blue animate-pulse">
                LOADING...
            </div>
        </div>
    );
};

export default Loader;
