import { createPortal } from 'react-dom';
import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Monitor, Clock, Hourglass, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface PhotoObject {
    id: number;
    description: string;
}

type PhotoItem = number | PhotoObject;

const ImageCarousel = ({ photos, folderName, seasonName }: { photos: PhotoItem[], folderName: string, seasonName: string }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [selectedImage, setSelectedImage] = useState<PhotoItem | null>(null);

    const getPhotoId = (item: PhotoItem) => typeof item === 'number' ? item : item.id;
    const getPhotoDescription = (item: PhotoItem) => typeof item === 'number' ? null : item.description;

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            // Scroll by 1 image width + gap
            const itemWidth = container.firstElementChild?.clientWidth || 0;
            const scrollAmount = itemWidth ? itemWidth + 16 : container.clientWidth;
            const targetScroll = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);

            container.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedImage !== null) {
            const currentIndex = photos.indexOf(selectedImage);
            const nextIndex = (currentIndex + 1) % photos.length;
            setSelectedImage(photos[nextIndex]);
        }
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedImage !== null) {
            const currentIndex = photos.indexOf(selectedImage);
            const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
            setSelectedImage(photos[prevIndex]);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedImage === null) return;
            if (e.key === 'ArrowRight') {
                const currentIndex = photos.indexOf(selectedImage);
                const nextIndex = (currentIndex + 1) % photos.length;
                setSelectedImage(photos[nextIndex]);
            } else if (e.key === 'ArrowLeft') {
                const currentIndex = photos.indexOf(selectedImage);
                const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
                setSelectedImage(photos[prevIndex]);
            } else if (e.key === 'Escape') {
                setSelectedImage(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImage, photos]);

    useEffect(() => {
        if (selectedImage !== null) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedImage]);

    return (
        <>
            <div className="relative group">
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/80 text-white p-2 rounded-r-lg backdrop-blur-sm transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                    aria-label="Previous images"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>

                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/80 text-white p-2 rounded-l-lg backdrop-blur-sm transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                    aria-label="Next images"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>

                <div
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                >
                    {photos.map((photo, index) => {
                        const photoId = getPhotoId(photo);
                        return (
                            <div
                                key={index}
                                className="snap-start shrink-0 w-full md:w-[calc(50%-8px)] aspect-video rounded-lg overflow-hidden border border-white/10 bg-black/50 relative cursor-pointer"
                                onClick={() => setSelectedImage(photo)}
                            >
                                <img
                                    src={`/history/${folderName}/images/${photoId}.webp`}
                                    alt={`${seasonName} photo ${photoId}`}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Lightbox Modal - Portaled to body to avoid stacking context issues */}
            {selectedImage !== null && createPortal(
                <div
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]"
                    onClick={() => setSelectedImage(null)}
                >
                    {/* Close Button - Fixed to screen top-right */}
                    <button
                        className="fixed top-4 right-4 z-[10000] text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all backdrop-blur-md"
                        onClick={() => setSelectedImage(null)}
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Image Container - Centered in Viewport */}
                    <div className="absolute inset-0 flex items-center justify-center p-0 md:p-4 pointer-events-none">
                        <div
                            className="relative flex items-center justify-center w-full h-full pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Prev Button - Absolute Left */}
                            <button
                                className="absolute left-2 md:left-8 z-50 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 md:p-3 transition-all backdrop-blur-sm"
                                onClick={handlePrev}
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>

                            {/* Image */}
                            <img
                                key={getPhotoId(selectedImage)}
                                src={`/history/${folderName}/images/${getPhotoId(selectedImage)}.webp`}
                                alt={`${seasonName} full screen`}
                                className="max-w-full max-h-[100vh] md:max-h-[90vh] object-contain shadow-2xl animate-[zoom-in_0.3s_ease-out]"
                                style={{
                                    animation: 'zoom-in 0.3s ease-out forwards'
                                }}
                            />

                            {/* Next Button - Absolute Right */}
                            <button
                                className="absolute right-2 md:right-8 z-50 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 md:p-3 transition-all backdrop-blur-sm"
                                onClick={handleNext}
                                aria-label="Next image"
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </div>
                    </div>

                    {/* Description - Absolute Bottom */}
                    {getPhotoDescription(selectedImage) && (
                        <div className="absolute bottom-8 left-0 right-0 flex justify-center px-4 pointer-events-none">
                            <div
                                className="bg-black/60 backdrop-blur-md p-4 rounded-lg max-w-2xl text-center border border-white/10 animate-[fade-in_0.3s_ease-out_0.1s] opacity-0 pointer-events-auto"
                                style={{ animationFillMode: 'forwards' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <p className="text-white text-lg font-medium whitespace-pre-line">
                                    {getPhotoDescription(selectedImage)}
                                </p>
                            </div>
                        </div>
                    )}

                    <style>{`
                        @keyframes zoom-in {
                            0% { opacity: 0; transform: scale(0.95); }
                            100% { opacity: 1; transform: scale(1); }
                        }
                        @keyframes fade-in {
                            0% { opacity: 0; }
                            100% { opacity: 1; }
                        }
                    `}</style>
                </div>,
                document.body
            )}
        </>
    );
};

import Layout from '../components/Layout';
import GlassCard from '../components/ui/GlassCard';
import { MessageSquare, Download, PlayCircle, Map as MapIcon } from 'lucide-react';

interface SeasonFeatures {
    online: string;
    discord_online?: string;
    platform: string;
    work_time: string;
    runtime: string;
}

interface SeasonLogo {
    description: string;
    second_description: string;
    image: string;
}

interface SeasonVideo {
    description: string;
    url: string;
}

interface SeasonMap {
    description: string;
    url: string;
}

interface Season {
    name: string;
    date: string;
    s_description: string;
    features: SeasonFeatures;
    description: string;
    photos?: PhotoItem[];
    logo?: SeasonLogo;
    logos?: SeasonLogo[];
    video?: SeasonVideo;
    map?: SeasonMap;
}

interface HistoryDetails {
    id: string;
    name: string;
    date: string;
    description: string;
    seasons: (Season | string)[]; // Array of seasons or text separators
    photos: number[]; // Global photos if any (though user asked for per-season carousel, keeping for compatibility)
}

const HistoryDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [details, setDetails] = useState<HistoryDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [folderName, setFolderName] = useState<string>('');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // First, we need to find the folder name for this ID from the index
                const indexResponse = await fetch('/history-index.json');
                if (!indexResponse.ok) throw new Error('Failed to load history index');
                const indexData = await indexResponse.json();
                const item = indexData.find((i: any) => i.id === id);

                if (!item) {
                    throw new Error('History item not found');
                }

                setFolderName(item.path);

                const encodedPath = encodeURIComponent(item.path);
                console.log(`Fetching details from: /history/${encodedPath}/details.json`);
                const detailsResponse = await fetch(`/history/${encodedPath}/details.json`);
                if (!detailsResponse.ok) throw new Error('Failed to load details');
                const detailsData = await detailsResponse.json();
                setDetails(detailsData);
            } catch (err) {
                console.error(err);
                setError('Failed to load history details.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-white text-xl">Загрузка...</div>
                </div>
            </Layout>
        );
    }

    if (error || !details) {
        return (
            <Layout>
                <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                    <div className="text-red-400 text-xl">{error || 'История не найдена'}</div>
                    <Link to="/history" className="text-blue-400 hover:underline">Вернуться к списку</Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="pt-20 lg:pt-24 pb-8 lg:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                <Link
                    to="/history"
                    className="inline-flex items-center text-white hover:text-gray-300 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Назад к истории
                </Link>

                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-minecraft">
                        {details.name}
                    </h1>
                    <p className="text-gray-200 max-w-2xl mx-auto whitespace-pre-line">
                        {details.description}
                    </p>
                </div>

                <div className="space-y-16">
                    {details.seasons.map((value, index) => {
                        // Check if it's a text separator
                        if (typeof value === 'string') {
                            return (
                                <div key={index} className="relative py-8">
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="w-full border-t border-white/10"></div>
                                    </div>
                                    <div className="relative flex justify-center z-10">
                                        <span className="bg-[#050505] px-4 text-xl font-bold text-white font-minecraft">
                                            {value}
                                        </span>
                                    </div>
                                </div>
                            );
                        }

                        // It's a season object
                        const season = value as Season;
                        const logos = season.logos || (season.logo ? [season.logo] : []);

                        return (
                            <div key={index} className="space-y-8">
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold text-white mb-2 font-minecraft">{season.s_description}</h2>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Left Column Wrapper */}
                                    <div className="contents lg:flex lg:flex-col lg:gap-8">
                                        {/* Description Card (Mobile: 1) */}
                                        <div className="order-1">
                                            <GlassCard className="p-6">
                                                <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Описание</h3>
                                                <div className="text-gray-100 whitespace-pre-line leading-relaxed">
                                                    {season.description}
                                                </div>
                                            </GlassCard>
                                        </div>

                                        {/* Video Section (Mobile: 4) */}
                                        {season.video && (
                                            <div className="order-4">
                                                <GlassCard className="p-6">
                                                    <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                                                        <PlayCircle className="w-5 h-5 text-red-500" />
                                                        Видео
                                                    </h3>
                                                    <div className="text-gray-300 mb-4 whitespace-pre-line text-sm">
                                                        {season.video.description}
                                                    </div>
                                                    {season.video.url.includes('youtu') ? (
                                                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/50">
                                                            <iframe
                                                                src={`https://www.youtube.com/embed/${season.video.url.split('/').pop()}`}
                                                                title="YouTube video player"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                                className="absolute inset-0 w-full h-full"
                                                            ></iframe>
                                                        </div>
                                                    ) : (
                                                        <a
                                                            href={season.video.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                                                        >
                                                            Смотреть видео
                                                            <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                                                        </a>
                                                    )}
                                                </GlassCard>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column Wrapper */}
                                    <div className="contents lg:flex lg:flex-col lg:gap-8">
                                        {/* Features Card (Mobile: 2) */}
                                        <div className="order-2">
                                            <GlassCard className="p-6">
                                                <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Информация</h3>
                                                <div className="space-y-4">
                                                    <div className="flex items-start gap-3">
                                                        <Users className="w-5 h-5 text-blue-400 mt-1" />
                                                        <div>
                                                            <span className="text-gray-300 block text-sm">Онлайн</span>
                                                            <span className="text-white">{season.features.online}</span>
                                                        </div>
                                                    </div>
                                                    {season.features.discord_online && (
                                                        <div className="flex items-start gap-3">
                                                            <MessageSquare className="w-5 h-5 text-indigo-400 mt-1" />
                                                            <div>
                                                                <span className="text-gray-300 block text-sm">Discord</span>
                                                                <span className="text-white">{season.features.discord_online}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex items-start gap-3">
                                                        <Monitor className="w-5 h-5 text-purple-400 mt-1" />
                                                        <div>
                                                            <span className="text-gray-300 block text-sm">Платформа</span>
                                                            <span className="text-white">{season.features.platform}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <Clock className="w-5 h-5 text-green-400 mt-1" />
                                                        <div>
                                                            <span className="text-gray-300 block text-sm">Часы работы</span>
                                                            <span className="text-white">{season.features.work_time}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <Hourglass className="w-5 h-5 text-yellow-400 mt-1" />
                                                        <div>
                                                            <span className="text-gray-300 block text-sm">Продлился сервер</span>
                                                            <span className="text-white">{season.features.runtime}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </GlassCard>
                                        </div>

                                        {/* Logo Section (Mobile: 3) */}
                                        {logos.length > 0 && (
                                            <div className="order-3">
                                                <GlassCard className="p-6">
                                                    <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">
                                                        {logos.length > 1 ? 'Логотипы' : 'Логотип'}
                                                    </h3>
                                                    <div className={`grid grid-cols-1 ${logos.length > 1 ? 'gap-8' : ''}`}>
                                                        {logos.map((logo, logoIndex) => (
                                                            <div key={logoIndex} className="flex flex-col items-center text-center">
                                                                <div className="relative w-full">
                                                                    <img
                                                                        src={`/history/${folderName}/images/${logo.image}`}
                                                                        alt={`Season Logo ${logoIndex + 1}`}
                                                                        className="w-full h-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                                                    />
                                                                </div>
                                                                {(logo.description || logo.second_description) && (
                                                                    <div className="mt-4">
                                                                        {logo.description && <p className="text-white font-medium mb-1">{logo.description}</p>}
                                                                        {logo.second_description && <p className="text-gray-400 text-sm">{logo.second_description}</p>}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </GlassCard>
                                            </div>
                                        )}

                                        {/* Map Download Section (Mobile: 6) */}
                                        {season.map && (
                                            <div className="order-6">
                                                <GlassCard className="p-6">
                                                    <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                                                        <MapIcon className="w-5 h-5 text-green-500" />
                                                        Карта
                                                    </h3>
                                                    <div className="text-gray-300 mb-4 text-sm">
                                                        {season.map.description}
                                                    </div>
                                                    <a
                                                        href={season.map.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                                                    >
                                                        <Download className="w-4 h-4 mr-2" />
                                                        Скачать карту
                                                    </a>
                                                </GlassCard>
                                            </div>
                                        )}
                                    </div>

                                    {/* Carousel (Mobile: 5, Desktop: Bottom) */}
                                    {season.photos && season.photos.length > 0 && (
                                        <div className="order-5 lg:col-span-2">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/20"></div>
                                                <h3 className="text-2xl font-bold text-white font-minecraft text-center">Скриншоты сервера</h3>
                                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/20"></div>
                                            </div>
                                            <ImageCarousel
                                                photos={season.photos}
                                                folderName={folderName}
                                                seasonName={season.name}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Layout>
    );
};

export default HistoryDetail;
