import React, { useEffect, useState } from 'react';
import { applicationsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { ScrollText, Send, Clock, CheckCircle, XCircle, Mail, ShieldCheck, AlertCircle, Youtube, Twitch, Users, Music, MessageSquare } from 'lucide-react';
import { useGoogleReCaptcha } from 'react19-google-recaptcha-v3';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';


const sourceOptions = [
    { id: 'YouTube', label: 'YouTube', icon: Youtube, placeholder: 'Ссылка на канал или видео' },
    { id: 'Twitch', label: 'Twitch', icon: Twitch, placeholder: 'Никнейм или ссылка' },
    { id: 'TikTok', label: 'TikTok', icon: Music, placeholder: 'Никнейм или ссылка' },
    { id: 'Friend', label: 'От друга', icon: Users, placeholder: 'Никнейм друга' },
    { id: 'Other', label: 'Другое', icon: MessageSquare, placeholder: 'Расскажите подробнее...' }
];

const ApplicationPage = () => {
    const { user, loading: authLoading, refreshUser } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (user && user.discordVerified && !user.inDiscordServer) {
            interval = setInterval(() => {
                refreshUser();
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [user?.inDiscordServer, user?.discordVerified, refreshUser]);
    const [myApplications, setMyApplications] = useState<any[]>([]);
    const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        age: '',
        whyUs: '',
        source: '',
        makeContent: false,
        additionalInfo: '',
        selfRating: 5
    });

    const [sourceCategory, setSourceCategory] = useState<string>('');
    const [sourceDetail, setSourceDetail] = useState<string>('');

    useEffect(() => {
        if (!sourceCategory) {
            setFormData(prev => ({ ...prev, source: '' }));
            return;
        }
        const finalSource = (sourceCategory === 'Other') ? sourceDetail : (sourceDetail ? `${sourceCategory}: ${sourceDetail}` : sourceCategory);
        setFormData(prev => ({ ...prev, source: finalSource }));
    }, [sourceCategory, sourceDetail]);

    const [contentLinks, setContentLinks] = useState<string[]>(['']);

    const handleAddLink = () => {
        setContentLinks([...contentLinks, '']);
    };

    const handleLinkChange = (index: number, value: string) => {
        const newLinks = [...contentLinks];
        newLinks[index] = value;
        setContentLinks(newLinks);
    };

    const handleRemoveLink = (index: number) => {
        const newLinks = [...contentLinks];
        newLinks.splice(index, 1);
        setContentLinks(newLinks);
    };

    const isValidUrl = (url: string) => {
        if (!url.trim()) return true;
        const pattern = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?([/?#].*)?$/i;
        return pattern.test(url.trim());
    };

    const [settings, setSettings] = useState<any>(null);
    const [settingsLoading, setSettingsLoading] = useState(true);

    useEffect(() => {
        fetchMyApplications();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await (await import('../api')).adminApi.getPublicSettings();
            setSettings(res);
        } catch (err) {
            console.error('Failed to fetch settings', err);
        } finally {
            setSettingsLoading(false);
        }
    };

    const fetchMyApplications = async () => {
        try {
            const res = await applicationsApi.getMy();
            console.log('API Response (my apps):', res);

            // res now has { current, history } structure
            const apps: any[] = [];
            if (res.current) apps.push(res.current);
            if (res.history && Array.isArray(res.history)) {
                // Filter out current from history if duplicated, though backend should handle it
                const history = res.history.filter(h => h.id !== res.current?.id);
                apps.push(...history);
            }

            setMyApplications(apps);
        } catch (err: any) {
            console.error('Failed to fetch applications', err);
        }
    };

    const hasPendingApp = myApplications.some(app => app.status === 'PENDING' || !app.status);

    const { executeRecaptcha } = useGoogleReCaptcha();

    const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) return;

        if (!executeRecaptcha) {
            showNotification('reCAPTCHA не готова', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('Executing reCAPTCHA for application...');
            const token = await executeRecaptcha('submit_application');

            if (!token) {
                console.error('reCAPTCHA returned null or empty token');
                showNotification('Не удалось получить токен безопасности', 'error');
                setIsSubmitting(false);
                return;
            }

            let finalAdditionalInfo = formData.additionalInfo;
            if (formData.makeContent) {
                const validLinks = contentLinks.filter(l => l.trim() !== '');
                if (validLinks.length > 0) {
                    finalAdditionalInfo += '\n\nКонтент-ссылки:\n' + validLinks.join('\n');
                }
            }

            console.log('Application submission attempt with token length:', token.length);
            await applicationsApi.create({
                ...formData,
                additionalInfo: finalAdditionalInfo,
                age: formData.age ? parseInt(formData.age) : 0,
                recaptchaToken: token
            });

            setFormData({
                firstName: '',
                age: '',
                whyUs: '',
                source: '',
                makeContent: false,
                additionalInfo: '',
                selfRating: 5
            });
            setContentLinks(['']);
            setSourceCategory('');
            setSourceDetail('');

            fetchMyApplications();
            showNotification('Заявка успешно отправлена!', 'success');
        } catch (err: any) {
            console.error('Submit error details:', err.response?.data);
            const data = err.response?.data;
            let msg = 'Не удалось отправить заявку. Возможно, у вас уже есть активная заявка.';

            if (data?.message) {
                msg = data.message;
            } else if (data?.error) {
                msg = data.error;
            } else if (Array.isArray(data?.errors)) {
                msg = data.errors.map((e: any) => e.message || e.defaultMessage || JSON.stringify(e)).join('\n');
            } else if (typeof data === 'object') {
                msg = JSON.stringify(data, null, 2);
            } else if (typeof data === 'string') {
                msg = data;
            }

            showNotification(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    }, [executeRecaptcha, formData, fetchMyApplications, showNotification, isSubmitting]);

    return (
        <Layout>
            <SEO title="Заявки" description="Управление заявками на сервер" />
            <div className="min-h-[80vh] pt-32 pb-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-story-gold to-story-gold-dark flex items-center justify-center shadow-lg shadow-story-gold/20">
                            <ScrollText className="w-6 h-6 text-black" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold font-minecraft text-white">Мои Заявки</h1>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Left Column (Form + History) */}
                        <div className="flex flex-col gap-8">
                            <div className="bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-xl">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                                    <Send className="w-5 h-5 text-story-gold" />
                                    Подать заявку
                                </h2>

                                {authLoading || settingsLoading ? (
                                    <div className="flex justify-center py-10">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white/20"></div>
                                    </div>
                                ) : !user ? (
                                    <div className="bg-white/5 border border-white/5 rounded-xl p-8 text-center">
                                        <h3 className="text-xl font-bold text-white mb-2">Авторизация</h3>
                                        <p className="text-gray-400 mb-6">Войдите в аккаунт, чтобы подать заявку.</p>
                                        <button
                                            onClick={() => navigate('/login')}
                                            className="px-6 py-2 bg-story-gold text-black text-sm font-bold rounded-xl hover:bg-white transition-all"
                                        >
                                            Войти
                                        </button>
                                    </div>
                                ) : settings && !settings.applicationsOpen ? (
                                    <div className="bg-white/5 border border-white/5 rounded-xl p-8 text-center animate-fadeIn">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                                            <XCircle className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Заявки закрыты</h3>
                                        <p className="text-gray-400 mb-0">Приём заявок временно приостановлен администрацией проекта.</p>
                                    </div>
                                ) : user?.banned ? (
                                    <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 text-red-200">
                                        <h3 className="text-lg font-bold flex items-center gap-2 mb-2 text-red-100">
                                            <span className="text-xl">⚠️</span> Доступ ограничен
                                        </h3>
                                        <p className="mb-2">Вы не можете подавать новые заявки, так как ваш аккаунт заблокирован.</p>
                                        <p className="text-sm opacity-80"><strong className="text-red-100">Причина:</strong> {user.banReason}</p>
                                    </div>
                                ) : user?.inSeason ? (
                                    <div className="bg-blue-900/20 border border-blue-500/50 rounded-xl p-8 text-blue-200 text-center">
                                        <div className="text-4xl mb-4">⌛</div>
                                        <h3 className="text-xl font-bold text-blue-400 mb-2">Вердикт уже получен</h3>
                                        <p className="text-blue-300">Вы уже получили вердикт (приняты или отказаны) в этом сезоне. Подайте новую заявку в следующем сезоне!</p>
                                    </div>
                                ) : !user?.emailVerified ? (
                                    <div className="bg-story-gold/10 border border-story-gold/30 rounded-xl p-8 text-center animate-fadeIn">
                                        <div className="w-16 h-16 bg-story-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Mail className="w-8 h-8 text-story-gold" />
                                        </div>
                                        <h3 className="text-xl font-bold text-story-gold mb-2">Подтвердите Email</h3>
                                        <p className="text-gray-300 mb-6">Чтобы подать заявку на сервер, необходимо подтвердить адрес электронной почты. Мы отправили письмо с инструкциями на ваш email.</p>
                                        <div className="flex flex-col gap-3">
                                            <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-sm text-gray-400">
                                                Письмо не пришло? Проверьте папку <strong>Спам</strong>.
                                            </div>
                                        </div>
                                    </div>
                                ) : !user?.discordVerified ? (
                                    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-8 text-center animate-fadeIn">
                                        <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ShieldCheck className="w-8 h-8 text-indigo-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-indigo-400 mb-2">Подключите Discord</h3>
                                        <p className="text-gray-300 mb-6">Для подачи заявки необходимо привязать ваш Discord аккаунт через OAuth2 в профиле.</p>
                                        <button
                                            onClick={() => navigate('/profile')}
                                            className="px-6 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-sm font-bold rounded-xl border border-indigo-500/20 transition-all"
                                        >
                                            Перейти в профиль
                                        </button>
                                    </div>
                                ) : !user?.inDiscordServer ? (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center animate-fadeIn">
                                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <AlertCircle className="w-8 h-8 text-red-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-red-400 mb-2">Вы не на сервере Discord</h3>
                                        <p className="text-gray-300 mb-6">Для подачи заявки необходимо находиться на нашем Discord сервере.</p>
                                        <a
                                            href={import.meta.env.VITE_DISCORD_SERVER_URL || "#"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-sm font-bold rounded-xl border border-red-500/20 transition-all"
                                        >
                                            Зайти в Discord
                                        </a>
                                    </div>
                                ) : hasPendingApp ? (
                                    <div className="bg-story-gold/10 border border-story-gold/30 rounded-xl p-8 text-center">
                                        <div className="text-4xl mb-4">⌛</div>
                                        <h3 className="text-xl font-bold text-story-gold mb-2">Заявка в обработке</h3>
                                        <p className="text-gray-300">У вас уже есть активная заявка. Пожалуйста, дождитесь решения администрации. Статус можно увидеть ниже.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-300">Имя</label>
                                                <input
                                                    type="text"
                                                    value={formData.firstName}
                                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-story-gold/50 focus:bg-white/10 transition-colors text-white"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-300">Возраст</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="126"
                                                    value={formData.age}
                                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-story-gold/50 focus:bg-white/10 transition-colors text-white"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-end mb-1">
                                                <label className="block text-sm font-medium text-gray-300">Почему мы?</label>
                                                <span className={`text-[10px] font-bold ${formData.whyUs.length > 1000 ? 'text-red-400' : 'text-gray-500'}`}>
                                                    {formData.whyUs.length}/1000
                                                </span>
                                            </div>
                                            <textarea
                                                value={formData.whyUs}
                                                onChange={(e) => setFormData({ ...formData, whyUs: e.target.value })}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl h-24 focus:outline-none focus:border-story-gold/50 focus:bg-white/10 transition-colors text-white resize-none"
                                                required
                                                maxLength={1000}
                                            ></textarea>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="block text-sm font-medium mb-1 text-gray-300">Откуда узнали о проекте?</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {sourceOptions.map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => {
                                                            if (sourceCategory === opt.id) {
                                                                setSourceCategory('');
                                                                setSourceDetail('');
                                                            } else {
                                                                setSourceCategory(opt.id);
                                                                setSourceDetail('');
                                                            }
                                                        }}
                                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-xs font-medium ${
                                                            sourceCategory === opt.id 
                                                            ? 'bg-story-gold/20 border-story-gold text-story-gold shadow-lg shadow-story-gold/10' 
                                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                                                        }`}
                                                    >
                                                        <opt.icon className="w-4 h-4" />
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                            
                                            {sourceCategory && (
                                                <div className="animate-fadeIn">
                                                    <input
                                                        type="text"
                                                        placeholder={sourceOptions.find(o => o.id === sourceCategory)?.placeholder}
                                                        value={sourceDetail}
                                                        onChange={(e) => setSourceDetail(e.target.value)}
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-story-gold/50 focus:bg-white/10 transition-colors text-white"
                                                        required
                                                        maxLength={200}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-end mb-1">
                                                <label className="block text-sm font-medium text-gray-300">О себе</label>
                                                <span className={`text-[10px] font-bold ${formData.additionalInfo.length < 200 ? 'text-red-400' : formData.additionalInfo.length > 2000 ? 'text-red-400' : 'text-green-400/80'}`}>
                                                    {formData.additionalInfo.length}/2000
                                                </span>
                                            </div>
                                            <textarea
                                                value={formData.additionalInfo}
                                                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl h-32 focus:outline-none focus:border-story-gold/50 focus:bg-white/10 transition-colors text-white resize-none"
                                                placeholder="Расскажите немного о себе..."
                                                required
                                                minLength={200}
                                                maxLength={2000}
                                            ></textarea>
                                            {formData.additionalInfo.length > 0 && formData.additionalInfo.length < 200 && (
                                                <p className="text-[10px] text-red-400/80 mt-1">Минимум 200 символов</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium text-gray-300">Оценка адекватности (1-10):</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={formData.selfRating}
                                                onChange={(e) => setFormData({ ...formData, selfRating: parseInt(e.target.value) })}
                                                className="w-20 px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-story-gold/50 text-white"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="makeContent"
                                                checked={formData.makeContent}
                                                onChange={(e) => setFormData({ ...formData, makeContent: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-story-gold focus:ring-story-gold"
                                            />
                                            <label htmlFor="makeContent" className="text-sm text-gray-300">Планирую создавать контент</label>
                                        </div>

                                        {formData.makeContent && (
                                            <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-xl animate-fadeIn">
                                                <label className="block text-sm font-medium text-gray-300">Ссылки на ваши каналы (YouTube, Twitch, TikTok и т.д.)</label>
                                                {contentLinks.map((link, idx) => {
                                                    const isInvalid = link.trim() !== '' && !isValidUrl(link);
                                                    return (
                                                        <div key={idx} className="flex gap-2 items-center">
                                                            <div className="flex-1 relative">
                                                                <input
                                                                    type="text"
                                                                    value={link}
                                                                    onChange={(e) => handleLinkChange(idx, e.target.value)}
                                                                    className={`w-full px-4 py-2 bg-black/40 border rounded-xl focus:outline-none text-white text-sm transition-colors ${isInvalid
                                                                        ? 'border-red-500/50 focus:border-red-500/80 bg-red-900/10'
                                                                        : 'border-white/10 focus:border-story-gold/50'
                                                                        }`}
                                                                    placeholder="https://..."
                                                                />
                                                                {isInvalid && (
                                                                    <span className="absolute -bottom-4 right-2 text-[10px] text-red-400">Некорректная ссылка</span>
                                                                )}
                                                            </div>
                                                            {idx === contentLinks.length - 1 ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={handleAddLink}
                                                                    disabled={link.trim() === ''}
                                                                    className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors flex-shrink-0 ${link.trim() === ''
                                                                        ? 'bg-story-gold/5 text-story-gold/30 border-story-gold/10 cursor-not-allowed'
                                                                        : 'bg-story-gold/20 hover:bg-story-gold/40 text-story-gold border-story-gold/30'
                                                                        }`}
                                                                >
                                                                    +
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveLink(idx)}
                                                                    className="w-10 h-10 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-xl border border-red-500/30 transition-colors flex-shrink-0"
                                                                >
                                                                    -
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={
                                                isSubmitting ||
                                                formData.additionalInfo.length < 200 ||
                                                !formData.source ||
                                                (formData.makeContent && contentLinks.some(l => l.trim() !== '' && !isValidUrl(l))) ||
                                                (formData.makeContent && !contentLinks.some(l => l.trim() !== ''))
                                            }
                                            className="w-full h-12 flex items-center justify-center bg-white text-black font-bold py-3.5 px-4 rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                                            ) : (
                                                'Отправить'
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>

                            {/* Applications History (Now in Left Column) */}
                            {myApplications.length > 0 && (
                                <div className="bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-xl animate-fadeIn">
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                                        Ваши заявки ({myApplications.length})
                                    </h2>
                                    <div className="grid grid-cols-1 gap-4">
                                        {myApplications.map((app: any, idx) => {
                                            const isExpanded = expandedAppId === app.id;
                                            return (
                                                <div
                                                    key={app.id || idx}
                                                    onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                                                    className="border border-white/10 p-5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group relative overflow-hidden"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex flex-col gap-2">
                                                            <span className={`w-fit px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${app.status === 'ACCEPTED' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                                                                app.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                                                                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'
                                                                }`}>
                                                                {app.status === 'ACCEPTED' && <CheckCircle className="w-3 h-3" />}
                                                                {app.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                                                                {app.status === 'PENDING' && <Clock className="w-3 h-3" />}
                                                                {app.status || 'PENDING'}
                                                            </span>
                                                            <h3 className="text-white font-bold text-sm">
                                                                Заявка от {new Date(app.createdAt).toLocaleDateString()}
                                                            </h3>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="text-[10px] text-gray-500 font-mono">#{app.id ? String(app.id).slice(0, 8) : '...'}</span>
                                                            <span className="text-[11px] text-story-gold opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {isExpanded ? 'Свернуть ▲' : 'Подробнее ▼'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {!isExpanded && app.adminComment && (
                                                        <div className="mt-3 p-3 bg-story-gold/5 border border-story-gold/10 rounded-xl flex items-center gap-3 group-hover:bg-story-gold/10 transition-colors">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-story-gold animate-pulse shadow-[0_0_10px_rgba(255,191,0,0.5)]" />
                                                            <p className="text-[11px] text-gray-400 line-clamp-1 italic">
                                                                <span className="text-story-gold/80 font-bold not-italic mr-1 uppercase tracking-tighter">Комментарий:</span>
                                                                "{app.adminComment}"
                                                            </p>
                                                        </div>
                                                    )}

                                                    {isExpanded && (
                                                        <div className="mt-4 pt-4 border-t border-white/5 animate-fadeIn">
                                                            {app.adminComment && (
                                                                <div className="mb-4 p-4 bg-story-gold/5 rounded-xl border border-story-gold/20 text-sm">
                                                                    <span className="text-story-gold text-[10px] font-bold uppercase tracking-wider block mb-1">Ответ администрации:</span>
                                                                    <p className="text-gray-200 italic break-words overflow-hidden">"{app.adminComment}"</p>
                                                                </div>
                                                            )}
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <div className="space-y-4 min-w-0">
                                                                    <div className="break-words overflow-hidden">
                                                                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Почему мы:</span>
                                                                        <p className="text-sm text-gray-300 leading-relaxed">{app.whyUs}</p>
                                                                    </div>
                                                                    <div className="break-words overflow-hidden">
                                                                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">О себе:</span>
                                                                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{app.additionalInfo}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-4 min-w-0">
                                                                    <div className="break-words overflow-hidden text-white">
                                                                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Имя Возраст:</span>
                                                                        <p className="text-sm">{app.firstName} ({app.age} лет)</p>
                                                                    </div>
                                                                    <div className="break-words overflow-hidden text-white">
                                                                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Источник:</span>
                                                                        <p className="text-sm">{app.source}</p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Оценка адекватности:</span>
                                                                        <p className="text-sm text-white font-minecraft">{app.selfRating}/10</p>
                                                                    </div>
                                                                    {app.makeContent && (
                                                                        <div className="inline-block px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                                            <span className="text-[10px] text-red-400 font-bold">🎥 Контент-мейкер</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column (Guidelines) */}
                        <div className="bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-xl h-fit sticky top-24">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 font-minecraft text-white">
                                <span className="text-2xl">📝</span> Как заполнять заявку?
                            </h2>
                            <div className="space-y-6 text-gray-300">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <h3 className="text-story-gold font-bold mb-2 text-sm">1. Расскажите о себе</h3>
                                    <p className="text-xs leading-relaxed text-gray-400">
                                        Напишите о своих увлечениях, опыте игры и планах на сервере.
                                        <br /><br />
                                        <span className="text-red-400/80 font-bold block mb-1">⚠️ Минимум 200 символов.</span>
                                        Если планируете снимать контент, укажите ссылки на каналы.
                                    </p>
                                </div>

                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <h3 className="text-story-gold font-bold mb-2 text-sm">2. Почему именно мы?</h3>
                                    <p className="text-xs leading-relaxed text-gray-400">
                                        Привлекло ли вас что-то конкретное в StoryLegends? Это поможет нам стать лучше.
                                    </p>
                                </div>

                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <h3 className="text-story-gold font-bold mb-2 text-sm">3. Будьте честны</h3>
                                    <p className="text-xs leading-relaxed text-gray-400">
                                        Адекватность и уважение — наши главные приоритеты. Заполняйте данные честно.
                                    </p>
                                </div>

                                <div className="mt-4 text-[10px] text-gray-500 border-t border-white/10 pt-4 italic">
                                    * Рассмотрение занимает 24-48 часов.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ApplicationPage;
