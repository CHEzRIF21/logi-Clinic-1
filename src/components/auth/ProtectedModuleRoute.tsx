import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User, ModulePermission } from '../../types/auth';
import { hasModuleAccess } from '../../utils/permissions';

interface ProtectedModuleRouteProps {
  children: React.ReactNode;
  user: User | null;
  requiredModule: ModulePermission;
}

/**
 * Route protégée qui vérifie si l'utilisateur a accès au module requis
 */
const ProtectedModuleRoute: React.FC<ProtectedModuleRouteProps> = ({ 
  children, 
  user, 
  requiredModule 
}) => {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasModuleAccess(user, requiredModule)) {
    // Rediriger vers le dashboard si l'utilisateur n'a pas accès
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedModuleRoute;

