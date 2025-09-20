import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import TopBar from '../components/Entity/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User as UserIcon, 
  Phone, 
  MapPin, 
  LogOut,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface UserProfile {
  strEntityName: string;
  roleName: string;
  strEntityPhone: string;
  strEntityAddress: string;
  vbrPicture: string | null;
}

const InfoRow = ({ icon: Icon, label, value }) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.infoRow}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
      >
        <Text style={styles.infoValue}>{value || 'غير محدد'}</Text>
        <View style={styles.infoLabelContainer}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Icon color="#7F8C8D" size={20} style={styles.infoIcon} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function AccountScreen({ navigation }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('user');
        if (userDataString) {
          setUser(JSON.parse(userDataString));
        }
      } catch (error) {
        console.error("Failed to load user data for profile screen:", error);
      }
    };
    
    loadUserData();

    // Smooth entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getRoleInArabic = (role: string | undefined) => {
    if (role === 'Entity') return 'تاجر';
    if (role === 'Driver') return 'سائق';
    return role || '...';
  };

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من أنك تريد تسجيل الخروج؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['user', 'token', 'isLoggedIn']);
              // Navigate to login - adjust route name as needed
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('خطأ', 'فشل في تسجيل الخروج');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <TopBar />
      
      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Enhanced Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {user?.vbrPicture ? (
                <Image source={{ uri: user.vbrPicture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <UserIcon color="#FFF" size={35} />
                </View>
              )}
              <View style={styles.avatarGlow} />
            </View>
            
            <Text style={styles.name}>{user?.strEntityName || '...'}</Text>
            
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{getRoleInArabic(user?.roleName)}</Text>
            </View>
          </View>

          {/* Enhanced Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>المعلومات الشخصية</Text>
              <View style={styles.cardTitleUnderline} />
            </View>
            
            <InfoRow icon={UserIcon} label="الاسم الكامل" value={user?.strEntityName} />
            <InfoRow icon={Phone} label="رقم الجوال" value={user?.strEntityPhone} />
            <InfoRow icon={MapPin} label="العنوان" value={user?.strEntityAddress} />
          </View>

          {/* Enhanced Logout Button */}
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={styles.logoutButtonContent}>
              <LogOut color="#FFF" size={22} style={styles.logoutIcon} />
              <Text style={styles.logoutButtonText}>تسجيل الخروج</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  content: {
    flex: 1,
  },
  scrollContent: { 
    padding: 20, 
    paddingBottom: 20 
  },
  profileHeader: { 
    alignItems: 'center', 
    marginBottom: 10,
    paddingTop: 2,
  },
  avatarContainer: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#3498DB', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 16, 
    elevation: 12, 
    marginBottom: 12,
    position: 'relative',
  },
  avatar: { 
    width: '90%', 
    height: '90%', 
    borderRadius: 32 
  },
  avatarPlaceholder: { 
    width: '90%', 
    height: '90%', 
    borderRadius: 32, 
    backgroundColor: '#BDC3C7', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3498DB20',
    top: -5,
    left: -5,
  },
  name: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#2C3E50', 
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  roleBadge: {
    backgroundColor: '#3498DB',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.05 }],
  },
  roleText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  detailsCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 8,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  cardTitleUnderline: {
    width: 50,
    height: 3,
    backgroundColor: '#3498DB',
    borderRadius: 2,
  },
  infoRow: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 20, 
    paddingHorizontal: 8,
    borderBottomWidth: 1, 
    borderBottomColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 2,
  },
  infoLabelContainer: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: { 
    marginRight: 15,
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  infoLabel: { 
    fontSize: 16, 
    color: '#7F8C8D',
    fontWeight: '600',
    flex: 1,
  },
  infoValue: { 
    fontSize: 16, 
    color: '#2C3E50', 
    fontWeight: '600', 
    flexShrink: 1, 
    textAlign: 'left',
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 5,
    marginBottom: 100,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    marginLeft: 12,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});