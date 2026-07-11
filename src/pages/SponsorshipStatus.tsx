import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { Sparkles, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const SponsorshipStatus: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { refreshUser, hasFeature, loading: authLoading } = useAuth();

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0b1320]">
                <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
            </div>
        );
    }

    if (!hasFeature('sponsorship')) {
        return <Navigate to="/404" replace />;
    }

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'success' | 'failed' | 'processing'>('processing');
    const [error, setError] = useState<string | null>(null);

    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        let isMounted = true;
        let pollCount = 0;
        let timeoutId: any = null;

        const verifySession = async () => {
            if (!sessionId) {
                if (isMounted) {
                    setStatus('failed');
                    setError('Неверная сессия оплаты');
                    setLoading(false);
                }
                return;
            }

            try {
                const response = await apiClient.get(`/api/sponsorship/session/${sessionId}`);
                const data = response.data;

                if (!isMounted) return;

                if (data.paymentStatus === 'paid') {
                    setStatus('success');
                    await refreshUser();
                    setLoading(false);
                } else if (data.status === 'open' && pollCount < 5) {
                    pollCount++;
                    timeoutId = setTimeout(verifySession, 2000);
                } else if (data.status === 'open') {
                    setStatus('processing');
                    setLoading(false);
                } else {
                    setStatus('failed');
                    setError('Оплата не была завершена. Если средства были списаны, пожалуйста, обратитесь в поддержку.');
                    setLoading(false);
                }
            } catch (err: any) {
                console.error('Failed to verify payment session:', err);
                if (isMounted) {
                    setStatus('failed');
                    setError(err.response?.data?.error || 'Ошибка проверки платежа. Попробуйте обновить страницу.');
                    setLoading(false);
                }
            }
        };

        verifySession();

        return () => {
            isMounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [sessionId, refreshUser]);

    return (
        <Layout>
            <SEO title="Статус оплаты" description="Проверка статуса оплаты спонсорства StoryLegends" />
            <div className="pt-32 pb-24 text-center px-4 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[70vh] relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-story-gold/10 blur-[120px] rounded-full -z-10" />

                {loading && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-story-gold animate-spin" />
                        <h2 className="text-xl font-bold text-white font-minecraft">Проверяем статус оплаты...</h2>
                        <p className="text-gray-400 text-sm">Пожалуйста, не закрывайте эту страницу.</p>
                    </div>
                )}

                {!loading && status === 'success' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="w-16 h-16 rounded-2xl bg-story-gold/15 border border-story-gold/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(255,215,0,0.2)]">
                            <Sparkles className="w-8 h-8 text-story-gold animate-pulse-slow" />
                        </div>
                        <h1 className="text-3xl font-bold text-white font-minecraft tracking-wide">Спасибо за поддержку!</h1>
                        <p className="text-gray-300 leading-relaxed">
                            Оплата успешно проведена. Ваша спонсорская подписка активирована. Изменения уже вступили в силу на сайте и скоро появятся на сервере Minecraft!
                        </p>
                        <button
                            onClick={() => navigate('/profile')}
                            className="px-6 py-3 bg-gradient-to-r from-story-gold to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)] flex items-center justify-center gap-2 mx-auto"
                        >
                            В личный кабинет
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {!loading && status === 'processing' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                        </div>
                        <h1 className="text-3xl font-bold text-white font-minecraft tracking-wide">Платеж обрабатывается</h1>
                        <p className="text-gray-300 leading-relaxed">
                            Мы ожидаем подтверждения от платежной системы. Обычно это занимает не больше минуты.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-story-gold text-black font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)]"
                            >
                                Обновить статус
                            </button>
                            <button
                                onClick={() => navigate('/sponsorship')}
                                className="px-6 py-3 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl text-white font-semibold transition-all"
                            >
                                Назад к выбору тарифа
                            </button>
                        </div>
                    </div>
                )}

                {!loading && status === 'failed' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-white font-minecraft tracking-wide">Оплата не удалась</h1>
                        <p className="text-gray-400 leading-relaxed">
                            {error || 'Во время транзакции произошла ошибка. Деньги не были списаны.'}
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => navigate('/sponsorship')}
                                className="px-6 py-3 bg-white/5 border border-white/10 hover:border-story-gold/50 rounded-xl text-white font-semibold transition-all"
                            >
                                Попробовать снова
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="px-6 py-3 bg-transparent text-gray-400 hover:text-white transition-all"
                            >
                                На главную
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default SponsorshipStatus;
