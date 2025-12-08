import { Navigate, Outlet, useLocation } from 'react-router-dom';
import usePlayerAuthStore from '../../store/playerAuthStore';
import { ROUTES } from '../../constants';

export default function CustomerProtectedRoute() {
  const { isAuthenticated, isLoading } = usePlayerAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
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
