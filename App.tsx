// App.tsx

import { StatusBar, View, Alert, Platform, PermissionsAndroid, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import AppNavigator from "./navigation/AppNavigator";
import { DashboardProvider } from "./Context/DashboardContext";
import { enableScreens } from 'react-native-screens';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from "@react-native-async-storage/async-storage";
import notifee, { EventType } from '@notifee/react-native';

// Import our global navigation service
import { navigationRef, navigate } from "./navigation/NavigationService";
// ✅ 1. IMPORT SafeAreaProvider
import { SafeAreaProvider } from 'react-native-safe-area-context';
enableScreens(false);

const handleNotificationNavigation = async (remoteMessage: any) => {
  try {
    const intParcelCode = remoteMessage.data?.intParcelCode;
    if (!intParcelCode) return;

    const cachedParcelsString = await AsyncStorage.getItem('all_parcels');
    if (!cachedParcelsString) {
      Alert.alert("Error", "Please refresh your dashboard to load the latest data.");
      return;
    }
    const allParcels = JSON.parse(cachedParcelsString);
    const targetParcel = allParcels.find(
      (p: any) => p.intParcelCode.toString() === intParcelCode.toString()
    );

    if (targetParcel) {
      navigate('ParcelDetailsScreen', { parcel: targetParcel });
    } else {
      Alert.alert("Error", "Could not find this parcel. Please refresh your dashboard.");
    }
  } catch (error) {
    console.error("Failed to process notification from cache:", error);
  }
};

async function requestUserPermission() {
  if (Platform.OS === 'ios') {
    await messaging().requestPermission();
  } else if (Platform.OS === 'android') {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
  getFCMToken();
}

async function getFCMToken() {
  let fcmToken = await AsyncStorage.getItem('fcmToken');
  if (!fcmToken) {
    try {
      fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log("FCM TOKEN (newly generated):", fcmToken);
        await AsyncStorage.setItem('fcmToken', fcmToken);
      }
    } catch (error) {
      console.error("Failed to get FCM token", error);
    }
  } else {
    console.log("FCM TOKEN (from storage):", fcmToken);
  }
}

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

export const notificationListener = () => {
  messaging().onTokenRefresh(newFcmToken => {
    console.log('FCM TOKEN (refreshed):', newFcmToken);
    AsyncStorage.setItem('fcmToken', newFcmToken);
  });

  messaging().onMessage(async remoteMessage => {
    if (Platform.OS === 'android') {
      onDisplayNotification(remoteMessage.notification.title, remoteMessage.notification.body, remoteMessage.data);
    }
  });

  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Notification caused app to open from background state.');
    handleNotificationNavigation(remoteMessage);
  });
};

const AppContent = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <View style={{ flex: 1 }}>
        <AppNavigator />
      </View>
    </NavigationContainer>
  );
};

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  useEffect(() => {
    const init = async () => {
      await requestUserPermission();
      notificationListener();
      setIsAppReady(true);
    };
    init();

    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        handleNotificationNavigation({ data: detail.notification?.data });
      }
    });


    return () => {
      unsubscribeNotifee();
    };
  }, []);

  if (!isAppReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#2C3E50" }}>
        <ActivityIndicator size="large" color="#E67E22" />
      </View>
    );
  }


  return (
    <SafeAreaProvider>
      <DashboardProvider>
        <StatusBar translucent barStyle="dark-content" backgroundColor="#ffe0e0ff" />
        <AppContent />
      </DashboardProvider>
    </SafeAreaProvider>
  );
}