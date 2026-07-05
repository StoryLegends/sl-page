import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import { usersApi, authApi, type User } from '../api';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (data: any) => Promise<User>;
    register: (data: any) => Promise<void>;
    verifyEmail: (token: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isModerator: boolean;
    features: string[];
    hasFeature: (name: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [features, setFeatures] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFeatureFlags = async () => {
        try {
            const active = await usersApi.getActiveFeatureFlags();
            setFeatures(active);
        } catch (e) {
            console.error('Failed to load active feature flags:', e);
            setFeatures([]);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const user = await usersApi.getMe();
                    setUser(user);
                    await loadFeatureFlags();
                } catch (error) {
                    console.error('Failed to fetch user', error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (data: any) => {
        try {
            const response = await authApi.login(data);

            if (response.totpRequired) {
                throw { totpRequired: true };
            }

            if (response.token) {
                localStorage.setItem('token', response.token);
                const user = await usersApi.getMe();
                setUser(user);
                await loadFeatureFlags();
                return user;
            }

            throw new Error('Login failed: No token received');
        } catch (error: any) {
            if (error.response?.data?.totpRequired || error.totpRequired) {
                throw { totpRequired: true };
            }
            throw error;
        }
    };

    const register = async (data: any) => {
        await authApi.register(data);
    };

    const verifyEmail = async (token: string) => {
        const response = await authApi.verifyEmail(token);
        if (response.token) {
            localStorage.setItem('token', response.token);
            const user = await usersApi.getMe();
            setUser(user);
            await loadFeatureFlags();
        }
    };

    const refreshUser = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const refreshed = await usersApi.getMe();
                setUser(refreshed);
                await loadFeatureFlags();
            } catch (error) {
                console.error('Failed to refresh user', error);
            }
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setFeatures([]);
    };

    const hasFeature = (name: string) => {
        return features.includes(name);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                verifyEmail,
                logout,
                refreshUser,
                isAuthenticated: !!user,
                isAdmin: user?.role === 'ROLE_ADMIN',
                isModerator: user?.role === 'ROLE_MODERATOR',
                features,
                hasFeature,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
