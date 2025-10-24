import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react';
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
  ImageSourcePropType,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useDashboard } from '../../Context/DashboardContext';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

const images = {
  dashboard: require('../../assets/icons/dashboard-icon.png'),
  cityRates: require('../../assets/icons/rates-icon-new.png'),
  balance: require('../../assets/icons/balance-icon.png'),
  pending: require('../../assets/icons/pending-icon.png'),
  assigned: require('../../assets/pending.png'),
  inBranch: require('../../assets/icons/branch-icon.png'),
  onTheWay: require('../../assets/icons/on-the-way-icon.png'),
  returned: require('../../assets/icons/returned-parcels-icon.png'),
  history: require('../../assets/icons/history-icon.png'),
  deliveredParcels: require('../../assets/icons/delivered-parcels-icon.png'),
  returnedParcels: require('../../assets/icons/returned-parcels-icon.png'),
};

const TAB_SCREENS: (keyof RootStackParamList)[] = ['EntityDashboard', 'ReportsTab', 'StoresTab', 'AccountTab'];
const DRIVER_TAB_SCREENS: (keyof RootStackParamList)[] = ['DriverDashboard', 'ParcelsTab', 'AccountTab', 'ReportsTab'];

interface DialerSidebarProps {
  visible: boolean;
  onClose: () => void;
}

interface DialerMenuItem {
  image: ImageSourcePropType;
  title: string;
  route?: keyof RootStackParamList;
  action?: () => void;
}

export default function Sidebar({ visible, onClose }: DialerSidebarProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // --- UPDATED: Destructure dcBalance directly. It's the single source of truth. ---
  const { dcBalance, currentRoute, user } = useDashboard();
  const [isRendered, setIsRendered] = useState(false);

  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const animationController = useRef<Animated.CompositeAnimation | null>(null);
  const insets = useSafeAreaInsets();

  const { dashboardItem, orbitingItems } = useMemo(() => {
    if (!user) {
      return { dashboardItem: null, orbitingItems: [] };
    }
    const isDriver = user.roleName === 'Driver';
    const allItems: DialerMenuItem[] = isDriver
      ? [
        { image: images.deliveredParcels, title: 'الطرود المسلمة', route: 'DeliverdParcel' },
        { image: images.returnedParcels, title: 'الطرود المرتجعة', route: 'ReturnedParcel' }
      ]
      : [
        { image: images.cityRates, title: 'الأسعار حسب المدينة', route: 'CityRates' },
        { image: images.balance, title: 'الرصيد المتاجر', route: 'EntitiesBalanceScreen' },
        { image: images.pending, title: 'في انتظار التصديق', route: 'PendingApprovalScreen' },
        { image: images.inBranch, title: 'في الفرع', route: 'AtBranchScreen' },
        { image: images.onTheWay, title: 'في الطريق', route: 'OnTheWayScreen' },
        { image: images.returned, title: 'الطرود المرتجعة', route: 'ReturnedParcelsScreen' },
        { image: images.deliveredParcels, title: 'التوصيل ناجح', route: 'SuccessfulDeliveryScreen' }

      ];
    const dashboardRoute: keyof RootStackParamList = isDriver ? 'DriverDashboard' : 'EntityDashboard';
    return {
      dashboardItem: { image: images.dashboard, title: 'لوحة القيادة', route: dashboardRoute },
      orbitingItems: allItems,
    };
  }, [user]);

  const itemAnims = useMemo(() => orbitingItems.map(() => new Animated.Value(0)), [orbitingItems]);
  const mainButtonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animationController.current?.stop();
    const allItemAnimations = [
      ...itemAnims.map(anim => Animated.spring(anim, { toValue: visible ? 1 : 0, friction: 7, tension: 30, useNativeDriver: true })),
      Animated.spring(mainButtonAnim, { toValue: visible ? 1 : 0, friction: 7, tension: 30, useNativeDriver: true }),
    ];
    if (visible) {
      setIsRendered(true);
      animationController.current = Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(rotationAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.cubic) }),
        Animated.stagger(60, allItemAnimations),
      ]);
      animationController.current.start();
    } else if (isRendered) {
      animationController.current = Animated.parallel([
        Animated.timing(slideAnim, { toValue: screenWidth, duration: 600, useNativeDriver: true, easing: Easing.in(Easing.cubic) }),
        Animated.timing(rotationAnim, { toValue: 0, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.cubic) }),
        Animated.stagger(50, allItemAnimations.reverse()),
      ]);
      animationController.current.start(() => {
        if (!visible) setIsRendered(false);
      });
    }
  }, [visible, isRendered, itemAnims, mainButtonAnim, slideAnim, rotationAnim]);

  const handleItemPress = useCallback((item: DialerMenuItem) => {
    // setTimeout(() => {
    if (!user || !item.route || item.route === currentRoute) return;
    // const activeTabs = user.roleName === 'Driver' ? DRIVER_TAB_SCREENS : TAB_SCREENS;
    // if (activeTabs.includes(item.route as any)) {
    //   navigation.reset({ index: 0, routes: [{ name: 'MainTabs', state: { routes: [{ name: item.route as any }] } }] });
    // } else {
    //   navigation.reset({ index: 1, routes: [{ name: 'MainTabs' }, { name: item.route }] });
    // }
    // if (activeTabs.includes(item.route as any)) {
    //   navigation.navigate('MainTabs', { screen: item.route as any });
    // } else {
    navigation.navigate(item.route as any);
    onClose();

    // }

    // }, 250);
  }, [navigation, onClose]);

  const handleProfilePress = () => {

    // setTimeout(() => {
    // navigation.reset({ index: 0, routes: [{ name: 'MainTabs', state: { routes: [{ name: 'AccountTab' }] } }] });
    navigation.navigate('MainTabs', { screen: 'AccountTab' });
    onClose();

    // }, 250);
  };

  if (!isRendered || !user || !dashboardItem) return null;

  // --- UPDATED: Create a dynamic label for the balance card ---
  const balanceLabel = user.roleName === 'Driver' ? 'الرصيد في المحفظة' : 'المبلغ المستحق';

  const isDriver = user.roleName === 'Driver';
  const activeTabs = isDriver ? DRIVER_TAB_SCREENS : TAB_SCREENS;
  const isDashboardActive = activeTabs.includes(currentRoute as any);

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-120deg', '0deg'],
  });

  return (
    <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: slideAnim }] }]}>
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <StatusBar backgroundColor="transparent" translucent barStyle="dark-content" />
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}><X color="#FFFFFF" size={28} /></TouchableOpacity>
        </View>
        <View style={styles.headerContainer}>
          <Image source={require('../../assets/images/Almasr.png')} style={styles.appLogo} />
          <Text style={styles.userName}>{user.strEntityName || 'Welcome'}</Text>
          <View style={styles.balanceCard}>
            {/* Use the dynamic balanceLabel */}
            <Text style={styles.balanceLabel}>{balanceLabel}</Text>
            {/* Directly use the up-to-date dcBalance from the context */}
            <Text style={styles.balanceAmount}>{dcBalance ?? '0.00'} <Text style={styles.currency}>د.ل</Text></Text>
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

            if (!itemAnimation) return null;

            const transformX = itemAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, radius * Math.cos((angle * Math.PI) / 180)] });
            const transformY = itemAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, radius * Math.sin((angle * Math.PI) / 180)] });

            return (
              <Animated.View key={`${item.title}-${index}`} style={[styles.menuItemContainer, { opacity: itemAnimation, transform: [{ translateX: transformX }, { translateY: transformY }, { scale: itemAnimation }] }]}>
                <TouchableOpacity style={[styles.menuItem, isActive && styles.menuItemActive]} onPress={() => handleItemPress(item)}>
                  <Image source={item.image} style={[styles.menuItemImage, isActive && styles.menuItemImageActive]} />
                </TouchableOpacity>
                <Text style={styles.menuItemText}>{item.title}</Text>
              </Animated.View>
            );
          })}

          <Animated.View style={{ transform: [{ scale: mainButtonAnim }] }}>
            <TouchableOpacity style={[styles.mainButton, isDashboardActive && styles.mainButtonActive]} onPress={() => handleItemPress(dashboardItem)}>
              <Image source={dashboardItem.image} style={[styles.mainButtonImage, isDashboardActive && styles.mainButtonImageActive]} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: '#E67E22', zIndex: 1000 },
  safeArea: {
    flex: 1,
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topBar: { width: '100%', flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 5 },
  closeButton: { padding: 15 },
  headerContainer: { alignItems: 'center', width: '100%', paddingTop: 0 },
  appLogo: {
    width: 110,
    height: 110,
    resizeMode: 'contain',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  userName: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  balanceCard: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 15, paddingVertical: 10, paddingHorizontal: 30, alignItems: 'center', marginBottom: 20 },
  balanceLabel: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14 },
  balanceAmount: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  currency: { fontSize: 14, fontWeight: 'normal' },
  profileButton: { backgroundColor: '#FFFFFF', borderRadius: 25, paddingVertical: 12, paddingHorizontal: 40, elevation: 5, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 5 },
  profileButtonText: { color: '#FF8C42', fontSize: 14, fontWeight: 'bold' },
  dialerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mainButton: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', elevation: 10 },
  mainButtonActive: { backgroundColor: '#FF8C42' },
  menuItemContainer: { position: 'absolute', alignItems: 'center' },
  menuItem: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  menuItemActive: { backgroundColor: '#FF8C42' },
  menuItemText: { color: '#FFFFFF', marginTop: 0, fontSize: 12, fontWeight: 'bold', textAlign: 'center', width: 90, textShadowColor: 'rgba(0, 0, 0, 0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  mainButtonImage: {
    width: 65,
    height: 65,
    resizeMode: 'contain',
  },
  mainButtonImageActive: {
    tintColor: '#FFFFFF',
  },
  menuItemImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  menuItemImageActive: {
    tintColor: '#FFFFFF',
  },
});