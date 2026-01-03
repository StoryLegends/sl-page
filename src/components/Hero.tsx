import React from 'react';
import { ArrowDown } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      <div className="text-center z-10 px-4 max-w-5xl mx-auto">
        {/* Main Title with Gradient and Glow */}
        {/* Main Title with Logo Image */}
        <div className="mb-12 animate-float relative z-10">
          <img
            src="/images/logo.png"
            alt="StoryLegends"
            className="w-full max-w-4xl mx-auto drop-shadow-[0_0_50px_rgba(255,215,0,0.2)]"
          />
        </div>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          Бесплатный приватный Minecraft сервер <span className="text-legends-blue font-medium">StoryLegends</span>!
        </p>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <ArrowDown className="h-8 w-8 text-white" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
