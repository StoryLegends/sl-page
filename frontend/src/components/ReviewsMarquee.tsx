import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, CornerDownRight, History, ArrowRight } from 'lucide-react';
import { reviewsApi, type Review } from '../api/reviews';
import ReviewsModal from './ReviewsModal';

const ReviewsMarquee: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedReviewForModal, setSelectedReviewForModal] = useState<Review | null>(null);

    // Fisher-Yates shuffle helper
    const shuffleArray = <T,>(array: T[]): T[] => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    useEffect(() => {
        const load = async () => {
            try {
                const data = await reviewsApi.getPublicReviews();
                setReviews(shuffleArray(data));
            } catch (err) {
                console.error('Failed to load public reviews:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading || reviews.length === 0) {
        return null;
    }

    // Ensure enough cards to fill marquee viewport (at least 8 cards before doubling)
    const minCards = 8;
    const fillRowToMinLength = (arr: Review[]) => {
        if (arr.length === 0) return [];
        const result: Review[] = [];
        while (result.length < minCards) {
            result.push(...arr);
        }
        return result;
    };

    // Generate row 1 and row 2 using ALL reviews with an offset rotation so both rows alternate all reviews
    const offset = Math.max(1, Math.floor(reviews.length / 2));
    const row1Base = reviews;
    const row2Base = [...reviews.slice(offset), ...reviews.slice(0, offset)];

    const row1Set = fillRowToMinLength(row1Base);
    const row2Set = fillRowToMinLength(row2Base);

    // Double for seamless infinite marquee scroll (translateX -50%)
    const row1List = [...row1Set, ...row1Set];
    const row2List = [...row2Set, ...row2Set];

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
            <div className="space-y-4 py-2">
                {/* Row 1 - Marquee Left */}
                <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}>
                    <div className="flex gap-4 marquee-scroll hover:[animation-play-state:paused]" style={{ width: 'max-content' }}>
                        {row1List.map((r, i) => renderCard(r, i))}
                    </div>
                </div>

                {/* Row 2 - Marquee Right (Reverse) */}
                <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}>
                    <div className="flex gap-4 marquee-scroll-reverse hover:[animation-play-state:paused]" style={{ width: 'max-content' }}>
                        {row2List.map((r, i) => renderCard(r, i))}
                    </div>
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
