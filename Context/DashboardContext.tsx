import React, { createContext, useContext, useState } from 'react';

// --- ADDED USER TYPE ---
interface User {
  strEntityName: string;
  roleName: string;
  userId: number;
  DCBalance?: number; // Make DCBalance optional as it might not exist on all user objects
  // Add any other user properties you need globally
}

interface DashboardContextType {
  dcBalance: string;
  setDcBalance: (balance: string) => void;
  dashboardData: any;
  setDashboardData: (data: any) => void;
  isSidebarVisible: boolean;
  toggleSidebar: () => void;
  currentRoute: string;
  setCurrentRoute: (route: string) => void;
  // --- ADDED ---
  user: User | null;
  setUser: (user: User | null) => void;
  // -------------
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dcBalance, setDcBalance] = useState('0.00');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('');
  // --- ADDED ---
  const [user, setUser] = useState<User | null>(null);
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
        currentRoute,
        setCurrentRoute,
        // --- ADDED ---
        user,
        setUser,
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