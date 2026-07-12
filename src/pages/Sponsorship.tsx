import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { Check, Heart, X, Sparkles, Shield, Crown, FileText, Info, ShieldAlert, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { message } from 'antd';
import { Navigate, useNavigate } from 'react-router-dom';

const Level1Icon = () => (
  <svg viewBox="0 0 758 758" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 md:w-24 md:h-24 drop-shadow-[0_0_15px_rgba(0,191,255,0.5)]">
    <path d="M438.066 297.502C440.75 308.251 449.14 316.646 459.888 319.337L696.23 378.5L459.888 437.663C449.14 440.354 440.75 448.749 438.066 459.498L379 696.076L319.934 459.498C317.25 448.749 308.86 440.354 298.112 437.663L61.7695 378.5L298.112 319.337C308.86 316.646 317.25 308.251 319.934 297.502L379 60.9238L438.066 297.502Z" stroke="#00BFFF" strokeWidth="30" />
    <path d="M379 221L410.6 347.4L537 379L410.6 410.6L379 537L347.4 410.6L221 379L347.4 347.4L379 221Z" fill="#77D8F9" />
  </svg>
);

const Level2Icon = () => (
  <svg viewBox="0 0 758 758" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 md:w-24 md:h-24 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
    <path d="M438.066 297.502C440.75 308.251 449.14 316.646 459.888 319.337L696.23 378.5L459.888 437.663C449.14 440.354 440.75 448.749 438.066 459.498L379 696.076L319.934 459.498C317.25 448.749 308.86 440.354 298.112 437.663L61.7695 378.5L298.112 319.337C308.86 316.646 317.25 308.251 319.934 297.502L379 60.9238L438.066 297.502Z" stroke="#FFD700" strokeWidth="30" />
    <path d="M379 221L410.6 347.4L537 379L410.6 410.6L379 537L347.4 410.6L221 379L347.4 347.4L379 221Z" fill="#FFE44D" />
  </svg>
);

const Level3Icon = () => (
  <svg viewBox="0 0 758 758" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 md:w-24 md:h-24 drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]">
    <path d="M438.066 297.502C440.75 308.251 449.14 316.646 459.888 319.337L696.23 378.5L459.888 437.663C449.14 440.354 440.75 448.749 438.066 459.498L379 696.076L319.934 459.498C317.25 448.749 308.86 440.354 298.112 437.663L61.7695 378.5L298.112 319.337C308.86 316.646 317.25 308.251 319.934 297.502L379 60.9238L438.066 297.502Z" stroke="#FFD700" strokeWidth="30" />
    <path d="M379 221L410.6 347.4L537 379L410.6 410.6L379 537L347.4 410.6L221 379L347.4 347.4L379 221Z" fill="#77D8F9" />
  </svg>
);

const defaultPricing: Record<number, Array<{ days: string, price: string, note: string | null, badge?: string, isSubscription?: boolean }>> = {
  1: [
    { days: '30 дней', price: '199₽', note: '199 ₽ / месяц (Автопродление)', isSubscription: true },
    { days: '60 дней', price: '349₽', note: 'скидка 12%', badge: 'ВЫГОДНО', isSubscription: false },
    { days: '90 дней', price: '499₽', note: 'скидка 16%', badge: 'ЛУЧШАЯ ЦЕНА', isSubscription: false },
  ],
  2: [
    { days: '30 дней', price: '349₽', note: '349 ₽ / месяц (Автопродление)', isSubscription: true },
    { days: '60 дней', price: '629₽', note: 'скидка 10%', badge: 'ВЫГОДНО', isSubscription: false },
    { days: '90 дней', price: '899₽', note: 'скидка 14%', badge: 'ЛУЧШАЯ ЦЕНА', isSubscription: false },
  ],
  3: [
    { days: '30 дней', price: '599₽', note: '599 ₽ / месяц (Автопродление)', isSubscription: true },
    { days: '60 дней', price: '1049₽', note: 'скидка 12%', badge: 'ВЫГОДНО', isSubscription: false },
    { days: '90 дней', price: '1499₽', note: 'скидка 17%', badge: 'ЛУЧШАЯ ЦЕНА', isSubscription: false },
  ]
};

const Sponsorship = () => {
  const { hasFeature, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number>(0);
  const [activeCard, setActiveCard] = useState<number>(2); // Default focus to Level 3
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState<boolean>(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [pricingData, setPricingData] = useState(defaultPricing);
  const [publicSettings, setPublicSettings] = useState<any>(null);

  // Load public settings for goals/top donators
  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const response = await apiClient.get('/api/settings/public');
        setPublicSettings(response.data);
      } catch (err) {
        console.error('Failed to load public settings:', err);
      }
    };
    fetchPublicSettings();
  }, []);

  // Filtered plans for the selected level and recurrence type
  const activePlans = selectedLevel && pricingData[selectedLevel]
    ? pricingData[selectedLevel].filter(p => !!p.isSubscription === isRecurring)
    : [];

  // Reset selected plan when active plans change
  useEffect(() => {
    setSelectedPlan(0);
  }, [isRecurring, selectedLevel]);

  // Load plans from database on mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await apiClient.get('/api/sponsorship/plans');
        const dbPlans = response.data;
        if (Array.isArray(dbPlans) && dbPlans.length > 0) {
          const grouped: Record<number, any[]> = { 1: [], 2: [], 3: [] };
          dbPlans.forEach((plan: any) => {
            if (plan.active) {
              if (!grouped[plan.level]) grouped[plan.level] = [];
              
              let badge = undefined;
              if (plan.days === 60) badge = 'ВЫГОДНО';
              if (plan.days === 90) badge = 'ЛУЧШАЯ ЦЕНА';

              let note = plan.note;
              if (!note) {
                note = plan.isSubscription ? `${plan.price} ₽ / месяц (Автопродление)` : '(Разовый платёж)';
              }

              grouped[plan.level].push({
                days: `${plan.days} дней`,
                price: `${plan.price}₽`,
                note: note,
                badge: badge,
                isSubscription: plan.isSubscription
              });
            }
          });

          // Sort plans within each level by days duration
          Object.keys(grouped).forEach((lvlStr) => {
            const lvl = parseInt(lvlStr, 10);
            grouped[lvl].sort((a, b) => {
              const aDays = parseInt(a.days.split(' ')[0], 10);
              const bDays = parseInt(b.days.split(' ')[0], 10);
              return aDays - bDays;
            });
          });

          if (grouped[1].length > 0 || grouped[2].length > 0 || grouped[3].length > 0) {
            setPricingData(grouped);
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic pricing plans:', err);
      }
    };
    fetchPlans();
  }, []);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (selectedLevel) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [selectedLevel]);



  // Center the third card on load for mobile
  useEffect(() => {
    if (carouselRef.current && window.innerWidth < 768) {
      const container = carouselRef.current;
      setTimeout(() => {
        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
      }, 300);
    }
  }, []);

  const handleStripeCheckout = async () => {
    if (!selectedLevel || activePlans.length === 0) return;
    setCheckoutLoading(true);
    try {
      const plan = activePlans[selectedPlan];
      const priceVal = parseInt(plan.price.replace('₽', ''), 10);
      const daysVal = parseInt(plan.days.split(' ')[0], 10);

      const response = await apiClient.post('/api/sponsorship/checkout', {
        level: selectedLevel,
        days: daysVal,
        price: priceVal,
        isRecurring: isRecurring
      });

      // Navigate to full-page checkout
      navigate('/sponsorship/checkout', {
        state: {
          clientSecret: response.data.clientSecret,
          levelName: `Уровень ${selectedLevel}`,
          planInfo: `${plan.days} — ${plan.price} (${isRecurring ? 'Подписка' : 'Разовый платёж'})`
        }
      });
    } catch (err) {
      console.error('Failed to create checkout session:', err);
      message.error('Не удалось запустить оплату. Пожалуйста, попробуйте позже.');
    } finally {
      setCheckoutLoading(false);
    }
  };

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



  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 768) return;
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.clientWidth * 0.85;
    const newIndex = Math.min(2, Math.max(0, Math.round(scrollLeft / cardWidth)));
    setActiveCard(newIndex);
  };

  const isSponsorshipActive = user && user.sponsorshipLevel && user.sponsorshipLevel > 0 && (
    !user.sponsorshipExpiresAt || new Date(user.sponsorshipExpiresAt) > new Date()
  );

  const currentSponsorshipLevel = isSponsorshipActive ? (user?.sponsorshipLevel || 0) : 0;
  const isDowngrade = selectedLevel !== null && currentSponsorshipLevel > 0 && selectedLevel < currentSponsorshipLevel;
  const isDuplicateLevel = selectedLevel !== null && currentSponsorshipLevel > 0 && selectedLevel === currentSponsorshipLevel;

  const handleSupportClick = (level: number) => {
    setSelectedLevel(level);
    setSelectedPlan(0); // reset to 30 days
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'from-[#00BFFF]/20 to-blue-600/20 text-[#00BFFF] border-[#00BFFF]/50';
      case 2: return 'from-[#FFD700]/20 to-yellow-600/20 text-[#FFD700] border-[#FFD700]/50';
      case 3: return 'from-[#FFD700]/20 to-[#4DD2FF]/20 text-white border-[#4DD2FF]/50';
      default: return '';
    }
  };

  const renderModalText = (level: number) => {
    switch (level) {
      case 1:
        return (
          <>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Став спонсором, вы вносите огромный вклад в развитие <strong>StoryLegends</strong>.
              Эти средства идут напрямую на оплату хостинга, плагинов и поддержание работы сервера.
            </p>
            <p className="text-white/80 font-medium italic">
              "Вы не просто игрок, вы — созидатель нашей истории."
            </p>
          </>
        );
      case 2:
        return (
          <>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Выбирая второй уровень, вы демонстрируете серьёзную веру в проект.
              Ваша поддержка дает нам уверенность в завтрашнем дне и возможность развивать сервер еще быстрее.
            </p>
            <p className="text-white/80 font-medium italic">
              "Ваше имя золотом вписано в летопись StoryLegends."
            </p>
          </>
        );
      case 3:
        return (
          <>
            <p className="text-gray-300 mb-6 leading-relaxed">
              <strong>Уровень «Легенда».</strong> Выбирая этот тир, вы становитесь фундаментом нашего проекта.
              Ваша поддержка позволяет нам реализовывать самые смелые технические идеи и выводить сервер на новый уровень.
            </p>
            <p className="text-white/80 font-medium italic">
              "Истинные Легенды не просто играют, они создают этот мир."
            </p>
          </>
        );
      default:
        return null;
    }
  };
  const getDaysRemaining = (expiryStr: string | null | undefined) => {
    if (!expiryStr) return 0;
    const expiry = new Date(expiryStr);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <Layout>
      <style>{`
        @keyframes slide-right-gradient {
          from { background-position: 200% 50%; }
          to { background-position: 0% 50%; }
        }
        .animate-slide-right {
          animation: slide-right-gradient 3s linear infinite;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
      `}</style>
      <SEO
        title="Спонсорство"
        description="Поддержите сервер StoryLegends и получите уникальные награды! Уровни спонсорства и бонусы."
      />

      <div className="pt-24 pb-12 px-4 max-w-[1440px] mx-auto relative overflow-hidden min-h-screen">

        {/* Main Content with Transition when Modal is Open */}
        <div className={`transition-all duration-500 ease-out ${selectedLevel ? 'scale-95 opacity-30 blur-sm pointer-events-none' : 'scale-100 opacity-100 blur-0'}`}>
          
          {user && user.sponsorshipLevel !== undefined && user.sponsorshipLevel > 0 && user.sponsorshipExpiresAt && (
            <div className="max-w-6xl mx-auto mb-8 md:mb-12">
              <div className={`relative group p-4 md:p-6 rounded-2xl border backdrop-blur-md transition-all duration-300 ${
                getDaysRemaining(user.sponsorshipExpiresAt) <= 7 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' 
                  : 'bg-green-500/10 border-green-500/30 text-green-200'
              }`}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg ${
                      getDaysRemaining(user.sponsorshipExpiresAt) <= 7 
                        ? 'bg-amber-500/20 border-amber-500/30' 
                        : 'bg-green-500/20 border-green-500/30'
                    }`}>
                      {getDaysRemaining(user.sponsorshipExpiresAt) <= 7 ? (
                        <ShieldAlert className="w-6 h-6 text-amber-400 animate-pulse" />
                      ) : (
                        <Sparkles className="w-6 h-6 text-green-400" />
                      )}
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-base md:text-lg font-minecraft tracking-wider text-white">
                        Активное спонсорство: Уровень {user.sponsorshipLevel}
                      </h4>
                      <p className="text-sm opacity-80 mt-1">
                        {user.subscriptionRecurring ? (
                          getDaysRemaining(user.sponsorshipExpiresAt) <= 7 ? (
                            `Внимание! Ваша подписка будет автоматически продлена через ${getDaysRemaining(user.sponsorshipExpiresAt)} дн. (${formatDate(user.sponsorshipExpiresAt)}).`
                          ) : (
                            `Подписка активна (автопродление включено). Следующее списание: ${formatDate(user.sponsorshipExpiresAt)}.`
                          )
                        ) : user.stripeSubscriptionId ? (
                          `Автопродление отключено. Спонсорство действует до: ${formatDate(user.sponsorshipExpiresAt)}.`
                        ) : (
                          getDaysRemaining(user.sponsorshipExpiresAt) <= 7 ? (
                            `Внимание! Ваше спонсорство закончится через ${getDaysRemaining(user.sponsorshipExpiresAt)} дн. (${formatDate(user.sponsorshipExpiresAt)}).`
                          ) : (
                            `Разовый платёж. Действует до: ${formatDate(user.sponsorshipExpiresAt)}.`
                          )
                        )}
                      </p>
                    </div>
                  </div>
                  {user.subscriptionRecurring && (
                    <button
                      onClick={async () => {
                        if (confirm('Вы уверены, что хотите отменить автопродление спонсорства? Привилегии останутся активными до конца оплаченного срока.')) {
                          try {
                            const { usersApi } = await import('../api/users');
                            await usersApi.cancelSubscription();
                            message.success('Автопродление подписки успешно отменено.');
                            window.location.reload();
                          } catch (err) {
                            console.error(err);
                            message.error('Не удалось отменить автопродление. Попробуйте позже.');
                          }
                        }
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-200 text-gray-300 font-bold text-xs md:text-sm rounded-xl border border-white/10 hover:border-red-500/30 transition-all uppercase tracking-wider whitespace-nowrap"
                    >
                      Отменить автопродление
                    </button>
                  )}
                  {!user.subscriptionRecurring && user.stripeSubscriptionId && (
                    <button
                      onClick={async () => {
                        if (confirm('Вы хотите возобновить автопродление спонсорства? Списания продолжатся автоматически.')) {
                          try {
                            const { usersApi } = await import('../api/users');
                            await usersApi.resumeSubscription();
                            message.success('Автопродление подписки успешно возобновлено.');
                            window.location.reload();
                          } catch (err) {
                            console.error(err);
                            message.error('Не удалось возобновить автопродление. Попробуйте позже.');
                          }
                        }
                      }}
                      className="px-4 py-2 bg-story-gold/10 hover:bg-story-gold/20 text-story-gold font-bold text-xs md:text-sm rounded-xl border border-story-gold/30 hover:border-story-gold/50 transition-all uppercase tracking-wider whitespace-nowrap"
                    >
                      Включить автопродление
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Header Section */}
          <div className="text-center mb-10 md:mb-16 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64 bg-story-gold/20 blur-[100px] rounded-full -z-10" />
            <Heart className="w-12 h-12 md:w-16 md:h-16 text-story-gold mx-auto mb-4 md:mb-6 animate-pulse-slow drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
            <span className="text-story-gold uppercase tracking-[0.2em] font-bold text-sm md:text-base block mb-2 font-minecraft">
              Уровни спонсорства
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-story-gold via-white to-legends-blue bg-clip-text text-transparent drop-shadow-lg leading-tight">
              StoryLegends — Спонсорство
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed px-4 md:px-0">
              Актуально для всех сезонов. Привилегии действуют в течение оплаченного периода подписки.
            </p>
          </div>

          {/* Sponsorship Goal and Top Donators Section */}
          {publicSettings && (publicSettings.sponsorshipGoalEnabled || (publicSettings.topDonatorAmount1 > 0)) && (
            <div className={`max-w-6xl mx-auto mb-16 grid grid-cols-1 ${publicSettings.sponsorshipGoalEnabled ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-2xl'} gap-8 items-stretch relative z-10 text-left`}>
              
              {/* Progress Goal */}
              {publicSettings.sponsorshipGoalEnabled && (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-story-gold/10 via-legends-blue/10 to-story-gold/10 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
                  <div className="relative h-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Цель сбора</span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-story-gold/15 text-story-gold border border-story-gold/20 animate-pulse-slow">
                          Сбор средств
                        </span>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white mb-2 font-minecraft tracking-wider">
                        {publicSettings.sponsorshipGoalText || 'На оплату хостинга'}
                      </h3>
                      
                      <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                        Все полученные средства идут непосредственно на оплату и поддержание работы инфраструктуры сервера. Каждая ваша поддержка продлевает жизнь проекту.
                      </p>
                    </div>

                    <div>
                      {/* Progress Metrics */}
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-3xl font-extrabold text-white font-minecraft">
                          {publicSettings.sponsorshipGoalCurrent} <span className="text-lg font-normal text-gray-400">₽</span>
                        </span>
                        <span className="text-sm text-gray-500 font-medium">
                          цель: {publicSettings.sponsorshipGoalTarget} ₽
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5 relative">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-story-gold via-yellow-400 to-amber-500 shadow-[0_0_10px_rgba(255,215,0,0.5)] transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${Math.min(100, Math.max(0, (publicSettings.sponsorshipGoalCurrent / publicSettings.sponsorshipGoalTarget) * 100))}%` 
                          }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                        <span>Собрано: {Math.round(Math.min(100, (publicSettings.sponsorshipGoalCurrent / publicSettings.sponsorshipGoalTarget) * 100))}%</span>
                        <span>Осталось: {Math.max(0, publicSettings.sponsorshipGoalTarget - publicSettings.sponsorshipGoalCurrent)} ₽</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Donators */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-legends-blue/10 via-story-gold/10 to-legends-blue/10 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="relative h-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Топ спонсоров</span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20">
                      <Crown className="w-3.5 h-3.5" /> Лучшие за всё время
                    </span>
                  </div>

                  <div className="flex-grow flex flex-col justify-center gap-4">
                    {publicSettings.topDonatorAmount1 === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4 text-center my-auto">
                        <Heart className="w-12 h-12 text-red-500/30 mb-3 animate-pulse" />
                        <span className="text-gray-400 text-sm font-semibold">Спонсоров пока нет</span>
                        <span className="text-gray-500 text-xs mt-1 max-w-[200px]">Вы можете совершить оплату и стать первым в топе!</span>
                      </div>
                    ) : (
                      <>
                        {/* Top 1 */}
                        {publicSettings.topDonatorAmount1 > 0 && (
                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#FFD700]/30 transition-all duration-300">
                            <div className="flex items-center gap-4">
                              <span className="text-xl font-bold text-center w-6">🥇</span>
                              {(() => {
                                const avatarUrl = publicSettings.topDonatorAvatar1;
                                const username = publicSettings.topDonatorName1;
                                const isLetter = avatarUrl && avatarUrl.length === 1;
                                if (isLetter || !avatarUrl) {
                                  return (
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-story-gold/20 to-story-gold/10 border border-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                      {isLetter ? avatarUrl : username.substring(0, 1).toUpperCase()}
                                    </div>
                                  );
                                }
                                return (
                                  <img 
                                    src={avatarUrl} 
                                    alt={username}
                                    className="w-10 h-10 rounded-lg bg-black/20 border border-white/10 object-cover shrink-0"
                                    onError={(e) => {
                                      const parent = (e.target as HTMLElement).parentElement;
                                      if (parent) {
                                        const fallback = document.createElement('div');
                                        fallback.className = "w-10 h-10 rounded-lg bg-gradient-to-br from-story-gold/20 to-story-gold/10 border border-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0";
                                        fallback.innerText = username.substring(0, 1).toUpperCase();
                                        parent.replaceChild(fallback, e.target as HTMLElement);
                                      }
                                    }}
                                  />
                                );
                              })()}
                              <div>
                                <div className="font-bold text-white text-base font-minecraft tracking-wide">
                                  {publicSettings.topDonatorName1}
                                </div>
                                <div className="text-xs text-gray-500">1-е место на сервере</div>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-[#FFD700] font-minecraft">
                              {publicSettings.topDonatorAmount1} <span className="text-xs font-normal text-gray-400">₽</span>
                            </span>
                          </div>
                        )}

                        {/* Top 2 */}
                        {publicSettings.topDonatorAmount2 > 0 && (
                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-gray-400/30 transition-all duration-300">
                            <div className="flex items-center gap-4">
                              <span className="text-xl font-bold text-center w-6">🥈</span>
                              {(() => {
                                const avatarUrl = publicSettings.topDonatorAvatar2;
                                const username = publicSettings.topDonatorName2;
                                const isLetter = avatarUrl && avatarUrl.length === 1;
                                if (isLetter || !avatarUrl) {
                                  return (
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-story-gold/20 to-story-gold/10 border border-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                      {isLetter ? avatarUrl : username.substring(0, 1).toUpperCase()}
                                    </div>
                                  );
                                }
                                return (
                                  <img 
                                    src={avatarUrl} 
                                    alt={username}
                                    className="w-10 h-10 rounded-lg bg-black/20 border border-white/10 object-cover shrink-0"
                                    onError={(e) => {
                                      const parent = (e.target as HTMLElement).parentElement;
                                      if (parent) {
                                        const fallback = document.createElement('div');
                                        fallback.className = "w-10 h-10 rounded-lg bg-gradient-to-br from-story-gold/20 to-story-gold/10 border border-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0";
                                        fallback.innerText = username.substring(0, 1).toUpperCase();
                                        parent.replaceChild(fallback, e.target as HTMLElement);
                                      }
                                    }}
                                  />
                                );
                              })()}
                              <div>
                                <div className="font-bold text-white text-base font-minecraft tracking-wide">
                                  {publicSettings.topDonatorName2}
                                </div>
                                <div className="text-xs text-gray-500">2-е место на сервере</div>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-gray-300 font-minecraft">
                              {publicSettings.topDonatorAmount2} <span className="text-xs font-normal text-gray-400">₽</span>
                            </span>
                          </div>
                        )}

                        {/* Top 3 */}
                        {publicSettings.topDonatorAmount3 > 0 && (
                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-amber-600/30 transition-all duration-300">
                            <div className="flex items-center gap-4">
                              <span className="text-xl font-bold text-center w-6">🥉</span>
                              {(() => {
                                const avatarUrl = publicSettings.topDonatorAvatar3;
                                const username = publicSettings.topDonatorName3;
                                const isLetter = avatarUrl && avatarUrl.length === 1;
                                if (isLetter || !avatarUrl) {
                                  return (
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-story-gold/20 to-story-gold/10 border border-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                      {isLetter ? avatarUrl : username.substring(0, 1).toUpperCase()}
                                    </div>
                                  );
                                }
                                return (
                                  <img 
                                    src={avatarUrl} 
                                    alt={username}
                                    className="w-10 h-10 rounded-lg bg-black/20 border border-white/10 object-cover shrink-0"
                                    onError={(e) => {
                                      const parent = (e.target as HTMLElement).parentElement;
                                      if (parent) {
                                        const fallback = document.createElement('div');
                                        fallback.className = "w-10 h-10 rounded-lg bg-gradient-to-br from-story-gold/20 to-story-gold/10 border border-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0";
                                        fallback.innerText = username.substring(0, 1).toUpperCase();
                                        parent.replaceChild(fallback, e.target as HTMLElement);
                                      }
                                    }}
                                  />
                                );
                              })()}
                              <div>
                                <div className="font-bold text-white text-base font-minecraft tracking-wide">
                                  {publicSettings.topDonatorName3}
                                </div>
                                <div className="text-xs text-gray-500">3-е место на сервере</div>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-amber-500 font-minecraft">
                              {publicSettings.topDonatorAmount3} <span className="text-xs font-normal text-gray-400">₽</span>
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cards Container (Carousel on mobile, Grid on desktop) */}
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="flex md:grid md:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-24 max-w-6xl mx-auto relative z-10 items-stretch overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-4 px-4 pt-4 -mt-4 md:px-0 md:mx-auto pb-4 md:pb-0"
          >

            {/* Level 1 */}
            <div className="w-[85vw] md:w-auto shrink-0 snap-center glass rounded-2xl p-6 md:p-8 flex flex-col relative overflow-hidden group hover:border-[#00BFFF]/50 transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-legends-blue/20 to-[#00BFFF]"></div>

              <div className="mb-6 md:mb-8 flex flex-col items-center justify-center text-center mt-2 md:mt-4">
                <div className="mb-4 drop-shadow-[0_0_15px_rgba(0,191,255,0.3)]">
                  <Level1Icon />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white font-minecraft tracking-wider">Уровень 1</h3>
              </div>

              <ul className="space-y-2 mb-8 md:mb-10 flex-grow text-sm md:text-base">
                <li className="flex gap-3 text-gray-300 p-3 rounded-xl border-l-2 border-transparent hover:bg-white/5 hover:border-[#00BFFF] hover:text-white transition-all duration-300">
                  <Check className="w-5 h-5 text-[#00BFFF] flex-shrink-0 mt-0.5" />
                  <span>Синяя звёздочка перед ником в чате и табе.</span>
                </li>
                <li className="flex gap-3 text-gray-300 p-3 rounded-xl border-l-2 border-transparent hover:bg-white/5 hover:border-[#00BFFF] hover:text-white transition-all duration-300">
                  <Check className="w-5 h-5 text-[#00BFFF] flex-shrink-0 mt-0.5" />
                  <span>Доступ к закрытому Discord-каналу спонсоров.</span>
                </li>
                <li className="flex gap-3 text-gray-300 p-3 rounded-xl border-l-2 border-transparent hover:bg-white/5 hover:border-[#00BFFF] hover:text-white transition-all duration-300">
                  <Check className="w-5 h-5 text-[#00BFFF] flex-shrink-0 mt-0.5" />
                  <span>1 уникальное переименование предмета в месяц (градиент, описание). Не потратил — сгорает.</span>
                </li>
                <li className="flex gap-3 text-gray-300 p-3 rounded-xl border-l-2 border-transparent hover:bg-white/5 hover:border-[#00BFFF] hover:text-white transition-all duration-300">
                  <Check className="w-5 h-5 text-[#00BFFF] flex-shrink-0 mt-0.5" />
                  <span><strong>Приоритетное рассмотрение идей:</strong> идеи спонсоров рассматриваются администрацией в приоритетном порядке. Рассмотрение не гарантирует реализацию предложения.</span>
                </li>
                <li className="flex gap-3 text-gray-300 p-3 rounded-xl border-l-2 border-transparent hover:bg-white/5 hover:border-[#00BFFF] hover:text-white transition-all duration-300">
                  <Check className="w-5 h-5 text-[#00BFFF] flex-shrink-0 mt-0.5" />
                  <span>Кастомные пластинки (AudioPlayer).</span>
                </li>
                <li className="flex gap-3 text-gray-300 p-3 rounded-xl border-l-2 border-transparent hover:bg-white/5 hover:border-[#00BFFF] hover:text-white transition-all duration-300">
                  <Check className="w-5 h-5 text-[#00BFFF] flex-shrink-0 mt-0.5" />
                  <span>Харкнуть (/spit).</span>
                </li>
              </ul>

              <button
                onClick={() => handleSupportClick(1)}
                className="w-full mt-auto py-3.5 rounded-xl bg-white/5 hover:bg-[#00BFFF]/20 border border-white/10 hover:border-[#00BFFF]/50 text-white font-bold transition-all text-center flex items-center justify-center gap-2"
              >
                Поддержать
              </button>
            </div>

            {/* Level 2 */}
            <div className="w-[85vw] md:w-auto shrink-0 snap-center glass rounded-2xl p-6 md:p-8 flex flex-col relative overflow-hidden group hover:border-[#FFD700]/50 transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-[#FFD700]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-story-gold/50 to-[#FFD700]"></div>

              <div className="mb-6 md:mb-8 flex flex-col items-center justify-center text-center mt-2 md:mt-4">
                <div className="mb-4 drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                  <Level2Icon />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white font-minecraft tracking-wider">Уровень 2</h3>
              </div>

              <ul className="space-y-2 mb-8 md:mb-10 flex-grow text-sm md:text-base">
                <li className="flex gap-3 text-gray-300 p-3 rounded-xl border-l-2 border-transparent hover:bg-white/5 hover:border-[#FFD700] hover:text-white transition-all duration-300">
                  <Check className="w-5 h-5 text-[#FFD700] flex-shrink-0 mt-0.5" />
                  <span>Жёлтая звёздочка перед ником в чате и табе.</span>
                </li>
                <li className="flex gap-3 text-gray-300 p-3 rounded-xl border-l-2 border-transparent hover:bg-white/5 hover:border-[#FFD700] hover:text-white transition-all duration-300">
                  <Check className="w-5 h-5 text-[#FFD700] flex-shrink-0 mt-0.5" />
                  <span>Доступ к команде <code className="text-[#FFD700]/90 bg-white/5 px-1.5 py-0.5 rounded ml-1">/lg i</code> (лого).</span>
                </li>
                <li className="flex gap-3 text-gray-300 p-3 rounded-xl border-l-2 border-transparent hover:bg-white/5 hover:border-[#FFD700] hover:text-white transition-all duration-300">
                  <Check className="w-5 h-5 text-[#FFD700] flex-shrink-0 mt-0.5" />
                  <span>2 уникальных переименования предмета в месяц.</span>
                </li>
                <li className="flex gap-3 text-gray-300 p-3 rounded-xl border-l-2 border-transparent hover:bg-white/5 hover:border-[#FFD700] hover:text-white transition-all duration-300 group/item">
                  <Check className="w-5 h-5 text-[#FFD700] flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span>1 предмет (инструмент/оружие, кроме брони) получает тег нерушимости:</span>
                    <span className="text-sm text-gray-400 mt-2 pl-3 border-l-2 border-white/10 group-hover/item:border-[#FFD700]/50 transition-colors">Если подписка не продлена — тег снимается.</span>
                    <span className="text-sm text-gray-400 mt-2 pl-3 border-l-2 border-white/10 group-hover/item:border-[#FFD700]/50 transition-colors">Если предмет был утерян (лава, деслав) — администрация восстанавливает его <strong className="text-white font-bold">1 раз в месяц в течение 7 дней</strong> с момента обращения. Восстановление невозможно, если предмет утерян вследствие нарушения правил самим игроком.</span>
                  </div>
                </li>
                <li className="flex gap-3 text-gray-300 p-3 rounded-xl border-l-2 border-transparent hover:bg-white/5 hover:border-[#FFD700] hover:text-white transition-all duration-300 font-medium">
                  <Check className="w-5 h-5 text-[#FFD700] flex-shrink-0 mt-0.5" />
                  <span>Все привилегии уровня 1.</span>
                </li>
              </ul>

              <button
                onClick={() => handleSupportClick(2)}
                className="w-full mt-auto py-3.5 rounded-xl bg-white/5 hover:bg-[#FFD700]/20 border border-[#FFD700]/30 hover:border-[#FFD700] text-[#FFD700] hover:text-white font-bold transition-all text-center shadow-[0_0_15px_rgba(255,215,0,0.1)] flex items-center justify-center gap-2"
              >
                Поддержать
              </button>
            </div>

            {/* Level 3 */}
            <div className="w-[85vw] md:w-auto shrink-0 snap-center glass rounded-2xl p-6 md:p-8 flex flex-col relative overflow-hidden group hover:border-[#4DD2FF]/50 transition-all duration-300 transform hover:-translate-y-2 border-story-gold/30 shadow-[0_0_30px_rgba(0,191,255,0.05)]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/5 to-legends-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FFD700] via-white to-legends-blue"></div>

              {/* Badge for Level 3 */}
              <div className="absolute top-4 right-4 z-20">
                <span
                  className="px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs md:text-sm font-bold bg-gradient-to-r from-[#FFD700] via-[#4DD2FF] to-[#FFD700] bg-[length:200%_auto] animate-slide-right text-black shadow-[0_0_20px_rgba(0,191,255,0.6)] border border-white/20 inline-flex items-center gap-1"
                >
                  ✦ рекомендуем
                </span>
              </div>

              <div className="mb-6 md:mb-8 flex flex-col items-center justify-center text-center mt-2 md:mt-4">
                <div className="mb-4 drop-shadow-[0_0_25px_rgba(255,215,0,0.4)]">
                  <Level3Icon />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white font-minecraft tracking-wider">Уровень 3</h3>
              </div>

              <ul className="space-y-3 mb-8 md:mb-10 flex-grow text-sm md:text-base">
                {/* Emphasized Level 3 unique perks */}
                <li className="flex gap-3 text-white font-medium p-3 md:p-4 md:px-5 rounded-xl border-l-2 border-[#4DD2FF]/40 bg-white/5 hover:bg-white/10 hover:border-[#4DD2FF] transition-all duration-300">
                  <Check className="w-5 h-5 text-[#4DD2FF] drop-shadow-[0_0_8px_rgba(77,210,255,0.8)] flex-shrink-0 mt-0.5" />
                  <span>Уникальный сине-жёлтый градиент на весь ник в чате и табе.</span>
                </li>
                <li className="flex gap-3 text-white font-medium p-3 md:p-4 md:px-5 rounded-xl border-l-2 border-[#4DD2FF]/40 bg-white/5 hover:bg-white/10 hover:border-[#4DD2FF] transition-all duration-300 group/item">
                  <Check className="w-5 h-5 text-[#4DD2FF] drop-shadow-[0_0_8px_rgba(77,210,255,0.8)] flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span>2 предмета (инструмент/оружие) получают тег нерушимости:</span>
                    <span className="text-xs md:text-sm text-gray-400 font-normal mt-2 pl-3 border-l-2 border-white/10 group-hover/item:border-[#4DD2FF]/50 transition-colors">Если подписка не продлена — тег снимается.</span>
                    <span className="text-xs md:text-sm text-gray-400 font-normal mt-2 pl-3 border-l-2 border-white/10 group-hover/item:border-[#4DD2FF]/50 transition-colors">Если предмет был утерян — администрация восстанавливает его <strong className="text-white font-bold">2 раза в месяц в течение 7 дней</strong> с момента обращения. Восстановление невозможно, если предмет утерян вследствие нарушения правил самим игроком.</span>
                  </div>
                </li>
                <li className="flex gap-3 text-white font-medium p-3 md:p-4 md:px-5 rounded-xl border-l-2 border-[#4DD2FF]/40 bg-white/5 hover:bg-white/10 hover:border-[#4DD2FF] transition-all duration-300">
                  <Check className="w-5 h-5 text-[#4DD2FF] drop-shadow-[0_0_8px_rgba(77,210,255,0.8)] flex-shrink-0 mt-0.5" />
                  <span>4 уникальных переименования предмета в месяц.</span>
                </li>
                <li className="flex gap-3 text-white font-medium p-3 md:p-4 md:px-5 rounded-xl border-l-2 border-[#4DD2FF]/40 bg-white/5 hover:bg-white/10 hover:border-[#4DD2FF] transition-all duration-300">
                  <Check className="w-5 h-5 text-[#4DD2FF] drop-shadow-[0_0_8px_rgba(77,210,255,0.8)] flex-shrink-0 mt-0.5" />
                  <span><strong>Право участвовать в закрытых голосованиях:</strong> голосования носят рекомендательный характер. Финальное решение по любому вопросу остаётся за администрацией.</span>
                </li>
                <li className="flex gap-3 text-white font-medium p-3 md:p-4 md:px-5 rounded-xl border-l-2 border-[#4DD2FF]/40 bg-white/5 hover:bg-white/10 hover:border-[#4DD2FF] transition-all duration-300">
                  <Check className="w-5 h-5 text-[#4DD2FF] drop-shadow-[0_0_8px_rgba(77,210,255,0.8)] flex-shrink-0 mt-0.5" />
                  <span>Кастомное (или из заготовок) уведомление о заходе и выходе.</span>
                </li>
                <li className="flex gap-3 text-white font-medium p-3 md:p-4 md:px-5 rounded-xl border-l-2 border-[#4DD2FF]/40 bg-white/5 hover:bg-white/10 hover:border-[#4DD2FF] transition-all duration-300">
                  <Check className="w-5 h-5 text-[#4DD2FF] drop-shadow-[0_0_8px_rgba(77,210,255,0.8)] flex-shrink-0 mt-0.5" />
                  <span>Звук захода (выбор из заготовок).</span>
                </li>
                <li className="flex gap-3 text-white font-medium p-3 md:p-4 md:px-5 rounded-xl border-l-2 border-[#4DD2FF]/40 bg-white/5 hover:bg-white/10 hover:border-[#4DD2FF] transition-all duration-300">
                  <Check className="w-5 h-5 text-[#4DD2FF] drop-shadow-[0_0_8px_rgba(77,210,255,0.8)] flex-shrink-0 mt-0.5" />
                  <span>Кастомный (или из заготовок) суффикс.</span>
                </li>

                {/* Common perk */}
                <li className="flex gap-3 text-gray-300 p-3 md:p-4 md:px-5 rounded-xl border-l-2 border-transparent hover:bg-white/5 hover:border-[#4DD2FF] hover:text-white transition-all duration-300 font-medium">
                  <Check className="w-5 h-5 text-[#4DD2FF] flex-shrink-0 mt-0.5" />
                  <span>Все привилегии предыдущих уровней.</span>
                </li>
              </ul>

              <button
                onClick={() => handleSupportClick(3)}
                className="w-full mt-auto py-4 rounded-xl bg-gradient-to-r from-[#4DD2FF] to-[#FFD700] hover:from-[#3bc1ee] hover:to-[#ecc600] text-black font-bold text-lg transition-all text-center shadow-[0_0_20px_rgba(77,210,255,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.6)] flex items-center justify-center gap-2 transform hover:-translate-y-1"
              >
                Поддержать
              </button>
            </div>
          </div>

          {/* Mobile pagination dots */}
          <div className="flex justify-center gap-2 mb-16 md:hidden">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${activeCard === idx ? 'w-6 bg-story-gold shadow-[0_0_10px_rgba(255,215,0,0.5)]' : 'w-2 bg-white/20'}`}
              />
            ))}
          </div>

          {/* General Terms Section */}
          <div className="max-w-4xl mx-auto mt-16 md:mt-24">
            <div className="relative group">
              {/* Soft glowing ambient background */}
              <div className="absolute -inset-1 bg-gradient-to-r from-story-gold/20 via-white/5 to-legends-blue/20 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative bg-white/5 rounded-3xl p-6 md:p-10 border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-6 md:mb-8 border-b border-white/10 pb-4 md:pb-6">
                  <FileText className="w-6 h-6 md:w-8 md:h-8 text-story-gold drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]" />
                  <h2 className="text-2xl md:text-3xl font-bold text-white font-minecraft">
                    Общие условия подписки
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4 md:space-y-6">
                    <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-300">
                      <div className="w-8 h-8 rounded-xl bg-story-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Info className="w-4 h-4 text-story-gold" />
                      </div>
                      <div className="text-sm md:text-base text-gray-300 leading-relaxed">
                        Услуга считается оказанной с момента активации привилегий. <strong className="text-white font-semibold">Возврат средств после активации не производится.</strong>
                      </div>
                    </div>

                    <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-300">
                      <div className="w-8 h-8 rounded-xl bg-[#00BFFF]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Info className="w-4 h-4 text-[#00BFFF]" />
                      </div>
                      <div className="text-sm md:text-base text-gray-300 leading-relaxed">
                        Привилегии действуют в течение оплаченного периода и прекращаются при его окончании, если подписка не продлена.
                      </div>
                    </div>

                    <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#FF4D4D]/20 hover:bg-[#FF4D4D]/5 transition-all duration-300">
                      <div className="w-8 h-8 rounded-xl bg-[#FF4D4D]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldAlert className="w-4 h-4 text-[#FF4D4D]" />
                      </div>
                      <div className="text-sm md:text-base text-gray-300 leading-relaxed">
                        При нарушении правил сервера администрация вправе прекратить действие привилегий <strong className="text-white font-semibold">без компенсации</strong>.
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4 md:space-y-6">
                    <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-300">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Info className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="text-sm md:text-base text-gray-300 leading-relaxed">
                        Администрация вправе изменить состав привилегий с уведомлением за <strong className="text-white font-semibold">7 дней</strong>. При существенном ухудшении условий пользователь вправе отказаться от продления.
                      </div>
                    </div>

                    <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#4DD2FF]/20 hover:bg-[#4DD2FF]/5 transition-all duration-300">
                      <div className="w-8 h-8 rounded-xl bg-[#4DD2FF]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <CreditCard className="w-4 h-4 text-[#4DD2FF]" />
                      </div>
                      <div className="text-sm md:text-base text-gray-300 leading-relaxed">
                        Оплата принимается через <strong className="text-white font-semibold">Бусти</strong> (для игроков из РФ) и по запросу через <strong className="text-white font-semibold">тикет в Discord</strong> (для остальных регионов).
                      </div>
                    </div>

                    <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-story-gold/20 transition-all duration-300">
                      <div className="w-8 h-8 rounded-xl bg-story-gold/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-story-gold" />
                      </div>
                      <div className="text-sm md:text-base text-gray-300 leading-relaxed font-medium">
                        Совершая платёж, пользователь подтверждает согласие с настоящими условиями и политикой невозврата цифровых услуг.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Modal overlay */}
        <div className={`fixed inset-0 z-[100] transition-all duration-500 ${selectedLevel ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`}>

          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/90 md:bg-black/60 backdrop-blur-md transition-opacity duration-500 ${selectedLevel ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setSelectedLevel(null)}
          />

          {/* Close button outside transform to guarantee fixed position */}
          <button
            onClick={() => setSelectedLevel(null)}
            className={`absolute top-4 right-4 z-[110] p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-500 backdrop-blur-md border border-white/20 ${selectedLevel ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Scrollable Container */}
          <div className="absolute inset-0 overflow-y-auto overflow-x-hidden md:p-10 flex items-start md:items-center justify-center overscroll-contain">
            <div className={`relative w-full min-h-[100dvh] md:min-h-0 md:h-auto max-w-7xl bg-[#0a0a0a] border-0 md:border border-white/10 md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row z-10 transition-all duration-500 transform ${selectedLevel ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'}`}>

              {/* Left Info Panel */}
              <div className={`w-full md:w-5/12 p-6 pt-20 md:p-8 border-b md:border-b-0 md:border-r border-white/10 relative overflow-hidden flex flex-col justify-start md:justify-center bg-gradient-to-br ${selectedLevel ? getLevelColor(selectedLevel) : ''}`}>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

                <div className="relative z-10">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 md:mb-6 border border-white/20 shadow-lg">
                    {selectedLevel === 1 && <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-[#00BFFF]" />}
                    {selectedLevel === 2 && <Shield className="w-6 h-6 md:w-8 md:h-8 text-[#FFD700]" />}
                    {selectedLevel === 3 && <Crown className="w-6 h-6 md:w-8 md:h-8 text-[#FFD700]" />}
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 font-minecraft tracking-wider">
                    Уровень {selectedLevel}
                  </h2>

                  <div className="text-sm md:text-base">
                    {selectedLevel && renderModalText(selectedLevel)}
                  </div>
                </div>
              </div>

              {/* Right Pricing Panel */}
              <div className="w-full md:w-7/12 p-6 pb-24 md:p-8 bg-[#0d0d0d] flex flex-col min-h-[500px]">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-6">Выберите срок подписки</h3>

                <div className="space-y-3 mb-6 md:mb-8">
                  {activePlans.map((plan, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPlan(index)}
                      className={`w-full flex items-center justify-between p-3 md:p-4 rounded-xl border transition-all duration-300 ${selectedPlan === index
                          ? 'border-story-gold bg-story-gold/10 shadow-[0_0_15px_rgba(255,215,0,0.15)]'
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                        }`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-base md:text-lg font-bold text-white">{plan.days}</span>
                        {plan.note && (
                          <span className="text-xs md:text-sm text-gray-400 mt-1">
                            {plan.note}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 md:gap-3">
                        {plan.badge && (
                          <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[10px] md:text-xs font-bold border ${plan.badge === 'ЛУЧШАЯ ЦЕНА'
                              ? 'bg-story-gold/20 text-story-gold border-story-gold/30 shadow-[0_0_10px_rgba(255,215,0,0.2)]'
                              : 'bg-green-500/20 text-green-400 border-green-500/30'
                            }`}>
                            {plan.badge}
                          </span>
                        )}
                        <span className="text-lg md:text-xl font-bold text-story-gold">{plan.price}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Payment Mode Selector */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 md:mb-8 flex flex-col gap-3">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider text-left">Тип оплаты</div>
                  <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => setIsRecurring(false)}
                      className={`py-2 text-xs md:text-sm font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                        !isRecurring 
                          ? 'bg-white/10 text-white shadow-lg border border-white/10' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Разово
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRecurring(true)}
                      className={`py-2 text-xs md:text-sm font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                        isRecurring 
                          ? 'bg-story-gold text-black shadow-lg shadow-story-gold/25' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Подписка
                    </button>
                  </div>
                  <div className="text-[10px] md:text-xs text-gray-400 flex items-start gap-2 mt-1 leading-relaxed text-left">
                    <Info className="w-3.5 h-3.5 text-story-gold shrink-0 mt-0.5" />
                    <span>
                      {isRecurring 
                        ? 'Списание будет происходить автоматически по истечении периода. Вы сможете отменить автопродление в любой момент в настройках.' 
                        : 'Списание произойдет один раз. Для продления по истечении срока нужно будет совершить повторную оплату вручную.'}
                    </span>
                  </div>
                </div>

                {isDuplicateLevel && (
                  <div className="mb-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-left">
                      <p className="font-bold text-white mb-1">У вас уже активна подписка этого уровня</p>
                      <p className="text-gray-300 leading-relaxed text-xs">
                        Она действует до {user?.sponsorshipExpiresAt ? new Date(user.sponsorshipExpiresAt).toLocaleDateString('ru-RU') : 'бессрочно'}.
                        Продление подписки произойдет автоматически, либо вы сможете повторно поддержать проект после завершения текущего периода.
                      </p>
                    </div>
                  </div>
                )}

                {isDowngrade && (
                  <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-left">
                      <p className="font-bold text-white mb-1">Понижение уровня подписки</p>
                      <p className="text-gray-300 leading-relaxed text-xs">
                        Внимание! Вы переходите с Уровня {currentSponsorshipLevel} на более низкий Уровень {selectedLevel}. 
                        Ваши текущие привилегии будут заменены на привилегии выбранного уровня после оплаты.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-auto">
                  <button
                    onClick={handleStripeCheckout}
                    disabled={checkoutLoading || isDuplicateLevel}
                    className="w-full py-3.5 md:py-4 rounded-xl bg-gradient-to-r from-story-gold to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold text-base md:text-lg transition-all text-center flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transform hover:-translate-y-1 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {checkoutLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                    Оплатить картой
                  </button>
                  <p className="text-center text-gray-500 text-[10px] md:text-xs mt-4">
                    Оплата производится через защищенный встроенный шлюз Stripe.
                  </p>

                  <div className="mt-4 pt-4 border-t border-white/10 text-center">
                    <p className="text-gray-400 text-xs md:text-sm">
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
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Sponsorship;
