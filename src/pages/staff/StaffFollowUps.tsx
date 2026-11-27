import React from 'react';
import { StaffDashboard } from './StaffDashboard';

/**
 * Follow-up Agenda is now integrated directly inside Sales Overview (StaffDashboard).
 * StaffFollowUps exports StaffDashboard for route backward compatibility.
 */
export const StaffFollowUps: React.FC = () => {
  return <StaffDashboard />;
};
