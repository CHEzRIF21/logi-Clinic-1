import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User } from '../../types/auth';
import { isSuperAdmin } from '../../utils/permissions';

interface SuperAdminRouteProps {
  children: React.ReactNode;
  user: User | null;
}

const SuperAdminRoute: React.FC<SuperAdminRouteProps> = ({ children, user }) => {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/super-admin/login" state={{ from: location }} replace />;
  }
  if (!isSuperAdmin(user)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default SuperAdminRoute;
