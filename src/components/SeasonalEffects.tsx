import React from 'react';
import { CURRENT_SEASON, seasonalEffects } from '../config/seasonal';

const SeasonalEffects: React.FC = () => {
  const config = seasonalEffects[CURRENT_SEASON];

  const particles = React.useMemo(() => {
    if (!config.enabled) return [];
    return Array.from({ length: config.count }).map((_, i) => ({
      id: i,
      // Handle both string and array for backward compatibility, though we updated config to array
      content: Array.isArray(config.particles)
        ? config.particles[Math.floor(Math.random() * config.particles.length)]
        : config.particles,
      left: `${Math.random() * 100}%`,
      animationDelay: `-${Math.random() * 20}s`,
      animationDuration: `${10 + Math.random() * 10}s`,
    }));
  }, [config]);

  if (!config.enabled) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden h-full w-full">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute text-sm opacity-70 ${config.animation}`}
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
