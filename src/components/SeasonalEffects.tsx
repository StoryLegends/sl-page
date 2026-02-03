import React, { useState, useEffect, useRef } from 'react';
import { CURRENT_SEASON, seasonalEffects } from '../config/seasonal';

// Particle Interface
interface Particle {
  id: number;
  content: React.ReactNode;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSpeedY: number;
  swaySpeed: number;
  swayOffset: number;
  opacity: number;
  color: string | undefined;
  scale: number;
  element: HTMLDivElement | null;
  rotation: number;
  rotationSpeed: number;
  fontSize: string | undefined;
}

const SeasonalEffects: React.FC = () => {
  const config = seasonalEffects[CURRENT_SEASON];
  const [isMobile, setIsMobile] = useState(false);

  // Use state to hold particles so that the component renders them
  const [renderedParticles, setRenderedParticles] = useState<Particle[]>([]);

  // Refs for animation system to avoid re-renders during loop
  const requestRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]); // Holds the mutable live state

  // Initialize checks
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize Particles
  useEffect(() => {
    if (!config.enabled) {
      setRenderedParticles([]);
      particlesRef.current = [];
      return;
    }

    const count = isMobile ? Math.min(config.count, 20) : config.count;
    const isWinter = CURRENT_SEASON === 'winter' || CURRENT_SEASON === 'new-year';

    // Winter colors palette
    const winterColors = [
      '#FFFFFF', '#DBF4FF', '#E0FFFF', '#F0F8FF', '#F8F8FF',
    ];

    const newParticles: Particle[] = Array.from({ length: count }).map((_, i) => ({
      id: i,
      content: Array.isArray(config.particles)
        ? config.particles[Math.floor(Math.random() * config.particles.length)]
        : config.particles,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: 0,
      vy: 0,
      // Physics properties
      baseSpeedY: config.animation === 'float-up' ? -(0.5 + Math.random()) : (0.5 + Math.random()),
      swaySpeed: 0.02 + Math.random() * 0.04,
      swayOffset: Math.random() * Math.PI * 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
      // Visual properties
      opacity: 0.4 + Math.random() * 0.4,
      color: isWinter ? winterColors[Math.floor(Math.random() * winterColors.length)] : undefined,
      scale: 0.5 + Math.random() * 0.5,
      fontSize: isWinter ? `${10 + Math.random() * 10}px` : undefined,
      element: null, // Will be bound on render via callback ref
    }));

    // Set state to trigger render
    setRenderedParticles(newParticles);
    // Set ref for animation loop
    particlesRef.current = newParticles;

  }, [config, isMobile]);

  // Animation Loop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      if (!config.enabled) return;

      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const repulsionRadius = 150;
      const repulsionStrength = 0.5;

      particles.forEach(p => {
        if (!p.element) return;

        // 1. Base Movement
        p.vx *= 0.95; // Friction
        p.vy *= 0.95;

        // Normal movement factor (decreases if pushed by physics)
        const speedFactor = Math.max(0, 1 - Math.sqrt(p.vx * p.vx + p.vy * p.vy) * 0.1);
        p.y += p.baseSpeedY * speedFactor;

        // Sway
        p.swayOffset += p.swaySpeed;
        p.x += Math.sin(p.swayOffset) * 0.5 * speedFactor;

        // Velocity (Repulsion + Inertia)
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // 2. Repulsion Logic
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < repulsionRadius) {
          const force = (repulsionRadius - dist) / repulsionRadius;
          const angle = Math.atan2(dy, dx);

          p.vx += Math.cos(angle) * force * repulsionStrength;
          p.vy += Math.sin(angle) * force * repulsionStrength;
        }

        // 3. Screen Wrapping
        if (p.x < -50) p.x = width + 50;
        if (p.x > width + 50) p.x = -50;

        if (config.animation === 'float-up') {
          if (p.y < -50) p.y = height + 50;
        } else {
          if (p.y > height + 50) p.y = -50;
        }

        // 4. Update DOM
        p.element.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rotation}deg) scale(${p.scale})`;
        p.element.style.opacity = p.opacity.toString();
        if (p.color) p.element.style.color = p.color;
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    }
  }, [config]);

  if (!config.enabled) {
    return null;
  }

  // Render from state
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden h-full w-full">
      {renderedParticles.map((particle) => (
        <div
          key={particle.id}
          ref={(el) => {
            // Update the ref's element reference 
            // AND the state's element reference (though ref is what matters for animation)
            if (particlesRef.current[particle.id]) {
              particlesRef.current[particle.id].element = el;
            }
          }}
          className="absolute will-change-transform text-xs md:text-xl"
          style={{
            transform: 'translate3d(-100px, -100px, 0)', // Allow first frame to position correctly
            fontSize: particle.fontSize
          }}
        >
          {particle.content}
        </div>
      ))}
    </div>
  );
};

export default SeasonalEffects;
