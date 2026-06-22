import React, { useEffect, useState } from 'react';

interface IPGeoInfoProps {
    ip?: string;
    colorClasses?: string;
}

interface GeoData {
    city?: string;
    country_name?: string;
    country_code?: string;
    flag?: string;
    ip?: string;
}

export const IPGeoInfo: React.FC<IPGeoInfoProps> = ({ ip: rawIpInput, colorClasses = 'text-gray-300' }) => {
    const [geo, setGeo] = useState<GeoData | null>(null);
    const [loading, setLoading] = useState(false);

    const getFlagEmoji = (countryCode: string) => {
        if (!countryCode || countryCode.length !== 2) return '';
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    };

    // Check if a string looks like a valid IPv4 or IPv6 address
    const isValidIp = (s: string) => /^[\d.:a-fA-F]+$/.test(s) && s.length > 3;

    useEffect(() => {
        if (!rawIpInput || rawIpInput === '—') return;

        // Handle new CC,City,IP format from backend
        if (rawIpInput.includes(',')) {
            const parts = rawIpInput.split(',').map(s => s.trim());
            if (parts.length >= 3) {
                setGeo({
                    country_code: parts[0],
                    city: parts[1],
                    ip: parts[2],
                    flag: getFlagEmoji(parts[0])
                });
                setLoading(false);
                return;
            }
            // Handle legacy CC,IP format
            if (parts.length === 2 && !isValidIp(parts[0])) {
                setGeo({
                    country_code: parts[0],
                    ip: parts[1],
                    flag: getFlagEmoji(parts[0])
                });
                setLoading(false);
                return;
            }
        }

        const ip = rawIpInput.trim();

        // If stored value is just a 2-letter country code (e.g. "RU")
        if (!isValidIp(ip) && ip.length === 2) {
            const flag = getFlagEmoji(ip);
            setGeo({ country_code: ip, flag, ip: '' });
            return;
        }

        setLoading(true);
        fetch(`https://ipwho.is/${ip}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.success !== false) {
                    setGeo({
                        city: data.city,
                        country_name: data.country,
                        country_code: data.country_code,
                        flag: data.country_code ? getFlagEmoji(data.country_code) : undefined,
                        ip: ip
                    });
                } else {
                    setGeo({ ip });
                }
            })
            .catch(() => setGeo({ ip }))
            .finally(() => setLoading(false));
    }, [rawIpInput]);

    if (!rawIpInput || rawIpInput === '—') return <code className="text-gray-600 font-bold">—</code>;

    const displayIp = geo?.ip || rawIpInput;

    return (
        <div className="flex items-center gap-2 min-w-0 font-mono">
            {geo?.ip && (
                <code className={`${colorClasses} font-semibold text-xs tracking-tight shrink-0`}>
                    {displayIp}
                </code>
            )}
            {!geo?.ip && !loading && (
                <code className={`${colorClasses} font-semibold text-xs tracking-tight shrink-0`}>
                    {rawIpInput}
                </code>
            )}
            {geo?.flag && (
                <span className="text-sm shrink-0" title={geo.city ? `${geo.city}, ${geo.country_name}` : geo.country_name}>
                    {geo.flag}
                </span>
            )}
            {geo?.city && (
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                    {geo.city}
                </span>
            )}
            {loading && <div className="w-3 h-3 border-2 border-white/20 border-t-story-gold rounded-full animate-spin shrink-0" />}
        </div>
    );
};
export default IPGeoInfo;

