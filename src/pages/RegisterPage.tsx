import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { XCircle, Eye, EyeOff } from 'lucide-react';
import apiClient from '../api/client';
import { useGoogleReCaptcha } from 'react19-google-recaptcha-v3';
import { useNotification } from '../context/NotificationContext';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [minecraftNickname, setMinecraftNickname] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [error, setError] = useState('');
    const [settings, setSettings] = useState<any>(null);
    const [settingsLoading, setSettingsLoading] = useState(true);

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await apiClient.get('/api/auth/public/settings');
                setSettings(res.data);
            } catch (err) {
                console.error('Failed to fetch settings', err);
            } finally {
                setSettingsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const { executeRecaptcha } = useGoogleReCaptcha();

    const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!executeRecaptcha) {
            showNotification('reCAPTCHA не готова', 'error');
            return;
        }

        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            showNotification('Пароли не совпадают', 'error');
            return;
        }

        const passwordRegex = /^(?=.*[0-9])(?=.*[\p{Ll}])(?=.*[\p{Lu}])(?=.*[\p{P}\p{S}]).*$/u;
        if (!passwordRegex.test(password)) {
            setError('Пароль должен содержать минимум 8 символов, включая цифру, строчную и заглавную буквы, а также специальный символ');
            showNotification('Слишком простой пароль', 'error');
            return;
        }

        try {
            console.log('Executing reCAPTCHA...');
            const token = await executeRecaptcha('register');

            if (!token) {
                console.error('reCAPTCHA returned null or empty token');
                showNotification('Не удалось получить токен безопасности', 'error');
                return;
            }

            console.log('Registration attempt with token length:', token.length);
            await register({
                username,
                email,
                password,
                minecraftNickname,
                recaptchaToken: token
            });

            showNotification('Регистрация успешна! Проверьте ваш email.', 'success');
            navigate('/login');
        } catch (err: any) {
            console.error('Registration error:', err.response?.data || err.message);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Registration failed.';
            setError(errorMsg);
            showNotification(errorMsg, 'error');
        }
    }, [executeRecaptcha, username, email, password, confirmPassword, minecraftNickname, register, navigate, showNotification]);

    return (
        <Layout>
            <SEO title="Регистрация" description="Создайте аккаунт на StoryLegends" />
            <div className="min-h-screen flex items-center justify-center px-4 py-20">
                <div className="w-full max-w-md">
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-story-gold to-transparent opacity-50" />

                        <h2 className="text-3xl font-bold mb-6 text-center text-white font-minecraft tracking-wider">Регистрация</h2>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
                                {error}
                            </div>
                        )}

                        {settingsLoading ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-story-gold"></div>
                            </div>
                        ) : settings && !settings.registrationOpen ? (
                            <div className="text-center py-10">
                                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                    <XCircle className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Регистрация закрыта</h3>
                                <p className="text-gray-400">На данный момент регистрация новых пользователей временно приостановлена администрацией.</p>
                                <button
                                    onClick={() => navigate('/')}
                                    className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10"
                                >
                                    На главную
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="username">Имя пользователя</label>
                                    <input
                                        type="text"
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-story-gold/50 focus:bg-white/10 transition-colors text-white placeholder-gray-500"
                                        placeholder="Steve"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-story-gold/50 focus:bg-white/10 transition-colors text-white placeholder-gray-500"
                                        placeholder="steve@minecraft.com"
                                        required
                                    />
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="minecraft">Minecraft Nickname</label>
                                    <input
                                        type="text"
                                        id="minecraft"
                                        value={minecraftNickname}
                                        onChange={(e) => setMinecraftNickname(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-story-gold/50 focus:bg-white/10 transition-colors text-white placeholder-gray-500"
                                        placeholder="Steve"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="password">Пароль</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-story-gold/50 focus:bg-white/10 transition-colors text-white placeholder-gray-500 pr-12"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="confirmPassword">Подтвердите пароль</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            id="confirmPassword"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-story-gold/50 focus:bg-white/10 transition-colors text-white placeholder-gray-500 pr-12"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2 ml-1 leading-tight">
                                        Пароль должен содержать минимум <span className="text-gray-300">8 символов</span>, включая <span className="text-gray-300">цифру</span>, <span className="text-gray-300">строчную</span> и <span className="text-gray-300">заглавную</span> буквы, а также <span className="text-gray-300">специальный символ</span>.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-story-gold to-story-gold-dark hover:from-story-gold-light hover:to-story-gold text-black font-bold py-3.5 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-story-gold/20 mt-4"
                                >
                                    Создать аккаунт
                                </button>

                                <div className="text-[10px] text-gray-500 text-center mt-3">
                                    This site is protected by reCAPTCHA and the Google{' '}
                                    <a href="https://policies.google.com/privacy" className="text-gray-400 hover:text-white" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and{' '}
                                    <a href="https://policies.google.com/terms" className="text-gray-400 hover:text-white" target="_blank" rel="noopener noreferrer">Terms of Service</a> apply.
                                </div>
                            </form>
                        )}

                        <p className="mt-6 text-center text-gray-400 text-sm">
                            Уже есть аккаунт? <a href="/login" className="text-story-gold hover:text-story-gold-light hover:underline transition-colors">Войти</a>
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default RegisterPage;
