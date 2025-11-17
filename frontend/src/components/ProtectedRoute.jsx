import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '../constants';
import useAuthStore from '../store/authStore';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen gradient-blue flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 animate-pulse-glow">
            <span className="text-white font-bold text-4xl">B</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-white/80 text-sm mt-4">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Render children if authenticated
  return children;
}
