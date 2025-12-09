import React from 'react';
import DashboardModern from './DashboardModern';
import { User } from '../types/auth';

interface DashboardProps {
  user: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  return <DashboardModern user={user} />;
};

export default Dashboard;
