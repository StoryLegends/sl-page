import Hero from '../components/Hero';
import Features from '../components/Features';
import CTASection from '../components/CTASection';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import SeasonStatus from '../components/SeasonStatus';

const Main = () => {
  return (
    <Layout>
      <SEO
        title="Главная"
        description="StoryLegends - Бесплатный ванильный сервер Minecraft. Присоединяйся к нашему сообществу, строй, выживай и твори историю!"
      />
      <Hero />
      <Features />
      <SeasonStatus />
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
        {/* How to Join Section */}
        <div className="mb-16 max-w-3xl mx-auto text-center relative z-20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Как попасть на сервер?</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <p className="text-gray-300 text-lg mb-6">
              Всё, что вам нужно сделать — это создать аккаунт на нашем сайте и заполнить заявку в личном кабинете.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Пожалуйста, внимательно внесите все необходимые данные при регистрации и отправьте форму-заявку. После этого остаётся только подождать её рассмотрения. Наша администрация рассмотрит вашу заявку и если всё в порядке, вы получите доступ на сервер. При необходимости мы можем связаться с вами в Discord.
            </p>
          </div>
        </div>

        <CTASection />
      </div>
    </Layout>
  );
};

export default Main;
