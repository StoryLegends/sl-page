import React from 'react';
import GlassCard from './ui/GlassCard';

const Features: React.FC = () => {
  const features = [
    {
      title: "Лёгкость",
      description: "Легко присоединится к нашему серверу",
      icon: <img src="/images/feather.png" alt="Lightness" className="w-40 h-40 object-contain mx-auto drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />,
      variant: 'default' as const
    },
    {
      title: "Цена",
      description: "Ты не должен платить чтобы попасть на сервер, лишь написать заявку. Все бесплатно",
      icon: <img src="/images/diamond.png" alt="Price" className="w-40 h-40 object-contain mx-auto drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />,
      variant: 'highlight' as const
    },
    {
      title: "Быстрый ответ",
      description: "Мы достаточно быстро отвечаем на заявки",
      icon: <img src="/images/book.png" alt="Fast Answer" className="w-40 h-40 object-contain mx-auto drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />,
      variant: 'default' as const
    }
  ];

  return (
    <section className="py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-2xl md:text-3xl uppercase tracking-[0.2em] text-story-gold/80 font-medium">Наши плюсы:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <GlassCard
              key={index}
              variant={feature.variant}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-6">
                {feature.icon}
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${feature.variant === 'highlight' ? 'text-story-gold' : 'text-legends-blue'}`}>
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </GlassCard>
          ))}
        </div>

        {/* Call to Action */}

      </div>
    </section>
  );
};

export default Features;
