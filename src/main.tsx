import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { HelmetProvider } from 'react-helmet-async'
import { CookieConsentProvider } from './context/CookieConsentContext'


import { GoogleReCaptchaProvider } from 'react19-google-recaptcha-v3';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <GoogleReCaptchaProvider
        reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        useEnterprise={true} // Enabled to support modern reCAPTCHA Enterprise keys
      >
        <CookieConsentProvider>
          <App />
        </CookieConsentProvider>
      </GoogleReCaptchaProvider>
    </HelmetProvider>
  </StrictMode>,
)
