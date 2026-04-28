import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

const FCM_TOKEN_KEY = 'fcmToken';

const getUpdateEndpoint = (roleName: string): string | null => {
  if (roleName === 'Entity') return 'http://tanmia-group.com:90/courierApi/entity/updateToken';
  if (roleName === 'Driver') return 'http://tanmia-group.com:90/courierApi/driver/updateToken';
  return null;
};

export const syncFcmTokenToServer = async (
  userId: number,
  roleName: string,
  token: string,
): Promise<boolean> => {
  const endpoint = getUpdateEndpoint(roleName);
  if (!endpoint || !userId || !token) return false;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Id: userId,
        IosToken: Platform.OS === 'ios' ? token : null,
        AndroidToken: Platform.OS === 'android' ? token : null,
      }),
    });
    if (!response.ok) {
      console.error('Failed to update FCM token:', response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error updating FCM token:', error);
    return false;
  }
};

/**
 * Fetches the current FCM token, persists it, and pushes it to the server
 * if a user is logged in. Safe to call on startup and from token-refresh
 * listeners — only POSTs when the token actually changed or the server hasn't
 * been told yet (tracked by `fcmTokenSynced` flag).
 */
export const refreshAndSyncFcmToken = async (): Promise<string | null> => {
  try {
    const currentToken = await messaging().getToken();
    if (!currentToken) return null;

    const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    const syncedFlag = await AsyncStorage.getItem('fcmTokenSynced');
    const tokenChanged = storedToken !== currentToken;

    if (tokenChanged) {
      await AsyncStorage.setItem(FCM_TOKEN_KEY, currentToken);
      await AsyncStorage.removeItem('fcmTokenSynced');
    }

    const userDataString = await AsyncStorage.getItem('user');
    if (!userDataString) return currentToken;

    const userData = JSON.parse(userDataString);
    if (!userData.userId || !userData.roleName) return currentToken;

    const needsSync = tokenChanged || syncedFlag !== currentToken;
    if (needsSync) {
      const ok = await syncFcmTokenToServer(userData.userId, userData.roleName, currentToken);
      if (ok) await AsyncStorage.setItem('fcmTokenSynced', currentToken);
    }

    return currentToken;
  } catch (error) {
    console.error('refreshAndSyncFcmToken failed:', error);
    return null;
  }
};
