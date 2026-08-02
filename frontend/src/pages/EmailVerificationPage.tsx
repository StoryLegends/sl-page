import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const EmailVerificationPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const { verifyEmail } = useAuth();
    const navigate = useNavigate();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');

    const hasVerified = React.useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided.');
            return;
        }

        // Prevent double execution in React Strict Mode
        if (hasVerified.current) {
            return;
        }
        hasVerified.current = true;

        const verify = async () => {
            try {
                await verifyEmail(token);
                setStatus('success');
                setMessage('Email verified successfully! Redirecting...');
                setTimeout(() => {
                    navigate('/profile');
                }, 3000);
            } catch (err: any) {
                console.error(err);

                // Handle "Already Verified" case
                const errorMsg = err.response?.data?.error || '';
                if (errorMsg.includes('уже подтвержден') || errorMsg.includes('already verified')) {
                    setStatus('success'); // Treat as success
                    setMessage('Email уже подтвержден! Перенаправляем...');
                    setTimeout(() => {
                        navigate('/profile');
                    }, 3000);
                    return;
                }

                setStatus('error');
                setMessage(errorMsg || 'Failed to verify email. The link may be invalid or expired.');
            }
        };

        verify();
    }, [token, verifyEmail, navigate]);

    return (
        <Layout>
            <SEO title="Email Verification" description="Verifying your email address" />
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-xl text-center">

                    <div className="flex justify-center mb-6">
                        {status === 'loading' && <Loader className="w-16 h-16 text-story-gold animate-spin" />}
                        {status === 'success' && <CheckCircle className="w-16 h-16 text-green-500" />}
                        {status === 'error' && <XCircle className="w-16 h-16 text-red-500" />}
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4 font-minecraft">
                        {status === 'loading' && 'Подтверждение Email'}
                        {status === 'success' && 'Успешно!'}
                        {status === 'error' && 'Ошибка'}
                    </h2>

                    <p className="text-gray-300 mb-6">{message}</p>

                    {status === 'error' && (
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-6 rounded-xl transition-all"
                        >
                            Вернуться ко входу
                        </button>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default EmailVerificationPage;
