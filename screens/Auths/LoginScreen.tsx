import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar,
  Image,
  Animated,
  Easing,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlert from '../../components/CustomAlert';
import { useDashboard } from '../../Context/DashboardContext';

type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  Register: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// --- Color Palette ---
const Colors = {
  primaryOrange: '#FF7043',
  darkOrange: '#E65100',
  lightOrange: '#FFA726',
  white: '#FFFFFF',
  darkText: '#303030',
  greyText: '#757575',
  lightGreyBackground: '#FAFAFA',
  borderGrey: '#E0E0E0',
  errorRed: '#EF5350',
  softOrange: '#FFD7C5',
};

// --- Reusable Input Field ---
interface CustomInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  secureTextEntry?: boolean;
  isPassword?: boolean;
  togglePasswordVisibility?: () => void;
  error?: string | null;
  onFocus?: () => void;
  onBlur?: () => void;
}

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  secureTextEntry = false,
  isPassword = false,
  togglePasswordVisibility,
  error,
  onFocus,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderColorAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start(() => shakeAnim.setValue(0));
    }
  }, [error]);

  const interpolatedBorderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.borderGrey, Colors.primaryOrange],
  });

  return (
    <View style={inputStyles.container}>
      <Text style={inputStyles.label}>{label}</Text>
      <Animated.View
        style={[
          inputStyles.wrapper,
          { borderColor: error ? Colors.errorRed : interpolatedBorderColor },
          { transform: [{ translateX: shakeAnim }] }
        ]}
      >
        <TextInput
          style={inputStyles.textInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          textAlign="right"
          placeholderTextColor={Colors.greyText}
          onFocus={() => {
            setIsFocused(true);
            if (onFocus) onFocus();
          }}
          onBlur={() => {
            setIsFocused(false);
            if (onBlur) onBlur();
          }}
        />
        {isPassword && togglePasswordVisibility && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={inputStyles.passwordIconContainer}
          >
            <Icon
              name={secureTextEntry ? 'visibility-off' : 'visibility'}
              size={22}
              color={Colors.greyText}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      {error && <Text style={inputStyles.errorText}>{error}</Text>}
    </View>
  );
};

const inputStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: Colors.darkText,
    marginBottom: 8,
    textAlign: 'right',
    fontFamily: 'System',
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: Colors.borderGrey,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkText,
    fontFamily: 'System',
    writingDirection: 'rtl',
    textAlign: 'right',
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  passwordIconContainer: {
    marginLeft: 10,
    padding: 5,
  },
  errorText: {
    fontSize: 12,
    color: Colors.errorRed,
    marginTop: 5,
    textAlign: 'right',
    fontFamily: 'System',
  },
});

// --- Main Login Screen Component ---
const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAlertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertConfirmColor, setAlertConfirmColor] = useState(Colors.primaryOrange);
  type Errors = {
    phoneNumber?: string;
    password?: string;
  };
  const [errors, setErrors] = useState<Errors>({});

  // Get the state setters from the global context
  const { setUser, setDashboardData, setDcBalance } = useDashboard();

  // Animation references
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formOpacityAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const waveOffset1 = useRef(new Animated.Value(0)).current;
  const waveOffset2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial animations
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(formOpacityAnim, {
        toValue: 1,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Wave animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveOffset1, {
          toValue: 1,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(waveOffset1, {
          toValue: 0,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(waveOffset2, {
          toValue: 1,
          duration: 12000,
          delay: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(waveOffset2, {
          toValue: 0,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

  }, []);

  // --- NEW: Function to update FCM token on the server ---
  const updateFCMToken = async (userId: number, roleName: string) => {
    try {
      const fcmToken = await AsyncStorage.getItem('fcmToken');
      if (!fcmToken) {
        console.log('No FCM token found, skipping update.');
        return;
      }

      let endpoint = '';
      if (roleName === 'Entity') {
        endpoint = 'https://tanmia-group.com:84/courierApi/entity/updateToken';
      } else if (roleName === 'Driver') {
        endpoint = 'https://tanmia-group.com:84/courierApi/driver/updateToken';
      } else {
        console.log(`Unknown role: ${roleName}. Skipping FCM token update.`);
        return;
      }

      const body = {
        Id: userId,
        IosToken: Platform.OS === 'ios' ? fcmToken : null,
        AndroidToken: Platform.OS === 'android' ? fcmToken : null,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        console.log(`FCM token updated successfully for ${roleName} ${userId}.`);
      } else {
        const errorData = await response.json();
        console.error('Failed to update FCM token:', response.status, errorData);
      }
    } catch (error) {
      console.error('An error occurred while updating FCM token:', error);
    }
  };



  const handleLogin = async () => {
    setIsLoading(true);
    Animated.sequence([
      Animated.spring(buttonScaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }),
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }),
    ]).start();

    try {
      const response = await fetch('https://tanmia-group.com:84/courierApi/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          UserName: phoneNumber,
          Password: password,
        }),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        updateFCMToken(responseData.userId, responseData.roleName);
        setDashboardData(null);
        setUser(responseData);
        setDcBalance(String(responseData?.DCBalance?.toFixed(2) ?? '0.00'));
        await AsyncStorage.setItem('user', JSON.stringify(responseData));
        navigation.replace('MainTabs');
      } else {
        setAlertTitle('خطأ في تسجيل الدخول');
        setAlertMessage(responseData.message || 'يرجى التحقق من بياناتك');
        setAlertConfirmColor(Colors.errorRed);
        setAlertVisible(true);
      }
    } catch (error) {
      console.error('Login error:', error);
      setAlertTitle('خطأ في الاتصال');
      setAlertMessage('يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى');
      setAlertConfirmColor(Colors.errorRed);
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };


  const handleCreateAccount = () => {
    navigation.replace('Register');
  };

  const wavePath1 = waveOffset1.interpolate({
    inputRange: [0, 1],
    outputRange: [
      `M0,${screenHeight * 0.15} C${screenWidth * 0.25},${screenHeight * 0.25} ${screenWidth * 0.75},${screenHeight * 0.05} ${screenWidth},${screenHeight * 0.15} V0 H0 Z`,
      `M0,${screenHeight * 0.15} C${screenWidth * 0.25},${screenHeight * 0.05} ${screenWidth * 0.75},${screenHeight * 0.25} ${screenWidth},${screenHeight * 0.15} V0 H0 Z`
    ],
  });

  const wavePath2 = waveOffset2.interpolate({
    inputRange: [0, 1],
    outputRange: [
      `M0,${screenHeight * 0.2} C${screenWidth * 0.35},${screenHeight * 0.1} ${screenWidth * 0.65},${screenHeight * 0.3} ${screenWidth},${screenHeight * 0.2} V0 H0 Z`,
      `M0,${screenHeight * 0.2} C${screenWidth * 0.35},${screenHeight * 0.3} ${screenWidth * 0.65},${screenHeight * 0.1} ${screenWidth},${screenHeight * 0.2} V0 H0 Z`
    ],
  });

  const animatedHeaderStyle = {
    opacity: headerAnim,
    transform: [
      {
        translateY: headerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
      {
        scale: headerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
    ],
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -StatusBar.currentHeight}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSvgContainer}>
          <Svg height={screenHeight * 0.3} width={screenWidth}>
            <Defs>
              <LinearGradient id="gradTop" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={Colors.lightOrange} stopOpacity="0.8" />
                <Stop offset="100%" stopColor={Colors.primaryOrange} stopOpacity="1" />
              </LinearGradient>
              <LinearGradient id="gradMid" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={Colors.lightOrange} stopOpacity="0.6" />
                <Stop offset="100%" stopColor={Colors.primaryOrange} stopOpacity="0.7" />
              </LinearGradient>
            </Defs>
            <AnimatedPath
              d={wavePath1}
              fill="url(#gradTop)"
            />
            <AnimatedPath
              d={wavePath2}
              fill="url(#gradMid)"
            />
          </Svg>
        </View>

        <Animated.View style={[styles.topSection]}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/NavLogo2.png')}
              style={styles.iconImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcometitle}>المسار</Text>
          <Text style={styles.welcomeSubtitle}>مرحبًا بك في شركة المسار، يرجى تسجيل الدخول للمتابعة</Text>
        </Animated.View>

        <Animated.View style={[styles.formSection, { opacity: formOpacityAnim }]}>
          <CustomInput
            label="*رقم الهاتف"
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              setErrors((prev) => ({ ...prev, phoneNumber: undefined }));
            }}
            keyboardType="default"
            error={errors.phoneNumber}
          />

          <CustomInput
            label="*كلمة المرور"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            secureTextEntry={!isPasswordVisible}
            isPassword
            togglePasswordVisibility={() => setIsPasswordVisible(!isPasswordVisible)}
            error={errors.password}
          />
        </Animated.View>

        <View style={styles.bottomSection}>
          <View style={styles.topLeftDecor} />
          <View style={styles.topRightDecor} />

          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>مزال ماعندكش حساب لمتجرك؟ </Text>
            <TouchableOpacity onPress={handleCreateAccount}>
              <Text style={styles.signUpLink}>إنشاء حساب متجر</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomIndicator} />
        </View>
      </ScrollView>
      <CustomAlert
        isVisible={isAlertVisible}
        title={alertTitle}
        message={alertMessage}
        confirmText="حسنًا"
        cancelText=""
        onConfirm={() => {
          setAlertVisible(false);
          if (alertTitle === 'تم تسجيل الدخول بنجاح') {
            navigation.replace('MainTabs');
          }
        }}
        onCancel={() => setAlertVisible(false)}
      />

    </KeyboardAvoidingView>
  );
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: screenHeight * 0.15,
  },
  topSvgContainer: {
    height: screenHeight * 0.3,
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 25,
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  iconImage: {
    width: 100,
    height: 100,
    marginLeft: 5,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: Colors.darkText,
    textAlign: 'center',
    fontFamily: 'System',
    marginTop: 8,
    fontWeight: '500',
  },
  welcometitle: {
    fontSize: 28,
    color: Colors.darkText,
    textAlign: 'center',
    fontFamily: 'System',
    marginTop: 8,
    fontWeight: '900',
  },
  formSection: {
    marginTop: 15,
    paddingHorizontal: 30,
  },
  bottomSection: {
    backgroundColor: Colors.primaryOrange,
    paddingTop: 30,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 30,
    alignItems: 'center',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    marginTop: 'auto',
  },
  topLeftDecor: {
    position: 'absolute',
    top: 15,
    left: 20,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.lightOrange,
    opacity: 0.7,
  },
  topRightDecor: {
    position: 'absolute',
    top: 15,
    right: 20,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.darkOrange,
    opacity: 0.6,
  },
  loginButton: {
    backgroundColor: Colors.white,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    width: '100%',
    marginBottom: 15,
    shadowColor: Colors.darkOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
    backgroundColor: Colors.borderGrey,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryOrange,
    fontFamily: 'System',
  },
  signUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: Colors.white,
    fontFamily: 'System',
  },
  signUpLink: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '700',
    textDecorationLine: 'underline',
    fontFamily: 'System',
  },
  bottomIndicator: {
    width: 40,
    height: 4,
    backgroundColor: Colors.white,
    borderRadius: 2,
    opacity: 0.7,
  },
});

export default LoginScreen;