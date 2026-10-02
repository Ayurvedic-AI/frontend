import React from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';

interface UnprotectedRouteProps {
  children: React.ReactNode;
}

/**
 * Routes that should only show to anonymous users (login, forgot-password).
 *
 * Special handling for `/set-password`: that page is reachable either from
 * the forgot-password flow (`location.state.token`) or from an admin
 * invitation email (`?token=...` in the URL). Both paths are allowed even if
 * the visitor is already signed in — the server still validates the token.
 */
const UnprotectedRoute: React.FC<UnprotectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  if (location.pathname.includes('/set-password')) {
    const stateToken = (location.state as { token?: string })?.token;
    const urlToken = searchParams.get('token');
    if (stateToken || urlToken) return <>{children}</>;
    return <Navigate to="/login" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default UnprotectedRoute;
