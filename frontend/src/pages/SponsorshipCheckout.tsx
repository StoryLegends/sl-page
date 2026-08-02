import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import SEO from '../components/SEO';

const SponsorshipCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const checkoutRef = useRef<any>(null);

  const clientSecret = location.state?.clientSecret;
  const planInfo = location.state?.planInfo || '';

  useEffect(() => {
    if (!clientSecret) {
      navigate('/sponsorship', { replace: true });
      return;
    }

    let checkoutInstance: any = null;

    const initStripe = async () => {
      try {
        const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_dummy');
        if (!stripe) {
          setError('Не удалось загрузить платёжную систему.');
          setLoading(false);
          return;
        }

        // Wait for container to be available
        await new Promise(resolve => setTimeout(resolve, 100));

        const container = document.getElementById('checkout-container');
        if (!container) {
          setError('Контейнер для оплаты не найден.');
          setLoading(false);
          return;
        }

        checkoutInstance = await (stripe as any).createEmbeddedCheckoutPage({
          clientSecret
        });
        checkoutInstance.mount('#checkout-container');
        checkoutRef.current = checkoutInstance;
        setLoading(false);
      } catch (e) {
        console.error('Failed to mount Stripe checkout:', e);
        setError('Произошла ошибка при загрузке формы оплаты.');
        setLoading(false);
      }
    };

    initStripe();

    return () => {
      if (checkoutRef.current) {
        checkoutRef.current.destroy();
        checkoutRef.current = null;
      }
    };
  }, [clientSecret, navigate]);

  if (!clientSecret) {
    return null;
  }

  return (
    <>
      <SEO title="Оплата спонсорства — StoryLegends" description="Безопасная оплата спонсорства через Stripe" />
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        {/* Header */}
        <div className="bg-[#0d0d0d] border-b border-white/10 px-4 md:px-8 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button
              onClick={() => navigate('/sponsorship')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Назад к выбору тарифа</span>
            </button>
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>Защищённое соединение</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-start px-4 py-6 md:py-10">
          <div className="w-full max-w-2xl">
            {/* Title */}
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-white font-minecraft mb-2">
                Оплата спонсорства
              </h1>
              {planInfo && (
                <p className="text-gray-400 text-sm md:text-base">{planInfo}</p>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-[#FFD700] mb-4" />
                <p className="text-gray-400 text-sm">Загрузка формы оплаты...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => navigate('/sponsorship')}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm font-medium"
                >
                  Вернуться к спонсорству
                </button>
              </div>
            )}

            {/* Stripe Checkout Container */}
            <div
              id="checkout-container"
              className={`bg-white/[0.03] rounded-2xl border border-white/10 min-h-[500px] overflow-hidden ${loading ? 'hidden' : ''}`}
            />

            {/* Footer */}
            <div className="mt-6 text-center space-y-3">
              <p className="text-gray-500 text-xs">
                Оплата производится через защищённый шлюз Stripe. Мы не храним данные вашей карты.
              </p>
              <p className="text-gray-400 text-xs">
                Из Украины или Европы?{' '}
                <a
                  href="https://discord.com/channels/1078405146557558824/1475513944448827492"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4DD2FF] hover:text-white underline decoration-[#4DD2FF]/40 hover:decoration-white transition-colors"
                >
                  Оплатить прямым переводом (без комиссии)
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SponsorshipCheckout;
