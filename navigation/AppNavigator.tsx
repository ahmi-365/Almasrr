import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/Auths/LoginScreen';
import MainTabNavigator from './MainTabNavigator';
import EntityDashboard from '../screens/Entity/EntityDashboard';
import RegisterScreen from '../screens/Auths/RegisterScreen';
import DeliveryTracking from '../screens/Entity/DeliveryTracking';
import { DashboardProvider } from '../Context/DashboardContext'; // import context

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  MainTabs: undefined;
  EntityDashboard: undefined;
  Reports: undefined;
  Stores: undefined;
  Account: undefined;
  HelpCenter: undefined;
  ContactUs: undefined;
  BookInspection: undefined;
  Register: undefined;
  AuctionDetail: undefined;
  DeliveryTracking: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    // Wrap entire navigator in DashboardProvider
    <DashboardProvider>
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
        <Stack.Screen name="EntityDashboard" component={EntityDashboard} />
        <Stack.Screen name="DeliveryTracking" component={DeliveryTracking} />
      </Stack.Navigator>
    </DashboardProvider>
  );
};

export default AppNavigator;
