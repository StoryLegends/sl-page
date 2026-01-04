import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Главная', href: '/' },
    { name: 'О сервере', href: '/about' },
    { name: 'Правила', href: '/rules' },
    { name: 'История', href: '/history' },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'py-4 bg-black/80 backdrop-blur-md' : 'py-6 bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="relative group cursor-pointer z-50">
            {/* Dual-color glow: Gold (Left) -> Blue (Right) */}
            <div className="absolute inset-0 bg-gradient-to-r from-story-gold/40 via-transparent to-legends-blue/60 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />

            <img
              src={`${import.meta.env.BASE_URL}images/logo.webp`}
              alt="StoryLegends"
              className={`relative z-10 h-6 md:h-8 w-auto drop-shadow-[0_0_15px_rgba(255,215,0,0.1)] transition-all duration-300 group-hover:scale-105 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = link.href === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(link.href);

              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`text-sm font-medium transition-colors relative group ${isActive ? 'text-white' : 'text-gray-300 hover:text-white'}`}
                >
                  {link.name}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-story-gold to-legends-blue transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button (Hamburger) */}
          <button
            className={`md:hidden relative z-50 text-white p-2 focus:outline-none transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Backdrop */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] transition-opacity duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <div className={`fixed top-0 right-0 h-full w-64 bg-black/80 backdrop-blur-md border-l border-white/10 shadow-2xl z-[100] transition-transform duration-300 md:hidden flex flex-col ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
        {/* Drawer Header with Close Button */}
        <div className="flex justify-end p-6">
          <button
            className="text-white p-2 focus:outline-none hover:bg-white/10 rounded-full transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Drawer Links */}
        <div className="flex flex-col items-center gap-8 mt-10">
          {navLinks.map((link) => {
            const isActive = link.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(link.href);

            return (
              <Link
                key={link.name}
                to={link.href}
                className={`text-xl font-bold transition-colors relative group ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-story-gold to-legends-blue transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'
                  }`} />
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Navbar;
