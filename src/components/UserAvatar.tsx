import React from 'react';

interface UserAvatarProps {
    avatarUrl: string | null | undefined;
    username: string;
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    rounded?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ avatarUrl, username, className = '', size = 'md', rounded = 'rounded-full' }) => {
    const isLetter = !avatarUrl || avatarUrl.length <= 1;
    const initial = (avatarUrl && avatarUrl.length === 1 ? avatarUrl : username.charAt(0)).toUpperCase();

    const sizeMemo: Record<string, string> = {
        'xs': 'w-6 h-6 text-[10px]',
        'sm': 'w-8 h-8 text-xs',
        'md': 'w-10 h-10 text-base',
        'lg': 'w-12 h-12 text-xl',
        'xl': 'w-32 h-32 text-4xl',
        'full': 'w-full h-full text-base'
    };

    const containerClass = sizeMemo[size] || sizeMemo['md'];

    if (isLetter) {
        return (
            <div className={`${containerClass} ${rounded} bg-gradient-to-br from-story-gold to-story-gold-dark flex items-center justify-center text-black font-bold shadow-lg shadow-story-gold/10 ${className}`}>
                {initial}
            </div>
        );
    }

    return (
        <div className={`${containerClass} ${rounded} overflow-hidden bg-neutral-900 border border-white/10 relative ${className}`}>
            <img
                src={avatarUrl as string}
                alt={username}
                className="w-full h-full object-cover"
                onError={(e) => {
                    // If image fails to load, replace with letter
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent) {
                        const div = document.createElement('div');
                        div.className = `${containerClass} ${rounded} bg-gradient-to-br from-story-gold to-story-gold-dark flex items-center justify-center text-black font-bold shadow-lg shadow-story-gold/10 ${className}`;
                        div.innerText = initial;
                        parent.replaceWith(div);
                    }
                }}
            />
        </div>
    );
};

export default UserAvatar;
