import React from 'react';
import ModernLayout from './ModernLayout';
import { User } from '../../types/auth';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  return (
    <ModernLayout user={user} onLogout={onLogout}>
      {children}
    </ModernLayout>
  );
};

export default Layout;
