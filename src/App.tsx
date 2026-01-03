import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Footer from './components/Footer';
import Background from './components/Background';
import SeasonalEffects from './components/SeasonalEffects';

function App() {
  return (
    <div className="min-h-screen text-white selection:bg-yellow-500/30 relative">
      <Background />
      <SeasonalEffects />
      <Navbar />
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
}

export default App;
