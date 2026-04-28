import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Rehydrate user (and DCBalance) from AsyncStorage on cold start so context
  // consumers don't see `null` until the user logs in again.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && parsed.roleName && parsed.userId) {
          setUser(parsed);
          const balanceNum = Number(parsed?.DCBalance);
          if (Number.isFinite(balanceNum)) setDcBalance(balanceNum.toFixed(2));
        }
      } catch (err) {
        console.error('Failed to rehydrate user from storage:', err);
      }
    })();
  }, []);

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