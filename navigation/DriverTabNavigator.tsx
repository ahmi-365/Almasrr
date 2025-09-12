import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import {
  Truck,
  ClipboardList,
  User,
  Map,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomPlusButton from '@/components/Entity/CustomPlusButton';

export type DriverTabParamList = {
  ProfileTab: undefined;
  ParcelsTab: undefined;
  AddTab: undefined;
  TrackingTab: undefined;
  MapTab: undefined;
};

const Tab = createBottomTabNavigator<DriverTabParamList>();

// 🧪 Dummy placeholder screens
const ProfileScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 20 }}>Profile Screen</Text>
  </View>
);

const ParcelsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 20 }}>Parcels Screen</Text>
  </View>
);

const DeliveryTracking = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 20 }}>Delivery Tracking Screen</Text>
  </View>
);

const RouteMapScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 20 }}>Route Map Screen</Text>
  </View>
);

// Empty placeholder for the center tab (plus button)
const EmptyComponent = () => null;

export default function DriverTabNavigator() {
  const insets = useSafeAreaInsets();

  const handlePlusPress = () => {
    console.log('Driver Plus button pressed!');
    // In future: navigate to add new delivery / scan parcel screen
  };

  return (
    <>
      <Tab.Navigator
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
          name="ProfileTab"
          component={ProfileScreen}
          options={{
            title: 'حسابي',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="ParcelsTab"
          component={ParcelsScreen}
          options={{
            title: 'الطرود',
            tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
          }}
        />
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
          name="TrackingTab"
          component={DeliveryTracking}
          options={{
            title: 'التتبع',
            tabBarIcon: ({ color, size }) => <Truck color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="MapTab"
          component={RouteMapScreen}
          options={{
            title: 'الخريطة',
            tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
          }}
        />
      </Tab.Navigator>

      {/* Floating Plus Button */}
      <CustomPlusButton onPress={handlePlusPress} />
    </>
  );
}
