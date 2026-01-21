import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Loader from '../components/ui/Loader';
import { Crown, Youtube, Twitch, Trophy, Gamepad2, ChevronLeft, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const DiscordIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.921 13.921 0 0 0-.64 1.314 18.288 18.288 0 0 0-5.426 0 14.172 14.172 0 0 0-.64-1.314.076.076 0 0 0-.08-.037 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" />
    </svg>
);

interface LinkItem {
    name: string;
    url: string;
}

interface GloryItem {
    name: string;
    image: string;
    description: string;
    details?: string;
    links: LinkItem[];
    Discrod?: string;
    Discord?: string;
}

interface GloryData {
    [key: string]: GloryItem[];
}

const sectionTitles: { [key: string]: string } = {
    Legends: "Легенды",
    ContenMakers: "Контент-мейкеры",
    Staff: "Команда проекта"
};

const sectionConfig: { [key: string]: { icon: any, color: string, border: string, bg: string, text: string, gradientMiddle: string, pillBg: string, pillText: string } } = {
    Legends: {
        icon: Crown,
        color: "text-story-gold",
        border: "border-story-gold/30",
        bg: "from-yellow-900/20",
        text: "text-story-gold",
        gradientMiddle: "via-story-gold",
        pillBg: "bg-yellow-500/10",
        pillText: "text-yellow-300"
    },
    ContenMakers: {
        icon: Youtube,
        color: "text-red-400",
        border: "border-red-500/30",
        bg: "from-red-900/20",
        text: "text-red-400",
        gradientMiddle: "via-red-500",
        pillBg: "bg-red-500/10",
        pillText: "text-red-300"
    },
    Staff: {
        icon: Gamepad2,
        color: "text-purple-400",
        border: "border-purple-500/30",
        bg: "from-purple-900/20",
        text: "text-purple-400",
        gradientMiddle: "via-purple-500",
        pillBg: "bg-purple-500/10",
        pillText: "text-purple-300"
    }
};

const ModalInner = ({ item, theme, onClose }: { item: GloryItem, theme: any, onClose: () => void }) => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/90 touch-none"
                onClick={onClose}
            />

            {/* Modal Content */}
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative w-full max-w-4xl bg-[#0a0a0a] rounded-3xl border border-white/10 shadow-xl overflow-hidden flex flex-col md:flex-row z-10 will-change-transform"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-white/20 transition-all"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Left Side - Image and Links */}
                <div className={`relative w-full md:w-5/12 bg-gradient-to-br ${theme.bg} to-black flex flex-col items-center justify-center p-6 gap-6 border-r border-white/5 touch-none select-none`}>
                    <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay pointer-events-none"></div>

                    {/* Image */}
                    <div className="relative h-48 md:h-64 w-full flex items-center justify-center">
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            src={`/glorylist/skins/${item.image}`}
                            alt={item.name}
                            decoding="async"
                            className="h-full w-auto object-contain hover:scale-105 transition-transform duration-300"
                            style={{ maskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)' }}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${item.name}&background=random`;
                            }}
                        />
                    </div>

                    {/* Links */}
                    {(item.links?.length > 0 || item.Discrod || item.Discord) && (
                        <div className="w-full relative z-10 flex flex-col items-center gap-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                                {item.links?.map((link, i) => (
                                    <a
                                        key={i}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group w-full"
                                    >
                                        {link.name.toLowerCase() === 'youtube' ? <Youtube className="w-4 h-4 text-red-500" /> :
                                            link.name.toLowerCase() === 'twitch' ? <Twitch className="w-4 h-4 text-purple-500" /> :
                                                <ExternalLink className="w-4 h-4 text-gray-400" />}
                                        <span className="text-gray-300 group-hover:text-white font-medium text-sm truncate">{link.name}</span>
                                    </a>
                                ))}

                                {/* Discord Copy/Link */}
                                {(item.Discrod || item.Discord) && (
                                    <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20 text-[#5865F2] w-full ${(!item.links || item.links.length === 0) ? 'col-span-1 sm:col-span-2' : ''}`}>
                                        <DiscordIcon className="w-4 h-4 flex-shrink-0" />
                                        <span className="font-medium text-sm truncate">{item.Discrod || item.Discord}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side - Content */}
                <div className="flex-1 p-6 md:p-12 flex flex-col relative overflow-y-auto max-h-[50vh] md:max-h-[80vh] overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs md:text-sm text-gray-400 mb-4">
                            <theme.icon className={`w-3 h-3 md:w-4 md:h-4 ${theme.color}`} />
                            <span className="opacity-80">Профиль игрока</span>
                        </div>
                        <h2 className={`text-2xl md:text-4xl font-bold text-white mb-2 ${theme.color} bg-clip-text`}>{item.name}</h2>
                        <p className="text-base md:text-xl text-gray-300 font-medium border-l-2 border-white/20 pl-4">{item.description}</p>
                    </div>

                    {/* Details / Lore */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-6 flex-grow"
                    >

                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                            <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-3">Информация</h3>
                            <p className="text-gray-300 leading-relaxed text-lg">
                                {item.details || "Дополнительная информация отсутствует для этого легендарного героя. Но его дела говорят сами за себя."}
                            </p>
                        </div>


                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const CharacterModal = ({ item, onClose, theme }: { item?: GloryItem | null, onClose: () => void, theme?: any }) => {
    return createPortal(
        <AnimatePresence>
            {item && theme && (
                <ModalInner key="modal-inner" item={item} theme={theme} onClose={onClose} />
            )}
        </AnimatePresence>,
        document.body
    );
};

const GloryList = () => {
    const [data, setData] = useState<GloryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExiting, setIsExiting] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{ item: GloryItem, sectionKey: string } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/glorylist/list.json');
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error('Failed to load glory list', error);
            } finally {
                setIsExiting(true);
                setTimeout(() => {
                    setLoading(false);
                }, 500);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Layout>
                <div className={`min-h-screen flex items-center justify-center transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
                    <Loader />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto relative">
                {/* Back Button */}
                <div className="absolute top-24 left-4 md:left-0 md:top-24 z-10">
                    <Link
                        to="/about"
                        className="inline-flex items-center text-white/80 hover:text-white glass px-4 py-2 rounded-full transition-all hover:scale-105 mb-12 group"
                    >
                        <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium inline">Назад</span>
                    </Link>
                </div>

                {/* Header Section */}
                <div className="text-center mb-16 relative mt-16 md:mt-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-story-gold/20 blur-[100px] rounded-full -z-10" />
                    <Trophy className="w-20 h-20 text-story-gold mx-auto mb-6 animate-pulse-slow" />
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-story-gold via-white to-legends-blue bg-clip-text text-transparent drop-shadow-lg">
                        Зал Славы
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Те, кто навсегда вписал своё имя в историю StoryLegends.
                    </p>
                </div>

                {/* Content Sections */}
                {data && Object.keys(data).map((sectionKey) => {
                    const items = data[sectionKey];
                    if (!items || items.length === 0) return null;

                    const title = sectionTitles[sectionKey] || sectionKey;
                    const theme = sectionConfig[sectionKey] || sectionConfig['Legends'];
                    const Icon = theme.icon;

                    return (
                        <div key={sectionKey} className="mb-20">
                            <div className="flex items-center gap-4 mb-10 justify-center">
                                <Icon className={`w-8 h-8 ${theme.color}`} />
                                <h2 className="text-3xl md:text-4xl font-bold text-white relative">
                                    {title}
                                    <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent ${theme.gradientMiddle} to-transparent opacity-50`} />
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                                {items.map((item, index) => (
                                    <div
                                        key={index}
                                        onClick={() => setSelectedItem({ item, sectionKey })}
                                        className={`group relative p-6 rounded-2xl bg-gradient-to-br ${theme.bg} to-black border ${theme.border} backdrop-blur-sm cursor-pointer hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center overflow-hidden`}
                                    >

                                        {/* Image Container */}
                                        <div className="relative mb-6 h-48 w-full flex items-center justify-center">
                                            <img
                                                src={`/glorylist/skins/${item.image}`}
                                                alt={item.name}
                                                className="h-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500 relative z-0"
                                                style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${item.name}&background=random`;
                                                }}
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 w-full flex flex-col items-center relative z-20">
                                            <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center border ${theme.border}`}>
                                                <Icon className={`w-6 h-6 ${theme.color}`} />
                                            </div>

                                            <h3 className={`text-xl font-bold ${theme.text} mb-2 group-hover:text-white transition-colors`}>{item.name}</h3>
                                            <p className="text-gray-400 text-sm line-clamp-3 mb-4">{item.description}</p>

                                            {(item.Discrod || item.Discord) && (
                                                <div className={`mb-3 inline-block px-3 py-1 rounded-full ${theme.pillBg} ${theme.pillText} text-xs font-mono`}>
                                                    {item.Discrod || item.Discord}
                                                </div>
                                            )}
                                            <div className={`mt-auto py-2 px-4 rounded-full border ${theme.border} text-xs font-bold uppercase tracking-wider text-white/50 group-hover:bg-white/10 group-hover:text-white transition-all`}>
                                                Подробнее
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            <CharacterModal
                item={selectedItem?.item}
                onClose={() => setSelectedItem(null)}
                theme={selectedItem ? (sectionConfig[selectedItem.sectionKey] || sectionConfig['Legends']) : undefined}
            />
        </Layout>
    );
};

export default GloryList;
