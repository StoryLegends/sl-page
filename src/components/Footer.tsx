import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 py-12 border-t border-white/5 bg-black/40 backdrop-blur-sm mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">

          {/* Social Section */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <span className="text-gray-500 uppercase tracking-widest text-sm font-medium">Мы в соц. сетях</span>
            <div className="flex gap-4">
              <a href="#" className="px-6 py-2 rounded-lg bg-[#FF0000]/10 border border-[#FF0000]/20 text-[#FF0000] hover:bg-[#FF0000]/20 transition-all hover:scale-105">
                YouTube
              </a>
              <a href="https://discord.com/invite/2RxxMnr6X9" target="_blank" rel="noopener noreferrer" className="px-6 py-2 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/20 text-[#5865F2] hover:bg-[#5865F2]/20 transition-all hover:scale-105">
                Discord
              </a>
            </div>
          </div>

          {/* Copyright / Info */}
          <div className="text-center md:text-right text-xs text-gray-600 space-y-2">
            <p>Not an official Minecraft product.</p>
            <p>The server StoryLegends is not affiliated with Mojang Studios.</p>
            <p className="text-gray-500">StoryLegends © 2023 - 2026</p>
            <p className="text-gray-500 pt-2">
              Developed by <a href="https://datapeice.me" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">@datapeice</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
