import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { useNotification } from '../context/NotificationContext';
import { useGoogleReCaptcha } from 'react19-google-recaptcha-v3';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [totpCode, setTotpCode] = useState('');
    const [totpRequired, setTotpRequired] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [error, setError] = useState('');

    const { executeRecaptcha } = useGoogleReCaptcha();

    const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!executeRecaptcha) {
            showNotification('reCAPTCHA не готова', 'error');
            return;
        }

        try {
            console.log('Executing reCAPTCHA for login...');
            const token = await executeRecaptcha('login');

            if (!token) {
                console.error('reCAPTCHA returned null or empty token');
                showNotification('Не удалось получить токен безопасности', 'error');
                return;
            }

            console.log('Login attempt with token length:', token.length);
            await login({
                username,
                password,
                totpCode: totpRequired ? totpCode : undefined,
                recaptchaToken: token
            });

            showNotification(`Добро пожаловать, ${username}!`, 'success');
            navigate('/profile');
        } catch (err: any) {
            console.error('Login error:', err);

            if (err.totpRequired) {
                setTotpRequired(true);
                showNotification('Введите код 2FA', 'info');
                return;
            }

            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Ошибка входа. Проверьте данные.';
            setError(errorMsg);
            showNotification(errorMsg, 'error');
        }
    }, [executeRecaptcha, username, password, totpCode, totpRequired, login, navigate, showNotification]);

    return (
        <Layout>
            <SEO title="Вход" description="Войдите в свой аккаунт StoryLegends" />
            <div className="min-h-screen flex items-center justify-center px-4 py-20">
                <div className="w-full max-w-md">
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-story-gold to-transparent opacity-50" />

                        <h2 className="text-3xl font-bold mb-6 text-center text-white font-minecraft tracking-wider">Вход</h2>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {!totpRequired ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="username">Никнейм</label>
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
                                        <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="password">Пароль</label>
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
                                    <div className="flex justify-end">
                                        <Link
                                            to="/forgot-password"
                                            className="text-xs text-story-gold hover:text-white transition-colors"
                                        >
                                            Забыли пароль?
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="totp">Cod 2FA</label>
                                    <input
                                        type="text"
                                        id="totp"
                                        value={totpCode}
                                        onChange={(e) => setTotpCode(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-story-gold/50 focus:bg-white/10 transition-colors text-white placeholder-gray-500 text-center tracking-widest text-xl"
                                        placeholder="000000"
                                        required
                                        autoFocus
                                        maxLength={6}
                                    />
                                    <p className="text-xs text-gray-500 mt-2 text-center">Введите 6-значный код из приложения аутентификации</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-story-gold to-story-gold-dark hover:from-story-gold-light hover:to-story-gold text-black font-bold py-3.5 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-story-gold/20 mt-2"
                            >
                                {totpRequired ? 'Подтвердить' : 'Войти'}
                            </button>

                            <div className="text-[10px] text-gray-500 text-center mt-3">
                                This site is protected by reCAPTCHA and the Google{' '}
                                <a href="https://policies.google.com/privacy" className="text-gray-400 hover:text-white" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and{' '}
                                <a href="https://policies.google.com/terms" className="text-gray-400 hover:text-white" target="_blank" rel="noopener noreferrer">Terms of Service</a> apply.
                            </div>
                        </form>

                        <p className="mt-6 text-center text-gray-400 text-sm">
                            Нет аккаунта? <Link to="/register" className="text-story-gold hover:text-story-gold-light hover:underline transition-colors">Зарегистрироваться</Link>
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default LoginPage;
