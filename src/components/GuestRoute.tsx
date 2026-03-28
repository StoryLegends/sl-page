import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './ui/Loader';

interface GuestRouteProps {
    children: ReactNode;
}

const GuestRoute = ({ children }: GuestRouteProps) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <Loader />
            </div>
        );
    }

    if (user) {
        return <Navigate to="/profile" replace />;
    }

    return <>{children}</>;
};

export default GuestRoute;
