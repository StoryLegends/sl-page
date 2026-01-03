export type Season = 'winter' | 'spring' | 'summer' | 'autumn' | 'none';

export const CURRENT_SEASON: Season = 'none';

export const seasonalEffects = {
  winter: {
    enabled: true,
    particles: '❄️',
    count: 50,
    animation: 'snow-fall',
  },
  spring: {
    enabled: true,
    particles: '🌸',
    count: 30,
    animation: 'float-up',
  },
  summer: {
    enabled: true,
    particles: '☀️',
    count: 20,
    animation: 'sun-rays',
  },
  autumn: {
    enabled: true,
    particles: '🍂',
    count: 40,
    animation: 'leaves-fall',
  },
  none: {
    enabled: false,
    particles: '',
    count: 0,
    animation: '',
  },
};
