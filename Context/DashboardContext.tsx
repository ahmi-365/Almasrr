// src/context/DashboardContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface DashboardContextType {
  dcBalance: string;
  setDcBalance: (balance: string) => void;
  dashboardData: any;
  setDashboardData: (data: any) => void;
  isSidebarVisible: boolean;
  toggleSidebar: () => void;
  // --- ADDED ---
  currentRoute: string;
  setCurrentRoute: (route: string) => void;
  // -------------
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dcBalance, setDcBalance] = useState('0.00');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  // --- ADDED ---
  const [currentRoute, setCurrentRoute] = useState('');
  // -------------

  const toggleSidebar = () => setSidebarVisible(prev => !prev);

  return (
    <DashboardContext.Provider
      value={{
        dcBalance,
        setDcBalance,
        dashboardData,
        setDashboardData,
        isSidebarVisible,
        toggleSidebar,
        // --- ADDED ---
        currentRoute,
        setCurrentRoute
        // -------------
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within a DashboardProvider');
  return context;
};