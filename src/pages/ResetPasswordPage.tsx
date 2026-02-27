import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { authApi } from '../api';
import { KeyRound, CheckCircle, Eye, EyeOff } from 'lucide-react';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Недействительная ссылка. Убедитесь, что вы перешли по правильной ссылке.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setError('');

        if (passwords.newPassword !== passwords.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        if (passwords.newPassword.length < 6) {
            setError('Пароль должен быть не менее 6 символов');
            return;
        }

        if (!token) {
            setError('Недействительная ссылка.');
            return;
        }

        setLoading(true);

        try {
            await authApi.resetPassword({ token, newPassword: passwords.newPassword });
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            console.error(err);
            let msg = 'Не удалось сбросить пароль.';
            if (err.response?.data) {
                if (err.response.data.message) {
                    msg = err.response.data.message;
                } else if (typeof err.response.data === 'string') {
                    msg = err.response.data;
                } else {
                    msg = JSON.stringify(err.response.data);
                }
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <SEO title="Сброс пароля" description="Установка нового пароля" />
            <div className="min-h-screen flex items-center justify-center px-4 py-20">
                <div className="w-full max-w-md">
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-story-gold to-transparent opacity-50" />

                        <div className="mb-6 text-center">
                            <div className="w-16 h-16 bg-story-gold/10 rounded-full flex items-center justify-center mx-auto text-story-gold mb-4 border border-story-gold/20">
                                <KeyRound className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-white font-minecraft mb-2">Новый пароль</h2>
                        </div>

                        {success ? (
                            <div className="text-center space-y-6 animate-fadeIn">
                                <div className="bg-green-500/10 border border-green-500/20 text-green-200 px-4 py-4 rounded-xl flex flex-col items-center gap-3">
                                    <CheckCircle className="w-8 h-8 text-green-400" />
                                    <p className="font-bold">Пароль успешно изменен!</p>
                                    <p className="text-sm opacity-80">Перенаправление на страницу входа...</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Новый пароль</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="newPassword"
                                            value={passwords.newPassword}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setPasswords(prev => ({ ...prev, newPassword: val }));
                                            }}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-story-gold/50 focus:bg-white/10 transition-colors text-white placeholder-gray-500 pr-10"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            disabled={!token}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Подтвердите пароль</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={passwords.confirmPassword}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setPasswords(prev => ({ ...prev, confirmPassword: val }));
                                            }}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-story-gold/50 focus:bg-white/10 transition-colors text-white placeholder-gray-500 pr-10"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            disabled={!token}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !token}
                                    className="w-full bg-story-gold text-black font-bold py-3 rounded-xl hover:bg-white transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Сохранение...' : 'Сменить пароль'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ResetPasswordPage;
