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
        const storedConsent = localStorage.getItem(STORAGE_KEY);
        if (storedConsent) {
            try {
                setConsent(JSON.parse(storedConsent));
                setBannerVisible(false);
            } catch (e) {
                console.error("Failed to parse cookie consent", e);
                // If parsing fails, reset
                localStorage.removeItem(STORAGE_KEY);
                setBannerVisible(true);
            }
        } else {
            setBannerVisible(true);
        }
    }, []);

    const saveConsent = (settings: ConsentSettings) => {
        setConsent(settings);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
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
