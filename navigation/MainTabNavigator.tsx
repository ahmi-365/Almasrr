import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, Text, BackHandler, Image } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LayoutDashboardIcon } from 'lucide-react-native';
import { useNavigation, EventArg, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import EntityDashboard from '../screens/Entity/EntityDashboard';
import DriverDashboard from '../screens/Driver/DriverDashboard';
import ReportsDashboard from '../screens/Entity/ReportsDashboard';
import AccountScreen from '../screens/AccountScreen';
import StoresScreen from '../screens/StoresScreen';
import CustomTabBar from './CustomTabBar';
import { RootStackParamList } from './AppNavigator';
import ParcelsScreen from '../screens/Driver/ParcelsScreen';
import AssignedParcelScreen from '../screens/Driver/AssignedParcelScreen';

export type TabParamList = {
  EntityDashboard: undefined;
  DriverDashboard: undefined;
  ReportsTab: { entityCode?: number };
  StoresTab: undefined;
  AccountTab: undefined;
  AddTab: undefined;
  ParcelsTab: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const EmptyComponent = () => null;

const TabBarIcon = ({ source, color, size }) => (
  <Image
    source={source}
    style={{
      width: size,
      height: size,
      tintColor: color,
    }}
    resizeMode="contain"
  />
);


const MainTabNavigator = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [userRole, setUserRole] = useState<'Entity' | 'Driver' | null>(null);

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        setUserRole(userData ? JSON.parse(userData).roleName : null);
      } catch (e) {
        console.error("Failed to get user role for tabs", e);
        setUserRole(null);
      }
    };
    getUserRole();
  }, []);

  const initialRouteName = userRole === 'Entity' ? "EntityDashboard" : "DriverDashboard";

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        const state = navigation.getState();
        const currentRoute = state.routes[state.index];

        if (currentRoute && currentRoute.name === "MainTabs" && currentRoute.state) {
          const tabState = currentRoute.state;
          const activeTabRouteName = tabState.routeNames[tabState.index];

          if (activeTabRouteName !== initialRouteName) {
            navigation.navigate('MainTabs', { screen: initialRouteName });
            return true;
          }
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation, initialRouteName])
  );

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
      tabBar={(props: BottomTabBarProps) => <CustomTabBar {...props} />}
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      {userRole === 'Entity' ? (
        // Tabs for Entity (with AddTab)
        <>
          <Tab.Screen name="AccountTab" component={AccountScreen} options={{ title: 'حسابي', tabBarIcon: ({ color }) => <TabBarIcon source={require('../assets/icons/user-icon-tb.png')} color={color} size={35} /> }} />
          <Tab.Screen name="StoresTab" component={StoresScreen} options={{ title: 'المتاجر', tabBarIcon: ({ color }) => <TabBarIcon source={require('../assets/icons/store-icon-tb.png')} color={color} size={40} /> }} />
          <Tab.Screen
            name="AddTab"
            component={EmptyComponent}
            options={{ title: '', tabBarIcon: () => null }}
            listeners={{
              tabPress: (e: EventArg<'tabPress', true>) => {
                e.preventDefault();
              },
            }}
          />
          <Tab.Screen name="ReportsTab" component={ReportsDashboard} options={{ title: 'تقرير المعاملات', tabBarIcon: ({ color }) => <TabBarIcon source={require('../assets/icons/reports-icon-tb.png')} color={color} size={35} /> }} />
          <Tab.Screen name="EntityDashboard" component={EntityDashboard} options={{ title: 'لوحة القيادة', tabBarIcon: ({ color }) => <LayoutDashboardIcon color={color} size={27} /> }} />
        </>
      ) : (
        // --- FIX: Tabs for Driver (AddTab has been removed) ---
        <>
          <Tab.Screen name="AccountTab" component={AccountScreen} options={{ title: 'حسابي', tabBarIcon: ({ color }) => <TabBarIcon source={require('../assets/icons/user-icon-tb.png')} color={color} size={35} /> }} />
          <Tab.Screen name="ParcelsTab" component={AssignedParcelScreen} options={{ title: 'الطرد المعين', tabBarIcon: ({ color }) => <TabBarIcon source={require('../assets/icons/package-icon-tb.png')} color={color} size={35} /> }} />
          {/* The "AddTab" Screen has been removed from here */}
          <Tab.Screen name="ReportsTab" component={ReportsDashboard} options={{ title: 'تقرير المعاملات', tabBarIcon: ({ color }) => <TabBarIcon source={require('../assets/icons/reports-icon-tb.png')} color={color} size={35} /> }} />
          <Tab.Screen name="DriverDashboard" component={DriverDashboard} options={{ title: 'الرئيسية', tabBarIcon: ({ color }) => <TabBarIcon source={require('../assets/icons/ddashboard-icon-tb.png')} color={color} size={37} /> }} />
        </>
      )}
    </Tab.Navigator>
  );
};

export default MainTabNavigator;