import { createPortal } from 'react-dom';
import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Monitor, Clock, Hourglass, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import Loader from '../components/ui/Loader';
import SEO from '../components/SEO';
import { historyApi } from '../api/history';

interface PhotoObject {
    id: number | string;
    description: string;
}

type PhotoItem = number | string | PhotoObject;

const folderPathMap: Record<string, string> = {
    '5': 'StoryLegends AF',
    '4': 'StoryLegends SL',
    '3': 'StoryModeMSM',
    '2': 'StoneSheild',
    '1': '2B2T'
};

const getRealFolderName = (folder: string) => folderPathMap[folder] || folder;

const ImageCarousel = ({ photos, folderName, seasonName }: { photos: PhotoItem[], folderName: string, seasonName: string }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [selectedImage, setSelectedImage] = useState<PhotoItem | null>(null);
    const [isClosing, setIsClosing] = useState(false);

    const getPhotoId = (item: PhotoItem): string | number => typeof item === 'object' ? item.id : item;
    const getPhotoDescription = (item: PhotoItem) => typeof item === 'object' ? item.description : null;
    const resolvePhotoUrl = (item: PhotoItem) => {
        const pid = getPhotoId(item);
        const s = String(pid);
        if (typeof pid === 'string' && (s.startsWith('http') || s.startsWith('/'))) {
            return s;
        }
        const realFolder = getRealFolderName(folderName);
        return `/history/${encodeURIComponent(realFolder)}/images/${pid}.webp`;
    };

    const handleCloseLightbox = () => {
        setIsClosing(true);
        setTimeout(() => {
            setSelectedImage(null);
            setIsClosing(false);
        }, 300);
    };

    const scroll = (direction: 'left' | 'right') => {
        // ... (existing scroll logic)
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
                        return (
                            <div
                                key={index}
                                className="snap-start shrink-0 w-full md:w-[calc(50%-8px)] aspect-video rounded-lg overflow-hidden border border-white/10 bg-black/50 relative cursor-pointer"
                                onClick={() => setSelectedImage(photo)}
                            >
                                <img
                                    src={resolvePhotoUrl(photo)}
                                    alt={`${seasonName} photo ${getPhotoId(photo)}`}
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

            {/* Lightbox Modal */}
            {selectedImage !== null && createPortal(
                <div
                    className={`fixed inset-0 z-[9999] bg-black/95 touch-none flex flex-col md:block items-center justify-center ${isClosing ? 'animate-[fade-out_0.3s_ease-out_forwards]' : 'animate-[fade-in_0.3s_ease-out]'}`}
                    onClick={handleCloseLightbox}
                >
                    {/* Image Container */}
                    <div
                        className="relative w-full h-[70vh] md:h-full flex items-center justify-center z-0 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <TransformWrapper
                            initialScale={1}
                            minScale={1}
                            maxScale={5}
                            centerOnInit
                            limitToBounds={true}
                            panning={{ velocityDisabled: true }}
                        >
                            <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                                <img
                                    key={getPhotoId(selectedImage)}
                                    src={resolvePhotoUrl(selectedImage)}
                                    alt={`${seasonName} full screen`}
                                    className="max-w-full max-h-full md:max-h-screen object-contain will-change-transform"
                                />
                            </TransformComponent>
                        </TransformWrapper>
                    </div>

                    {/* Mobile Controls Row */}
                    <div className="w-full px-4 mt-4 flex items-center justify-between gap-4 md:hidden z-[10001]" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors backdrop-blur-md border border-white/10 shrink-0"
                            onClick={(e) => { e.stopPropagation(); handlePrev(e); }}
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>

                        {getPhotoDescription(selectedImage) && (
                            <div className="flex-1 bg-black/50 p-3 rounded-xl border border-white/10 backdrop-blur-sm max-h-24 overflow-y-auto">
                                <p className="text-white text-sm font-medium text-center leading-relaxed">
                                    {getPhotoDescription(selectedImage)}
                                </p>
                            </div>
                        )}

                        <button
                            className="bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors backdrop-blur-md border border-white/10 shrink-0"
                            onClick={(e) => { e.stopPropagation(); handleNext(e); }}
                            aria-label="Next image"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Top Right Close Button */}
                    <div className="absolute top-4 right-4 z-[10001]">
                        <button
                            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors backdrop-blur-none"
                            onClick={(e) => { e.stopPropagation(); handleCloseLightbox(); }}
                            aria-label="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Desktop Navigation Arrows */}
                    <button
                        className="hidden md:block absolute left-[10%] top-1/2 -translate-y-1/2 z-[10001] bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all backdrop-blur-none"
                        onClick={(e) => { e.stopPropagation(); handlePrev(e); }}
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>

                    <button
                        className="hidden md:block absolute right-[10%] top-1/2 -translate-y-1/2 z-[10001] bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all backdrop-blur-none"
                        onClick={(e) => { e.stopPropagation(); handleNext(e); }}
                        aria-label="Next image"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>

                    {/* Desktop Description */}
                    {getPhotoDescription(selectedImage) && (
                        <div className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 z-[10001] w-[90%] max-w-2xl pointer-events-none">
                            <div className="bg-black/90 p-4 rounded-xl text-center border border-white/10 pointer-events-auto">
                                <p className="text-white text-lg font-medium whitespace-pre-line">
                                    {getPhotoDescription(selectedImage)}
                                </p>
                            </div>
                        </div>
                    )}

                    <style>{`
                        @keyframes fade-in {
                            0% { opacity: 0; }
                            100% { opacity: 1; }
                        }
                        @keyframes fade-out {
                            0% { opacity: 1; }
                            100% { opacity: 0; }
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
    map?: SeasonMap | SeasonMap[];
}

interface HistoryDetails {
    id: string;
    name: string;
    date: string;
    description: string;
    colors?: string[];
    seasons: (Season | string)[]; // Array of seasons or text separators
    photos: number[]; // Global photos if any (though user asked for per-season carousel, keeping for compatibility)
}

import { useAuth } from '../context/AuthContext';

const HistoryDetail = () => {
    const { id } = useParams<{ id: string }>();
    const { hasFeature, loading: authLoading } = useAuth();
    const [details, setDetails] = useState<HistoryDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [folderName, setFolderName] = useState<string>('');

    useEffect(() => {
        if (authLoading) return; // Wait until AuthContext finishes loading token and feature flags!

        const fetchDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                if (!id) throw new Error('No id');

                const useDbFirst = hasFeature('history');

                // Helper to load index and resolve folder name
                const getFolderName = async (): Promise<string> => {
                    let indexData: any[] = [];
                    try {
                        const indexRes = await fetch('/history-index.json');
                        const contentType = indexRes.headers.get('content-type') || '';
                        if (indexRes.ok && (contentType.includes('application/json') || contentType.includes('text/plain'))) {
                            indexData = await indexRes.json();
                        }
                    } catch {}
                    const indexItem = indexData.find((i: any) => i.id === id || i.path === id);
                    return indexItem?.path || id;
                };

                // Helper to fetch rich static details file safely
                const fetchFileDetails = async (folder: string) => {
                    try {
                        const detailsRes = await fetch(`/history/${encodeURIComponent(folder)}/details.json`);
                        const contentType = detailsRes.headers.get('content-type') || '';
                        if (detailsRes.ok && (contentType.includes('application/json') || contentType.includes('text/plain'))) {
                            const text = await detailsRes.text();
                            if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                                return JSON.parse(text);
                            }
                        }
                    } catch {}
                    return null;
                };

                if (useDbFirst) {
                    // --- FEATURE FLAG ENABLED: 100% DB ONLY (No static .json requests) ---
                    try {
                        const serverItem = await historyApi.getHistoryBySlug(id);
                        setFolderName(serverItem.pathSlug || String(serverItem.id));

                        let colors: string[] = [];
                        if (typeof serverItem.colorsJson === 'string') {
                            try { colors = JSON.parse(serverItem.colorsJson); } catch {}
                        }
                        if (colors.length === 0) colors = ['#34383b', '#728697'];

                        let parsedPhotos: any[] = [];
                        if (typeof serverItem.photosJson === 'string') {
                            try { parsedPhotos = JSON.parse(serverItem.photosJson); } catch {}
                        }

                        let parsedLogo: any = null;
                        if (typeof serverItem.logoJson === 'string') {
                            try { parsedLogo = JSON.parse(serverItem.logoJson); } catch {}
                        }

                        let parsedMaps: any[] = [];
                        if (typeof serverItem.mapsJson === 'string') {
                            try { parsedMaps = JSON.parse(serverItem.mapsJson); } catch {}
                        }

                        setDetails({
                            id: String(serverItem.id),
                            name: serverItem.title,
                            date: serverItem.eventDate || '',
                            description: serverItem.description || '',
                            colors,
                            seasons: [{
                                name: serverItem.title,
                                date: serverItem.eventDate || '',
                                s_description: serverItem.description || '',
                                features: {
                                    online: serverItem.featureOnline || '—',
                                    platform: serverItem.featurePlatform || 'Minecraft',
                                    work_time: serverItem.featureWorkTime || '—',
                                    runtime: serverItem.featureRuntime || '—'
                                },
                                description: serverItem.contentHtml || '',
                                logo: parsedLogo,
                                map: parsedMaps,
                                photos: parsedPhotos
                            }],
                            photos: []
                        });
                        return;
                    } catch (dbErr) {
                        console.warn('DB history detail fetch failed, trying static fallback:', dbErr);
                        const resolvedFolder = await getFolderName();
                        setFolderName(resolvedFolder);
                        const richDetails = await fetchFileDetails(resolvedFolder);
                        if (richDetails) {
                            setDetails(richDetails);
                            return;
                        }
                        throw dbErr;
                    }
                } else {
                    // --- FEATURE FLAG DISABLED: FETCH ONLY FROM STATIC FILES, DO NOT TOUCH DB AT ALL! ---
                    const resolvedFolder = await getFolderName();
                    setFolderName(resolvedFolder);
                    const richDetails = await fetchFileDetails(resolvedFolder);
                    if (richDetails) {
                        setDetails(richDetails);
                        return;
                    }
                    throw new Error('History details not found in static files');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load history details.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id, authLoading, hasFeature]);

    if (loading || authLoading) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader />
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

    const gradient = details.colors && details.colors.length > 0
        ? `linear-gradient(to right, ${details.colors.join(', ')})`
        : 'linear-gradient(to right, #c084fc, #3b82f6)'; // Purple to blue default

    return (
        <Layout>
            <SEO
                title={details.name}
                description={details.description.slice(0, 160)}
            />
            <div className="pt-20 lg:pt-24 pb-8 lg:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                <Link
                    to="/history"
                    className="inline-flex items-center text-white/80 hover:text-white glass px-4 py-2 rounded-full transition-all hover:scale-105 mb-12 group"
                >
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Назад к истории
                </Link>

                <div className="text-center mb-16">
                    <h1
                        className="text-4xl md:text-7xl font-bold mb-8 bg-clip-text text-transparent drop-shadow-lg pb-4 leading-tight"
                        style={{ backgroundImage: gradient }}
                    >
                        {details.name}
                    </h1>
                    <p className="text-gray-200 max-w-2xl mx-auto whitespace-pre-line text-lg">
                        {details.description}
                    </p>
                </div>

                <div className="space-y-16">
                    {details.seasons.map((value, index) => {
                        // Check if it's a text separator
                        if (typeof value === 'string') {
                            return (
                                <div key={index} className="flex items-center gap-4 py-12">
                                    <div className="h-px flex-1 opacity-50" style={{ background: `linear-gradient(to right, transparent, ${details.colors?.[0] || '#c084fc'})` }}></div>
                                    <span className="text-xl md:text-3xl font-bold text-white shadow-lg text-center">
                                        {value}
                                    </span>
                                    <div className="h-px flex-1 opacity-50" style={{ background: `linear-gradient(to left, transparent, ${details.colors?.[details.colors?.length - 1] || '#3b82f6'})` }}></div>
                                </div>
                            );
                        }

                        // It's a season object
                        const season = value as Season;
                        const logos = season.logos || (season.logo ? [season.logo] : []);

                        return (
                            <div key={index} className="space-y-8">
                                <div className="text-center">
                                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">{season.s_description}</h2>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Left Column Wrapper */}
                                    <div className="contents lg:flex lg:flex-col lg:gap-8">
                                        {/* Description Card (Mobile: 1) */}
                                        <div className="order-1">
                                            <GlassCard className="p-6">
                                                <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Описание</h3>
                                                <div
                                                    className="prose prose-invert max-w-none text-gray-100 text-sm leading-relaxed space-y-4"
                                                    dangerouslySetInnerHTML={{ __html: season.description }}
                                                />
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
                                                                        src={logo.image && (logo.image.startsWith('http') || logo.image.startsWith('/')) ? logo.image : `/history/${encodeURIComponent(getRealFolderName(folderName))}/images/${logo.image}`}
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
                                                    <div className="flex flex-col gap-3">
                                                        {(Array.isArray(season.map) ? season.map : [season.map]).map((mapItem, mapIndex) => (
                                                            <a
                                                                key={mapIndex}
                                                                href={mapItem.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center justify-center px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors w-full"
                                                            >
                                                                <Download className="w-4 h-4 mr-2" />
                                                                {mapItem.description}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </GlassCard>
                                            </div>
                                        )}
                                    </div>

                                    {/* Carousel (Mobile: 5, Desktop: Bottom) */}
                                    {season.photos && season.photos.length > 0 && (
                                        <div className="order-5 lg:col-span-2">
                                            <div className="flex items-center gap-4 py-12">
                                                <div className="h-px flex-1 opacity-50" style={{ background: `linear-gradient(to right, transparent, ${details.colors?.[0] || '#c084fc'})` }}></div>
                                                <span className="text-xl md:text-3xl font-bold text-white shadow-lg text-center">
                                                    Скриншоты сервера
                                                </span>
                                                <div className="h-px flex-1 opacity-50" style={{ background: `linear-gradient(to left, transparent, ${details.colors?.[details.colors?.length - 1] || '#3b82f6'})` }}></div>
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
