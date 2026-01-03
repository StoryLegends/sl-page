import React, { useState, useEffect } from 'react';

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Главная страница', href: '#' },
    { name: 'Донат', href: '#' },
    { name: 'О сервере', href: '#' },
    { name: 'История', href: '#' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-4 bg-black/50 backdrop-blur-md border-b border-white/5' : 'py-6 bg-transparent'
      }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="relative group cursor-pointer">
          {/* Dual-color glow: Gold (Left) -> Blue (Right) */}
          <div className="absolute inset-0 bg-gradient-to-r from-story-gold/40 via-transparent to-legends-blue/60 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />

          <img
            src="/images/logo.png"
            alt="StoryLegends"
            className="relative z-10 h-12 w-auto drop-shadow-[0_0_15px_rgba(255,215,0,0.1)] transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-story-gold to-legends-blue transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
