import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle, Compass } from 'lucide-react';

const NotFound: React.FC = () => {
    const [displayText, setDisplayText] = React.useState('d3s');
    const [glitchState, setGlitchState] = React.useState<{ index: number | null, x: number, y: number }>({ index: null, x: 0, y: 0 });

    React.useEffect(() => {
        let iteration = 0;
        const target = '404';
        let glitchInterval: any;
        let teleportTimeout: any;

        // Initial Decrypt
        const decryptInterval = setInterval(() => {
            setDisplayText(prev =>
                prev.split('').map((_, index) => {
                    if (index < iteration) {
                        return target[index];
                    }
                    return String.fromCharCode(48 + Math.floor(Math.random() * 10));
                }).join('')
            );

            if (iteration >= target.length) {
                clearInterval(decryptInterval);
                setDisplayText(target);

                // Start Random Glitch Loop
                glitchInterval = setInterval(() => {
                    // Random character replacement (existing logic)
                    if (Math.random() > 0.7) {
                        const glitchText = target.split('').map((char) => {
                            if (Math.random() > 0.5) return String.fromCharCode(33 + Math.floor(Math.random() * 90));
                            return char;
                        }).join('');
                        setDisplayText(glitchText);
                        setTimeout(() => setDisplayText(target), 100 + Math.random() * 200);
                    }

                    // Teleporting Digit Logic
                    if (Math.random() > 0.6) {
                        const indexToGlitch = Math.floor(Math.random() * target.length);

                        // Sequence of jumps
                        const jumps = 3 + Math.floor(Math.random() * 3); // 3 to 5 jumps
                        let currentJump = 0;

                        const doJump = () => {
                            if (currentJump >= jumps) {
                                setGlitchState({ index: null, x: 0, y: 0 });
                                return;
                            }

                            setGlitchState({
                                index: indexToGlitch,
                                x: Math.random() * 90, // 0-90% width
                                y: Math.random() * 90  // 0-90% height
                            });

                            currentJump++;
                            teleportTimeout = setTimeout(doJump, 50 + Math.random() * 50); // 50-100ms per jump
                        };

                        doJump();
                    }
                }, 2000);
            }

            iteration += 1 / 3;
        }, 50);

        return () => {
            clearInterval(decryptInterval);
            if (glitchInterval) clearInterval(glitchInterval);
            if (teleportTimeout) clearTimeout(teleportTimeout);
        };
    }, []);

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
                <div className="relative inline-block mb-4 font-minecraft">
                    <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-tighter select-none relative text-white flex justify-center">
                        <span className="relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] flex">
                            {displayText.split('').map((char, i) => (
                                <span key={i} style={{ opacity: glitchState.index === i ? 0 : 1 }}>
                                    {char}
                                </span>
                            ))}
                        </span>

                        {/* White Glitch Layers (Static Jitter) */}
                        <span className="absolute top-0 left-0 -ml-1 text-white/50 animate-glitch-jitter" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)', transform: 'translate(-2px, 2px)' }}>{displayText}</span>
                        <span className="absolute top-0 left-0 ml-1 text-white/50 animate-glitch-jitter" style={{ clipPath: 'polygon(0 80%, 100% 20%, 100% 100%, 0 100%)', transform: 'translate(2px, -2px)', animationDelay: '0.1s' }}>{displayText}</span>
                    </h1>
                </div>

                {/* Teleporting Ghost Digit */}
                {glitchState.index !== null && (
                    <div
                        className="fixed text-white font-minecraft font-black text-[100px] md:text-[150px] pointer-events-none z-50 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                        style={{
                            top: `${glitchState.y}%`,
                            left: `${glitchState.x}%`,
                            opacity: 0.8
                        }}
                    >
                        {displayText[glitchState.index]}
                    </div>
                )}

                {/* Subtitle */}
                <div className="flex items-center justify-center gap-3 mb-8 text-red-400 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20 mx-auto w-fit animate-glitch-jitter">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-mono font-bold tracking-wider">Похоже, вы потерялись...</span>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-200">
                    Добро пожаловать в пустоты...
                </h2>
                <p className="text-gray-400 max-w-md mx-auto mb-12 leading-relaxed">
                    Это не ваш мир, вернитесь пока никто не заметил...
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

            {/* Floating Characters */}
            <div className="absolute top-[500px] left-2 w-20 md:top-[60%] md:left-[10%] md:w-40 animate-float opacity-80 pointer-events-none">
                <img
                    src="/images/angel.png"
                    alt="Angel"
                    className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                />
            </div>

            <div className="absolute top-5 right-2 w-32 md:top-[0%] md:right-[15%] md:w-96 animate-float opacity-80 pointer-events-none" style={{ animationDelay: '2s' }}>
                <img
                    src="/images/datapeice_full.png"
                    alt="Datapeice"
                    className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(255,0,0,0.3)] -rotate-12"
                />
            </div>

            {/* Code Decor */}
            <div className="absolute bottom-8 left-0 right-0 text-center opacity-20 font-mono text-xs pointer-events-none">
                <p>Error: Dimension not found at coordinates [NaN, NaN, NaN]</p>
                <p>System.out.println("Please contact administrator datapeice or lendspele_");</p>
            </div>
        </div>
    );
};

export default NotFound;
