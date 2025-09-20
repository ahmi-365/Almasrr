import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
  Image,
  SafeAreaView,
  Easing,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import {
  CircleCheck,
  ClipboardCheck,
  CirclePlus,
  History,
  Hourglass,
  Landmark,
  LayoutDashboard,
  Scale,
  Truck,
  Undo2,
  X,
} from 'lucide-react-native';
import { useDashboard } from '../../Context/DashboardContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width: screenWidth } = Dimensions.get('window');

const TAB_SCREENS: (keyof RootStackParamList)[] = ['EntityDashboard', 'ReportsTab', 'StoresTab', 'AccountTab'];
const DRIVER_TAB_SCREENS: (keyof RootStackParamList)[] = ['DriverDashboard', 'ParcelsTab', 'AccountTab', 'ReportsTab'];

interface DialerSidebarProps {
  visible: boolean;
  onClose: () => void;
}

interface DialerMenuItem {
  icon: React.ComponentType<any>;
  title: string;
  route?: keyof RootStackParamList;
  action?: () => void;
}

export default function Sidebar({ visible, onClose }: DialerSidebarProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { dcBalance: entityDcBalance, currentRoute } = useDashboard();

  const [user, setUser] = useState<any>(null);
  const [driverBalance, setDriverBalance] = useState('0.00');
  const [isRendered, setIsRendered] = useState(false);

  const slideAnim = useState(new Animated.Value(screenWidth))[0];
  const rotationAnim = useState(new Animated.Value(0))[0];

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const userData = await AsyncStorage.getItem('user');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            if (parsedUser.roleName === 'Driver') {
              const response = await axios.get(`https://tanmia-group.com:84/courierApi/driverparcels/DashboardData/${parsedUser.userId}`);
              if (response.data) {
                setDriverBalance(String(response.data?.DCBalance?.toFixed(2) ?? '0.00'));
              }
            }
          }
        } catch (err) { console.error('Failed to load user data:', err); }
      };
      if (visible) { loadData(); }
    }, [visible])
  );

  const { dashboardItem, orbitingItems } = useMemo(() => {
    let allItems: DialerMenuItem[] = [];
    if (user?.roleName === 'Driver') {
      allItems = [{ icon: CircleCheck, title: 'الطرود المسلمة' }, { icon: Undo2, title: 'الطرود المرتجعة' }];
    } else {
      allItems = [{ icon: Landmark, title: 'الأسعار', route: 'CityRates' }, { icon: Scale, title: 'الرصيد' }, { icon: Hourglass, title: 'قيد الانتظار' }, { icon: ClipboardCheck, title: 'في الفرع' }, { icon: Truck, title: 'في الطريق', route: 'DeliveryTracking' }, { icon: CirclePlus, title: 'المرتجعة' }, { icon: History, title: 'السجل' }];
    }
    const dashboardRoute: keyof RootStackParamList = user?.roleName === 'Driver' ? 'DriverDashboard' : 'EntityDashboard';
    return {
      dashboardItem: { icon: LayoutDashboard, title: 'لوحة القيادة', route: dashboardRoute },
      orbitingItems: allItems,
    };
  }, [user]);

  // --- REFINED ANIMATION LOGIC ---
  // Create animation values dynamically based on the number of items
  const itemAnims = useMemo(() =>
    orbitingItems.map(() => new Animated.Value(0)),
    [orbitingItems]);
  // Give the main button its own animation value for stability
  const mainButtonAnim = useState(new Animated.Value(0))[0];


  useEffect(() => {
    // Combine all item animations plus the main button animation
    const allItemAnimations = [
      ...itemAnims.map(anim => Animated.spring(anim, { toValue: visible ? 1 : 0, friction: 7, tension: 30, useNativeDriver: true })),
      Animated.spring(mainButtonAnim, { toValue: visible ? 1 : 0, friction: 7, tension: 30, useNativeDriver: true }),
    ];

    if (visible) {
      setIsRendered(true);
      Animated.parallel([
        // --- CHANGE: SLOWER, SYNCHRONIZED OPENING ANIMATION ---
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
        Animated.stagger(60, allItemAnimations),
      ]).start();
    } else {
      Animated.parallel([
        // --- CHANGE: SLOWER, SYNCHRONIZED CLOSING ANIMATION ---
        Animated.timing(slideAnim, { toValue: screenWidth, duration: 600, useNativeDriver: true, easing: Easing.in(Easing.cubic) }),
        Animated.timing(rotationAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
        Animated.stagger(50, allItemAnimations.reverse()),
      ]).start(() => {
        setIsRendered(false);
      });
    }
  }, [visible, itemAnims, mainButtonAnim]);

  const handleItemPress = useCallback((item: DialerMenuItem) => {
    let isActive = false;
    const activeTabs = user?.roleName === 'Driver' ? DRIVER_TAB_SCREENS : TAB_SCREENS;
    if (item.route === 'EntityDashboard' || item.route === 'DriverDashboard') {
      isActive = activeTabs.includes(currentRoute as any);
    } else {
      isActive = item.route === currentRoute;
    }
    onClose();
    if (item.route && !isActive) {
      setTimeout(() => {
        if (activeTabs.includes(item.route as any)) {
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs', state: { routes: [{ name: item.route as any }] } }] });
        } else {
          navigation.reset({ index: 1, routes: [{ name: 'MainTabs' }, { name: item.route }] });
        }
      }, 250);
    } else if (item.action) {
      item.action();
    }
  }, [navigation, user, onClose, currentRoute]);

  const handleProfilePress = () => {
    onClose();
    setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs', state: { routes: [{ name: 'AccountTab' }] } }] });
    }, 250);
  }

  if (!isRendered) return null;

  const isDriver = user?.roleName === 'Driver';
  const balance = isDriver ? driverBalance : entityDcBalance;
  const activeTabs = isDriver ? DRIVER_TAB_SCREENS : TAB_SCREENS;
  const isDashboardActive = activeTabs.includes(currentRoute as any);

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-120deg', '0deg'],
  });

  return (
    <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: slideAnim }] }]}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}><X color="#FFFFFF" size={28} /></TouchableOpacity>
        </View>
        <View style={styles.headerContainer}>
          <Image source={require('../../assets/images/Almasr.png')} style={styles.appLogo} />
          <Text style={styles.userName}>{user?.strEntityName || 'Welcome'}</Text>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>المبلغ المستحق</Text>
            <Text style={styles.balanceAmount}>{balance ?? '0.00'} <Text style={styles.currency}>د.ل</Text></Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}><Text style={styles.profileButtonText}>الحساب الشخصي</Text></TouchableOpacity>
        </View>

        <Animated.View style={[styles.dialerContainer, { transform: [{ rotate: rotation }] }]}>
          {orbitingItems.map((item, index) => {
            const totalItems = orbitingItems.length;
            const anglePerItem = 360 / totalItems;
            const angle = -90 + (index * anglePerItem);
            const radius = screenWidth * 0.3;
            const isActive = item.route === currentRoute;
            const itemAnimation = itemAnims[index];

            // If itemAnimation is undefined (shouldn't happen now), we can fallback
            if (!itemAnimation) return null;

            const transformX = itemAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, radius * Math.cos((angle * Math.PI) / 180)] });
            const transformY = itemAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, radius * Math.sin((angle * Math.PI) / 180)] });
            const scale = itemAnimation;
            const opacity = itemAnimation;

            return (
              <Animated.View key={`${item.title}-${index}`} style={[styles.menuItemContainer, { opacity, transform: [{ translateX: transformX }, { translateY: transformY }, { scale }] }]}>
                <TouchableOpacity style={[styles.menuItem, isActive && styles.menuItemActive]} onPress={() => handleItemPress(item)}>
                  <item.icon color={isActive ? '#FFFFFF' : '#FF8C42'} size={28} />
                </TouchableOpacity>
                <Text style={styles.menuItemText}>{item.title}</Text>
              </Animated.View>
            );
          })}

          <Animated.View style={{ transform: [{ scale: mainButtonAnim }] }}>
            <TouchableOpacity style={[styles.mainButton, isDashboardActive && styles.mainButtonActive]} onPress={() => handleItemPress(dashboardItem)}>
              <dashboardItem.icon color={isDashboardActive ? '#FFFFFF' : '#FF8C42'} size={32} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: '#E67E22', zIndex: 1000 },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topBar: { width: '100%', flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 5 },
  closeButton: { padding: 15 },
  headerContainer: { alignItems: 'center', width: '100%', paddingTop: 0 },
  appLogo: {
    width: 110,
    height: 110,
    resizeMode: 'contain',
    marginBottom: 20,
    backgroundColor: '#FFFFFF', // This adds the white background
    borderRadius: 8,          // This adds the border radius
  },
  userName: { color: '#FFFFFF', fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  balanceCard: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 15, paddingVertical: 10, paddingHorizontal: 30, alignItems: 'center', marginBottom: 20 },
  balanceLabel: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14 },
  balanceAmount: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
  currency: { fontSize: 16, fontWeight: 'normal' },
  profileButton: { backgroundColor: '#FFFFFF', borderRadius: 25, paddingVertical: 12, paddingHorizontal: 40, elevation: 5, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 5 },
  profileButtonText: { color: '#FF8C42', fontSize: 16, fontWeight: 'bold' },
  dialerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mainButton: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', elevation: 10 },
  mainButtonActive: { backgroundColor: '#FF8C42' },
  menuItemContainer: { position: 'absolute', alignItems: 'center' },
  menuItem: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  menuItemActive: { backgroundColor: '#FF8C42' },
  menuItemText: { color: '#FFFFFF', marginTop: 8, fontSize: 13, fontWeight: 'bold', textAlign: 'center', width: 80, textShadowColor: 'rgba(0, 0, 0, 0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
});