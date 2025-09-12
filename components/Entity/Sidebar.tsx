import { useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import {
  Menu,
  Calendar,
  Package,
  CircleCheck as CheckCircle,
  Truck,
  Wallet,
  LayoutDashboard,
  FileText,
  Landmark,
  Store,
  Scale,
  Hourglass,
  ClipboardCheck,
  User,
  Clock,
  CircleCheck,
  CirclePlus,
  History,
  LogOut,
} from 'lucide-react-native';
import { useDashboard } from '../../Context/DashboardContext'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import { useState } from 'react';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  activeRoute?: string;
}

interface MenuItem {
  icon: React.ComponentType<any>;
  title: string;
  color: string;
  route?: keyof RootStackParamList;
  onPress?: () => void;
}

type SidebarNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function Sidebar({
  visible,
  onClose,
  activeRoute = 'EntityDashboard',
}: SidebarProps) {
  const navigation = useNavigation<SidebarNavigationProp>();
  const slideAnim = useRef(new Animated.Value(280)).current;
  const { dcBalance } = useDashboard(); 
const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 280,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);
useEffect(() => {
  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (err) {
      console.error('Failed to load user from storage:', err);
    }
  };

  loadUser();
}, []);
const menuItems: MenuItem[] = useMemo(
  () => [
    {
      icon: LayoutDashboard,
      title: 'لوحة القيادة', // Dashboard
      color: '#FFFFFF',
      route: 'EntityDashboard', 
    },
    {
      icon: FileText,
      title: 'تقرير المعاملات', // Transaction Report
      color: '#FFFFFF',
      // route: 'TransactionReport',
    },
    {
      icon: Landmark,
      title: 'الأسعار حسب المدينة', // City Rates
      color: '#FFFFFF',
      // route: 'CityRates',
    },
    {
      icon: Store,
      title: 'المتاجر', // Stores
      color: '#FFFFFF',
      // route: 'Stores',
    },
    {
      icon: Scale,
      title: 'الرصيد المتاجر', // Store Balance
      color: '#FFFFFF',
      // route: 'StoreBalance',
    },
    {
      icon: Hourglass,
      title: 'في انتظار التصديق', // Pending Approval
      color: '#FFFFFF',
      // route: 'PendingApproval',
    },
    {
      icon: ClipboardCheck,
      title: 'في الفرع', // In Branch
      color: '#FFFFFF',
      // route: 'InBranch',
    },
    {
      icon: Truck,
      title: 'في الطريق', // On The Way
      color: '#FFFFFF',
      // route: 'OnTheWay',
    },
    {
      icon: CircleCheck,
      title: 'التوصيل ناجح', // Delivered Successfully
      color: '#FFFFFF',
      route: 'DeliveryTracking',
    },
    {
      icon: CirclePlus,
      title: 'الطرود المرتجعة', // Returned Parcels
      color: '#FFFFFF',
      // route: 'ReturnedParcels',
    },
    {
      icon: History,
      title: 'سجل الطرود', // Parcels History
      color: '#FFFFFF',
      // route: 'ParcelsHistory',
    },
  ],
  []
);



const handleMenuItemPress = useCallback(
  (item: MenuItem) => {
    if (item.route) {
      navigation.navigate(item.route);
    }
    onClose();
  },
  [navigation, onClose]
);


  const handleChangePassword = useCallback(() => {
    console.log('Change password pressed');
    onClose();
  }, [onClose]);

  const handleLogout = useCallback(() => {
    navigation.navigate('Login');
    onClose();
  }, [navigation, onClose]);
  const MenuItem = useCallback(
    ({ item }: { item: MenuItem }) => {
      const isActive = item.route === activeRoute;
      return (
        <TouchableOpacity
          style={[styles.menuItem, isActive && styles.activeMenuItem]}
          onPress={() => handleMenuItemPress(item)}
          activeOpacity={0.7}
        >
          {/* Text first */}
          <Text style={[styles.menuText, isActive && styles.activeMenuText]}>
            {item.title}
          </Text>

          {/* Icon on the right */}
          <item.icon color={isActive ? '#FF8C42' : item.color} size={18} />

          {isActive && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      );
    },
    [handleMenuItemPress, activeRoute]
  );

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
      />
      <Animated.View
        style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
      >
        <StatusBar backgroundColor="#2C2C2C" barStyle="light-content" />

        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContent}>
            {/* Welcome Text */}
            <View>
              <Text style={styles.welcomeTitle}>مجموعة متاجر خالد</Text>
              <Text style={styles.welcomeSubtitle}>Welcome Back</Text>
            </View>

            {/* Profile Button on the right */}
          <TouchableOpacity
  style={styles.profileButton}
  onPress={() => console.log('Profile button pressed')}
  activeOpacity={0.7}
>
  {user?.vbrPicture ? (
    <Image
      source={{ uri: user.vbrPicture }}
      style={{ width: 36, height: 36, borderRadius: 18 }}
      resizeMode="cover"
    />
  ) : (
    <User color="#FFFFFF" size={28} />
  )}
</TouchableOpacity>

          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>المبلغ المستحق</Text>
          <Text style={styles.balanceAmount}>
            <Text style={styles.currency}> د.ل</Text>
            {dcBalance ?? '0.00'}
          </Text>
        </View>

        {/* Menu Items */}
        <ScrollView
          style={styles.menuContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.menuContent}
        >
          {menuItems.map((item, index) => (
            <MenuItem key={`${item.title}-${index}`} item={item} />
          ))}

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleChangePassword}
            activeOpacity={0.7}
          >
            <Clock color="#FFFFFF" size={18} />
            <Text style={styles.menuText}>تغيير كلمة المرور</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOut color="#E74C3C" size={18} />
            <Text style={styles.logoutText}>تسجيل الخروج</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 1000,
  },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 2, 2, 0.5)',
  },
sidebar: {
  position: 'absolute',     // <-- add this
  right: 0,                  // <-- add this
  width: 280,
  backgroundColor: '#2C2C2C',
  height: '100%',
  shadowColor: '#000',
  shadowOffset: {
    width: -5,
    height: 0,
  },
  shadowOpacity: 0.3,
  shadowRadius: 5,
  elevation: 15,
},

  header: {
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#2C2C2C',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 5,
    marginTop: 15,
  },

  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  welcomeSubtitle: {
    color: '#BBBBBB',
    fontSize: 12,
    textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: '#FF8C42',
    marginHorizontal: 15,
    marginVertical: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  menuContainer: {
    flex: 1,
  },
  menuContent: {
    paddingHorizontal: 0,
    paddingBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#404040',
    position: 'relative',
  },
  welcomeContent: {
    flexDirection: 'row', // normal row
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 15,
    paddingHorizontal: 15,
    paddingTop: 10,
  },

  profileButton: {
    width: 40,
    height: 40,
    marginLeft: 25,

    borderRadius: 20,
    backgroundColor: '#444', // subtle background for button
    justifyContent: 'center',
    alignItems: 'center',
  },

  welcomeSection: {
    alignItems: 'center',
    marginTop: 40, // adjust this value as needed
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: 5,
    bottom: 5,
    width: 6,
    backgroundColor: '#FF8C42',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },

  menuText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    marginRight: 12,
    fontWeight: '400',
  },
  activeMenuText: {
    color: '#FF8C42',
    fontWeight: '600',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#404040',
    marginVertical: 10,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 5,
  },
  logoutText: {
    color: '#E74C3C',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    marginRight: 12,
    fontWeight: '400',
  },
  activeMenuItem: {
    backgroundColor: '#232323',
  },
  currency: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
});
