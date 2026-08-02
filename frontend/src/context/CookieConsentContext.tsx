import React, { createContext, useContext, useEffect, useState } from 'react';

type ConsentSettings = {
    necessary: boolean;
    analytics: boolean;
};

type CookieConsentContextType = {
    consent: ConsentSettings | null;
    updateConsent: (settings: ConsentSettings) => void;
    acceptAll: () => void;
    rejectAll: () => void;
    bannerVisible: boolean;
    setBannerVisible: (visible: boolean) => void;
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

const STORAGE_KEY = 'cookie_consent_v1';

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [consent, setConsent] = useState<ConsentSettings | null>(null);
    const [bannerVisible, setBannerVisible] = useState(false);

    useEffect(() => {
        try {
            const storedConsent = localStorage.getItem(STORAGE_KEY);
            if (storedConsent) {
                try {
                    setConsent(JSON.parse(storedConsent));
                    setBannerVisible(false);
                } catch (e) {
                    console.error("Failed to parse cookie consent", e);
                    // If parsing fails, try to reset
                    try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
                    setBannerVisible(true);
                }
            } else {
                setBannerVisible(true);
            }
        } catch (e) {
            console.warn("LocalStorage access denied or unavailable", e);
            // If we can't read storage, we probably should show the banner or default to denied?
            // Usually showing the banner is safer, but if storage is blocked, we can't save the choice anyway.
            // Let's assume we show it for now, or maybe just proceed with defaults.
            setBannerVisible(true);
        }
    }, []);

    const saveConsent = (settings: ConsentSettings) => {
        setConsent(settings);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.warn("Failed to save consent to LocalStorage", e);
        }
        setBannerVisible(false);
    };

    const updateConsent = (settings: ConsentSettings) => {
        saveConsent(settings);
    };

    const acceptAll = () => {
        saveConsent({
            necessary: true,
            analytics: true
        });
    };

    const rejectAll = () => {
        saveConsent({
            necessary: true,
            analytics: false
        });
    };

    return (
        <CookieConsentContext.Provider value={{ consent, updateConsent, acceptAll, rejectAll, bannerVisible, setBannerVisible }}>
            {children}
        </CookieConsentContext.Provider>
    );
};

export const useCookieConsent = () => {
    const context = useContext(CookieConsentContext);
    if (!context) {
        throw new Error('useCookieConsent must be used within a CookieConsentProvider');
    }
    return context;
};
