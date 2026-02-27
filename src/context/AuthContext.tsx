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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const user = await usersApi.getMe();
                    setUser(user);
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
                // Also store verified status if crucial for redirection logic before getMe completes
                // localStorage.setItem('emailVerified', String(response.emailVerified));

                const user = await usersApi.getMe();
                setUser(user);
                return user;
            }

            throw new Error('Login failed: No token received');
        } catch (error: any) {
            // Check if the error response indicates TOTP is required
            // Note: If success response had totpRequired, we threw above.
            // If API returned 401 with totpRequired in body, axios throws.
            if (error.response?.data?.totpRequired || error.totpRequired) {
                throw { totpRequired: true };
            }
            throw error;
        }
    };

    const register = async (data: any) => {
        await authApi.register(data);
        // Registration now requires email verification, so we don't auto-login
    };

    const verifyEmail = async (token: string) => {
        const response = await authApi.verifyEmail(token);
        if (response.token) {
            localStorage.setItem('token', response.token);
            const user = await usersApi.getMe();
            setUser(user);
        }
    };

    const refreshUser = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const refreshed = await usersApi.getMe();
                setUser(refreshed);
            } catch (error) {
                console.error('Failed to refresh user', error);
            }
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
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
