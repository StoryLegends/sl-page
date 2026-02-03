
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
        <div className="max-w-4xl mx-auto px-4 md:px-6 mb-32 relative z-20">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="w-full"
            >
                {/* Glow Effect */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[500px] bg-gradient-to-r ${config.bg} to-transparent blur-[80px] opacity-40 pointer-events-none rounded-full`} />

                <div className={`relative overflow-hidden rounded-[2rem] border ${config.border} bg-[#0a0a0a]/80 backdrop-blur-xl shadow-2xl group transition-all duration-500 hover:shadow-[0_0_50px_rgba(0,0,0,0.5)]`}>
                    {/* Dynamic Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${config.bg} via-transparent to-transparent opacity-30 group-hover:opacity-50 transition-opacity duration-500`} />

                    <div className="relative p-8 md:p-10 flex flex-col items-center text-center gap-6">

                        {/* Status Label */}
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${config.badge} border ${config.border} backdrop-blur-md shadow-lg`}>
                            <span className="w-2 h-2 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor]" />
                            <span className="text-sm font-bold uppercase tracking-widest">{config.header}</span>
                        </div>

                        {/* Icon */}
                        <div className={`p-5 rounded-3xl ${config.badge} bg-opacity-20 backdrop-blur-sm border ${config.border} shadow-[0_0_40px_rgba(0,0,0,0.2)] group-hover:scale-110 transition-transform duration-500 group-hover:rotate-3`}>
                            <Icon className={`w-12 h-12 ${config.color} drop-shadow-[0_0_10px_currentColor]`} />
                        </div>

                        {/* Content */}
                        <div className="space-y-4 max-w-2xl">
                            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight font-minecraft drop-shadow-xl bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                                {title}
                            </h2>
                            <p className="text-gray-300 text-lg leading-relaxed font-medium">
                                {description}
                            </p>
                        </div>

                        {/* Date / Footer Info */}
                        {date && (
                            <div className="pt-4 mt-2 border-t border-white/10 w-full max-w-xs mx-auto">
                                <span className={`text-sm font-mono flex items-center justify-center gap-2 ${config.color} opacity-80`}>
                                    <Clock className="w-4 h-4" />
                                    {date}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SeasonStatus;
