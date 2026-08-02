import { type ReactNode } from 'react';
import Navbar from './Navbar';
import Background from './Background';
import Footer from './Footer';
import SeasonalEffects from './SeasonalEffects';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen text-white selection:bg-yellow-500/30 relative flex flex-col">
      <div id="nav-sentinel" className="absolute top-0 h-[10px] left-0 right-0 pointer-events-none bg-transparent opacity-0 z-[-1]" />
      <Background />
      <SeasonalEffects />
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
