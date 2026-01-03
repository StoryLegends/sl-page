import Layout from '../components/Layout';
import { Clock, Calendar, Map, ArrowRight } from 'lucide-react';

const History = () => {
  const seasons = [
    {
      title: "StoryLegends • SL",
      subtitle: "Первый сезон",
      description: "Начало истории. Зарождение легенд и первые герои сервера.",
      color: "from-blue-500 to-cyan-400",
      date: "2023"
    },
    {
      title: "StoryLegends • AF",
      subtitle: "Второй сезон",
      description: "Эпоха расцвета. Новые механики, масштабные постройки и эпические события.",
      color: "from-purple-500 to-pink-400",
      date: "2024"
    },
    {
      title: "StoneShield • SH",
      subtitle: "Третий сезон",
      description: "Суровые испытания. Хардкорное выживание и борьба за ресурсы.",
      color: "from-orange-500 to-red-400",
      date: "2025"
    },
    {
      title: "2b2t • Пародия",
      subtitle: "Спин-офф",
      description: "Анархия без правил. Полная свобода действий и хаос.",
      color: "from-gray-500 to-gray-400",
      date: "Special"
    }
  ];

  return (
    <Layout>
      <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto overflow-hidden">
        {/* Header */}
        <div className="text-center mb-24 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full -z-10" />
          <Clock className="w-20 h-20 text-purple-400 mx-auto mb-6 animate-pulse-slow" />
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-white to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
            История сервера
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Хронология событий и сезонов, которые сформировали наш мир.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative max-w-5xl mx-auto">
          {/* Central Line (hidden on mobile) */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent -translate-x-1/2 hidden md:block" />

          {seasons.map((season, index) => (
            <div key={index} className={`relative flex items-center justify-between mb-16 md:mb-24 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              } flex-col gap-8 md:gap-0`}>

              {/* Content Card */}
              <div className="w-full md:w-[45%] group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 z-10">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${season.color}`} />

                <div className="p-6 md:p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/10 mb-3 text-white`}>
                        {season.subtitle}
                      </span>
                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                        {season.title}
                      </h2>
                    </div>
                    <div className="text-2xl font-bold text-white/20 font-mono">
                      {season.date}
                    </div>
                  </div>

                  <p className="text-gray-400 mb-8 line-clamp-3 text-sm md:text-base">
                    {season.description}
                  </p>

                  <div className="flex items-center gap-4 pt-6">
                    <button className="flex items-center gap-2 text-sm font-bold text-white hover:gap-3 transition-all">
                      Подробнее <ArrowRight className="w-4 h-4" />
                    </button>
                    <div className="flex-grow" />
                    <Map className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                    <Calendar className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>

              {/* Center Dot (Desktop only) */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black border-2 border-white/50 z-20 hidden md:block shadow-[0_0_15px_rgba(255,255,255,0.5)]" />

              {/* Empty Space for Zigzag Balance */}
              <div className="w-full md:w-[45%] hidden md:block" />

            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default History;
