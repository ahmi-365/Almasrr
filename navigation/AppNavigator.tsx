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
import EntitiesBalanceScreen from '../screens/Entity/Balance';
import AddParcelWhatsappScreen from '../screens/Entity/AddParcelWhatsapp';
import DeliverdParcelScreen from '../screens/Driver/DeliveredParcelScreen';
import ReturnedParcelScreen from '../screens/Driver/ReturnedParcelScreen';
import ParcelsScreen from '../screens/Driver/ParcelsScreen';
import SuccessfulDeliveryScreen from '../screens/Entity/SuccessDeliveredParcelScreen';
import ReturnedParcelsScreen from '../screens/Entity/EntityReturnedParcelScreen';
import PendingApprovalScreen from '../screens/Entity/PendingParcelScreen';
import AtBranchScreen from '../screens/Entity/AtBranchScreen';
import OnTheWayScreen from '../screens/Entity/OnTheWayScreen';
import ReportsDashboard from '../screens/Entity/ReportsDashboard';
import ParcelDetailsScreen from '../components/ParcelDetailsScreen';
import SearchScreen from '../components/SearchScreen';
// --- THIS IS THE FIX ---
// Add all possible screen names, including the new Driver tabs, to the master list.
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
  Register: undefined;
  DeliveryTracking: undefined;
  AddParcelForm: undefined;
  CityRates: undefined;
  AddParcelWhatsapp: undefined;
  RegisterDetails: { mobileNumber: string };
  EntityDashboard: undefined;
  ReportsTab: undefined;
  StoresTab: undefined;
  AccountTab: undefined;
  EntitiesBalanceScreen: undefined;
  DriverDashboard: undefined;
  ParcelsTab: undefined;
  DeliverdParcel: undefined
  ReturnedParcel: undefined
  ParcelsScreen: undefined
  SuccessfulDeliveryScreen: undefined
  ReturnedParcelsScreen: undefined
  PendingApprovalScreen: undefined
  AtBranchScreen: undefined
  OnTheWayScreen: undefined
  ParcelDetailsScreen: undefined
  EntityReports: { entityCode: number };
  SearchScreen: { allParcels: any[] };

};

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
        <Stack.Screen
          name="ParcelDetailsScreen"
          component={ParcelDetailsScreen}
          options={{
            headerShown: false,
            presentation: 'card'
          }}
        />
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen
          name="EntityReports"
          component={ReportsDashboard}
        //           options={{ headerShown: true, title: 'تقرير المتجر' }} 
        />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="DeliveryTracking" component={DeliveryTracking} />
        <Stack.Screen name="EntitiesBalanceScreen" component={EntitiesBalanceScreen} />
        <Stack.Screen name="CityRates" component={CityRatesScreen} />
        <Stack.Screen name="RegisterDetails" component={RegisterDetailsScreen} />
        <Stack.Screen name="AddParcelForm" component={AddParcelScreen} />
        <Stack.Screen name="AddParcelWhatsapp" component={AddParcelWhatsappScreen} />
        <Stack.Screen name="DeliverdParcel" component={DeliverdParcelScreen} />
        <Stack.Screen name="ReturnedParcel" component={ReturnedParcelScreen} />
        <Stack.Screen name="ParcelsScreen" component={ReturnedParcelScreen} />
        <Stack.Screen name="SuccessfulDeliveryScreen" component={SuccessfulDeliveryScreen} />
        <Stack.Screen name="ReturnedParcelsScreen" component={ReturnedParcelsScreen} />
        <Stack.Screen name="PendingApprovalScreen" component={PendingApprovalScreen} />
        <Stack.Screen name="AtBranchScreen" component={AtBranchScreen} />
        <Stack.Screen name="OnTheWayScreen" component={OnTheWayScreen} />

        {/* 3. REGISTER THE SEARCH SCREEN AND SET ITS PRESENTATION TO MODAL */}
        <Stack.Screen
          name="SearchScreen"
          component={SearchScreen}
          options={{
            presentation: 'transparentModal', // Key for custom animations
            headerShown: false,
            animation: 'fade', // The screen container will fade in gently
          }}
        />

        {/* We add DriverDashboard here as well to ensure it's a valid top-level route if needed */}
        <Stack.Screen name="DriverDashboard" component={ParcelsScreen} />
      </Stack.Navigator>

      <Sidebar visible={isSidebarVisible} onClose={toggleSidebar} />
    </>
  );
};

const AppNavigator = () => {
  return <AppContent />;
};

export default AppNavigator;