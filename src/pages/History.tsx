import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Clock, Calendar, Map, ArrowRight } from 'lucide-react';
import Loader from '../components/ui/Loader';
import SEO from '../components/SEO';
import { historyApi } from '../api/history';

import { useAuth } from '../context/AuthContext';

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
  const { hasFeature } = useAuth();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      const useDbFirst = hasFeature('history');

      const fetchFromFiles = async (): Promise<HistoryItem[]> => {
        const res = await fetch('/history-index.json');
        if (!res.ok) throw new Error('history-index not found');
        return await res.json();
      };

      const fetchFromDb = async (): Promise<HistoryItem[]> => {
        const items = await historyApi.getPublicHistory();
        if (!items || items.length === 0) throw new Error('No DB items');
        return items.map(item => {
          let colors = item.colors || [];
          if (typeof item.colorsJson === 'string') {
            try { colors = JSON.parse(item.colorsJson); } catch {}
          }
          if (colors.length === 0) colors = ['#34383b', '#728697'];
          return {
            id: item.pathSlug || String(item.id),
            name: item.title,
            description: item.description || '',
            path: item.pathSlug || String(item.id),
            date: item.eventDate || '',
            colors: colors
          };
        });
      };

      try {
        if (useDbFirst) {
          // Flag ENABLED: DB first -> Fallback to files
          try {
            const data = await fetchFromDb();
            setHistoryItems(data);
          } catch (dbErr) {
            console.warn('DB history fetch failed, falling back to files:', dbErr);
            const data = await fetchFromFiles();
            setHistoryItems(data);
          }
        } else {
          // Flag DISABLED: Files first -> Fallback to DB
          try {
            const data = await fetchFromFiles();
            setHistoryItems(data);
          } catch (fileErr) {
            console.warn('File history fetch failed, falling back to DB:', fileErr);
            const data = await fetchFromDb();
            setHistoryItems(data);
          }
        }
      } catch (error) {
        console.error('All history fetch strategies failed:', error);
      } finally {
        setIsExiting(true);
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    };

    fetchHistory();
  }, [hasFeature]);

  if (loading) {
    return (
      <Layout>
        <div className={`min-h-screen flex items-center justify-center transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
          <Loader />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title="История"
        description="Хроники сезонов и великие события сервера StoryLegends. Погрузитесь в прошлое нашего мира."
      />
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
                <Link to={`/history/${item.id}`} className="w-full md:w-[45%] group relative bg-white/5 backdrop-blur-sm ring-1 ring-inset ring-white/10 rounded-2xl overflow-hidden transition-transform duration-500 hover:-translate-y-2 hover:bg-white/10 z-10 block">
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
