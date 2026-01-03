import React from 'react';
import { CURRENT_SEASON, seasonalEffects } from '../config/seasonal';

const SeasonalEffects: React.FC = () => {
  const config = seasonalEffects[CURRENT_SEASON];

  if (!config.enabled) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: config.count }).map((_, i) => (
        <div
          key={i}
          className={`absolute text-2xl ${config.animation}`}
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`,
          }}
        >
          {config.particles}
        </div>
      ))}
    </div>
  );
};

export default SeasonalEffects;
