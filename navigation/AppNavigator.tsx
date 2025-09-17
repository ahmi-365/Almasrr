import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import React from 'react';
import { NavigatorScreenParams } from '@react-navigation/native';
import MainTabNavigator, { TabParamList } from './MainTabNavigator';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/Auths/LoginScreen';
import RegisterScreen from '../screens/Auths/RegisterScreen';
import DeliveryTracking from '../screens/Entity/DeliveryTracking';
import { useDashboard } from '../Context/DashboardContext';
import Sidebar from '../components/Entity/Sidebar';
import AddParcelScreen from '../screens/Entity/AddParcelScreen';
import CityRatesScreen from '../screens/Entity/CityRatesScreen';
import RegisterDetailsScreen from '../screens/Auths/RegisterDetailsScreen';
import DriverDashboard from '../screens/Driver/DriverDashboard'; // Import DriverDashboard to ensure it's in the build

// --- THIS IS THE FIX ---
// Add all possible screen names, including the new Driver tabs, to the master list.
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
  Register: undefined;
  DeliveryTracking: undefined;
  AddParcel: undefined;
  CityRates: undefined;
  RegisterDetails: { mobileNumber: string };

  // For type safety in nested navigators
  EntityDashboard: undefined;
  ReportsTab: undefined;
  StoresTab: undefined;
  AccountTab: undefined;

  // Add the Driver-specific tab names
  DriverDashboard: undefined;
  ParcelsTab: undefined;
};
// ----------------------

const Stack = createNativeStackNavigator<RootStackParamList>();

const modalHeaderOptions: NativeStackNavigationOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: '#FFF' },
  headerTintColor: '#2C3E50',
  headerTitleStyle: { fontWeight: 'bold' },
  headerTitleAlign: 'center',
};

const AppContent = () => {
  const { isSidebarVisible, toggleSidebar } = useDashboard();

  return (
    <>
      <Stack.Navigator
        id={undefined}
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="DeliveryTracking" component={DeliveryTracking} />
        <Stack.Screen name="CityRates" component={CityRatesScreen} />
        <Stack.Screen name="RegisterDetails" component={RegisterDetailsScreen} />
        <Stack.Screen
          name="AddParcel"
          component={AddParcelScreen}
          options={{
            ...modalHeaderOptions,
            title: 'إضافة طرد',
            presentation: 'modal',
          }}
        />
        {/* We add DriverDashboard here as well to ensure it's a valid top-level route if needed */}
        <Stack.Screen name="DriverDashboard" component={DriverDashboard} />
      </Stack.Navigator>

      <Sidebar visible={isSidebarVisible} onClose={toggleSidebar} />
    </>
  );
};

const AppNavigator = () => {
  return <AppContent />;
};

export default AppNavigator;