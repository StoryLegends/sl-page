import React from 'react';

const Footer: React.FC = () => {
  return (
    <>
      {/* Social Section (Outside dark footer) */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 mt-20 mb-8">
        <div className="flex flex-col items-center gap-4">
          <span className="text-gray-500 uppercase tracking-widest text-sm font-medium">Мы в соц. сетях</span>
          <div className="flex gap-4">
            <a href="https://www.youtube.com/@storylegends77" className="px-6 py-2 rounded-lg bg-[#FF0000]/10 border border-[#FF0000]/20 text-[#FF0000] hover:bg-[#FF0000]/20 transition-all hover:scale-105">
              YouTube
            </a>
            <a href="https://discord.com/invite/2RxxMnr6X9" target="_blank" rel="noopener noreferrer" className="px-6 py-2 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/20 text-[#5865F2] hover:bg-[#5865F2]/20 transition-all hover:scale-105">
              Discord
            </a>
          </div>
        </div>
      </div>

      <footer className="relative z-10 py-12 border-t border-white/5 bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-stretch gap-8">

            {/* Contact Info */}
            <div className="flex flex-col items-center md:items-start gap-2 text-xs text-gray-600">
              <span className="text-gray-500 uppercase tracking-widest text-xs font-medium mb-2">Контакты</span>
              <a href="mailto:info@storylegends.xyz" className="hover:text-gray-400 transition-colors">
                info@storylegends.xyz
              </a>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Discord:</span>
                <span className="text-gray-500">lendspele_</span>
              </div>
              <div className="flex flex-col gap-1 mt-2">
                <a href="/privacy-policy" className="hover:text-gray-400 transition-colors">Политика конфиденциальности</a>
                <a href="/user-agreement" className="hover:text-gray-400 transition-colors">Пользовательское соглашение</a>
              </div>
            </div>

            {/* Copyright / Info */}
            <div className="flex flex-col justify-between text-center md:text-right text-xs text-gray-600">
              <div className="space-y-2">
                <p>Not an official Minecraft product.</p>
                <p>The server StoryLegends is not affiliated with Mojang Studios.</p>
                <p className="text-gray-500">StoryLegends © 2023 - 2026</p>
              </div>
              <p className="text-gray-500 pt-4 md:pt-0">
                Developed by <a href="https://datapeice.me" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">@datapeice</a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
