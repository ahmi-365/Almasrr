// App.tsx

import { StatusBar, View, Alert, Platform, PermissionsAndroid, ActivityIndicator, Linking } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import AppNavigator from "./navigation/AppNavigator";
import { DashboardProvider } from "./Context/DashboardContext";
import { enableScreens } from 'react-native-screens';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from "@react-native-async-storage/async-storage";
import notifee, { EventType } from '@notifee/react-native';
import DeviceInfo from 'react-native-device-info';

// Import local components and services
import CustomAlert from "./components/CustomAlert";
import { navigationRef, navigate } from "./navigation/NavigationService";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NotificationProvider } from "./Context/NotificationContext";

enableScreens(false);

// --- SHARED UTILITY FUNCTIONS ---

/**
 * Sends the current FCM token to the backend server based on the user's role.
 * This is a fire-and-forget function for reliability.
 * @param {number} userId - The ID of the logged-in user.
 * @param {string} roleName - The role of the user ('Entity' or 'Driver').
 * @returns {Promise<boolean>} - True if sync was successful or not needed, false otherwise.
 */
const updateFCMTokenOnServer = async (userId, roleName) => {
  try {
    const fcmToken = await AsyncStorage.getItem('fcmToken');
    if (!fcmToken) {
      console.log('No FCM token found, skipping server update.');
      return true; // Nothing to sync.
    }

    const endpoint = roleName === 'Entity'
      ? 'http://tanmia-group.com:90/courierApi/entity/updateToken'
      : roleName === 'Driver'
        ? 'http://tanmia-group.com:90/courierApi/driver/updateToken'
        : '';

    if (!endpoint) {
      console.warn(`Unknown role "${roleName}". Cannot update FCM token.`);
      return false;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Id: userId,
        IosToken: Platform.OS === 'ios' ? fcmToken : null,
        AndroidToken: Platform.OS === 'android' ? fcmToken : null,
      }),
    });

    if (response.ok) {
      console.log(`FCM token synced successfully for ${roleName} (ID: ${userId}).`);
      return true;
    } else {
      console.error(`Failed to sync FCM token. Server responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('An error occurred while syncing FCM token:', error);
    return false;
  }
};


// --- NOTIFICATION HANDLERS ---

const handleNotificationNavigation = async (remoteMessage) => {
  try {
    const intParcelCode = remoteMessage.data?.intParcelCode;
    if (!intParcelCode) return;

    const cachedParcelsString = await AsyncStorage.getItem('all_parcels');
    if (!cachedParcelsString) {
      Alert.alert("خطأ", "يرجى تحديث لوحة التحكم لتحميل أحدث البيانات.");
      return;
    }
    const allParcels = JSON.parse(cachedParcelsString);
    const targetParcel = allParcels.find(
      (p) => p.intParcelCode.toString() === intParcelCode.toString()
    );

    if (targetParcel) {
      navigate('ParcelDetailsScreen', { parcel: targetParcel });
    } else {
      Alert.alert("خطأ", "تعذر العثور على هذا الطرد. يرجى تحديث لوحة التحكم.");
    }
  } catch (error) {
    console.error("Failed to process notification from cache:", error);
  }
};

async function onDisplayNotification(title, body, data) {
  await notifee.requestPermission();
  const channelId = await notifee.createChannel({ id: 'default', name: 'Default Channel' });
  await notifee.displayNotification({
    title,
    body,
    data,
    android: { channelId, pressAction: { id: 'default' } },
  });
}

// --- CORE APP LOGIC ---

const AppContent = () => (
  <NavigationContainer ref={navigationRef}>
    <View style={{ flex: 1 }}>
      <AppNavigator />
    </View>
  </NavigationContainer>
);

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [alertInfo, setAlertInfo] = useState({
    isVisible: false,
    title: '',
    message: '',
    confirmText: 'حسنًا',
    onConfirm: () => { },
    success: false,
  });

  useEffect(() => {
    /**
     * The main initialization sequence for the application.
     * It runs checks in a specific order: Update Check -> Permissions -> Notifications.
     */
    const initializeApp = async () => {
      // --- 1. Mandatory App Update Check ---
      const canContinue = await checkAppUpdate();
      if (!canContinue) {
        // If the check fails, the alert is shown and we stop the entire process.
        // The app remains in a "loading" state with the alert on top.
        return;
      }

      // --- 2. Notification Permissions & Token Retrieval ---
      await setupNotifications();

      // --- 3. Finalize App Readiness ---
      setIsAppReady(true);
    };

    const checkAppUpdate = async () => {
      try {
        const currentVersion = DeviceInfo.getBuildNumber();
        const apiUrl = Platform.OS === 'ios'
          ? 'http://tanmia-group.com:90/api/checkUpdate/AL_MASAR_IOS'
          : 'http://tanmia-group.com:90/api/checkUpdate/AL_MASAR_ANDROID';

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Server returned an error.');

        const data = await response.json();
        const requiredVersion = data.strValue;

        console.log(`App Version Check - Current: ${currentVersion}, Required: ${requiredVersion}`);

        // if (requiredVersion && currentVersion !== requiredVersion) {
        if (requiredVersion && parseInt(currentVersion) < parseInt(requiredVersion)) {
          // --- IMPORTANT: REPLACE WITH YOUR ACTUAL STORE URLS ---
          const storeUrl = Platform.OS === 'ios'
            ? 'https://apps.apple.com/us/app/your-app-name/idcom.ALMASAR.ALMASAR'
            : 'https://play.google.com/store/apps/details?id=com.ALMASAR.ALMASAR';

          setAlertInfo({
            isVisible: true,
            title: 'تحديث إجباري',
            message: 'يتوفر إصدار جديد من التطبيق. يرجى التحديث إلى أحدث إصدار للاستمرار.',
            confirmText: 'تحديث الآن',
            onConfirm: () => Linking.openURL(storeUrl),
            success: false,
          });
          return false; // STOP initialization
        }
        return true; // PROCEED with initialization
      } catch (error) {
        console.error("Update check failed:", error);
        setAlertInfo({
          isVisible: true,
          title: 'خطأ في الاتصال',
          message: 'لا يمكن التحقق من وجود تحديثات. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.',
          confirmText: 'حسنًا',
          onConfirm: () => { }, // Block the user
          success: false,
        });
        return false; // STOP initialization
      }
    };

    const setupNotifications = async () => {
      // Request user permission for notifications.
      if (Platform.OS === 'ios') {
        await messaging().requestPermission();
      } else if (Platform.OS === 'android') {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }

      // Get FCM token if it doesn't exist.
      let fcmToken = await AsyncStorage.getItem('fcmToken');
      console.log("loaded:", fcmToken);

      if (!fcmToken) {
        try {
          fcmToken = await messaging().getToken();
          if (fcmToken) {
            // console.log("FCM TOKEN (newly generated):", fcmToken);
            await AsyncStorage.setItem('fcmToken', fcmToken);
            await AsyncStorage.setItem('fcmTokenSynced', 'false'); // Mark as needing sync
          }
        } catch (error) {
          console.error("Failed to get FCM token", error);
        }
      }

      // Set up listeners for token refresh and incoming messages.
      messaging().onTokenRefresh(async (newFcmToken) => {
        console.log('FCM TOKEN (refreshed):', newFcmToken);
        await AsyncStorage.setItem('fcmToken', newFcmToken);
        await AsyncStorage.setItem('fcmTokenSynced', 'false'); // Mark as needing sync
      });

      messaging().onMessage(async (remoteMessage) => {
        onDisplayNotification(remoteMessage.notification.title, remoteMessage.notification.body, remoteMessage.data);
      });

      messaging().onNotificationOpenedApp(remoteMessage => {
        handleNotificationNavigation(remoteMessage);
      });

      notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.PRESS) {
          handleNotificationNavigation({ data: detail.notification?.data });
        }
      });

      // Check if a logged-in user's token needs to be synced.
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const tokenSynced = await AsyncStorage.getItem('fcmTokenSynced');
        if (tokenSynced !== 'true') {
          console.log('FCM token is out of sync. Attempting to sync on app startup...');
          const user = JSON.parse(userString);
          const syncSuccess = await updateFCMTokenOnServer(user.userId, user.roleName);
          if (syncSuccess) {
            await AsyncStorage.setItem('fcmTokenSynced', 'true');
          }
        }
      }
    };

    initializeApp();

  }, []);

  return (
    <SafeAreaProvider>
      <DashboardProvider>
        <NotificationProvider>
          <StatusBar translucent barStyle="dark-content" backgroundColor="#ffe0e0ff" />

          {isAppReady ? (
            <AppContent />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#2C3E50" }}>
              <ActivityIndicator size="large" color="#E67E22" />
            </View>
          )}

          <CustomAlert
            isVisible={alertInfo.isVisible}
            title={alertInfo.title}
            message={alertInfo.message}
            confirmText={alertInfo.confirmText}
            onConfirm={alertInfo.onConfirm}
            success={alertInfo.success}
            onCancel={() => { }} // Mandatory alerts are not cancelable
            cancelText={undefined} />
        </NotificationProvider>
      </DashboardProvider>
    </SafeAreaProvider>
  );
}


// import { StatusBar, View, Alert, Platform, PermissionsAndroid, ActivityIndicator } from "react-native";
// import { NavigationContainer } from "@react-navigation/native";
// import React, { useEffect, useState } from "react";
// import AppNavigator from "./navigation/AppNavigator";
// import { DashboardProvider } from "./Context/DashboardContext";
// import { enableScreens } from 'react-native-screens';
// import messaging from '@react-native-firebase/messaging';
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import notifee, { EventType } from '@notifee/react-native';

// // Import our global navigation service
// import { navigationRef, navigate } from "./navigation/NavigationService";
// // ✅ 1. IMPORT SafeAreaProvider
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// enableScreens(false);

// const handleNotificationNavigation = async (remoteMessage: any) => {
//   try {
//     const intParcelCode = remoteMessage.data?.intParcelCode;
//     if (!intParcelCode) return;

//     const cachedParcelsString = await AsyncStorage.getItem('all_parcels');
//     if (!cachedParcelsString) {
//       Alert.alert("Error", "Please refresh your dashboard to load the latest data.");
//       return;
//     }
//     const allParcels = JSON.parse(cachedParcelsString);
//     const targetParcel = allParcels.find(
//       (p: any) => p.intParcelCode.toString() === intParcelCode.toString()
//     );

//     if (targetParcel) {
//       navigate('ParcelDetailsScreen', { parcel: targetParcel });
//     } else {
//       Alert.alert("Error", "Could not find this parcel. Please refresh your dashboard.");
//     }
//   } catch (error) {
//     console.error("Failed to process notification from cache:", error);
//   }
// };

// async function requestUserPermission() {
//   if (Platform.OS === 'ios') {
//     await messaging().requestPermission();
//   } else if (Platform.OS === 'android') {
//     await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
//   }
//   getFCMToken();
// }

// async function getFCMToken() {
//   let fcmToken = await AsyncStorage.getItem('fcmToken');
//   if (!fcmToken) {
//     try {
//       fcmToken = await messaging().getToken();
//       if (fcmToken) {
//         console.log("FCM TOKEN (newly generated):", fcmToken);
//         await AsyncStorage.setItem('fcmToken', fcmToken);
//       }
//     } catch (error) {
//       console.error("Failed to get FCM token", error);
//     }
//   } else {
//     console.log("FCM TOKEN (from storage):", fcmToken);
//   }
// }

// async function onDisplayNotification(title, body, data) {
//   await notifee.requestPermission();
//   const channelId = await notifee.createChannel({ id: 'default', name: 'Default Channel' });
//   await notifee.displayNotification({
//     title,
//     body,
//     data,
//     android: { channelId, pressAction: { id: 'default' } },
//   });
// }

// export const notificationListener = () => {
//   messaging().onTokenRefresh(newFcmToken => {
//     console.log('FCM TOKEN (refreshed):', newFcmToken);
//     AsyncStorage.setItem('fcmToken', newFcmToken);
//   });

//   messaging().onMessage(async remoteMessage => {
//     if (Platform.OS === 'android') {
//       onDisplayNotification(remoteMessage.notification.title, remoteMessage.notification.body, remoteMessage.data);
//     }
//   });

//   messaging().onNotificationOpenedApp(remoteMessage => {
//     console.log('Notification caused app to open from background state.');
//     handleNotificationNavigation(remoteMessage);
//   });
// };

// const AppContent = () => {
//   return (
//     <NavigationContainer ref={navigationRef}>
//       <View style={{ flex: 1 }}>
//         <AppNavigator />
//       </View>
//     </NavigationContainer>
//   );
// };

// export default function App() {
//   const [isAppReady, setIsAppReady] = useState(false);
//   useEffect(() => {
//     const init = async () => {
//       await requestUserPermission();
//       notificationListener();
//       setIsAppReady(true);
//     };
//     init();

//     const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
//       if (type === EventType.PRESS) {
//         handleNotificationNavigation({ data: detail.notification?.data });
//       }
//     });


//     return () => {
//       unsubscribeNotifee();
//     };
//   }, []);

//   if (!isAppReady) {
//     return (
//       <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#2C3E50" }}>
//         <ActivityIndicator size="large" color="#E67E22" />
//       </View>
//     );
//   }


//   return (
//     <SafeAreaProvider>
//       <DashboardProvider>
//         <StatusBar translucent barStyle="dark-content" backgroundColor="#ffe0e0ff" />
//         <AppContent />
//       </DashboardProvider>
//     </SafeAreaProvider>
//   );
// }