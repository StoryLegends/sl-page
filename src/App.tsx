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
import UserAgreement from './pages/UserAgreement';
import Licenses from './pages/Licenses';
import FAQ from './pages/FAQ';
import NotFound from './pages/NotFound';

const History = lazy(() => import('./pages/History'));
const HistoryDetail = lazy(() => import('./pages/HistoryDetail'));
const GloryList = lazy(() => import('./pages/GloryList'));
const PlayersPage = lazy(() => import('./pages/PlayersPage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));

import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import ApplicationPage from './pages/ApplicationPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import DiscordCallbackPage from './pages/DiscordCallbackPage';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <GoogleAnalytics />
      <ScrollToTop />
      <SeasonalEffects />
      <CookieBanner />
      <Suspense fallback={<Loader />}>
        <NotificationProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Main />} />
              <Route path="/about" element={<About />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/history" element={<History />} />
              <Route path="/history/:id" element={<HistoryDetail />} />
              <Route path="/glorylist" element={<GloryList />} />
              <Route path="/players" element={<PlayersPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/user-agreement" element={<UserAgreement />} />
              <Route path="/licenses" element={<Licenses />} />
              <Route path="/faq" element={<FAQ />} />

              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/discord/callback" element={<DiscordCallbackPage />} />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />

              <Route path="/application" element={
                <ProtectedRoute>
                  <ApplicationPage />
                </ProtectedRoute>
              } />

              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </NotificationProvider>
      </Suspense>
    </Router>
  );
}


export default App;
// Rebuild trigger 3
