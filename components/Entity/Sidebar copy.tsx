import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import {
  CircleCheck,
  ClipboardCheck,
  Clock,
  CirclePlus,
  FileText,
  History,
  Hourglass,
  Landmark,
  LayoutDashboard,
  LogOut,
  Package,
  Scale,
  Store,
  Truck,
  User,
} from 'lucide-react-native';
import { useDashboard } from '../../Context/DashboardContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItemProps {
  icon: React.ComponentType<any>;
  title: string;
  color: string;
  route?: keyof RootStackParamList;
}

const TAB_SCREENS: (keyof RootStackParamList)[] = [
  'EntityDashboard',
  'ReportsTab',
  'StoresTab',
  'AccountTab',
];

const MenuItem = ({ item }: { item: MenuItemProps }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { currentRoute, toggleSidebar } = useDashboard();

  let isActive = false;
  if (item.route === 'EntityDashboard') {
    isActive = TAB_SCREENS.includes(currentRoute as any);
  } else {
    isActive = item.route === currentRoute;
  }

  // --- THIS IS THE NEW NAVIGATION LOGIC ---
  const handlePress = useCallback(() => {
    toggleSidebar(); // Close the sidebar immediately

    if (item.route && !isActive) {
      if (TAB_SCREENS.includes(item.route)) {
        // If the target is a tab screen, reset the stack to MainTabs,
        // and tell MainTabs which screen to show.
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'MainTabs',
              state: {
                routes: [{ name: item.route as any }],
              },
            },
          ],
        });
      } else {
        // If the target is a regular stack screen (like CityRates),
        // reset the stack to show MainTabs first, and then the target screen on top.
        // This ensures the back button from CityRates goes to the Dashboard.
        navigation.reset({
          index: 1,
          routes: [
            { name: 'MainTabs' },
            { name: item.route },
          ],
        });
      }
    }
  }, [navigation, currentRoute, item.route, toggleSidebar, isActive]);
  // ------------------------------------------

  return (
    <TouchableOpacity
      style={[styles.menuItem, isActive && styles.activeMenuItem]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[styles.menuText, isActive && styles.activeMenuText]}>
        {item.title}
      </Text>
      <item.icon color={isActive ? '#FF8C42' : item.color} size={18} />
      {isActive && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
  );
};

export default function Sidebar({ visible, onClose }: SidebarProps) {
  // ... (The rest of your Sidebar component and styles are unchanged)
  // The code below is identical to the previous correct version.
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const slideAnim = useRef(new Animated.Value(280)).current;
  const { dcBalance } = useDashboard();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 280, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) { setUser(JSON.parse(userData)); }
      } catch (err) { console.error('Failed to load user from storage:', err); }
    };
    loadUser();
  }, []);

  const menuItems: MenuItemProps[] = useMemo(
    () => [
      { icon: LayoutDashboard, title: 'لوحة القيادة', color: '#FFFFFF', route: 'EntityDashboard' },
      { icon: Landmark, title: 'الأسعار حسب المدينة', color: '#FFFFFF', route: 'CityRates' },
      { icon: Scale, title: 'الرصيد المتاجر', color: '#FFFFFF' },
      { icon: Hourglass, title: 'في انتظار التصديق', color: '#FFFFFF' },
      { icon: ClipboardCheck, title: 'في الفرع', color: '#FFFFFF' },
      { icon: Truck, title: 'في الطريق', color: '#FFFFFF' },
      { icon: CircleCheck, title: 'التوصيل ناجح', color: '#FFFFFF', route: 'DeliveryTracking' },
      { icon: CirclePlus, title: 'الطرود المرتجعة', color: '#FFFFFF' },
      { icon: History, title: 'سجل الطرود', color: '#FFFFFF' },
    ],
    []
  );

  const handleChangePassword = useCallback(() => { console.log('Change password pressed'); onClose(); }, [onClose]);
  const handleLogout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('user');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) { console.error('Failed to clear user data on logout:', error); navigation.navigate('Login'); }
    onClose();
  }, [navigation, onClose]);

  if (!visible) { return null; }

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <StatusBar backgroundColor="#2C2C2C" barStyle="light-content" />
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContent}>
            <View>
              <Text style={styles.welcomeTitle}>{user?.strEntityName || 'مرحباً بك'}</Text>
              <Text style={styles.welcomeSubtitle}>Welcome Back</Text>
            </View>
            <TouchableOpacity style={styles.profileButton} activeOpacity={0.7}>
              {user?.vbrPicture ? (<Image source={{ uri: user.vbrPicture }} style={styles.profileImage} />) : (<User color="#FFFFFF" size={28} />)}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>المبلغ المستحق</Text>
          <Text style={styles.balanceAmount}><Text style={styles.currency}> د.ل</Text>{dcBalance ?? '0.00'}</Text>
        </View>
        <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.menuContent}>
          {menuItems.map((item, index) => (<MenuItem key={`${item.title}-${index}`} item={item} />))}
          <View style={styles.separator} />
          <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword} activeOpacity={0.7}>
            <Clock color="#FFFFFF" size={18} /><Text style={styles.menuText}>تغيير كلمة المرور</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutItem} onPress={handleLogout} activeOpacity={0.7}>
            <LogOut color="#E74C3C" size={18} /><Text style={styles.logoutText}>تسجيل الخروج</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', zIndex: 1000 },
  backdrop: { flex: 1, backgroundColor: 'rgba(2, 2, 2, 0.5)' },
  sidebar: { position: 'absolute', right: 0, width: 280, backgroundColor: '#2C2C2C', height: '100%', shadowColor: '#000', shadowOffset: { width: -5, height: 0 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 15 },
  welcomeSection: { alignItems: 'flex-end', marginTop: 40 },
  welcomeContent: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: 10, width: '100%' },
  welcomeTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', textAlign: 'right', marginBottom: 2 },
  welcomeSubtitle: { color: '#BBBBBB', fontSize: 12, textAlign: 'right' },
  profileButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#444', justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
  profileImage: { width: 36, height: 36, borderRadius: 18 },
  balanceCard: { backgroundColor: '#FF8C42', marginHorizontal: 15, marginVertical: 15, padding: 15, borderRadius: 8, alignItems: 'center' },
  balanceLabel: { color: '#FFFFFF', fontSize: 12, textAlign: 'center', marginBottom: 5 },
  balanceAmount: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  currency: { fontSize: 14, color: '#FFFFFF', fontWeight: 'bold', marginLeft: 4 },
  menuContainer: { flex: 1 },
  menuContent: { paddingHorizontal: 0, paddingBottom: 30 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 0.5, borderBottomColor: '#404040', position: 'relative' },
  menuText: { color: '#FFFFFF', fontSize: 14, flex: 1, textAlign: 'right', marginRight: 12, fontWeight: '400' },
  activeMenuText: { color: '#FF8C42', fontWeight: '600' },
  activeIndicator: { position: 'absolute', right: 0, top: 5, bottom: 5, width: 6, backgroundColor: '#FF8C42', borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
  activeMenuItem: { backgroundColor: '#232323' },
  separator: { height: 0.5, backgroundColor: '#404040', marginVertical: 10 },
  logoutItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, marginTop: 5 },
  logoutText: { color: '#E74C3C', fontSize: 14, flex: 1, textAlign: 'right', marginRight: 12, fontWeight: '400' },
});