import React, { useEffect, useState } from 'react';
import { Star, CheckCircle, XCircle, Trash2, MessageSquare, History, Send, Bot, Clock, Filter, Search } from 'lucide-react';
import { reviewsApi, type Review, type ReviewEditHistory, type ReviewReminderSettings } from '../../../api/reviews';
import { useNotification } from '../../../context/NotificationContext';

const ReviewsTab: React.FC = () => {
    const { showNotification } = useNotification();
    const [subTab, setSubTab] = useState<'MODERATION' | 'REMINDERS'>('MODERATION');

    // Moderation state
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [replyingReviewId, setReplyingReviewId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState<string>('');

    // Edit history state
    const [historyModalReview, setHistoryModalReview] = useState<Review | null>(null);
    const [editHistory, setEditHistory] = useState<ReviewEditHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Bot Reminders state
    const [reminderSettings, setReminderSettings] = useState<ReviewReminderSettings>({
        reviewReminderAppAccepted: false,
        reviewReminderAppAcceptedDays: 7,
        reviewReminderSponsorshipPurchased: false,
        reviewReminderSponsorshipDays: 3
    });
    const [savingSettings, setSavingSettings] = useState(false);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const data = await reviewsApi.getAdminReviews(filterStatus);
            setReviews(data);
        } catch (err) {
            console.error('Failed to load admin reviews', err);
        } finally {
            setLoading(false);
        }
    };

    const loadReminderSettings = async () => {
        try {
            const data = await reviewsApi.getReminderSettings();
            setReminderSettings(data);
        } catch (err) {
            console.error('Failed to load reminder settings', err);
        }
    };

    useEffect(() => {
        if (subTab === 'MODERATION') {
            loadReviews();
        } else {
            loadReminderSettings();
        }
    }, [subTab, filterStatus]);

    const handleUpdateStatus = async (id: number, status: 'APPROVED' | 'REJECTED') => {
        try {
            await reviewsApi.updateReviewStatus(id, status);
            showNotification(`Отзыв ${status === 'APPROVED' ? 'одобрен' : 'отклонен'}.`, 'success');
            loadReviews();
        } catch (err) {
            showNotification('Ошибка при обновлении статуса.', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return;
        try {
            await reviewsApi.deleteReview(id);
            showNotification('Отзыв удален.', 'success');
            loadReviews();
        } catch (err) {
            showNotification('Ошибка при удалении отзыва.', 'error');
        }
    };

    const handleAddReply = async (id: number) => {
        if (!replyText.trim()) return;
        try {
            await reviewsApi.addAdminReply(id, replyText.trim());
            showNotification('Ответ опубликован.', 'success');
            setReplyingReviewId(null);
            setReplyText('');
            loadReviews();
        } catch (err) {
            showNotification('Ошибка при отправке ответа.', 'error');
        }
    };

    const handleOpenHistory = async (r: Review) => {
        setHistoryModalReview(r);
        setLoadingHistory(true);
        try {
            const history = await reviewsApi.getReviewHistory(r.id);
            setEditHistory(history);
        } catch (err) {
            console.error('Failed to load history', err);
            setEditHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSaveReminderSettings = async () => {
        setSavingSettings(true);
        try {
            await reviewsApi.updateReminderSettings(reminderSettings);
            showNotification('Настройки рассылки через Discord-бота сохранены.', 'success');
        } catch (err) {
            showNotification('Не удалось сохранить настройки.', 'error');
        } finally {
            setSavingSettings(false);
        }
    };

    const filteredReviews = reviews.filter(r =>
        r.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header & Sub-Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-story-gold" />
                        Управление отзывами
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Модерация отзывов игроков и настройка автонапоминаний через бот</p>
                </div>

                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setSubTab('MODERATION')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${subTab === 'MODERATION' ? 'bg-story-gold text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                        Модерация отзывов
                    </button>
                    <button
                        onClick={() => setSubTab('REMINDERS')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${subTab === 'REMINDERS' ? 'bg-story-gold text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Bot className="w-4 h-4" />
                        Рассылка через бота
                    </button>
                </div>
            </div>

            {subTab === 'MODERATION' ? (
                <div className="space-y-4">
                    {/* Filters bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                        <div className="relative flex-1 min-w-[240px]">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Поиск по нику или тексту отзыва..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-story-gold/50"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-story-gold/50"
                            >
                                <option value="ALL">Все статусы</option>
                                <option value="PENDING">На модерации (PENDING)</option>
                                <option value="APPROVED">Опубликованные (APPROVED)</option>
                                <option value="REJECTED">Отклоненные (REJECTED)</option>
                            </select>
                        </div>
                    </div>

                    {/* Reviews List */}
                    {loading ? (
                        <div className="text-center py-12 text-gray-400 text-sm">Загрузка отзывов...</div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 text-sm">Отзывов не найдено.</div>
                    ) : (
                        <div className="space-y-4">
                            {filteredReviews.map(r => (
                                <div key={r.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-3">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={r.userAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.username)}&background=random`}
                                                alt={r.username}
                                                className="w-10 h-10 rounded-full object-cover border border-white/20"
                                            />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-white font-bold text-base">{r.username}</h4>
                                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${r.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : r.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                                        {r.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                                                    <div className="flex text-story-gold">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-story-gold' : 'text-gray-600'}`} />
                                                        ))}
                                                    </div>
                                                    <span>• {new Date(r.createdAt).toLocaleString('ru-RU')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Action Buttons */}
                                        <div className="flex items-center gap-2">
                                            {r.status !== 'APPROVED' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(r.id, 'APPROVED')}
                                                    className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold hover:bg-green-500/20 transition-colors flex items-center gap-1"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Одобрить
                                                </button>
                                            )}
                                            {r.status !== 'REJECTED' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(r.id, 'REJECTED')}
                                                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Отклонить
                                                </button>
                                            )}
                                            {r.edited && (
                                                <button
                                                    onClick={() => handleOpenHistory(r)}
                                                    className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-bold hover:bg-purple-500/20 transition-colors flex items-center gap-1"
                                                >
                                                    <History className="w-3.5 h-3.5 text-purple-400" />
                                                    История
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(r.id)}
                                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                                title="Удалить"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Review Text */}
                                    <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap pl-1">
                                        {r.content}
                                    </p>

                                    {/* Admin Reply Display */}
                                    {r.adminReply && (
                                        <div className="p-3 rounded-xl bg-purple-900/20 border border-purple-500/30 text-xs space-y-1">
                                            <div className="font-bold text-purple-300">
                                                Ответ от {r.adminReplyAuthorName || 'Администрации'}:
                                            </div>
                                            <p className="text-purple-100">{r.adminReply}</p>
                                        </div>
                                    )}

                                    {/* Reply form */}
                                    {replyingReviewId === r.id ? (
                                        <div className="space-y-2 pt-2 border-t border-white/5">
                                            <textarea
                                                rows={2}
                                                value={replyText}
                                                onChange={e => setReplyText(e.target.value)}
                                                placeholder="Напишите официальный ответ от администрации..."
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-purple-500/50"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setReplyingReviewId(null)}
                                                    className="px-3 py-1 rounded-lg text-xs text-gray-400 hover:text-white"
                                                >
                                                    Отмена
                                                </button>
                                                <button
                                                    onClick={() => handleAddReply(r.id)}
                                                    className="px-3 py-1 rounded-lg bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 transition-colors flex items-center gap-1"
                                                >
                                                    <Send className="w-3 h-3" />
                                                    Отправить ответ
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setReplyingReviewId(r.id);
                                                setReplyText(r.adminReply || '');
                                            }}
                                            className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            {r.adminReply ? 'Изменить ответ' : 'Ответить на отзыв'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Sub-Tab 2: Bot Reminder Settings (Default OFF) */
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 max-w-3xl">
                    <div className="border-b border-white/10 pb-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Bot className="w-5 h-5 text-story-gold" />
                            Настройки автоматической рассылки просьбы оставить отзыв
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            Discord-бот автоматически отправит личное сообщение пользователю через $N$ дней после наступления события. 
                            <strong> Рассылка ПО УМОЛЧАНИЮ ВЫКЛЮЧЕНА.</strong>
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Event 1: Application Approval */}
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-white font-bold text-sm">Событие: Принятие заявки на сервер</h4>
                                    <p className="text-xs text-gray-400">Отправка личного сообщения после одобрения заявки игрока.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={reminderSettings.reviewReminderAppAccepted}
                                        onChange={e => setReminderSettings({ ...reminderSettings, reviewReminderAppAccepted: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-story-gold"></div>
                                </label>
                            </div>

                            {reminderSettings.reviewReminderAppAccepted && (
                                <div className="flex items-center gap-3 pt-2 border-t border-white/5 text-xs text-gray-300">
                                    <Clock className="w-4 h-4 text-story-gold" />
                                    <span>Отправлять через:</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={365}
                                        value={reminderSettings.reviewReminderAppAcceptedDays}
                                        onChange={e => setReminderSettings({ ...reminderSettings, reviewReminderAppAcceptedDays: parseInt(e.target.value) || 7 })}
                                        className="w-20 px-3 py-1 bg-black/40 border border-white/10 rounded-lg text-white font-mono text-xs text-center"
                                    />
                                    <span>дней после принятия заявки</span>
                                </div>
                            )}
                        </div>

                        {/* Event 2: Sponsorship Purchase */}
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-white font-bold text-sm">Событие: Покупка спонсорства</h4>
                                    <p className="text-xs text-gray-400">Отправка личного сообщения спонсорам с просьбой поделиться отзывом.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={reminderSettings.reviewReminderSponsorshipPurchased}
                                        onChange={e => setReminderSettings({ ...reminderSettings, reviewReminderSponsorshipPurchased: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-story-gold"></div>
                                </label>
                            </div>

                            {reminderSettings.reviewReminderSponsorshipPurchased && (
                                <div className="flex items-center gap-3 pt-2 border-t border-white/5 text-xs text-gray-300">
                                    <Clock className="w-4 h-4 text-story-gold" />
                                    <span>Отправлять через:</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={365}
                                        value={reminderSettings.reviewReminderSponsorshipDays}
                                        onChange={e => setReminderSettings({ ...reminderSettings, reviewReminderSponsorshipDays: parseInt(e.target.value) || 3 })}
                                        className="w-20 px-3 py-1 bg-black/40 border border-white/10 rounded-lg text-white font-mono text-xs text-center"
                                    />
                                    <span>дней после оформления спонсорства</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-white/10">
                        <button
                            onClick={handleSaveReminderSettings}
                            disabled={savingSettings}
                            className="px-6 py-2.5 bg-story-gold text-black rounded-xl hover:bg-story-gold-light transition-all font-bold text-sm disabled:opacity-50 shadow-md"
                        >
                            {savingSettings ? 'Сохранение...' : 'Сохранить настройки бот-рассылки'}
                        </button>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {historyModalReview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <History className="w-5 h-5 text-purple-400" />
                                История изменений отзыва {historyModalReview.username}
                            </h3>
                            <button onClick={() => setHistoryModalReview(null)} className="text-gray-400 hover:text-white">
                                ✕
                            </button>
                        </div>

                        <div className="max-h-80 overflow-y-auto space-y-3">
                            {loadingHistory ? (
                                <div className="text-center text-xs text-gray-400 py-4">Загрузка истории...</div>
                            ) : editHistory.length === 0 ? (
                                <div className="text-center text-xs text-gray-500 py-4">История редактирования отсутствует.</div>
                            ) : (
                                editHistory.map((h) => (
                                    <div key={h.id} className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
                                        <div className="text-purple-300 font-semibold flex justify-between">
                                            <span>Версия от {new Date(h.createdAt).toLocaleString('ru-RU')}</span>
                                            <span>{h.rating}/5★</span>
                                        </div>
                                        <p className="text-gray-300 italic">"{h.content}"</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewsTab;
