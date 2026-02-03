
import { serverStatus } from '../config/serverStatus';
import { PlayCircle, Lock, Megaphone, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const StatusConfig = {
    active: {
        icon: PlayCircle,
        header: "Сезон активен!",
        color: "text-green-400",
        bg: "from-green-500/20",
        border: "border-green-500/30",
        badge: "bg-green-500/10 text-green-300"
    },
    closed: {
        icon: Lock,
        header: "Сервер закрыт",
        color: "text-red-400",
        bg: "from-red-500/20",
        border: "border-red-500/30",
        badge: "bg-red-500/10 text-red-300"
    },
    announced: {
        icon: Megaphone,
        header: "Сезон анонсирован!",
        color: "text-blue-400",
        bg: "from-blue-500/20",
        border: "border-blue-500/30",
        badge: "bg-blue-500/10 text-blue-300"
    },
    soon: {
        icon: Clock,
        header: "Скоро открытие!",
        color: "text-yellow-400",
        bg: "from-yellow-500/20",
        border: "border-yellow-500/30",
        badge: "bg-yellow-500/10 text-yellow-300"
    }
};

const SeasonStatus = () => {
    const { status, title, description, date } = serverStatus;
    const config = StatusConfig[status];
    const Icon = config.icon;

    return (
        <div className="max-w-5xl mx-auto px-4 md:px-6 mb-24 relative z-20">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="w-full"
            >
                {/* Background Glow - Stronger and larger */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-${config.color.split('-')[1]}-500/20 blur-[100px] pointer-events-none rounded-full`} />

                <div className={`relative overflow-hidden rounded-[2rem] border ${config.border} bg-[#050505]/40 backdrop-blur-md shadow-2xl group`}>

                    {/* Inner Content */}
                    <div className="relative p-8 md:px-16 md:py-10 flex flex-col items-center text-center gap-6">

                        {/* Status Pill - Floating at top */}
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${config.badge} border ${config.border} backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.3)] mb-2`}>
                            <span className="relative flex h-2.5 w-2.5">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.color.replace('text-', 'bg-')}`}></span>
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.color.replace('text-', 'bg-')}`}></span>
                            </span>
                            <span className="text-sm font-bold uppercase tracking-widest">{config.header}</span>
                        </div>

                        {/* Icon Container - Square with glow */}
                        <div className={`relative group-hover:scale-110 transition-transform duration-500`}>
                            <div className={`absolute inset-0 ${config.bg} blur-xl rounded-2xl opacity-50`}></div>
                            <div className={`relative p-5 rounded-2xl bg-black/40 border ${config.border} backdrop-blur-sm`}>
                                <Icon className={`w-10 h-10 md:w-12 md:h-12 ${config.color} drop-shadow-[0_0_8px_currentColor]`} />
                            </div>
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
            </motion.div>
        </div>
    );
};

export default SeasonStatus;
