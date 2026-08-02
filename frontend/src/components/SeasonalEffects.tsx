import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const isExcludedPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/sponsorship/checkout');

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
    if (!config.enabled || isExcludedPage) {
      setRenderedParticles([]);
      particlesRef.current = [];
      return;
    }

    const count = isMobile ? Math.min(config.count, 12) : config.count;
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

  }, [config, isMobile, isExcludedPage]);

  // Animation Loop
  useEffect(() => {
    if (!config.enabled || isExcludedPage) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      if (!config.enabled || isExcludedPage) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const mouse = mouseRef.current;

      // Update positions
      particlesRef.current.forEach((p) => {
        if (!p.element) return;

        // 1. Apply Sway (Horizontal wave)
        p.swayOffset += p.swaySpeed;
        const sway = Math.sin(p.swayOffset) * 0.5;

        // 2. Apply Wind / Mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let forceX = 0;
        let forceY = 0;

        if (dist < 120) {
          const force = (120 - dist) / 120;
          const angle = Math.atan2(dy, dx);
          forceX = Math.cos(angle) * force * 3;
          forceY = Math.sin(angle) * force * 3;
        }

        // Apply velocities with friction
        p.vx = p.vx * 0.95 + forceX;
        p.vy = p.vy * 0.95 + forceY;

        // 3. Move Particle
        p.x += p.vx + sway;
        p.y += p.vy + p.baseSpeedY;
        p.rotation += p.rotationSpeed;

        // Screen wrap
        if (p.x < -50) p.x = width + 50;
        else if (p.x > width + 50) p.x = -50;

        if (config.animation === 'float-up') {
          if (p.y < -50) p.y = height + 50;
        } else {
          if (p.y > height + 50) p.y = -50;
        }

        // 4. Update DOM - Only transform changes every frame
        p.element.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rotation}deg) scale(${p.scale})`;
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    }
  }, [config, isExcludedPage]);

  if (!config.enabled || isExcludedPage) {
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
            fontSize: particle.fontSize,
            opacity: particle.opacity,
            color: particle.color
          }}
        >
          {particle.content}
        </div>
      ))}
    </div>
  );
};

export default SeasonalEffects;
