import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import SeasonalEffects from './components/SeasonalEffects';
import GoogleAnalytics from './components/GoogleAnalytics';
import CookieBanner from './components/CookieBanner';
import Loader from './components/ui/Loader';
import './App.css';

const Main = lazy(() => import('./pages/Main'));
const About = lazy(() => import('./pages/About'));
const Rules = lazy(() => import('./pages/Rules'));
const History = lazy(() => import('./pages/History'));
const HistoryDetail = lazy(() => import('./pages/HistoryDetail'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const UserAgreement = lazy(() => import('./pages/UserAgreement'));
const Licenses = lazy(() => import('./pages/Licenses'));
const NotFound = lazy(() => import('./pages/NotFound'));
const GloryList = lazy(() => import('./pages/GloryList'));
const FAQ = lazy(() => import('./pages/FAQ'));

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
