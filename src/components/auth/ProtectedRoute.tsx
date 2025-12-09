import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User } from '../../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  user: User | null;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, user }) => {
  const location = useLocation();

  if (!user) {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
