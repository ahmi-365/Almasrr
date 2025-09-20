import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, Text, BackHandler } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { ChartBar as BarChart3, FileText, User, Store, Package, Truck } from 'lucide-react-native';
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
const ParcelsScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Parcels Screen</Text></View>;

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
            // --- THE FIX IS HERE ---
            // We tell the parent navigator to navigate to the 'MainTabs' screen,
            // and inside that, to focus on the 'initialRouteName' screen.
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

const handleEntityPlusPress = () => {
  navigation.navigate('AddParcel');
};

const handleDriverPlusPress = () => {
  navigation.navigate('SomeDriverPage'); 
};

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
      }}
    >
      {userRole === 'Entity' ? (
        <>
          <Tab.Screen name="AccountTab" component={AccountScreen} options={{ title: 'حسابي', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
          <Tab.Screen name="StoresTab" component={StoresScreen} options={{ title: 'المتاجر', tabBarIcon: ({ color, size }) => <Store color={color} size={size} /> }} />
          <Tab.Screen
            name="AddTab"
            component={EmptyComponent}
            options={{ title: '', tabBarIcon: () => null }}
            listeners={{
              tabPress: (e: EventArg<'tabPress', true>) => {
                e.preventDefault();
                handleEntityPlusPress();
              },
            }}
          />
          <Tab.Screen name="ReportsTab" component={ReportsDashboard} options={{ title: 'التقارير', tabBarIcon: ({ color, size }) => <FileText color={color} size={size} /> }} />
          <Tab.Screen name="EntityDashboard" component={EntityDashboard} options={{ title: 'الرئيسية', tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} /> }} />
        </>
      ) : (
        <>
          <Tab.Screen name="AccountTab" component={AccountScreen} options={{ title: 'حسابي', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
          <Tab.Screen name="ParcelsTab" component={ParcelsScreen} options={{ title: 'الطرود', tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> }} />
            <Tab.Screen
            name="AddTab"
            component={EmptyComponent}
            options={{ title: '', tabBarIcon: () => null }}
            listeners={{
              tabPress: (e: EventArg<'tabPress', true>) => {
                e.preventDefault();
                handleDriverPlusPress();
              },
            }}
          />
          <Tab.Screen name="ReportsTab" component={ReportsDashboard} options={{ title: 'التقارير', tabBarIcon: ({ color, size }) => <FileText color={color} size={size} /> }} />
          <Tab.Screen name="DriverDashboard" component={DriverDashboard} options={{ title: 'الرئيسية', tabBarIcon: ({ color, size }) => <Truck color={color} size={size} /> }} />
        </>
      )}
    </Tab.Navigator>
  );
};

export default MainTabNavigator;