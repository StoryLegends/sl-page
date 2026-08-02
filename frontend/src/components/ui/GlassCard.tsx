import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'highlight';
}

const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    variant = 'default'
}) => {
    const baseStyles = "bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all duration-300 relative group";

    const variants = {
        default: "hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:-translate-y-1",
        highlight: "bg-gradient-to-br from-story-gold/10 to-legends-blue/10 border-story-gold/30 shadow-[0_0_30px_rgba(255,215,0,0.1)] hover:shadow-[0_0_50px_rgba(255,215,0,0.2)] hover:-translate-y-2 scale-105 z-10 overflow-hidden"
    };

    return (
        <div className={`${baseStyles} ${variants[variant]} ${className}`}>
            {variant === 'highlight' && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:animate-[shimmer_2s_infinite]" />
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-story-gold/20 rounded-full blur-2xl group-hover:bg-story-gold/30 transition-colors" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-legends-blue/20 rounded-full blur-2xl group-hover:bg-legends-blue/30 transition-colors" />
                </>
            )}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default GlassCard;
