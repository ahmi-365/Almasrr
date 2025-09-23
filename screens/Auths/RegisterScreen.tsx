import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
  Image,
  Keyboard,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import CustomAlert from '../../components/CustomAlert';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

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
  successGreen: '#4CAF50', 

};

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<any>({});
  
// Custom Alert states
const [isAlertVisible, setAlertVisible] = useState(false);
const [alertTitle, setAlertTitle] = useState('');
const [alertMessage, setAlertMessage] = useState('');
const [alertConfirmColor, setAlertConfirmColor] = useState(Colors.primaryOrange);
  // Animation references
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formOpacityAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const waveOffset1 = useRef(new Animated.Value(0)).current;
  const waveOffset2 = useRef(new Animated.Value(0)).current;
  useFocusEffect(
    useCallback(() => {
      setPhoneNumber('');
      setVerificationCode('');
      setIsCodeSent(false);
      setIsLoading(false);
      setCountdown(0);
      setErrors({});
      return () => { };
    }, [])
  );

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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCountdown = () => setCountdown(120);

  const validatePhoneNumber = () => {
    if (!/^[0-9]{8,12}$/.test(phoneNumber)) {
      setErrors({ phoneNumber: 'يرجى إدخال رقم جوال صحيح (8-12 أرقام)' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSendVerificationCode = async () => {
    if (!validatePhoneNumber()) return;
    setIsLoading(true);
    Keyboard.dismiss();

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
      const fullMobileNumber = `92${phoneNumber}`;
      const formBody = new URLSearchParams({ MobileNumber: fullMobileNumber }).toString();
      const response = await fetch('https://tanmia-group.com:84/courierApi/register/sendotp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody,
      });
      const responseData = await response.json();
     if (responseData.Success) {
  setIsCodeSent(true);
  startCountdown();
  setAlertTitle('تم الإرسال');
  setAlertMessage(responseData.Message);
  setAlertConfirmColor(Colors.successGreen);
  setAlertVisible(true);
} else {
  setAlertTitle('خطأ');
  setAlertMessage(responseData.Message || 'فشل إرسال الرمز.');
  setAlertConfirmColor(Colors.errorRed);
  setAlertVisible(true);
}
    } catch (error) {
  console.error('Send OTP error:', error);
  setAlertTitle('خطأ في الاتصال');
  setAlertMessage('يرجى التحقق من اتصالك بالإنترنت.');
  setAlertConfirmColor(Colors.errorRed);
  setAlertVisible(true);
} finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    Keyboard.dismiss();
    if (verificationCode.length < 4) {
      setErrors({ verificationCode: 'رمز التحقق غير صحيح' });
      return;
    }
    setErrors({});
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
      const fullMobileNumber = `92${phoneNumber}`;
      const formBody = new URLSearchParams({ MobileNumber: fullMobileNumber, OTP: verificationCode }).toString();
      const response = await fetch('https://tanmia-group.com:84/courierApi/register/verifyotp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody,
      });
      const responseData = await response.json();
    if (responseData.Success) {
  navigation.navigate('RegisterDetails', { mobileNumber: phoneNumber });
} else {
  setAlertTitle('خطأ في التحقق');
  setAlertMessage(responseData.Message || 'الرمز الذي أدخلته غير صحيح أو انتهت صلاحيته.');
  setAlertConfirmColor(Colors.errorRed);
  setAlertVisible(true);
}
    }catch (error) {
  console.error('Verify OTP error:', error);
  setAlertTitle('خطأ في الاتصال');
  setAlertMessage('يرجى التحقق من اتصالك بالإنترنت.');
  setAlertConfirmColor(Colors.errorRed);
  setAlertVisible(true);
} finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => navigation.navigate('Login');

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
        {/* Custom Alert */}
<CustomAlert
  isVisible={isAlertVisible}
  title={alertTitle}
  message={alertMessage}
  confirmText="حسنًا"
  cancelText=""
  onConfirm={() => setAlertVisible(false)}
  onCancel={() => setAlertVisible(false)}
/>
        {/* Top SVG Waves */}
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

        {/* Logo & Welcome Section */}
        <Animated.View style={[styles.topSection]}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/NavLogo2.png')}
              style={styles.iconImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcometitle}>إنشاء حساب جديد</Text>
          <Text style={styles.welcomeSubtitle}>
            {!isCodeSent ? 'أدخل رقم جوالك لتلقي رمز التحقق' : 'أدخل رمز التحقق المرسل إلى جوالك'}
          </Text>
        </Animated.View>

        {/* Form Section */}
        <Animated.View style={[styles.formSection, { opacity: formOpacityAnim }]}>
          {!isCodeSent ? (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>*رقم الجوال</Text>
              <View style={[styles.phoneInputWrapper, errors.phoneNumber && styles.inputError]}>
                <Icon name="phone" size={20} color={Colors.greyText} style={styles.inputIcon} />
                <Text style={styles.countryCode}>+92</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="XXXXXXXX"
                  placeholderTextColor={Colors.greyText}
                  value={phoneNumber}
                  onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
                  keyboardType="phone-pad"
                  maxLength={12}
                  editable={!isLoading}
                  textAlign="right"
                />
                <TouchableOpacity 
                  style={styles.sendCodeButton} 
                  onPress={handleSendVerificationCode} 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.sendCodeButtonText}>إرسال</Text>
                  )}
                </TouchableOpacity>
              </View>
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
            </View>
          ) : (
            <>
              <View style={styles.successMessage}>
                <Icon name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.successText}>تم إرسال الرمز إلى +92{phoneNumber}</Text>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>*رمز التحقق</Text>
                <View style={[styles.phoneInputWrapper, errors.verificationCode && styles.inputError]}>
                  <Icon name="lock" size={20} color={Colors.greyText} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="رمز التحقق"
                    placeholderTextColor={Colors.greyText}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="numeric"
                    maxLength={6}
                    textAlign="right"
                  />
                </View>
                {errors.verificationCode && <Text style={styles.errorText}>{errors.verificationCode}</Text>}
              </View>

              <TouchableOpacity
                onPress={handleSendVerificationCode}
                style={[styles.resendButton, countdown > 0 && styles.resendButtonDisabled]}
                disabled={countdown > 0 || isLoading}
              >
                {countdown > 0 ? (
                  <View style={styles.resendTimerContainer}>
                    <Text style={styles.resendDisabledText}>يمكنك إرسال رمز جديد خلال </Text>
                    <Icon name="timer" size={16} color={Colors.primaryOrange} style={{ marginHorizontal: 4 }} />
                    <Text style={styles.resendDisabledText}>{formatTime(countdown)}</Text>
                  </View>
                ) : (
                  <Text style={styles.resendButtonText}>لم تتلق الرمز؟ إرسال مرة أخرى</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Orange decorative elements in top corners */}
          <View style={styles.topLeftDecor} />
          <View style={styles.topRightDecor} />

          {/* Main Button */}
          {isCodeSent && (
            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <TouchableOpacity
                style={[styles.mainButton, isLoading && styles.mainButtonDisabled]}
                onPress={handleVerifyOtp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.mainButtonText}>التحقق والمتابعة</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Back to Login Link */}
          <View style={styles.backToLoginContainer}>
            <Text style={styles.backToLoginText}>لديك حساب؟ </Text>
            <TouchableOpacity onPress={handleBackToLogin}>
              <Text style={styles.backToLoginLink}>تسجيل الدخول</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom indicator */}
          <View style={styles.bottomIndicator} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Create Animated version of Path for SVG animations
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
    fontSize: 16,
    color: Colors.darkText,
    textAlign: 'center',
    fontFamily: 'System',
    marginTop: 8,
    fontWeight: '500',
  },
  welcometitle: {
    fontSize: 24,
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: Colors.darkText,
    marginBottom: 8,
    textAlign: 'right',
    fontFamily: 'System',
  },
  phoneInputWrapper: {
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
    minHeight: 50,
  },
  inputError: {
    borderColor: Colors.errorRed,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkText,
    fontFamily: 'System',
    writingDirection: 'rtl',
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  countryCode: {
    color: Colors.darkText,
    fontSize: 16,
    marginRight: 8,
    fontWeight: '600',
    fontFamily: 'System',
  },
  sendCodeButton: {
    backgroundColor: Colors.primaryOrange,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  sendCodeButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  successText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 8,
    fontFamily: 'System',
    textAlign: 'right',
    flex: 1,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 10,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: 14,
    color: Colors.primaryOrange,
    fontWeight: '600',
    fontFamily: 'System',
    textDecorationLine: 'underline',
  },
  resendDisabledText: {
    color: Colors.greyText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
  },
  resendTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  mainButton: {
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
  mainButtonDisabled: {
    opacity: 0.7,
    backgroundColor: Colors.borderGrey,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryOrange,
    fontFamily: 'System',
  },
  backToLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  backToLoginText: {
    fontSize: 14,
    color: Colors.white,
    fontFamily: 'System',
  },
  backToLoginLink: {
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
  errorText: {
    fontSize: 12,
    color: Colors.errorRed,
    marginTop: 5,
    textAlign: 'right',
    fontFamily: 'System',
  },
});

export default RegisterScreen;