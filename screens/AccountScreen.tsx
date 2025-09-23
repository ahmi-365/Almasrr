import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  Easing
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User as UserIcon,
  Phone,
  MapPin,
  LogOut,
  ChevronLeft
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import CustomAlert from '../components/CustomAlert'; // Ensure this path is correct

import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';


const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);
const { width } = Dimensions.get('window');

interface UserProfile {
  strEntityName: string;
  roleName: string;
  strEntityPhone: string;
  strEntityAddress: string;
  vbrPicture: string | null;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedHeaderBackground = () => {
  const waveOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(waveOffset, {
        toValue: -width,
        duration: 5000,
        useNativeDriver: false,
        easing: Easing.linear,
      })
    ).start();
  }, [waveOffset]);

  const waveDefinition = `M 0 100 Q ${width / 4} 80, ${width / 2} 100 T ${width} 100 L ${width} 200 L 0 200 Z`;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} 200`} preserveAspectRatio="none">
        <AnimatedPath
          d={waveDefinition}
          fill="#FFFFFF"
          opacity={0.15}
          transform={[{ translateX: waveOffset }]}
        />
        <AnimatedPath
          d={waveDefinition}
          fill="#FFFFFF"
          opacity={0.15}
          transform={[{ translateX: Animated.add(waveOffset, width) }]}
        />
      </Svg>
    </View>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoDetails}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value || 'غير محدد'}</Text>
      </View>
      <View style={[styles.infoIconContainer, { backgroundColor: '#FF6B3520' }]}>
        <Icon color="#FF6B35" size={22} />
      </View>
    </View>
  );
};

const ActionRow = ({ icon: Icon, label, onPress, color }) => {
  return (
    <TouchableOpacity style={styles.infoRow} onPress={onPress} activeOpacity={0.7}>
      <ChevronLeft color={color} size={22} />
      <View style={styles.infoDetails}>
        <Text style={[styles.infoLabel, { color: color, fontSize: 16 }]}>{label}</Text>
      </View>
      <View style={[styles.infoIconContainer, { backgroundColor: `${color}20` }]}>
        <Icon color={color} size={22} />
      </View>
    </TouchableOpacity>
  );
};

const AccountSkeleton = () => {
  const shimmerColors = ['#FFFFFF', '#FDF1EC', '#FFFFFF'];
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ShimmerPlaceHolder style={styles.profileHeaderSkeleton} shimmerColors={shimmerColors} />
        <ShimmerPlaceHolder style={styles.sectionTitleSkeleton} shimmerColors={shimmerColors} />
        <ShimmerPlaceHolder style={styles.infoRowSkeleton} shimmerColors={shimmerColors} />
        <ShimmerPlaceHolder style={styles.infoRowSkeleton} shimmerColors={shimmerColors} />
        <ShimmerPlaceHolder style={styles.infoRowSkeleton} shimmerColors={shimmerColors} />
        <ShimmerPlaceHolder style={styles.sectionTitleSkeleton} shimmerColors={shimmerColors} />
        <ShimmerPlaceHolder style={styles.infoRowSkeleton} shimmerColors={shimmerColors} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default function AccountScreen({ navigation }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAlertVisible, setAlertVisible] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('user');
        if (userDataString) {
          setUser(JSON.parse(userDataString));
        }
      } catch (error) {
        console.error("Failed to load user data for profile screen:", error);
      } finally {
        setTimeout(() => setLoading(false), 1500);
      }
    };
    loadUserData();
  }, []);

  const getRoleInArabic = (role) => {
    if (role === 'Entity') return 'تاجر';
    if (role === 'Driver') return 'سائق';
    return role || 'مستخدم';
  };

  const confirmLogout = async () => {
    setAlertVisible(false);
    try {
      await AsyncStorage.clear();
      await AsyncStorage.multiRemove(['user', 'token', 'isLoggedIn']);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return <AccountSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <AnimatedHeaderBackground />
          <View style={styles.avatarContainer}>
            {user?.vbrPicture ? (
              <Image source={{ uri: user.vbrPicture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}><UserIcon color="#FFF" size={40} /></View>
            )}
          </View>
          <Text style={styles.name}>{user?.strEntityName || '...'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{getRoleInArabic(user?.roleName)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المعلومات الشخصية</Text>
          <InfoRow icon={UserIcon} label="الاسم الكامل" value={user?.strEntityName} />
          <InfoRow icon={Phone} label="رقم الجوال" value={user?.strEntityPhone} />
          <InfoRow icon={MapPin} label="العنوان" value={user?.strEntityAddress} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الإجراءات</Text>
          <ActionRow icon={LogOut} label="تسجيل الخروج" onPress={() => setAlertVisible(true)} color="#E74C3C" />
        </View>
      </ScrollView>

      <CustomAlert
        isVisible={isAlertVisible}
        title="تأكيد تسجيل الخروج"
        message="هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟"
        confirmText="تسجيل الخروج"
        cancelText="إلغاء"
        onConfirm={confirmLogout}
        onCancel={() => setAlertVisible(false)}
        confirmButtonColor="#E74C3C"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  // --- FIX: INCREASED TOP PADDING ---
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: 30, // Increased from 10 to give more space at the top
    paddingBottom: 100
  },
  profileHeader: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 30,
    overflow: 'hidden',
    height: 195,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 45
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center'
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  roleText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343A40',
    marginBottom: 10,
    textAlign: 'right',
  },
  infoRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoDetails: {
    flex: 1,
    marginRight: 15,
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '600',
    textAlign: 'right',
  },
  profileHeaderSkeleton: {
    height: 195,
    borderRadius: 12,
    marginBottom: 25,
    width: '100%',
  },
  sectionTitleSkeleton: {
    width: 150,
    height: 20,
    borderRadius: 4,
    marginBottom: 15,
    alignSelf: 'flex-end'
  },
  infoRowSkeleton: {
    width: '100%',
    height: 75,
    borderRadius: 8,
    marginBottom: 10
  },
});