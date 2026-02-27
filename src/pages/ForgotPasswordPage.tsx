import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { authApi } from '../api';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authApi.forgotPassword(email);
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Произошла ошибка. Попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <SEO title="Восстановление пароля" description="Восстановление доступа к аккаунту" />
            <div className="min-h-screen flex items-center justify-center px-4 py-20">
                <div className="w-full max-w-md">
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-story-gold to-transparent opacity-50" />

                        <div className="mb-6 text-center">
                            <h2 className="text-2xl font-bold text-white font-minecraft mb-2">Забыли пароль?</h2>
                            <p className="text-gray-400 text-sm">Введите ваш email, и мы отправим вам ссылку для сброса пароля.</p>
                        </div>

                        {success ? (
                            <div className="text-center space-y-6">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-400 border border-green-500/20">
                                    <Mail className="w-8 h-8" />
                                </div>
                                <div className="bg-green-500/10 border border-green-500/20 text-green-200 px-4 py-3 rounded-xl text-sm">
                                    Письмо отправлено! Проверьте вашу почту (включая папку Спам).
                                </div>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 text-story-gold hover:text-white transition-colors text-sm font-medium"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Вернуться ко входу
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-story-gold/50 focus:bg-white/10 transition-colors text-white placeholder-gray-500"
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-story-gold text-black font-bold py-3 rounded-xl hover:bg-white transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Отправка...' : 'Отправить ссылку'}
                                </button>

                                <div className="text-center pt-2">
                                    <Link
                                        to="/login"
                                        className="text-gray-400 hover:text-white transition-colors text-sm flex items-center justify-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Назад ко входу
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ForgotPasswordPage;
