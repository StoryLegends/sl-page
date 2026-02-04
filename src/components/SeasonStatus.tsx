
import { serverStatus } from '../config/serverStatus';
import { PlayCircle, Lock, Megaphone, Clock } from 'lucide-react';

const StatusConfig = {
    active: {
        icon: PlayCircle,
        header: "Сезон активен!",
        color: "text-green-400",
        glow: "bg-green-500/40",
        border: "border-green-500/30",
        badge: "bg-green-500/10 text-green-300",
        ping: "bg-green-400",
        hoverColor: "group-hover:bg-green-400"
    },
    closed: {
        icon: Lock,
        header: "Сервер закрыт",
        color: "text-red-400",
        glow: "bg-red-500/40",
        border: "border-red-500/30",
        badge: "bg-red-500/10 text-red-300",
        ping: "bg-red-400",
        hoverColor: "group-hover:bg-red-400"
    },
    announced: {
        icon: Megaphone,
        header: "Сезон анонсирован!",
        color: "text-blue-400",
        glow: "bg-blue-500/40",
        border: "border-blue-500/30",
        badge: "bg-blue-500/10 text-blue-300",
        ping: "bg-blue-400",
        hoverColor: "group-hover:bg-blue-400"
    },
    soon: {
        icon: Clock,
        header: "Скоро открытие!",
        color: "text-yellow-400",
        glow: "bg-yellow-500/40",
        border: "border-yellow-500/30",
        badge: "bg-yellow-500/10 text-yellow-300",
        ping: "bg-yellow-400",
        hoverColor: "group-hover:bg-yellow-400"
    }
};

const SeasonStatus = () => {
    const { status, title, description, date } = serverStatus;
    const config = StatusConfig[status];
    const Icon = config.icon;

    return (
        <div className="max-w-5xl mx-auto px-4 md:px-6 mb-24 relative z-20">
            <div className="w-full relative">
                {/* Background Glow - Replaced heavy 'blur' filter with 'radial-gradient' for better scroll performance */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                               w-[130%] h-[130%] md:w-[150%] md:h-[150%] 
                               pointer-events-none transform-gpu opacity-60 md:opacity-40"
                    style={{
                        background: `radial-gradient(circle, ${config.glow.replace('bg-', '').replace('/40', '')} 0%, transparent 70%)`,
                        filter: 'blur(30px)', // Minimal blur as fallback/booster
                        willChange: 'transform'
                    }}
                />

                <div className={`relative overflow-hidden rounded-[2rem] border ${config.border} bg-[#050505]/40 backdrop-blur-sm shadow-2xl group transform-gpu`}
                    style={{
                        transform: 'translate3d(0,0,0)',
                        backfaceVisibility: 'hidden'
                    }}>

                    {/* Inner Content */}
                    <div className="relative p-8 md:px-16 md:py-10 flex flex-col items-center text-center gap-6">

                        {/* Status Label - Glowing Text */}
                        <div className={`inline-flex items-center gap-3 mb-4`}>
                            <span className="relative flex h-3 w-3">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.ping}`}></span>
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${config.ping}`}></span>
                            </span>
                            <span className={`text-xl font-bold uppercase tracking-widest ${config.color}`}
                                style={{ textShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
                                {config.header}
                            </span>
                        </div>

                        {/* Icon Container - optimized glow */}
                        <div className={`relative group-hover:scale-110 transition-transform duration-500`}>
                            <div className="absolute inset-0 rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-500"
                                style={{
                                    background: `radial-gradient(circle, currentColor 0%, transparent 70%)`,
                                    filter: 'blur(15px)'
                                }} />
                            <Icon className={`relative z-10 w-16 h-16 md:w-20 md:h-20 ${config.color}`} />
                        </div>

                        {/* Text Content */}
                        <div className="space-y-4 max-w-3xl font-sans">
                            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight font-minecraft tracking-tight">
                                {title}
                            </h2>
                            <p className="text-gray-300 text-lg leading-relaxed font-medium">
                                {description}
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-2" />

                        {/* Date */}
                        {date && (
                            <span className={`text-sm font-mono flex items-center justify-center gap-2 ${config.color} opacity-90`}>
                                <Clock className="w-4 h-4" />
                                {date}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeasonStatus;
