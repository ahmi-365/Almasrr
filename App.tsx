// App.tsx

import "react-native-gesture-handler"; // ✅ CRITICAL: Must be at the very top
import {
  StatusBar,
  View,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  Linking,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import AppNavigator from "./navigation/AppNavigator";
import { DashboardProvider } from "./Context/DashboardContext";
import { enableScreens } from "react-native-screens";
import messaging from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";
import notifee from "@notifee/react-native";
import DeviceInfo from "react-native-device-info";
import { GestureHandlerRootView } from "react-native-gesture-handler"; // ✅ Required for Android Gestures

import CustomAlert from "./components/CustomAlert";
import { navigationRef, navigate } from "./navigation/NavigationService";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NotificationProvider } from "./Context/NotificationContext";
import { refreshAndSyncFcmToken } from "./screens/utils/fcmToken";

enableScreens(true);

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
    title: "",
    message: "",
    confirmText: "حسنًا",
    onConfirm: () => { },
    success: false,
  });

  //
  // 🔄 INITIALIZATION
  //
  useEffect(() => {
    const initializeApp = async () => {
      const canContinue = await checkAppUpdate();
      if (!canContinue) return;

      await setupNotifications();
      setIsAppReady(true);
    };

    const checkAppUpdate = async () => {
      try {
        const currentVersion = DeviceInfo.getBuildNumber();
        const apiUrl =
          Platform.OS === "ios"
            ? "http://tanmia-group.com:90/api/checkUpdate/AL_MASAR_IOS"
            : "http://tanmia-group.com:90/api/checkUpdate/AL_MASAR_ANDROID";

        const response = await fetch(apiUrl);
        const data = await response.json();
        const requiredVersion = data.strValue;

        if (
          requiredVersion &&
          parseInt(currentVersion) < parseInt(requiredVersion)
        ) {
          const storeUrl =
            Platform.OS === "ios"
              ? "https://apps.apple.com/us/app/المسار-للشحن/id6754100392"
              : "https://play.google.com/store/apps/details?id=com.ALMASAR.ALMASAR";

          setAlertInfo({
            isVisible: true,
            title: "تحديث إجباري",
            message: "يرجى تحديث التطبيق للمتابعة.",
            confirmText: "تحديث الآن",
            onConfirm: () => Linking.openURL(storeUrl),
            success: false,
          });
          return false;
        }
        return true;
      } catch {
        return true;
      }
    };

    const setupNotifications = async () => {
      if (Platform.OS === "ios") {
        await messaging().requestPermission();
      } else {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
      }

      // Always fetch the latest token, persist it, and sync to the server if
      // it changed or was never confirmed synced. Fixes the silent-rotation
      // bug where users stopped receiving notifications after FCM rotated
      // their token.
      await refreshAndSyncFcmToken();

      messaging().onMessage((msg) => {
        notifee.displayNotification({
          title: msg.notification?.title,
          body: msg.notification?.body,
          data: msg.data,
          android: {
            channelId: "default",
            pressAction: { id: "default" },
          },
        });
      });

      messaging().onNotificationOpenedApp((remoteMessage) => {
        navigate("ParcelDetailsScreen", {
          parcelCode: remoteMessage.data?.intParcelCode,
        });
      });
    };

    initializeApp();

    // FCM may rotate the token at any time (app reinstall, restored backup,
    // long inactivity). Persist + push to the server whenever that happens.
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
      try {
        await AsyncStorage.setItem("fcmToken", newToken);
        await AsyncStorage.removeItem("fcmTokenSynced");
        await refreshAndSyncFcmToken();
      } catch (err) {
        console.error("Failed to handle FCM token refresh:", err);
      }
    });

    return () => {
      unsubscribeTokenRefresh();
    };
  }, []);

  return (
    <SafeAreaProvider>
      {/* ✅ WRAPPER: Essential for touches and gestures on Android */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <DashboardProvider>
          <NotificationProvider>
            <StatusBar translucent barStyle="dark-content" />

            {isAppReady ? (
              <AppContent />
            ) : (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "#2C3E50",
                }}
              >
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
              onCancel={() => { }}
              cancelText={undefined}
            />
          </NotificationProvider>
        </DashboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}