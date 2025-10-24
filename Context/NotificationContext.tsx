import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Notification {
  NotificationId: number;
  BranchCode: number;
  ParcelCode: number;
  Title: string;
  Body: string;
  Url: string;
  Type: string;
  CreatedAt: string;
  IsRead: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  // Helper function to get role-based API URLs
  const getNotificationUrls = (userData: any, branchCode: number, entityCode: string) => {
    const userRole = userData.roleName || userData.role;
    const isDriver = userRole === 'Driver';

    const fetchUrl = isDriver
      ? `https://tanmia-group.com:84/courierApi/Driver/notifications/${branchCode}/${entityCode}`
      : `https://tanmia-group.com:84/courierApi/Entity/notifications/${branchCode}/${entityCode}`;

    const markAsReadUrl = isDriver
      ? `https://tanmia-group.com:84/courierApi/notifications/driver/mark-all-read/${branchCode}/${entityCode}`
      : `https://tanmia-group.com:84/courierApi/notifications/entity/mark-all-read/${branchCode}/${entityCode}`;

    return { fetchUrl, markAsReadUrl, userRole };
  };

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);

      const userDataString = await AsyncStorage.getItem('user');
      if (!userDataString) {
        // console.log('❌ No user data found for fetching notifications'); // Clarified message
        setLoading(false);
        return;
      }

      const userData = JSON.parse(userDataString);

      const branchCode = userData.intFromBranchCode || userData.branchCode || userData.BranchCode;
      const entityCode = userData.userId || userData.strSenderEntityCode;

      if (!branchCode || !entityCode) {
        // console.log('❌ Missing branchCode or entityCode for fetching notifications'); // Clarified message
        // console.log('Available user properties:', Object.keys(userData));
        setLoading(false);
        return;
      }

      const { fetchUrl, userRole } = getNotificationUrls(userData, branchCode, entityCode);

      // console.log(`🔔 Fetching ${userRole} notifications from:`, fetchUrl);

      const response = await axios.get(fetchUrl);

      if (response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        console.error('Response headers:', error.response?.headers);
      }
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      if (isMarkingAsRead) {
        // console.log('⏳ Already marking as read, skipping...');
        return;
      }

      if (unreadCount === 0) {
        // console.log('ℹ️ No unread notifications to mark. Current unreadCount:', unreadCount); // Added unreadCount to log
        return;
      }

      setIsMarkingAsRead(true);
      // console.log('Starting markAllAsRead process...'); // New log

      const userDataString = await AsyncStorage.getItem('user');
      if (!userDataString) {
        // console.log('❌ No user data found for marking as read'); // Clarified message
        setIsMarkingAsRead(false);
        return;
      }

      const userData = JSON.parse(userDataString);

      const branchCode = userData.intFromBranchCode || userData.branchCode || userData.BranchCode;
      const entityCode = userData.userId || userData.strSenderEntityCode;

      if (!branchCode || !entityCode) {
        setIsMarkingAsRead(false);
        return;
      }

      const { markAsReadUrl, userRole } = getNotificationUrls(userData, branchCode, entityCode);


      // Optimistically update UI immediately
      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, IsRead: true }));
        // console.log('Optimistically marked all notifications as read in UI state.'); // New log
        return updated;
      });
      setUnreadCount(0); // Set unread count to 0 in UI
      // console.log('Optimistically set unreadCount to 0 in UI state.'); // New log


      // Then call API in background
      const apiResponse = await axios.post(markAsReadUrl, {}); // Added empty object as body
      // console.log('✅ Server confirmed: all notifications marked as read. API Response:', apiResponse.data); // New log with response

    } catch (error) {
      console.error('❌ Error marking notifications as read:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data (mark as read error):', error.response?.data);
        console.error('Response status (mark as read error):', error.response?.status);
        console.error('Response headers (mark as read error):', error.response?.headers);
      }
      // On error, refetch to restore correct state
      // console.log('Attempting to refetch notifications to restore state due to error.'); // New log
      await fetchNotifications();
    } finally {
      setIsMarkingAsRead(false);
      // console.log('Finished markAllAsRead process.'); // New log
    }
  }, [unreadCount, fetchNotifications, isMarkingAsRead]); // Ensure isMarkingAsRead is a dependency

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};