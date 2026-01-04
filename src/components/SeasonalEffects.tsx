import React from 'react';
import { CURRENT_SEASON, seasonalEffects } from '../config/seasonal';

const SeasonalEffects: React.FC = () => {
  const config = seasonalEffects[CURRENT_SEASON];
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const particles = React.useMemo(() => {
    if (!config.enabled) return [];

    // Optimize count for mobile
    const count = isMobile ? Math.min(config.count, 20) : config.count;

    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      // Handle both string and array for backward compatibility
      content: Array.isArray(config.particles)
        ? config.particles[Math.floor(Math.random() * config.particles.length)]
        : config.particles,
      left: `${Math.random() * 100}%`,
      animationDelay: `-${Math.random() * 20}s`,
      animationDuration: `${10 + Math.random() * 10}s`,
    }));
  }, [config, isMobile]);

  if (!config.enabled) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden h-full w-full">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute text-sm opacity-70 ${config.animation} will-change-transform`}
          style={{
            left: particle.left,
            top: `-20px`,
            animationDelay: particle.animationDelay,
            animationDuration: particle.animationDuration,
          }}
        >
          {particle.content}
        </div>
      ))}
    </div>
  );
};

export default SeasonalEffects;
