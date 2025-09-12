import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import {
  ChartBar as BarChart3,
  FileText,
  Chrome as Home,
  User,
  Plus,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/Entity/EntityDashboard';
import ReportsScreen from '../screens/ReportsScreen';
import StoresScreen from '../screens/StoresScreen';
import AccountScreen from '../screens/AccountScreen';
import CustomPlusButton from '../components/Entity/CustomPlusButton';

export type TabParamList = {
  HomeTab: undefined;
  ReportsTab: undefined;
  StoresTab: undefined;
  AccountTab: undefined;
  AddTab: undefined; // Placeholder for plus button
};

const Tab = createBottomTabNavigator<TabParamList>();

// Custom Plus Button Component
type PlusButtonProps = {
  onPress: () => void;
};

// Empty component for the plus tab (won't be rendered)
const EmptyComponent = () => null;

const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();

  const handlePlusPress = () => {
    // Add your plus button functionality here
    console.log('Plus button pressed!');
    // Example: navigate to add screen, show modal, etc.
  };

  return (
    <>
      <Tab.Navigator 
        id={undefined}
        initialRouteName="HomeTab"  // 👈 Add this line
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
        <Tab.Screen
          name="AccountTab"
          component={AccountScreen}
          options={{
            title: 'حسابي',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="StoresTab"
          component={StoresScreen}
          options={{
            title: 'المتاجر',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />

        {/* Invisible tab for spacing the plus button */}
        <Tab.Screen
          name="AddTab"
          component={EmptyComponent}
          options={{
            title: '',
            tabBarIcon: () => <View style={{ width: 24, height: 24 }} />,
            tabBarButton: () => null,
          }}
        />

        <Tab.Screen
          name="ReportsTab"
          component={ReportsScreen}
          options={{
            title: 'التقارير',
            tabBarIcon: ({ color, size }) => (
              <FileText color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="HomeTab"
          component={HomeScreen}
          options={{
            title: 'لوحة القيادة',
            tabBarIcon: ({ color, size }) => (
              <BarChart3 color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>

      {/* Floating Plus Button */}
      <CustomPlusButton onPress={handlePlusPress} />
    </>
  );
};

const styles = StyleSheet.create({});

export default MainTabNavigator;
