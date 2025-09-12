import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DriverTabNavigator from '../../navigation/DriverTabNavigator';
// import DeliveryTracking from '@/screens/Driver/DeliveryTracking';
// import ProfileScreen from '@/screens/Driver/ProfileScreen';
// import ParcelsScreen from '@/screens/Driver/ParcelsScreen';

const Drawer = createDrawerNavigator();

export default function DriverDrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#E67E22' },
        headerTintColor: '#fff',
        drawerActiveTintColor: '#E67E22',
        drawerLabelStyle: { fontSize: 16 },
      }}
    >
      {/* Dashboard (with bottom tabs inside) */}
      <Drawer.Screen
        name="DriverDashboard"
        component={DriverTabNavigator}
        options={{ title: 'لوحة القيادة' }}
      />
      {/* <Drawer.Screen
        name="Parcels"
        component={ParcelsScreen}
        options={{ title: 'الطرود' }}
      />
      <Drawer.Screen
        name="Tracking"
        component={DeliveryTracking}
        options={{ title: 'تتبع التسليم' }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'حسابي' }}
      /> */}
    </Drawer.Navigator>
  );
}
