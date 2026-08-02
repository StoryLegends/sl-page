

export type Season = 'winter' | 'spring' | 'summer' | 'autumn' | 'new-year' | 'halloween' | 'valentines' | 'womens-day' | 'victory-day' | 'none';

export const CURRENT_SEASON: Season = (import.meta.env.VITE_SEASON as Season) || 'none';

const SNOWFLAKES = [
    <svg key="s1" width="1em" height="1em" viewBox="0 0 450 450" fill="none" xmlns="http://www.w3.org/2000/svg"><rect y="150" width="150" height="150" fill="currentColor" /><rect x="150" y="300" width="150" height="150" fill="currentColor" /><path d="M300 150H450V300H300V150Z" fill="currentColor" /><rect x="150" width="150" height="150" fill="currentColor" /></svg>,
    <svg key="s2" width="1em" height="1em" viewBox="0 0 450 450" fill="none" xmlns="http://www.w3.org/2000/svg"><rect y="150" width="150" height="150" fill="currentColor" /><rect x="150" y="150" width="150" height="150" fill="currentColor" /><rect x="150" y="300" width="150" height="150" fill="currentColor" /><path d="M300 150H450V300H300V150Z" fill="currentColor" /><rect x="150" width="150" height="150" fill="currentColor" /></svg>,
    <svg key="s3" width="1em" height="1em" viewBox="0 0 450 450" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="150" height="150" fill="currentColor" /><rect x="150" y="150" width="150" height="150" fill="currentColor" /><rect y="300" width="150" height="150" fill="currentColor" /><rect x="300" y="300" width="150" height="150" fill="currentColor" /><rect x="300" width="150" height="150" fill="currentColor" /><rect x="300" width="150" height="150" fill="currentColor" /></svg>
];

export const seasonalEffects = {
    winter: {
        enabled: true,
        particles: SNOWFLAKES,
        count: 20,
        animation: 'snow-fall',
    },
    spring: {
        enabled: true,
        particles: ['🌸', '🥚', '🐇', '🌱'],
        count: 15,
        animation: 'float-up',
    },
    summer: {
        enabled: true,
        particles: ['☀️', '🏖️', '⛱️', '🌊'],
        count: 10,
        animation: 'sun-rays',
    },
    autumn: {
        enabled: true,
        particles: ['🍂', '🍁', '🍄'],
        count: 20,
        animation: 'leaves-fall',
    },
    'new-year': {
        enabled: true,
        particles: ['🎄', '🎅', '🎁', ...SNOWFLAKES],
        count: 20,
        animation: 'snow-fall',
    },
    halloween: {
        enabled: true,
        particles: ['🎃', '👻', '🕸️', '🦇'],
        count: 15,
        animation: 'float-up',
    },
    valentines: {
        enabled: true,
        particles: ['❤️', '💖', '🌹', '💌'],
        count: 15,
        animation: 'float-up',
    },
    'womens-day': {
        enabled: true,
        particles: ['🌷', '💐', '🌸', '🎀'],
        count: 15,
        animation: 'float-up',
    },
    'victory-day': {
        enabled: true,
        particles: ['⭐', '🎗️', '🎆'],
        count: 15,
        animation: 'float-up',
    },
    none: {
        enabled: false,
        particles: [],
        count: 0,
        animation: '',
    },
};
