// navigation/AppNavigator.tsx

import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import React, { useCallback } from "react";
import { NavigatorScreenParams, useFocusEffect } from "@react-navigation/native";
import { View, BackHandler, Alert } from "react-native";

import MainTabNavigator, { TabParamList } from "./MainTabNavigator";
import { useDashboard } from "../Context/DashboardContext";
import Sidebar from "../components/Entity/Sidebar";

// Screens
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/Auths/LoginScreen";
import RegisterScreen from "../screens/Auths/RegisterScreen";
import RegisterDetailsScreen from "../screens/Auths/RegisterDetailsScreen";

import DeliveryTracking from "../screens/Entity/DeliveryTracking";
import AddParcelScreen from "../screens/Entity/AddParcelScreen";
import AddParcelWhatsappScreen from "../screens/Entity/AddParcelWhatsapp";
import CityRatesScreen from "../screens/Entity/CityRatesScreen";
import EntitiesBalanceScreen from "../screens/Entity/Balance";
import ReportsDashboard from "../screens/Entity/ReportsDashboard";
import EntityDashboard from "../screens/Entity/EntityDashboard";

import PendingApprovalScreen from "../screens/Entity/PendingParcelScreen";
import AtBranchScreen from "../screens/Entity/AtBranchScreen";
import OnTheWayScreen from "../screens/Entity/OnTheWayScreen";
import TrackShipment from "../screens/Entity/TrackShipments";
import SuccessfulDeliveryScreen from "../screens/Entity/SuccessDeliveredParcelScreen";
import ReturnedParcelsScreen from "../screens/Entity/EntityReturnedParcelScreen";

import DriverDashboard from "../screens/Driver/DriverDashboard";
import ParcelsScreen from "../screens/Driver/ParcelsScreen";
import AssignedParcelScreen from "../screens/Driver/AssignedParcelScreen";
import DeliverdParcelScreen from "../screens/Driver/DeliveredParcelScreen";
import ReturnedParcelScreen from "../screens/Driver/ReturnedParcelScreen";
import DriverInvoicesScreen from "../screens/Driver/driverinvoices";

import ParcelDetailsScreen from "../components/ParcelDetailsScreen";
import NotificationsScreen from "../components/Entity/NotificationsScreen";
import SearchScreen from "../components/SearchScreen";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  RegisterDetails: { mobileNumber: string; intCityCode: number | null };
  MainTabs: NavigatorScreenParams<TabParamList>;
  EntityDashboard: undefined;
  EntityReports: { entityCode: number };
  EntitiesBalanceScreen: undefined;
  DeliveryTracking: undefined;
  AddParcelForm: undefined;
  AddParcelWhatsapp: undefined;
  CityRates: undefined;
  PendingApprovalScreen: undefined;
  AtBranchScreen: undefined;
  OnTheWayScreen: undefined;
  TrackShipment: undefined;
  SuccessfulDeliveryScreen: undefined;
  ReturnedParcelsScreen: undefined;
  DriverDashboard: undefined;
  DriverParcelScreen: undefined;
  ParcelsTab: undefined;
  DeliverdParcel: undefined;
  ReturnedParcel: undefined;
  ParcelsScreen: undefined;
  DriverInvoices: undefined;
  ParcelDetailsScreen: undefined;
  NotificationsScreen: undefined;
  SearchScreen: { allParcels: any[] };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─────────────────────────────────────────────
// OPTIONS
// ─────────────────────────────────────────────

const defaultStackOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: "slide_from_right", // Smoother for Android
  gestureEnabled: true, // ✅ Required for Android Back Swipe
  gestureDirection: "horizontal",
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Wraps a screen to intercept the Android Back Swipe/Button.
 * Prevents the app from quitting immediately when swiping back on main screens.
 */
const BackHandledScreen = ({ Component, ...props }: any) => {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert("خروج", "هل أنت متأكد أنك تريد الخروج من التطبيق؟", [
          { text: "إلغاء", onPress: () => { }, style: "cancel" },
          { text: "نعم", onPress: () => BackHandler.exitApp() },
        ]);
        return true; // Stop default behavior
      };

      // ✅ FIXED: Using remove() on the subscription instead of removeEventListener
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => subscription.remove();
    }, [])
  );

  return <Component {...props} />;
};

// ─────────────────────────────────────────────
// NAVIGATOR
// ─────────────────────────────────────────────

const AppContent = () => {
  const { isSidebarVisible, toggleSidebar } = useDashboard();

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator
        id={undefined} // ✅ Fixes TypeScript error
        initialRouteName="Splash"
        screenOptions={defaultStackOptions}
      >
        {/* Core */}
        <Stack.Screen name="Splash" component={SplashScreen} />

        {/* ✅ Protect Login from accidental exit */}
        <Stack.Screen name="Login">
          {(props) => <BackHandledScreen Component={LoginScreen} {...props} />}
        </Stack.Screen>

        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="RegisterDetails" component={RegisterDetailsScreen} />

        {/* ✅ Protect Main Tabs */}
        <Stack.Screen name="MainTabs">
          {(props) => <BackHandledScreen Component={MainTabNavigator} {...props} />}
        </Stack.Screen>

        {/* ✅ Protect Entity Dashboard */}
        <Stack.Screen name="EntityDashboard">
          {(props) => <BackHandledScreen Component={EntityDashboard} {...props} />}
        </Stack.Screen>

        <Stack.Screen name="EntityReports" component={ReportsDashboard} />
        <Stack.Screen name="EntitiesBalanceScreen" component={EntitiesBalanceScreen} />
        <Stack.Screen name="DeliveryTracking" component={DeliveryTracking} />
        <Stack.Screen name="CityRates" component={CityRatesScreen} />
        <Stack.Screen name="AddParcelForm" component={AddParcelScreen} />
        <Stack.Screen name="AddParcelWhatsapp" component={AddParcelWhatsappScreen} />

        <Stack.Screen name="PendingApprovalScreen" component={PendingApprovalScreen} />
        <Stack.Screen name="AtBranchScreen" component={AtBranchScreen} />
        <Stack.Screen name="OnTheWayScreen" component={OnTheWayScreen} />
        <Stack.Screen name="TrackShipment" component={TrackShipment} />
        <Stack.Screen name="SuccessfulDeliveryScreen" component={SuccessfulDeliveryScreen} />
        <Stack.Screen name="ReturnedParcelsScreen" component={ReturnedParcelsScreen} />

        {/* ✅ Protect Driver Dashboard */}
        <Stack.Screen name="DriverDashboard">
          {(props) => <BackHandledScreen Component={DriverDashboard} {...props} />}
        </Stack.Screen>

        <Stack.Screen name="DriverParcelScreen" component={ParcelsScreen} />
        <Stack.Screen name="ParcelsTab" component={AssignedParcelScreen} />
        <Stack.Screen name="DeliverdParcel" component={DeliverdParcelScreen} />
        <Stack.Screen name="ReturnedParcel" component={ReturnedParcelScreen} />
        <Stack.Screen name="ParcelsScreen" component={ParcelsScreen} />
        <Stack.Screen name="DriverInvoices" component={DriverInvoicesScreen} />

        {/* Details */}
        <Stack.Screen
          name="ParcelDetailsScreen"
          component={ParcelDetailsScreen}
          options={{
            gestureEnabled: true,
            presentation: "card",
          }}
        />

        <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />

        {/* Modal */}
        <Stack.Screen
          name="SearchScreen"
          component={SearchScreen}
          options={{
            presentation: "transparentModal",
            animation: "fade",
            headerShown: false,
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>

      {/* 
        ✅ SIDEBAR GESTURE FIX:
        When sidebar is hidden, pointerEvents='none' allows swipes 
        to pass through to the navigator below.
      */}
      <View
        style={{
          position: 'absolute',
          top: 0, bottom: 0, left: 0, right: 0,
          zIndex: 1000,
          pointerEvents: isSidebarVisible ? 'auto' : 'none'
        }}
      >
        <Sidebar visible={isSidebarVisible} onClose={toggleSidebar} />
      </View>
    </View>
  );
};

export default function AppNavigator() {
  return <AppContent />;
}