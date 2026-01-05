import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Clock, Calendar, Map, ArrowRight } from 'lucide-react';

interface HistoryItem {
  id: string;
  name: string;
  description: string;
  path: string;
  date: string;
  gradient?: string;
  colors?: string[];
}

const History = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/history-index.json');
        if (response.ok) {
          const data = await response.json();
          setHistoryItems(data);
        }
      } catch (error) {
        console.error('Failed to load history index', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">Загрузка...</div>
        </div>
      </Layout>
    );
  }

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

          {historyItems.map((item, index) => {
            const gradientStyle = item.colors && item.colors.length > 0
              ? `linear-gradient(to right, ${item.colors.join(', ')})`
              : (item.gradient || 'linear-gradient(to right, #a855f7, #3b82f6)');

            return (
              <div key={item.id} className={`relative flex items-center justify-between mb-16 md:mb-24 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                } flex-col gap-8 md:gap-0`}>

                {/* Content Card */}
                <Link to={`/history/${item.id}`} className="w-full md:w-[45%] group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 z-10 block">
                  <div
                    className="absolute top-0 left-0 w-full h-1 rounded-t-2xl"
                    style={{ background: gradientStyle }}
                  />

                  <div className="p-6 md:p-8">
                    <div className="mb-6">
                      <div className="text-sm font-mono text-white/40 font-bold mb-2">
                        {item.date}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white transition-all">
                        {item.name}
                      </h2>
                    </div>

                    <p className="text-gray-300 mb-8 line-clamp-3 text-sm md:text-base">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-4 pt-6">
                      <span className="flex items-center gap-2 text-sm font-bold text-white group-hover:gap-3 transition-all">
                        Подробнее <ArrowRight className="w-4 h-4" />
                      </span>
                      <div className="flex-grow" />
                      <Map className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                      <Calendar className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>

                {/* Center Dot (Desktop only) */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black border-2 border-white/50 z-20 hidden md:block shadow-[0_0_15px_rgba(255,255,255,0.5)]" />

                {/* Empty Space for Zigzag Balance */}
                <div className="w-full md:w-[45%] hidden md:block" />

              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default History;
