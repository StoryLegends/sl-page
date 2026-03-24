import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Deep dark background */}
      <div className="absolute inset-0 bg-dark-bg" />

      {/* Animated Gradient Blobs - Logo Colors */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] animate-pulse-slow mix-blend-screen" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] animate-pulse-slow mix-blend-screen" style={{ backgroundColor: 'rgba(0, 191, 255, 0.1)', animationDelay: '2s' }} />

      {/* Floating Orbs */}
      <div className="absolute top-[20%] right-[20%] w-64 h-64 rounded-full blur-[80px] animate-float" style={{ backgroundColor: 'rgba(255, 215, 0, 0.05)' }} />
      <div className="absolute bottom-[20%] left-[20%] w-96 h-96 rounded-full blur-[100px] animate-float" style={{ backgroundColor: 'rgba(0, 191, 255, 0.05)', animationDelay: '3s' }} />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/80" />
    </div>
  );
};

export default Background;
