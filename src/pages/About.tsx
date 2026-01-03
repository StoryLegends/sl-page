import Layout from '../components/Layout';
import CTASection from '../components/CTASection';
import { Users, Video, Trophy, Crown, Code, Megaphone, ChevronLeft, ChevronRight, Gavel } from 'lucide-react';
import { useState, useEffect } from 'react';

const About = () => {
  // Load images dynamically from src/assets/gallery
  const galleryImagesGlob = import.meta.glob('/src/assets/gallery/*.{png,jpg,jpeg,webp}', { eager: true });
  const galleryImages = Object.values(galleryImagesGlob).map((img: any) => img.default);

  // Fallback images if folder is empty
  const images = galleryImages.length > 0 ? galleryImages : [
    "https://lh3.googleusercontent.com/sitesv/AAzXCkf0jtvw6YodxUoGqJcS46pP0pAbFLA0sFdioJRnpHTSYGKVnD04UxBYXc4iCTpDF_D0qngVCuoyRC_9VWzr_My1ndJwbRPF-y2Ysk1f4Pf2lH-lgB2cqi0Ya9c9DBJbBGNBft0ujddMDswE2wA9xzwfji2glG6RhzBKKcpQD4qKAxm2amKPOOL4=w16383",
    "https://lh3.googleusercontent.com/sitesv/AAzXCkeHH7PkxYlYCgTxYU9_2qehFeTvkMVWWlwvVUGxvopyZat-tRt3Qy-eyQO8LnK6CFPmSgyXFFLVuxdvwkYQ_s1i2kYQwgbjp7XgTvTd2VLJr5vh5uZ2B4-3CdB6pJ0bb7KxWLY-5LgimUPZTgp3A2xpvPAJzngwW4Gvw8D_FH73OudERSYIaRcm=w16383"
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <Layout>
      <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-story-gold/20 blur-[100px] rounded-full -z-10" />
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-story-gold via-white to-legends-blue bg-clip-text text-transparent drop-shadow-lg">
            О сервере
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            StoryLegends — это приватный Minecraft сервер выживания, где создаются легендарные истории.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 items-stretch">
          {/* Gallery Card (Carousel) */}
          <div className="group relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl h-[300px] md:h-full min-h-[300px] md:min-h-[400px] bg-white/5 backdrop-blur-sm">
            {images.map((img, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                  }`}
              >
                <img
                  src={img}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              </div>
            ))}

            {/* Navigation Arrows */}
            <button
              onClick={prevImage}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-30"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-30"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-20">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Живой мир</h3>
              <p className="text-gray-300 text-base md:text-lg">Погрузитесь в атмосферу, созданную игроками.</p>

              {/* Indicators */}
              <div className="flex gap-2 mt-4">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid gap-6 content-center h-full">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group">
              <Video className="w-10 h-10 text-story-gold mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-white mb-2">Для контент-мейкеров</h3>
              <p className="text-gray-400">На данном сервере вы можете снимать ролики и просто играть! Мы поддерживаем творчество.</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group">
              <Trophy className="w-10 h-10 text-legends-blue mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-white mb-2">Путь к успеху</h3>
              <p className="text-gray-400">Активные игроки попадают в следующие сезоны. Ваша активность — ключ к развитию сервера!</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group">
              <Users className="w-10 h-10 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-white mb-2">Сообщество</h3>
              <p className="text-gray-400">У нас играли немалые ютуберы. Присоединяйтесь к дружному комьюнити!</p>
            </div>
          </div>
        </div>



        {/* Administration Section */}
        <div className="mb-16 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">Состав администрации</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* LendSpele */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/20 to-black border border-purple-500/30 backdrop-blur-sm text-center group hover:-translate-y-2 transition-transform duration-300 flex flex-col h-full items-center">
              <div className="relative mb-4 h-48 flex items-center justify-center">
                <img
                  src="/images/lendspele.png"
                  alt="LendSpele"
                  className="h-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500"
                  style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}
                />
              </div>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/50">
                <Crown className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-purple-400 mb-1">LendSpele</h3>
              <p className="text-white font-semibold text-sm mb-2">Владелец и Тех. Админ</p>
              <p className="text-gray-400 text-xs mb-3">Содержит, настраивает и разрабатывает сервер.</p>
              <div className="inline-block px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-mono mt-auto">
                lendspele_
              </div>
            </div>

            {/* datapeice */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-red-900/20 to-black border border-red-500/30 backdrop-blur-sm text-center group hover:-translate-y-2 transition-transform duration-300 flex flex-col h-full items-center">
              <div className="relative mb-4 h-48 flex items-center justify-center">
                <img
                  src="/images/datapeice.png"
                  alt="datapeice"
                  className="h-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500"
                  style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}
                />
              </div>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50">
                <Code className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-red-400 mb-1">datapeice</h3>
              <p className="text-white font-semibold text-sm mb-2">Разработчик</p>
              <p className="text-gray-400 text-xs mb-3">Разрабатывает модификации для сервера.</p>
              <div className="inline-block px-3 py-1 rounded-full bg-red-500/10 text-red-300 text-xs font-mono mt-auto">
                datapeice
              </div>
            </div>

            {/* tybick */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-green-900/20 to-black border border-green-500/30 backdrop-blur-sm text-center group hover:-translate-y-2 transition-transform duration-300 flex flex-col h-full items-center">
              <div className="relative mb-4 h-48 flex items-center justify-center">
                <img
                  src="/images/tybick.png"
                  alt="tybick"
                  className="h-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500"
                  style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}
                />
              </div>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50">
                <Gavel className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-green-400 mb-1">tybick</h3>
              <p className="text-white font-semibold text-sm mb-2">Модератор</p>
              <p className="text-gray-400 text-xs mb-3">Помогает разбирать заявки.</p>
              <div className="inline-block px-3 py-1 rounded-full bg-green-500/10 text-green-300 text-xs font-mono mt-auto">
                ananasnmg22
              </div>
            </div>

            {/* Slides_GG */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900/20 to-black border border-blue-500/30 backdrop-blur-sm text-center group hover:-translate-y-2 transition-transform duration-300 flex flex-col h-full items-center">
              <div className="relative mb-4 h-48 flex items-center justify-center">
                <img
                  src="/images/slides.png"
                  alt="Slides_GG"
                  className="h-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500"
                  style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}
                />
              </div>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50">
                <Megaphone className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-blue-400 mb-1">Slides_GG</h3>
              <p className="text-white font-semibold text-sm mb-2">Рекламный менеджер</p>
              <p className="text-gray-400 text-xs mb-3">Занимается продвижением сервера</p>
              <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-mono mt-auto">
                slides_1
              </div>
            </div>
          </div>
        </div>

        {/* Last Video Section */}
        <div className="mb-16 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">Последнее видео</h2>
          <div className="max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/50">
            <iframe
              src={(() => {
                const videoUrl = import.meta.env.VITE_LAST_VIDEO || "https://www.youtube.com/embed/dQw4w9WgXcQ";
                // If it's already an embed URL, return it
                if (videoUrl.includes('/embed/')) return videoUrl;

                // Extract ID from various YouTube URL formats
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                const match = videoUrl.match(regExp);
                const videoId = (match && match[2].length === 11) ? match[2] : null;

                return videoId ? `https://www.youtube.com/embed/${videoId}` : videoUrl;
              })()}
              title="Last Video"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* CTA Section */}
        <CTASection />
      </div>
    </Layout>
  );
};

export default About;
