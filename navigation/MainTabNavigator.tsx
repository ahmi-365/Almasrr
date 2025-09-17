import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, ActivityIndicator, Text } from 'react-native'; // Added Text
import { ChartBar as BarChart3, FileText, Chrome as Home, User, Truck, ClipboardList, Store, Package } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import EntityDashboard from '../screens/Entity/EntityDashboard';
import DriverDashboard from '../screens/Driver/DriverDashboard';
import ReportsDashboard from '../screens/Entity/ReportsDashboard'; // Corrected import
import AccountScreen from '../screens/AccountScreen';
import StoresScreen from '../screens/StoresScreen'; // Added missing import
import CustomPlusButton from '../components/Entity/CustomPlusButton';
import { RootStackParamList } from './AppNavigator';

// This ParamList now includes all possible tabs for all roles
export type TabParamList = {
  EntityDashboard: undefined;
  DriverDashboard: undefined;
  ReportsTab: undefined;
  StoresTab: undefined;
  AccountTab: undefined;
  AddTab: undefined;
  ParcelsTab: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const EmptyComponent = () => null;

const CustomTabBarButton = ({ children, onPress }) => (
  <TouchableOpacity
    style={{ top: -25, justifyContent: 'center', alignItems: 'center' }}
    onPress={onPress}
    activeOpacity={0.9}
  >
    <CustomPlusButton />
  </TouchableOpacity>
);

// Dummy screen for a driver tab placeholder
const ParcelsScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Parcels Screen</Text></View>;

const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const stackNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [userRole, setUserRole] = useState<'Entity' | 'Driver' | null>(null);

  // Get the user's role from storage when the navigator first loads
  useEffect(() => {
    const getUserRole = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUserRole(parsedUser.roleName);
        } else {
          // Handle case where user data is missing (e.g., logout)
          setUserRole(null);
        }
      } catch (e) {
        console.error("Failed to get user role for tabs", e);
        setUserRole(null);
      }
    };
    getUserRole();
  }, []);

  const handlePlusPress = () => {
    // This can be customized based on role in the future if needed
    stackNavigation.navigate('AddParcel');
  };

  // Show a loading spinner while we determine the role
  if (!userRole) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color="#E67E22" />
      </View>
    );
  }

  return (
    <Tab.Navigator
      id={undefined}
      // Set the initial route based on the user's role
      initialRouteName={userRole === 'Entity' ? "EntityDashboard" : "DriverDashboard"}
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#E67E22',
        tabBarInactiveTintColor: '#95A5A6',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      {userRole === 'Entity' ? (
        // --- TABS FOR ENTITY ---
        <>
          <Tab.Screen name="AccountTab" component={AccountScreen} options={{ title: 'حسابي', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
          <Tab.Screen name="StoresTab" component={StoresScreen} options={{ title: 'المتاجر', tabBarIcon: ({ color, size }) => <Store color={color} size={size} /> }} />
          <Tab.Screen name="AddTab" component={EmptyComponent} options={{ title: '', tabBarButton: (props) => (<CustomTabBarButton {...props} onPress={handlePlusPress} />) }} />
          <Tab.Screen name="ReportsTab" component={ReportsDashboard} options={{ title: 'التقارير', tabBarIcon: ({ color, size }) => <FileText color={color} size={size} /> }} />
          <Tab.Screen name="EntityDashboard" component={EntityDashboard} options={{ title: 'لوحة القيادة', tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} /> }} />

        </>
      ) : (
        // --- TABS FOR DRIVER ---
        <>
          <Tab.Screen name="AccountTab" component={AccountScreen} options={{ title: 'حسابي', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
          <Tab.Screen name="ParcelsTab" component={ParcelsScreen} options={{ title: 'الطرود', tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> }} />
          <Tab.Screen name="ReportsTab" component={ReportsDashboard} options={{ title: 'التقارير', tabBarIcon: ({ color, size }) => <FileText color={color} size={size} /> }} />
          <Tab.Screen name="DriverDashboard" component={DriverDashboard} options={{ title: 'الرئيسية', tabBarIcon: ({ color, size }) => <Truck color={color} size={size} /> }} />

        </>
      )}
    </Tab.Navigator>
  );
};

export default MainTabNavigator;