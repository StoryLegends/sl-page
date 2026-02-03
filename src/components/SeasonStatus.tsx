
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
        ping: "bg-green-400"
    },
    closed: {
        icon: Lock,
        header: "Сервер закрыт",
        color: "text-red-400",
        glow: "bg-red-500/40",
        border: "border-red-500/30",
        badge: "bg-red-500/10 text-red-300",
        ping: "bg-red-400"
    },
    announced: {
        icon: Megaphone,
        header: "Сезон анонсирован!",
        color: "text-blue-400",
        glow: "bg-blue-500/40",
        border: "border-blue-500/30",
        badge: "bg-blue-500/10 text-blue-300",
        ping: "bg-blue-400"
    },
    soon: {
        icon: Clock,
        header: "Скоро открытие!",
        color: "text-yellow-400",
        glow: "bg-yellow-500/40",
        border: "border-yellow-500/30",
        badge: "bg-yellow-500/10 text-yellow-300",
        ping: "bg-yellow-400"
    }
};

const SeasonStatus = () => {
    const { status, title, description, date } = serverStatus;
    const config = StatusConfig[status];
    const Icon = config.icon;

    return (
        <div className="max-w-5xl mx-auto px-4 md:px-6 mb-24 relative z-20">
            <div
                className="w-full"
            >
                {/* Background Glow - Stronger and larger */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] ${config.glow} blur-[100px] pointer-events-none rounded-full transition-colors duration-500`} />

                <div className={`relative overflow-hidden rounded-[2rem] border ${config.border} bg-[#050505]/40 backdrop-blur-md shadow-2xl group`}>

                    {/* Inner Content */}
                    <div className="relative p-8 md:px-16 md:py-10 flex flex-col items-center text-center gap-6">

                        {/* Status Label - Glowing Text */}
                        <div className={`inline-flex items-center gap-3 mb-4`}>
                            <span className="relative flex h-3 w-3">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.ping}`}></span>
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${config.ping}`}></span>
                            </span>
                            <span className={`text-xl font-bold uppercase tracking-widest ${config.color} drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]`}>{config.header}</span>
                        </div>

                        {/* Icon Container - Square with glow */}
                        <div className={`relative group-hover:scale-110 transition-transform duration-500`}>
                            <div className={`absolute inset-0 ${config.glow} blur-2xl rounded-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500`}></div>
                            <Icon className={`relative z-10 w-16 h-16 md:w-20 md:h-20 ${config.color} drop-shadow-[0_0_20px_currentColor]`} />
                        </div>

                        {/* Text Content */}
                        <div className="space-y-4 max-w-3xl">
                            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight font-minecraft tracking-tight drop-shadow-lg">
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
