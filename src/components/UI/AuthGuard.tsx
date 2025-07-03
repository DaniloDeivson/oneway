import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  adminOnly?: boolean;
  managerOrAdminOnly?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requiredPermission,
  adminOnly = false,
  managerOrAdminOnly = false
}) => {
  const { user, loading, hasPermission, isAdmin, isManager } = useAuth();
  const location = useLocation();

  console.log('AuthGuard - Loading:', loading, 'User:', !!user, 'Path:', location.pathname);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) {
    console.log('AuthGuard - No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('AuthGuard - User authenticated, rendering children');

  if (adminOnly && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (managerOrAdminOnly && !isAdmin && !isManager) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};