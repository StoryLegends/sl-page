import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { User as UserIcon, Settings, Edit3, ShieldCheck, Mail, ExternalLink, LogOut, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { applicationsApi, usersApi, totpApi, authApi } from '../api';
import { useNotification } from '../context/NotificationContext';
import UserAvatar from '../components/UserAvatar';
import BoosterBadge from '../components/BoosterBadge';


const ProfilePage = () => {
    const { user, isAdmin, refreshUser } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (user && user.discordVerified && !user.inDiscordServer) {
            interval = setInterval(() => {
                refreshUser();
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [user?.inDiscordServer, user?.discordVerified, refreshUser]);

    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        discordNickname: user?.discordNickname || '',
        minecraftNickname: user?.minecraftNickname || '',
        bio: user?.bio || ''
    });

    const [showBanModal, setShowBanModal] = useState(false);

    const [totpSetupData, setTotpSetupData] = useState<{ secret: string; qrCodeDataUri: string } | null>(null);
    const [totpVerifyCode, setTotpVerifyCode] = useState('');
    const [showTotpModal, setShowTotpModal] = useState(false);

    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [myApp, setMyApp] = useState<any>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username,
                email: user.email || '',
                discordNickname: user.discordNickname || '',
                minecraftNickname: user.minecraftNickname || '',
                bio: user.bio || ''
            });

            if (user.banned) {
                setShowBanModal(true);
            }
        }

        // Handle Discord callback params
        const params = new URLSearchParams(window.location.search);
        const discordStatus = params.get('discord');

        if (discordStatus) {
            if (discordStatus === 'success') {
                const name = params.get('discordName');
                showNotification(`Discord ${name ? name : ''} успешно привязан!`, 'success');
            } else if (discordStatus === 'already_connected') {
                showNotification('Этот Discord аккаунт уже привязан к другому профилю.', 'warning');
            } else if (discordStatus === 'error') {
                const reason = params.get('reason');
                const errorMap: Record<string, string> = {
                    'discord_already_linked': 'Этот Discord аккаунт уже привязан к другому пользователю.',
                    'discord_nickname_mismatch': 'Линк в Discord не совпадает с вашим текущим ником.',
                    'token_exchange_failed': 'Не удалось связаться с Discord. Попробуйте позже.',
                    'invalid_state': 'Ошибка сессии. Пожалуйста, попробуйте еще раз.',
                    'user_not_found': 'Пользователь не найден.',
                    'server_error': 'Ошибка сервера Discord. Попробуйте позже.'
                };
                showNotification(`Ошибка привязки: ${errorMap[reason || ''] || reason || 'неизвестная ошибка'}`, 'error');
            }
            // Clean up URL
            navigate('/profile', { replace: true });
        }
        const fetchApps = async () => {
            try {
                const res = await applicationsApi.getMy();
                setMyApp(res.current);
            } catch (err) {
                console.error('Failed to fetch my apps', err);
            }
        };

        if (user) {
            fetchApps();
        }

    }, [user, isAdmin, navigate, showNotification]);

    const handleDiscordLink = async () => {
        try {
            const { url } = await authApi.discordAuthorize();
            window.location.href = url;
        } catch (err) {
            console.error(err);
            showNotification('Не удалось инициировать привязку Discord', 'error');
        }
    };

    const handleDiscordDisconnect = async () => {
        if (!confirm('Вы уверены, что хотите отвязать Discord? Вы не сможете подавать заявки до повторной привязки.')) return;
        try {
            await authApi.discordDisconnect();
            showNotification('Discord успешно отвязан', 'success');
            refreshUser();
        } catch (err) {
            console.error(err);
            showNotification('Ошибка при отвязке Discord', 'error');
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        if (user?.discordVerified && formData.discordNickname !== user.discordNickname) {
            if (!confirm('Изменение Discord ника приведет к сбросу верификации Discord. Вы уверены?')) {
                return;
            }
        }

        try {
            const dataToUpdate = { ...formData };
            if (!dataToUpdate.discordNickname) delete (dataToUpdate as any).discordNickname;
            if (!dataToUpdate.minecraftNickname) delete (dataToUpdate as any).minecraftNickname;

            await usersApi.updateMe(dataToUpdate);
            setIsEditing(false);
            showNotification('Профиль успешно обновлен!', 'success');
            refreshUser();
        } catch (err: any) {
            console.error('Failed to update profile', err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Не удалось обновить профиль.';
            showNotification(errorMsg, 'error');
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showNotification('Пароли не совпадают!', 'warning');
            return;
        }
        try {
            await usersApi.updateMe({
                newPassword: passwordData.newPassword,
                oldPassword: passwordData.oldPassword
            });

            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            showNotification('Пароль успешно обновлен!', 'success');
        } catch (err: any) {
            console.error('Failed to update password', err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Не удалось обновить пароль. Возможно, функция временно недоступна.';
            showNotification(errorMsg, 'error');
        }
    };

    const handleEnableTotp = async () => {
        try {
            const res = await totpApi.setup();
            setTotpSetupData(res);
            setShowTotpModal(true);
        } catch (err) {
            console.error(err);
            showNotification('Failed to start TOTP setup', 'error');
        }
    };

    const handleVerifyTotp = async () => {
        try {
            await totpApi.verify(totpVerifyCode);
            showNotification('2FA успешно активирована!', 'success');
            setShowTotpModal(false);
            setTotpSetupData(null);
            setTotpVerifyCode('');
            refreshUser();
        } catch (err) {
            console.error(err);
            showNotification('Неверный код', 'error');
        }
    };

    const handleDisableTotp = async () => {
        const code = prompt('Введите код из приложения для отключения 2FA:');
        if (!code) return;
        try {
            await totpApi.disable(code);
            showNotification('2FA успешно отключена', 'success');
            refreshUser();
        } catch (err) {
            console.error(err);
            alert('Ошибка отключения 2FA');
        }
    };



    if (!user) return (
        <Layout>
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-story-gold"></div>
            </div>
        </Layout>
    );

    return (
        <Layout>
            <SEO title="Профиль" description="Ваш профиль игрока" />
            <div className="min-h-screen pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto">

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Sidebar / Profile Card */}
                        <div className="w-full md:w-1/3 space-y-6">
                            <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-story-gold to-transparent opacity-50" />

                                <div className="relative group mx-auto mb-4">
                                    <UserAvatar
                                        avatarUrl={user.avatarUrl}
                                        username={user.username}
                                        size="xl"
                                        className="mx-auto"
                                    />
                                </div>

                                <h2 className="text-2xl font-bold font-minecraft text-white mb-2 text-center">
                                    {user.username}
                                </h2>

                                <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                                    {user.isBoosted && <BoosterBadge />}
                                    {user.badges && user.badges.map(badge => (
                                        <div key={badge.id} className="group/badge relative flex items-center justify-center">
                                            <div
                                                className="w-8 h-8 flex items-center justify-center transition-all duration-300 hover:scale-120 active:scale-95 cursor-help"
                                                style={{ color: badge.color }}
                                            >
                                                <div className="w-5 h-5 badge-icon" dangerouslySetInnerHTML={{ __html: badge.svgIcon }} />
                                            </div>
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider text-white whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none z-[100] shadow-2xl">
                                                {badge.name}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-black" />
                                            </div>
                                        </div>
                                    ))}
                                    {user.banned && <span className="bg-red-900/50 text-red-200 px-2 py-0.5 rounded text-xs border border-red-500/20 font-bold uppercase">BANNED</span>}
                                </div>
                                {user.banned && user.banReason && (
                                    <p className="text-[10px] text-red-500/80 font-bold uppercase tracking-widest mt-2 px-4 leading-relaxed">
                                        Причина: {user.banReason}
                                    </p>
                                )}
                            </div>

                            {/* Navigation Tabs (Vertical on desktop) */}
                            <div className="bg-black/40 border border-white/10 rounded-2xl p-2 backdrop-blur-md shadow-xl flex flex-col gap-1">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 font-medium ${activeTab === 'profile' ? 'bg-story-gold text-black shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <UserIcon className="w-4 h-4" />
                                    Профиль
                                </button>
                                <button
                                    onClick={() => setActiveTab('settings')}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 font-medium ${activeTab === 'settings' ? 'bg-story-gold text-black shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <Settings className="w-4 h-4" />
                                    Настройки аккаунта
                                </button>
                            </div>

                            {/* Application Status Card */}
                            {myApp && (
                                <div className="bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl animate-fadeIn">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Статус заявки</h4>
                                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${myApp.status === 'ACCEPTED' ? 'bg-green-500/20 text-green-400 border border-green-500/10' :
                                                myApp.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/10' :
                                                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/10'}`}>
                                                {myApp.status === 'ACCEPTED' && <CheckCircle2 className="w-3 h-3" />}
                                                {myApp.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                                                {myApp.status === 'PENDING' && <Clock className="w-3 h-3" />}
                                                {myApp.status || 'PENDING'}
                                            </span>
                                            <span className="text-[10px] text-gray-600 font-mono">#{String(myApp.id).slice(0, 8)}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            {myApp.status === 'ACCEPTED' ? 'Ваша заявка принята! Теперь вы имеете статус игрока.' :
                                                myApp.status === 'REJECTED' ? 'К сожалению, ваша заявка была отклонена.' :
                                                    'Ваша заявка находится на рассмотрении администрации.'}
                                        </p>
                                        <button
                                            onClick={() => navigate('/application')}
                                            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-300 transition-all"
                                        >
                                            История заявок
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Main Content Area */}
                        <div className="w-full md:w-2/3">
                            <div className="bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-xl relative min-h-[400px]">
                                {activeTab === 'profile' ? (
                                    // PROFILE VIEW
                                    <div className="space-y-8 animate-fadeIn">
                                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                            <h3 className="text-xl font-bold text-white">Информация о профиле</h3>
                                            {!isEditing && (
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-story-gold/10 hover:bg-story-gold/20 text-story-gold border border-story-gold/30 rounded-xl transition-all font-bold text-sm"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                    Редактировать
                                                </button>
                                            )}
                                        </div>

                                        {/* Discord Verification Warning - Only show if NOT verified */}
                                        {!user.discordVerified && (
                                            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                        <ShieldCheck className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-indigo-200 font-bold text-sm uppercase tracking-wider">Discord не привязан</h4>
                                                        <p className="text-gray-400 text-xs">Привяжите Discord через OAuth2 для подачи заявок.</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleDiscordLink}
                                                    className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-sm font-bold rounded-lg border border-indigo-500/20 transition-all uppercase tracking-wider whitespace-nowrap flex items-center gap-2"
                                                >
                                                    Привязать Discord <ExternalLink className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Email Verification Warning */}
                                        {!user.emailVerified && (
                                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                                                        <Mail className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-yellow-200 font-bold text-sm uppercase tracking-wider">Email не подтвержден</h4>
                                                        <p className="text-yellow-500/80 text-xs text-left">Подтвердите почту для доступа ко всем функциям.</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={async (e) => {
                                                        const btn = e.currentTarget;
                                                        if (!user.email) return;
                                                        try {
                                                            btn.disabled = true;
                                                            btn.textContent = 'Отправка...';
                                                            await authApi.resendVerification({ email: user.email });
                                                            btn.textContent = 'Отправлено!';
                                                            setTimeout(() => {
                                                                btn.disabled = false;
                                                                btn.textContent = 'Выслать письмо';
                                                            }, 60000);
                                                        } catch (err) {
                                                            console.error(err);
                                                            btn.textContent = 'Ошибка';
                                                            btn.disabled = false;
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 text-sm font-bold rounded-lg border border-yellow-500/20 transition-all uppercase tracking-wider whitespace-nowrap"
                                                >
                                                    Выслать письмо
                                                </button>
                                            </div>
                                        )}

                                        {/* Discord Server Warning */}
                                        {!user.inDiscordServer && (
                                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn mt-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                                                        <AlertCircle className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-red-300 font-bold text-sm uppercase tracking-wider">Вы не на сервере Discord</h4>
                                                        <p className="text-red-400/80 text-xs text-left">Для игры на сервере необходимо находиться в нашем Discord сервере.</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={import.meta.env.VITE_DISCORD_SERVER_URL || "#"}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-sm font-bold rounded-lg border border-red-500/20 transition-all uppercase tracking-wider whitespace-nowrap flex items-center gap-2"
                                                >
                                                    Зайти в Discord <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                        )}

                                        {!isEditing ? (
                                            // VIEW MODE
                                            <div className="grid grid-cols-1 gap-8 animate-fadeIn">
                                                <div className="space-y-4">
                                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block">О себе (Bio)</span>
                                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 min-h-[120px]">
                                                        <p className="text-gray-300 leading-relaxed italic whitespace-pre-wrap">
                                                            {user.bio || "Пользователь еще ничего не рассказал о себе."}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col gap-2">
                                                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Discord Tag</span>
                                                        {user.discordVerified ? (
                                                            <p className="text-white font-bold text-lg font-mono">{user.discordNickname || '—'}</p>
                                                        ) : (
                                                            <p className="text-red-400 text-sm font-bold mt-1">Привяжите Discord 👆</p>
                                                        )}
                                                    </div>
                                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col gap-2">
                                                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Minecraft Nickname</span>
                                                        <p className="text-white font-bold text-lg font-mono">{user.minecraftNickname || '—'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // EDIT MODE
                                            <form onSubmit={handleUpdateProfile} className="space-y-6 animate-slideUp">
                                                <div className="grid grid-cols-1 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-300 mb-2">О себе (Bio)</label>
                                                        <textarea
                                                            value={formData.bio}
                                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-story-gold/50 focus:bg-white/10 transition-colors text-white resize-none h-24"
                                                            placeholder="Расскажите о себе..."
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center justify-between">
                                                                <span className="flex items-center gap-2">
                                                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Discord Tag
                                                                </span>
                                                                {user.discordVerified && !user.isPlayer && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleDiscordDisconnect}
                                                                        className="text-[10px] text-red-400/80 hover:text-red-400 font-black uppercase tracking-widest flex items-center gap-1 transition-colors"
                                                                    >
                                                                        Отвязать <LogOut className="w-3 h-3" />
                                                                    </button>
                                                                )}
                                                            </label>
                                                            {user.isPlayer && !user.discordVerified ? (
                                                                <div className="w-full px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center justify-center">
                                                                    Привяжите Discord выше 👆
                                                                </div>
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    value={formData.discordNickname}
                                                                    onChange={(e) => setFormData({ ...formData, discordNickname: e.target.value })}
                                                                    className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-story-gold/50 focus:bg-white/10 transition-colors text-white ${user.discordVerified || user.isPlayer ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    placeholder="user#1234"
                                                                    disabled={user.discordVerified || user.isPlayer}
                                                                    title={user.isPlayer ? "Игрокам запрещено изменять никнейм вручную" : user.discordVerified ? "Изменить никнейм можно только после отвязки" : ""}
                                                                />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                                                <Mail className="w-3.5 h-3.5 text-story-gold" /> Minecraft Nickname
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={formData.minecraftNickname}
                                                                onChange={(e) => setFormData({ ...formData, minecraftNickname: e.target.value })}
                                                                className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-story-gold/50 focus:bg-white/10 transition-colors text-white ${user.isPlayer ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                placeholder="Steve"
                                                                disabled={user.isPlayer}
                                                                title={user.isPlayer ? "Игрокам запрещено изменять никнеймы" : ""}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsEditing(false);
                                                            // Reset form data to current user data
                                                            setFormData({
                                                                ...formData,
                                                                discordNickname: user?.discordNickname || '',
                                                                minecraftNickname: user?.minecraftNickname || '',
                                                                bio: user?.bio || ''
                                                            });
                                                        }}
                                                        className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border border-white/10"
                                                    >
                                                        Отмена
                                                    </button>
                                                    <button type="submit" className="bg-story-gold text-black font-bold py-2 px-8 rounded-xl hover:bg-story-gold-light transition-colors shadow-lg">
                                                        Сохранить изменения
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                ) : (
                                    // ACCOUNT SETTINGS (Email, Password, 2FA)
                                    <div className="space-y-8 animate-fadeIn">
                                        <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Настройки аккаунта</h3>

                                        {/* Security: Email & Password */}
                                        <div className="space-y-6">
                                            {/* Email Change Section */}
                                            <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                                                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                    <span className="text-gray-400">✉️</span> Смена Email
                                                </h4>
                                                <div className="flex flex-col gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-400 mb-1">Текущий Email</label>
                                                        <div className="text-white font-mono bg-black/30 px-3 py-2 rounded-lg border border-white/10 inline-block">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                    {/* In a real app, you would have a form here to request email change */}
                                                    <p className="text-xs text-gray-500">
                                                        Для смены email, пожалуйста, обратитесь к администрации через Discord.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Password Change Section */}
                                            <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                                                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                    <span className="text-gray-400">🔑</span> Смена пароля
                                                </h4>
                                                <form onSubmit={handleUpdatePassword} className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-300 mb-1">Текущий пароль</label>
                                                        <input
                                                            type="password"
                                                            value={passwordData.oldPassword}
                                                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                                            className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-story-gold/50 text-white"
                                                            placeholder="Текущий пароль"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-300 mb-1">Новый пароль</label>
                                                        <input
                                                            type="password"
                                                            value={passwordData.newPassword}
                                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                            className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-story-gold/50 text-white"
                                                            placeholder="••••••••"
                                                            minLength={6}
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-300 mb-1">Подтвердите пароль</label>
                                                        <input
                                                            type="password"
                                                            value={passwordData.confirmPassword}
                                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                            className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:border-story-gold/50 text-white"
                                                            placeholder="••••••••"
                                                            minLength={6}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex justify-end pt-2">
                                                        <button
                                                            type="submit"
                                                            disabled={!passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Обновить пароль
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>

                                        {/* Security: 2FA */}
                                        <div className="border-t border-white/10 pt-6">
                                            <h4 className="text-lg font-bold text-white mb-4">Двухфакторная аутентификация</h4>
                                            <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="text-white font-medium mb-1">Status: {user.totpEnabled ? <span className="text-green-400">Enabled</span> : <span className="text-gray-400">Disabled</span>}</p>
                                                    <p className="text-gray-400 text-sm">Protect your account with an extra layer of security.</p>
                                                </div>
                                                {user.totpEnabled ? (
                                                    <button
                                                        onClick={handleDisableTotp}
                                                        className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/20 hover:bg-red-500/30 transition-colors font-medium text-sm"
                                                    >
                                                        Отключить
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={handleEnableTotp}
                                                        className="px-4 py-2 bg-story-gold/20 text-story-gold rounded-lg border border-story-gold/20 hover:bg-story-gold/30 transition-colors font-medium text-sm"
                                                    >
                                                        Настроить
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Ban Notification Modal */}
            {showBanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-fadeIn">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                <span className="text-3xl">⚠️</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Аккаунт заблокирован</h3>
                            <p className="text-gray-400 text-sm">
                                Ваш аккаунт имеет статус <span className="text-red-400 font-bold">BANNED</span>.
                            </p>
                        </div>

                        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 mb-6">
                            <p className="text-xs text-red-300 uppercase font-bold mb-1">Причина блокировки:</p>
                            <p className="text-white italic">{user?.banReason || "Причина не указана"}</p>
                        </div>

                        <button
                            onClick={() => setShowBanModal(false)}
                            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors shadow-lg hover:shadow-red-600/20"
                        >
                            Понятно
                        </button>
                    </div>
                </div>
            )}

            {/* TOTP Setup Modal */}
            {showTotpModal && totpSetupData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-story-gold/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-fadeIn">
                        <h3 className="text-xl font-bold text-white mb-4 text-center">Настройка 2FA</h3>

                        <div className="bg-white p-4 rounded-xl mb-4 flex justify-center">
                            <img src={totpSetupData.qrCodeDataUri} alt="QR Code" className="w-48 h-48" />
                        </div>

                        <p className="text-gray-400 text-sm mb-4 text-center">
                            Отсканируйте QR-код в Google Authenticator или Authy.
                            <br />
                            Секретный ключ: <code className="bg-black/50 px-1 rounded text-story-gold">{totpSetupData.secret}</code>
                        </p>

                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Введите код (6 цифр)"
                                value={totpVerifyCode}
                                onChange={(e) => setTotpVerifyCode(e.target.value)}
                                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-center tracking-widest text-xl focus:border-story-gold/50 outline-none"
                                maxLength={6}
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleVerifyTotp}
                                className="flex-1 py-2 bg-story-gold hover:bg-story-gold-light text-black font-bold rounded-xl transition-colors"
                            >
                                Подтвердить
                            </button>
                            <button
                                onClick={() => { setShowTotpModal(false); setTotpSetupData(null); }}
                                className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default ProfilePage;
