// src/context/DashboardContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface DashboardContextType {
  dcBalance: string;
  setDcBalance: (balance: string) => void;
  dashboardData: any;
  setDashboardData: (data: any) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dcBalance, setDcBalance] = useState('0.00');
  const [dashboardData, setDashboardData] = useState<any>(null);

  return (
    <DashboardContext.Provider value={{ dcBalance, setDcBalance, dashboardData, setDashboardData }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within a DashboardProvider');
  return context;
};
