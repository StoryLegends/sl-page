import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, CornerDownRight, History, ArrowRight } from 'lucide-react';
import { reviewsApi, type Review } from '../api/reviews';
import ReviewsModal from './ReviewsModal';

const ReviewsMarquee: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedReviewForModal, setSelectedReviewForModal] = useState<Review | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await reviewsApi.getPublicReviews();
                setReviews(data);
            } catch (err) {
                console.error('Failed to load public reviews:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading || reviews.length === 0) {
        return null; // Don't show ticker if empty
    }

    // Split reviews into 2 rows
    const half = Math.ceil(reviews.length / 2);
    const row1 = reviews.slice(0, half > 0 ? half : 1);
    const row2 = reviews.length > 1 ? reviews.slice(half) : row1;

    // Duplicate rows for infinite seamless marquee loop
    const row1List = [...row1, ...row1, ...row1, ...row1];
    const row2List = [...row2, ...row2, ...row2, ...row2];

    const renderCard = (r: Review, idx: number) => (
        <div
            key={`${r.id}-${idx}`}
            onClick={() => {
                setSelectedReviewForModal(r);
                setModalOpen(true);
            }}
            className="flex-shrink-0 w-80 md:w-96 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-story-gold/40 transition-all cursor-pointer group shadow-lg"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <img
                        src={r.userAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.username)}&background=random`}
                        alt={r.username}
                        className="w-10 h-10 rounded-full object-cover border border-white/20"
                    />
                    <div>
                        <h4 className="text-white font-bold text-sm group-hover:text-story-gold transition-colors">{r.username}</h4>
                        <div className="flex items-center gap-1 text-story-gold text-xs mt-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-story-gold text-story-gold' : 'text-gray-600'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                {r.edited && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                        <History className="w-3 h-3 text-amber-400" />
                        Изм.
                    </span>
                )}
            </div>

            <p className="text-gray-300 text-sm line-clamp-3 leading-relaxed mb-3">
                "{r.content}"
            </p>

            {r.adminReply && (
                <div className="mt-2 pt-2 border-t border-white/5 flex items-start gap-2 text-xs text-purple-300 bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
                    <CornerDownRight className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">
                        <strong>{r.adminReplyAuthorName || 'Администрация'}:</strong> {r.adminReply}
                    </span>
                </div>
            )}
        </div>
    );

    return (
        <section className="my-16 relative overflow-hidden z-10">
            {/* Header & View All button */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto px-4 mb-8">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white text-center md:text-left flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-story-gold" />
                        Отзывы игроков
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Что говорят участники нашего сообщества о сервере StoryLegends.</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedReviewForModal(null);
                        setModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-story-gold/10 hover:bg-story-gold/20 text-story-gold border border-story-gold/30 font-semibold text-sm transition-all hover:scale-105"
                >
                    Все отзывы ({reviews.length})
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            {/* 2-Row Marquee Container */}
            <div className="space-y-4 py-2 relative">
                {/* Gradient Side Fades */}
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0b1320] to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0b1320] to-transparent z-10 pointer-events-none" />

                {/* Row 1 - Marquee Left */}
                <div className="flex gap-4 animate-marquee hover:[animation-play-state:paused]">
                    {row1List.map((r, i) => renderCard(r, i))}
                </div>

                {/* Row 2 - Marquee Right (Reverse) */}
                <div className="flex gap-4 animate-marquee-reverse hover:[animation-play-state:paused]">
                    {row2List.map((r, i) => renderCard(r, i))}
                </div>
            </div>

            {/* Reviews Modal */}
            <ReviewsModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                reviews={reviews}
                initialReview={selectedReviewForModal}
            />
        </section>
    );
};

export default ReviewsMarquee;
