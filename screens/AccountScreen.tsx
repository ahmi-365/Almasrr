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
  Easing,
  TextInput,
  ActivityIndicator,
  Platform, // Import Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User as UserIcon,
  Phone,
  MapPin,
  LogOut,
  ChevronLeft,
  Lock,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import CustomAlert from '../components/CustomAlert';

import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { useDashboard } from '../Context/DashboardContext';
import { useFocusEffect } from '@react-navigation/native';


const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);
const { width } = Dimensions.get('window');

interface UserProfile {
  strEntityName: string;
  roleName: string;
  strEntityPhone: string;
  strEntityAddress: string;
  vbrPicture: string | null;
  intUserCode?: number;
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
  const [isPasswordAlertVisible, setPasswordAlertVisible] = useState(false);
  const [isDeleteAlertVisible, setDeleteAlertVisible] = useState(false);

  // Password change states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const { setCurrentRoute } = useDashboard();


  useFocusEffect(
    React.useCallback(() => {
      setCurrentRoute('AccountTab');
    }, [setCurrentRoute])
  );

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
    if (role === 'Entity') return 'المتجر';
    if (role === 'Driver') return 'المندوب';
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

  const confirmDeleteAccount = async () => {
    setDeleteAlertVisible(false);
    console.log('Account deletion confirmed. Logging out...');
    await confirmLogout();
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || !confirmPassword) {
      setPasswordError('يرجى ملء جميع الحقول');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين');
      return;
    }

    if (newPassword.length < 3) {
      setPasswordError('كلمة المرور الجديدة يجب أن تكون 3 أحرف على الأقل');
      return;
    }

    setIsChangingPassword(true);

    try {
      const userDataString = await AsyncStorage.getItem('user');
      if (!userDataString) {
        setPasswordError('لم يتم العثور على بيانات المستخدم');
        setIsChangingPassword(false);
        return;
      }

      const userData = JSON.parse(userDataString);
      const intUserCode = userData.userId;
      const strRoleName = userData.roleName;

      if (!intUserCode || !strRoleName) {
        setPasswordError('بيانات المستخدم غير كاملة');
        setIsChangingPassword(false);
        return;
      }

      const payload = {
        intUserCode,
        strRoleName,
        NewPassword: newPassword,
      };

      const response = await fetch('https://tanmia-group.com:86/courierApi/changePassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && (data.success || data.Success || data.Status === "success")) {
        setPasswordSuccess(data.Message || 'تم تغيير كلمة المرور بنجاح');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setPasswordAlertVisible(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(data.Message || data.message || 'فشل تغيير كلمة المرور. حاول مرة أخرى');
      }
    } catch (error) {
      setPasswordError('حدث خطأ أثناء تغيير كلمة المرور. حاول مرة أخرى');
    } finally {
      setIsChangingPassword(false);
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
          <ActionRow
            icon={Lock}
            label="تغيير كلمة المرور"
            onPress={() => setPasswordAlertVisible(true)}
            color="#FF6B35"
          />
          {Platform.OS === 'ios' && user?.strEntityPhone === '218915556255' && (
            <ActionRow
              icon={Trash2}
              label="حذف الحساب"
              onPress={() => setDeleteAlertVisible(true)}
              color="#E74C3C"
            />
          )}
          <ActionRow icon={LogOut} label="تسجيل الخروج" onPress={() => setAlertVisible(true)} color="#E74C3C" />
        </View>
      </ScrollView>

      {/* Logout Alert */}
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

      {/* Delete Account Alert */}
      <CustomAlert
        isVisible={isDeleteAlertVisible}
        title="تأكيد حذف الحساب"
        message="هل أنت متأكد أنك تريد حذف حسابك نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف الحساب"
        cancelText="إلغاء"
        onConfirm={confirmDeleteAccount}
        onCancel={() => setDeleteAlertVisible(false)}
        confirmButtonColor="#E74C3C"
      />

      {/* Password Change Modal */}
      {isPasswordAlertVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>تغيير كلمة المرور</Text>

            <View style={styles.passwordContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>كلمة المرور الجديدة</Text>
                <View style={styles.passwordInputWrapper}>
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeIcon}
                  >
                    {showNewPassword ? <EyeOff size={20} color="#718096" /> : <Eye size={20} color="#718096" />}
                  </TouchableOpacity>
                  <TextInput
                    style={styles.passwordInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    placeholder="أدخل كلمة المرور الجديدة"
                    placeholderTextColor="#A0AEC0"
                    textAlign="right"
                    editable={!isChangingPassword}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>تأكيد كلمة المرور</Text>
                <View style={styles.passwordInputWrapper}>
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    {showConfirmPassword ? <EyeOff size={20} color="#718096" /> : <Eye size={20} color="#718096" />}
                  </TouchableOpacity>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                    placeholderTextColor="#A0AEC0"
                    textAlign="right"
                    editable={!isChangingPassword}
                  />
                </View>
              </View>

              {passwordError ? (
                <View style={styles.messageContainer}>
                  <Text style={styles.errorText}>{passwordError}</Text>
                </View>
              ) : null}

              {passwordSuccess ? (
                <View style={[styles.messageContainer, { backgroundColor: '#D4EDDA' }]}>
                  <Text style={[styles.errorText, { color: '#155724' }]}>{passwordSuccess}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setPasswordAlertVisible(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                disabled={isChangingPassword}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>تغيير</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: 30,
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
  passwordContainer: {
    width: '100%',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#343A40',
    marginBottom: 8,
    textAlign: 'right',
    fontWeight: '600',
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#2D3748',
  },
  eyeIcon: {
    padding: 12,
  },
  messageContainer: {
    backgroundColor: '#F8D7DA',
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
  },
  errorText: {
    color: '#721C24',
    fontSize: 14,
    textAlign: 'right',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#343A40',
    marginBottom: 20,
    textAlign: 'right',
  },
  modalButtons: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  confirmButton: {
    backgroundColor: '#FF6B35',
  },
  cancelButton: {
    backgroundColor: '#E2E8F0',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#718096',
    fontSize: 16,
    fontWeight: 'bold',
  },
});