import { useEffect } from 'react';
import ReactGA from 'react-ga4';
import { useLocation } from 'react-router-dom';

const GoogleAnalytics = () => {
    const location = useLocation();

    useEffect(() => {
        const gaId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;
        if (gaId) {
            ReactGA.initialize(gaId);
        }
    }, []);

    useEffect(() => {
        const gaId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;
        if (gaId) {
            ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
        }
    }, [location]);

    return null;
};

export default GoogleAnalytics;
