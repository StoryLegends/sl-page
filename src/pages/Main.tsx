import Hero from '../components/Hero';
import Features from '../components/Features';
import CTASection from '../components/CTASection';
import Layout from '../components/Layout';

const Main = () => {
  return (
    <Layout>
      <Hero />
      <Features />
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
        <CTASection />
      </div>
    </Layout>
  );
};

export default Main;
