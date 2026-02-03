import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Youtube } from 'lucide-react';

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.921 13.921 0 0 0-.64 1.314 18.288 18.288 0 0 0-5.426 0 14.172 14.172 0 0 0-.64-1.314.076.076 0 0 0-.08-.037 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" />
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.368-1.491.035-1.86-1.956-2.047z" />
  </svg>
);

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const sentinel = document.getElementById('nav-sentinel');
    if (!sentinel) return;

    const observer = new IntersectionObserver(([entry]) => {
      setScrolled(!entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "0px"
    });

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Главная', href: '/' },
    { name: 'Донат', href: 'https://boosty.to/lendspele/donate' },
    { name: 'О сервере', href: '/about' },
    { name: 'Правила', href: '/rules' },
    { name: 'FAQ', href: '/faq' },
    { name: 'История', href: '/history' },
  ];

  const socialLinks = [
    { name: 'YouTube', url: 'https://www.youtube.com/@storylegends77', icon: Youtube, color: 'hover:text-[#FF0000]' },
    { name: 'Discord', url: 'https://discord.com/invite/2RxxMnr6X9', icon: DiscordIcon, color: 'hover:text-[#5865F2]' },
    { name: 'Telegram', url: 'https://t.me/lendspelelogs', icon: TelegramIcon, color: 'hover:text-[#229ED9]' },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'py-3 md:py-4 bg-[#0a0a0a] shadow-lg' : 'py-3 md:py-6 bg-transparent'
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

          {/* Desktop Links & Socials */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = link.href === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.href) || (link.href === '/about' && location.pathname === '/glorylist');

                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`text-sm font-medium transition-colors relative group ${isActive ? 'text-white' : 'text-gray-300 hover:text-white'
                      }`}
                  >
                    {link.name}
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-story-gold to-legends-blue transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}
                    />
                  </Link>
                );
              })}
            </div>

            <div className="w-px h-5 bg-white/10" />

            {/* Desktop Social Icons */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-gray-400 transition-colors transform hover:scale-110 ${social.color}`}
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
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
      <div className={`fixed top-0 right-0 h-full w-64 bg-[#0a0a0a] border-l border-white/10 shadow-2xl z-[100] transition-transform duration-300 md:hidden flex flex-col ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
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
              : location.pathname.startsWith(link.href) || (link.href === '/about' && location.pathname === '/glorylist');

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

        {/* Mobile Social Links */}
        <div className="mt-auto mb-10 flex justify-center gap-6">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-gray-400 transition-colors p-2 rounded-full bg-white/5 border border-white/10 ${social.color}`}
              aria-label={social.name}
            >
              <social.icon className="w-6 h-6" />
            </a>
          ))}
        </div>
      </div>

    </>
  );
};

export default Navbar;
