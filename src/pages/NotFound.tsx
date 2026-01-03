import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle, Compass } from 'lucide-react';

const NotFound: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#050505] text-white">
            {/* Background Glitch Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 text-center px-4">
                {/* Glitchy 404 Text */}
                <div className="relative inline-block mb-4">
                    <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-tighter select-none relative">
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-600 relative z-10">
                            404
                        </span>
                        {/* Glitch Layers */}
                        <span className="absolute top-0 left-0 -ml-1 text-red-500 opacity-70 animate-pulse" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)', transform: 'translate(-2px, 2px)' }}>404</span>
                        <span className="absolute top-0 left-0 ml-1 text-blue-500 opacity-70 animate-pulse" style={{ clipPath: 'polygon(0 80%, 100% 20%, 100% 100%, 0 100%)', transform: 'translate(2px, -2px)', animationDelay: '0.1s' }}>404</span>
                    </h1>
                </div>

                {/* Subtitle */}
                <div className="flex items-center justify-center gap-3 mb-8 text-red-400 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20 mx-auto w-fit animate-bounce">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-mono font-bold tracking-wider">CHUNK_LOAD_ERROR</span>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-200">
                    Вы зашли слишком далеко...
                </h2>
                <p className="text-gray-400 max-w-md mx-auto mb-12 leading-relaxed">
                    Похоже, эта территория еще не сгенерирована или была удалена Херобрином. Лучше вернуться в безопасную зону.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        to="/"
                        className="group relative px-8 py-4 bg-white text-black font-bold rounded-xl overflow-hidden transition-transform hover:scale-105 active:scale-95"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-story-gold to-legends-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative flex items-center gap-2">
                            <Home className="w-5 h-5" />
                            <span>Вернуться на спавн</span>
                        </div>
                    </Link>

                    <Link
                        to="/history"
                        className="px-8 py-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2 text-gray-300 hover:text-white"
                    >
                        <Compass className="w-5 h-5" />
                        <span>Исследовать историю</span>
                    </Link>
                </div>
            </div>

            {/* Code Decor */}
            <div className="absolute bottom-8 left-0 right-0 text-center opacity-20 font-mono text-xs pointer-events-none">
                <p>Error: Dimension not found at coordinates [NaN, NaN, NaN]</p>
                <p>System.out.println("Please contact administrator lendspele_");</p>
            </div>
        </div>
    );
};

export default NotFound;
