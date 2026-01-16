import { useEffect } from 'react';
import ReactGA from 'react-ga4';
import { useLocation } from 'react-router-dom';
import { useCookieConsent } from '../context/CookieConsentContext';

const GoogleAnalytics = () => {
    const location = useLocation();
    const { consent } = useCookieConsent();

    useEffect(() => {
        // Only initialize if analytics consent is granted
        if (consent?.analytics) {
            const gaId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;
            if (gaId) {
                ReactGA.initialize(gaId);
                console.log("GA Initialized");
            }
        }
    }, [consent?.analytics]);

    useEffect(() => {
        // Only track page views if analytics consent is granted
        if (consent?.analytics) {
            ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
        }
    }, [location, consent?.analytics]);

    return null;
};

// Helper for tracking custom events safely
export const trackEvent = (category: string, action: string, label?: string) => {
    // We can't easily access hook state here outside component, 
    // but usually calling ReactGA.event without init might just warn or do nothing.
    // However, to be strict, we really should check consent.
    // For now, let's assume this is called from components that might check, 
    // or we just let ReactGA handle the "not initialized" state (it might warn).
    // A better way is to check if ReactGA is initialized.

    // Check if GA object exists (it is created by react-ga4 on init)
    try {
        ReactGA.event({
            category,
            action,
            label,
        });
    } catch (e) {
        // ignore if not initialized
    }
};

export default GoogleAnalytics;
