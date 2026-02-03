import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import SeasonalEffects from './components/SeasonalEffects';
import GoogleAnalytics from './components/GoogleAnalytics';
import CookieBanner from './components/CookieBanner';
import Loader from './components/ui/Loader';
import './App.css';

import Main from './pages/Main';
import About from './pages/About';
import Rules from './pages/Rules';
import PrivacyPolicy from './pages/PrivacyPolicy';
import UserAgreement from './pages/UserAgreement';
import Licenses from './pages/Licenses';
import FAQ from './pages/FAQ';
import NotFound from './pages/NotFound';

const History = lazy(() => import('./pages/History'));
const HistoryDetail = lazy(() => import('./pages/HistoryDetail'));
const GloryList = lazy(() => import('./pages/GloryList'));

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <GoogleAnalytics />
      <ScrollToTop />
      <SeasonalEffects />
      <CookieBanner />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/about" element={<About />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:id" element={<HistoryDetail />} />
          <Route path="/glorylist" element={<GloryList />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/user-agreement" element={<UserAgreement />} />
          <Route path="/licenses" element={<Licenses />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}


export default App;
