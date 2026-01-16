import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Loader from '../components/ui/Loader';
import { Crown, Youtube, Twitch, Trophy, Star, Gamepad2, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LinkItem {
    name: string;
    url: string;
}

interface GloryItem {
    name: string;
    image: string;
    description: string;
    links: LinkItem[];
    Discrod?: string;
    Discord?: string; // Handle potential typo fix in JSON
}

interface GloryData {
    [key: string]: GloryItem[];
}

const sectionTitles: { [key: string]: string } = {
    Legends: "Легенды",
    ContenMakers: "Контент-мейкеры",
    Staff: "Команда проекта"
};

const sectionIcons: { [key: string]: any } = {
    Legends: Crown,
    ContenMakers: Youtube,
    Staff: Gamepad2
};

const GloryList = () => {
    const [data, setData] = useState<GloryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

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
                <div className="absolute top-24 left-4 md:left-0 md:top-24">
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
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/20 blur-[100px] rounded-full -z-10" />
                    <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6 animate-pulse-slow" />
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-yellow-400 via-white to-yellow-600 bg-clip-text text-transparent drop-shadow-lg">
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
                    const Icon = sectionIcons[sectionKey] || Star;

                    return (
                        <div key={sectionKey} className="mb-20">
                            <div className="flex items-center gap-4 mb-10 justify-center">
                                <Icon className="w-8 h-8 text-story-gold" />
                                <h2 className="text-3xl md:text-4xl font-bold text-white relative">
                                    {title}
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-story-gold to-transparent opacity-50" />
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                                {items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center overflow-hidden"
                                    >
                                        {/* Glowing effect on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-story-gold/0 via-story-gold/0 to-story-gold/0 group-hover:from-story-gold/5 group-hover:to-purple-500/5 transition-all duration-500" />

                                        <div className="relative w-32 h-32 mb-6 rounded-full p-1 bg-gradient-to-br from-story-gold via-white/50 to-legends-blue">
                                            <div className="w-full h-full rounded-full overflow-hidden bg-transparent">
                                                <img
                                                    src={`/glorylist/skins/${item.image}`}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${item.name}&background=random`;
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-bold text-white mb-2 relative z-10">{item.name}</h3>
                                        <p className="text-gray-300 text-sm mb-6 flex-grow relative z-10">{item.description}</p>

                                        <div className="flex gap-3 relative z-10 mt-auto">
                                            {item.links && item.links.map((link, i) => (
                                                <a
                                                    key={i}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-full bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
                                                    title={link.name}
                                                >
                                                    {link.name.toLowerCase() === 'youtube' ? <Youtube className="w-5 h-5" /> :
                                                        link.name.toLowerCase() === 'twitch' ? <Twitch className="w-5 h-5" /> :
                                                            <Star className="w-5 h-5" />}
                                                </a>
                                            ))}
                                            {(item.Discrod || item.Discord) && (
                                                <a
                                                    href={item.Discrod || item.Discord}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-full bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
                                                    title="Discord"
                                                >
                                                    <Gamepad2 className="w-5 h-5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Layout>
    );
};

export default GloryList;
