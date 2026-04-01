import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Info } from 'lucide-react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';

const PALETTE = [
  {
    category: 'Золото (Primary)',
    description: 'Главный акцентный цвет бренда StoryLegends.',
    colors: [
      { name: 'Story Gold', hex: '#FFD700', isMain: true },
      { name: 'Gold Light', hex: '#FFE44D', isMain: false },
      { name: 'Gold Dark', hex: '#B39700', isMain: false },
    ]
  },
  {
    category: 'Голубой (Secondary)',
    description: 'Вспомогательный цвет, используемый для деталей и свечений.',
    colors: [
      { name: 'Legends Blue', hex: '#00BFFF', isMain: true },
      { name: 'Blue Light', hex: '#4DD2FF', isMain: false },
      { name: 'Blue Dark', hex: '#0086B3', isMain: false },
    ]
  },
  {
    category: 'Фон (Neutral)',
    description: 'Базовые цвета для интерфейса.',
    colors: [
      { name: 'Dark Bg', hex: '#050505', isMain: true },
      { name: 'Dark Surface', hex: '#111111', isMain: false },
      { name: 'White Text', hex: '#FFFFFF', isMain: false },
    ]
  }
];

const ASSETS = [
  {
    id: 'logo-full',
    title: 'Лого сервера',
    description: 'Основной текстовый логотип (PNG).',
    preview: '/design/StoryLegends.png',
    downloadUrl: '/design/StoryLegends.png',
    ext: 'PNG'
  },
  {
    id: 'logo-short',
    title: 'Короткое лого',
    description: 'Версия для аватарок (PNG/SVG).',
    preview: '/design/SL.png',
    downloadUrl: '/design/SL.png',
    svgUrl: '/design/svg/SL.svg',
    ext: 'PNG / SVG'
  },
  {
    id: 'logo-season',
    title: 'Лого сезона',
    description: 'Тематический логотип с подзаголовком.',
    preview: '/design/SLisland.png',
    downloadUrl: '/design/SLisland.png',
    ext: 'PNG'
  },
  {
    id: 'bg-animation',
    title: 'Анимированный фон',
    description: 'Бесконечный фон 60 FPS (идеально для OBS Browser Source). Работает лучше, чем GIF.',
    preview: '/design/bg-preview.webp',
    downloadUrl: '/design/bg-animation.html',
    ext: 'HTML'
  },
  {
    id: 'logo-discord',
    title: 'Discord Лого',
    description: 'Плоская версия для иконок.',
    preview: '/design/SLdiscord.png',
    downloadUrl: '/design/SLdiscord.png',
    svgUrl: '/design/svg/SLdiscord.svg',
    ext: 'PNG / SVG'
  }
];

const FONTS = [
  { name: 'Outfit', usage: 'Шрифт для заголовков и текстов. Современный, без засечек.' },
  { name: 'VT323', usage: 'Акцентный шрифт. Используется для стилизации текстов под майнкрафт.' },
];

export default function BrandKit() {
  const [downloadModal, setDownloadModal] = useState<{ isOpen: boolean; type: 'asset' | 'archive'; asset: typeof ASSETS[0] | null }>({
    isOpen: false,
    type: 'asset',
    asset: null
  });
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(text);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const handleDownload = (asset: typeof ASSETS[0], format: 'png' | 'svg' = 'png') => {
    const url = format === 'svg' ? asset.svgUrl : asset.downloadUrl;
    if (!url) return;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = url.split('/').pop() || 'asset';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadModal({ isOpen: false, type: 'asset', asset: null });
  };

  return (
    <Layout>
      <SEO 
        title="Brand Kit"
        description="Официальные материалы для контент-мейкеров StoryLegends: логотипы, цвета, шрифты."
      />
      
      {/* Главный контейнер */}
      <div className="relative z-10 pt-32 pb-24 px-4 w-full max-w-[1400px] mx-auto block overflow-visible">
        
        {/* Шапка */}
        <div className="relative z-20 w-full glass rounded-3xl p-8 md:p-12 mb-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-black text-white mb-4">Brand Kit</h1>
            <p className="text-gray-400 text-lg">
              Мы создали этот Brand Kit, чтобы вам было удобнее разрабатывать дизайн и контент, связанный с нашим сервером. 
              Здесь вы найдете все необходимые логотипы в максимальном качестве, шрифты и цвета.
            </p>
          </div>
          <button 
            onClick={() => setDownloadModal({ isOpen: true, type: 'archive', asset: null })}
            className="shrink-0 px-8 py-5 bg-[#FFD700] text-black rounded-2xl font-black text-lg flex items-center gap-3 hover:scale-105 transition-transform"
          >
            <Download className="w-6 h-6" />
            Скачать весь архив
          </button>
        </div>

        {/* Секция Логотипов */}
        <div className="relative z-20 mb-20 w-full block">
          <h2 className="text-3xl font-black text-white mb-8">Логотипы и Активы</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {ASSETS.map((asset) => (
              <div key={asset.id} className="glass rounded-[2rem] p-3 flex flex-col relative shadow-xl h-full">
                <div className="w-full h-32 rounded-3xl relative flex items-center justify-center p-4 shrink-0">
                  <img src={asset.preview} alt={asset.title} className="max-h-full max-w-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
                  <div className="absolute top-2 right-2 bg-white/10 backdrop-blur-md px-2 py-1 flex items-center border border-white/5 justify-center rounded text-[10px] text-white font-black">{asset.ext}</div>
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <div className="mb-6">
                    <h3 className="text-xl font-black text-white mb-2">{asset.title}</h3>
                    <p className="text-sm text-gray-400">{asset.description}</p>
                  </div>
                  <button 
                    onClick={() => setDownloadModal({ isOpen: true, type: 'asset', asset })}
                    className="w-full py-4 bg-white/10 hover:bg-white/20 text-white text-base font-black rounded-2xl flex items-center justify-center gap-2 transition-colors mt-auto"
                  >
                    <Download className="w-5 h-5" />
                    Скачать
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Секция Цвета и Шрифты */}
        <div className="relative z-20 grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          
          <div className="w-full">
            <h2 className="text-3xl font-black text-white mb-8">Цветовая палитра</h2>
            <div className="flex flex-col gap-6">
              {PALETTE.map((group) => (
                <div key={group.category} className="glass rounded-[2rem] p-6 shadow-xl">
                  <div className="mb-5">
                    <h3 className="text-white font-black text-xl">{group.category}</h3>
                    <p className="text-gray-400 text-sm mt-1">{group.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {group.colors.map((color) => (
                      <div 
                        key={color.hex} 
                        className={`flex flex-col overflow-hidden rounded-xl border border-white/10 shrink-0 ${color.isMain ? 'w-[110px] shadow-lg ring-1 ring-white/10' : 'w-[80px] opacity-80 hover:opacity-100'} transition-all cursor-pointer hover:-translate-y-1 block`}
                        onClick={() => copyToClipboard(color.hex)}
                      >
                        <div className={`w-full flex items-start justify-end p-2 ${color.isMain ? 'h-16' : 'h-10'}`} style={{ backgroundColor: color.hex }}>
                           {copiedColor === color.hex && (
                             <div className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-bold backdrop-blur-md">
                               Copied
                             </div>
                           )}
                           {color.isMain && copiedColor !== color.hex && (
                             <div className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-bold backdrop-blur-md uppercase tracking-wider">
                               Main
                             </div>
                           )}
                        </div>
                        <div className="p-2.5 bg-white/5">
                          <div className={`font-bold text-white truncate leading-none mb-1 ${color.isMain ? 'text-xs' : 'text-[10px]'}`}>{color.name}</div>
                          <div className="text-gray-400 font-mono text-[9px] leading-none uppercase">{color.hex}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full">
            <h2 className="text-3xl font-black text-white mb-8">Шрифты</h2>
            <div className="flex flex-col gap-4">
              {FONTS.map((font) => (
                <div key={font.name} className="glass rounded-2xl p-6 relative overflow-hidden">
                  <h3 className="text-white font-black text-xl mb-4">{font.name}</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-md">{font.usage}</p>
                  <p 
                    className="text-4xl text-white opacity-80" 
                    style={{ fontFamily: font.name === 'VT323' ? 'var(--font-minecraft)' : 'var(--font-sans)' }}
                  >
                    АБВГД ЕЁЖЗ ИЙКЛМ 123456
                  </p>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Секция Правил */}
        <div className="relative z-20 w-full mb-10">
          <h2 className="text-3xl font-black text-white mb-8">Правила использования</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-8">
              <h3 className="text-2xl font-black text-green-400 mb-6 flex items-center gap-3">
                Мы приветствуем
              </h3>
              <ul className="text-gray-300 space-y-4">
                <li className="flex items-start gap-4 text-base">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-2 shrink-0" />
                  <span>Создание фанатских артов или постов в соцсетях о своих приключениях и ивентах сервера.</span>
                </li>
                <li className="flex items-start gap-4 text-base">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-2 shrink-0" />
                  <span>Использование предоставленных ассетов для оформления превью к вашим видео на YouTube, стримам на Twitch и так далее.</span>
                </li>
              </ul>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8">
              <h3 className="text-2xl font-black text-red-500 mb-6 flex items-center gap-3">
                Мы запрещаем
              </h3>
              <ul className="text-gray-300 space-y-4">
                <li className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                  <div>
                    <span className="font-bold text-white block mb-1">Мисинформация и клевета</span>
                    <span className="text-sm">Не выдавайте свои арты или видео за официальную позицию администрации StoryLegends. Не используйте ассеты в видео, разжигающих ненависть.</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                  <div>
                    <span className="font-bold text-white block mb-1">Искажение стилистики</span>
                    <span className="text-sm">Не растягивайте логотипы и не меняйте их цвета. Они должны использоваться в соотношении сторон, задуманном авторами.</span>
                  </div>
                </li>
              </ul>
            </div>
            
          </div>
        </div>

      </div>

      {/* Модальное окно */}
      <AnimatePresence>
        {downloadModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDownloadModal({ isOpen: false, type: 'asset', asset: null })}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg glass rounded-3xl overflow-hidden shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-white">Скачивание файлов</h3>
                <button onClick={() => setDownloadModal({ isOpen: false, type: 'asset', asset: null })} className="p-2 bg-white/5 hover:bg-white/10 rounded-full">
                  <X className="w-6 h-6 text-gray-300" />
                </button>
              </div>

              {downloadModal.type === 'archive' ? (
                <div className="flex bg-black/40 p-4 rounded-xl items-center gap-5 mb-8 border border-white/5">
                  <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                    <Download className="w-8 h-8 text-story-gold drop-shadow" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">Полный архив (ZIP)</h4>
                    <p className="text-gray-400 text-sm">Все логотипы и элементы брендинга StoryLegends.</p>
                  </div>
                </div>
              ) : downloadModal.asset && (
                <div className="flex bg-black/40 p-4 rounded-xl items-center gap-4 mb-8 border border-white/5">
                  <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center shrink-0 p-2 border border-white/5 shadow-inner">
                    <img src={downloadModal.asset.preview} className="max-h-full max-w-full object-contain drop-shadow-xl" alt="" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">{downloadModal.asset.title}</h4>
                    <p className="text-gray-400 text-sm">{downloadModal.asset.description}</p>
                  </div>
                </div>
              )}

              {downloadModal.asset?.ext === 'HTML' ? (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 mb-8">
                  <div className="font-bold flex items-center gap-2 mb-2 text-blue-400">
                    <Info className="w-5 h-5"/>
                    Инструкция: Интерактивный фон
                  </div>
                  <p className="text-sm text-blue-200/80 leading-relaxed mb-2">
                    1. Скачайте файл и <b>откройте его в браузере</b>.<br/>
                    2. Настройте нужные вам цвета, яркость и скорость в панели.<br/>
                    3. Скопируйте ссылку и добавьте её в <b>OBS (Browser Source)</b> с размером 1920x1080.
                  </p>
                  <p className="text-sm text-blue-200/50 leading-relaxed">
                    Панель настроек скроется автоматически при захвате в OBS.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5 mb-8">
                  <div className="font-bold flex items-center gap-2 mb-2 text-yellow-500">
                    <Info className="w-5 h-5"/>
                    Правила использования
                  </div>
                  <p className="text-sm text-yellow-200/80 leading-relaxed">
                    Скачивая данные материалы, вы обязуетесь не искажать их пропорции и цвета, а также не использовать логотипы для создания дезинформации и материалов, нарушающих правила сервера.
                  </p>
                </div>
              )}

              {downloadModal.type === 'archive' ? (
                <a 
                  href="/design/storylegends.zip"
                  onClick={() => setDownloadModal({ isOpen: false, type: 'asset', asset: null })}
                  className="w-full py-4 bg-[#FFD700] text-black font-black rounded-xl hover:scale-105 transition-transform uppercase flex items-center justify-center cursor-pointer"
                >
                  Принять правила и скачать
                </a>
              ) : downloadModal.asset && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {downloadModal.asset.ext === 'HTML' ? (
                    <button 
                      onClick={() => handleDownload(downloadModal.asset!, 'png')}
                      className="col-span-1 md:col-span-2 py-4 bg-[#FFD700] text-black font-black rounded-xl hover:scale-105 transition-transform"
                    >
                      СКАЧАТЬ КОНФИГУРАТОР ФОНА
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleDownload(downloadModal.asset!)}
                        className="py-4 bg-white text-black font-black rounded-xl hover:scale-105 transition-transform"
                      >
                        СКАЧАТЬ PNG
                      </button>
                      {downloadModal.asset.svgUrl ? (
                        <button 
                          onClick={() => handleDownload(downloadModal.asset!, 'svg')}
                          className="py-4 bg-white/10 text-white font-black rounded-xl hover:bg-white/20 transition-colors"
                        >
                          СКАЧАТЬ SVG
                        </button>
                      ) : (
                        <div className="py-4 bg-white/5 text-gray-600 font-bold rounded-xl text-center cursor-not-allowed">
                          ТОЛЬКО PNG
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
