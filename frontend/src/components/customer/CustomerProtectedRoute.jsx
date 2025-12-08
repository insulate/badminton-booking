import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import usePlayerAuthStore from '../../store/playerAuthStore';
import { ROUTES } from '../../constants';

export default function CustomerProtectedRoute() {
  const { isAuthenticated, isLoading, initAuth } = usePlayerAuthStore();
  const location = useLocation();

  // Initialize auth state from localStorage
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login with return path
    return (
      <Navigate
        to={`${ROUTES.CUSTOMER.LOGIN}?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <Outlet />;
}
