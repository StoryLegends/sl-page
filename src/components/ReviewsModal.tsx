import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Search, Filter, History, CornerDownRight } from 'lucide-react';
import { reviewsApi, type Review, type ReviewEditHistory } from '../api/reviews';

interface ReviewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    reviews: Review[];
    initialReview?: Review | null;
}

const ReviewsModal: React.FC<ReviewsModalProps> = ({ isOpen, onClose, reviews, initialReview: _initialReview }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [ratingFilter, setRatingFilter] = useState<number | 'ALL'>('ALL');
    const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'RATING_HIGH' | 'RATING_LOW'>('NEWEST');
    const [historyModalReview, setHistoryModalReview] = useState<Review | null>(null);
    const [editHistory, setEditHistory] = useState<ReviewEditHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    if (!isOpen) return null;

    // Filter and Sort reviews
    const filtered = reviews.filter(r => {
        const matchesSearch = r.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRating = ratingFilter === 'ALL' || r.rating === ratingFilter;
        return matchesSearch && matchesRating;
    });

    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'NEWEST') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'OLDEST') {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'RATING_HIGH') {
            return b.rating - a.rating;
        }
        if (sortBy === 'RATING_LOW') {
            return a.rating - b.rating;
        }
        return 0;
    });

    const handleOpenHistory = async (r: Review) => {
        setHistoryModalReview(r);
        setLoadingHistory(true);
        try {
            const data = await reviewsApi.getReviewHistory(r.id);
            setEditHistory(data);
        } catch (err) {
            console.error('Failed to load edit history', err);
            setEditHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    onClick={onClose}
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl max-h-[85vh] bg-[#0c1524] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden z-10"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <div>
                            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Star className="w-6 h-6 text-story-gold fill-story-gold" />
                                Отзывы игроков StoryLegends
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Официальные отзывы игроков сервера ({reviews.length})</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Controls & Filters Bar */}
                    <div className="p-4 border-b border-white/5 bg-white/[0.02] flex flex-wrap items-center justify-between gap-3 text-sm">
                        {/* Search input */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Поиск по нику или тексту..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-story-gold/50 text-sm"
                            />
                        </div>

                        {/* Rating Filter Pills */}
                        <div className="flex items-center gap-1 overflow-x-auto py-1">
                            <button
                                onClick={() => setRatingFilter('ALL')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${ratingFilter === 'ALL' ? 'bg-story-gold text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                Все
                            </button>
                            {[5, 4, 3, 2, 1].map(star => (
                                <button
                                    key={star}
                                    onClick={() => setRatingFilter(star)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${ratingFilter === star ? 'bg-story-gold text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                >
                                    {star} <Star className="w-3 h-3 fill-current" />
                                </button>
                            ))}
                        </div>

                        {/* Sort Selector */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as any)}
                                className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-story-gold/50"
                            >
                                <option value="NEWEST">Сначала новые</option>
                                <option value="OLDEST">Сначала старые</option>
                                <option value="RATING_HIGH">Сначала высокий рейтинг</option>
                                <option value="RATING_LOW">Сначала низкий рейтинг</option>
                            </select>
                        </div>
                    </div>

                    {/* Reviews List Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[60vh] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {sorted.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 text-sm">
                                Отзывов по выбранным фильтрам не найдено.
                            </div>
                        ) : (
                            sorted.map(r => (
                                <div
                                    key={r.id}
                                    className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={r.userAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.username)}&background=random`}
                                                alt={r.username}
                                                className="w-10 h-10 rounded-full object-cover border border-white/20"
                                            />
                                            <div>
                                                <h4 className="text-white font-bold text-base">{r.username}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <div className="flex items-center gap-0.5 text-story-gold">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-story-gold text-story-gold' : 'text-gray-600'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-gray-400">
                                                        • {new Date(r.createdAt).toLocaleDateString('ru-RU')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {r.edited && (
                                            <button
                                                onClick={() => handleOpenHistory(r)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs hover:bg-amber-500/20 transition-colors"
                                            >
                                                <History className="w-3.5 h-3.5" />
                                                Отредактировано
                                            </button>
                                        )}
                                    </div>

                                    <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap pl-1">
                                        {r.content}
                                    </p>

                                    {r.adminReply && (
                                        <div className="mt-3 p-3.5 rounded-xl bg-purple-900/20 border border-purple-500/30 text-xs space-y-1">
                                            <div className="flex items-center gap-2 font-bold text-purple-300">
                                                <CornerDownRight className="w-4 h-4 text-purple-400" />
                                                Ответ от {r.adminReplyAuthorName || 'Администрации'}:
                                            </div>
                                            <p className="text-purple-100 pl-6 leading-relaxed">
                                                {r.adminReply}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>

            {/* History Modal */}
            {historyModalReview && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="relative w-full max-w-lg bg-[#0e1a2e] rounded-2xl border border-white/10 p-6 space-y-4 text-white">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h4 className="font-bold text-lg flex items-center gap-2">
                                <History className="w-5 h-5 text-amber-400" />
                                История правок отзыва ({historyModalReview.username})
                            </h4>
                            <button
                                onClick={() => setHistoryModalReview(null)}
                                className="p-1 text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
                                <div className="text-story-gold font-bold">Текущая версия ({historyModalReview.rating}/5★):</div>
                                <p className="text-gray-300">{historyModalReview.content}</p>
                            </div>

                            {loadingHistory ? (
                                <div className="text-center text-xs text-gray-400 py-4">Загрузка истории правок...</div>
                            ) : editHistory.length === 0 ? (
                                <div className="text-center text-xs text-gray-500 py-2">Предыдущие версии отсутствуют.</div>
                            ) : (
                                editHistory.map((h) => (
                                    <div key={h.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs space-y-1">
                                        <div className="text-gray-400 font-semibold">
                                            Версия от {new Date(h.createdAt).toLocaleString('ru-RU')} ({h.rating}/5★):
                                        </div>
                                        <p className="text-gray-400 italic">"{h.content}"</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ReviewsModal;
