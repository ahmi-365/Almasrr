import React, { useState, useEffect } from 'react';
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
  I18nManager,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { G, Rect, Line, Circle, Path } from 'react-native-svg';

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  type Errors = {
    phoneNumber?: string | null;
    verificationCode?: string | null;
  };
  const [errors, setErrors] = useState<Errors>({});

  // Countdown timer effect
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && isCodeSent) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, isCodeSent]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const startCountdown = () => {
    setCountdown(120);
    setCanResend(false);
  };

  const validatePhoneNumber = () => {
    const newErrors: Errors = {};
    if (!phoneNumber) {
      newErrors.phoneNumber = 'رقم الجوال مطلوب';
    } else if (!/^[0-9]{8}$/.test(phoneNumber)) {
      newErrors.phoneNumber = 'يرجى إدخال رقم جوال صحيح (8 أرقام فقط)';
    }
    setErrors((prev) => ({ ...prev, phoneNumber: newErrors.phoneNumber }));
    return !newErrors.phoneNumber;
  };

  const validateVerificationCode = () => {
    const newErrors: Errors = {};
    if (!verificationCode) {
      newErrors.verificationCode = 'رمز التحقق مطلوب';
    } else if (verificationCode.length < 3) {
      newErrors.verificationCode = 'رمز التحقق غير صحيح';
    }
    setErrors((prev) => ({
      ...prev,
      verificationCode: newErrors.verificationCode,
    }));
    return !newErrors.verificationCode;
  };

  const handleSendVerificationCode = async () => {
    if (!validatePhoneNumber()) return;
    setIsLoading(true);

    try {
      setTimeout(() => {
        setIsLoading(false);
        setIsCodeSent(true);
        startCountdown();
        setShowSuccess(true);

        // Hide success after 4 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 4000);

        Alert.alert('تم الإرسال', 'تم إرسال رمز التحقق إلى رقم الجوال');
      }, 2000);
    } catch (error) {
      console.error('Send verification error:', error);
      Alert.alert('خطأ في الإرسال', 'يرجى المحاولة مرة أخرى');
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      setTimeout(() => {
        setIsLoading(false);
        startCountdown();
        Alert.alert(
          'تم الإرسال مجدداً',
          'تم إرسال رمز التحقق الجديد إلى رقم الجوال'
        );
      }, 1500);
    } catch (error) {
      console.error('Resend verification error:', error);
      Alert.alert('خطأ في الإرسال', 'يرجى المحاولة مرة أخرى');
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateVerificationCode()) return;
    setIsLoading(true);

    try {
      const response = await fetch(
        'https://tanmia-group.com:84/courierApi/Register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            EntityName: 'مؤسسة افتراضية',
            EntityCode: null,
            EntityDescription: 'وصف افتراضي',
            MobileNumber: phoneNumber,
            Address: 'عنوان افتراضي',
            OwnerName: 'اسم افتراضي',
            strPassword: verificationCode,
            intCityCode: 1,
            intParentEntityCode: 0,
            intEntityCode: null,
          }),
        }
      );

      const responseData = await response.json();

      if (response.ok) {
        Alert.alert('تم إنشاء الحساب بنجاح', 'مرحباً بك في التطبيق', [
          {
            text: 'موافق',
            onPress: () => navigation.navigate('Login'),
          },
        ]);
      } else {
        Alert.alert(
          'خطأ في إنشاء الحساب',
          responseData.message || 'يرجى التحقق من البيانات المدخلة'
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'خطأ في الاتصال',
        'يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            {/* Warning Icon */}
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/images/NavLogo.png')} // 👈 apni image ka path
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>إنشاء حساب جديد</Text>
            <Text style={styles.subtitle}>
              {!isCodeSent
                ? 'أدخل رقم جوالك لتلقي رمز التحقق'
                : 'أدخل رمز التحقق المرسل إلى جوالك'}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Phone Number Input */}
            <View style={styles.inputContainer}>
              {!isCodeSent && (
                <View
                  style={[
                    styles.phoneInputWrapper,
                    errors.phoneNumber && styles.inputError,
                  ]}
                >
                  {/* Send button on left */}
                  <TouchableOpacity
                    style={styles.sendCodeButton}
                    onPress={handleSendVerificationCode}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.sendCodeButtonText}>إرسال</Text>
                    )}
                  </TouchableOpacity>

                  {/* User input (8 digits only) */}
                  <TextInput
                    style={[styles.textInput, { textAlign: 'right' }]} // RTL input
                    placeholder="XXXXXXXX"
                    placeholderTextColor="#888888"
                    value={phoneNumber}
                    onChangeText={(text) => {
                      setPhoneNumber(text.replace(/[^0-9]/g, ''));
                      if (errors.phoneNumber)
                        setErrors((prev) => ({ ...prev, phoneNumber: null }));
                    }}
                    keyboardType="phone-pad"
                    maxLength={8}
                    editable={!isCodeSent}
                  />

                  {/* Static +218 code on the right */}
                  <Text style={styles.countryCode}>+218</Text>

                  {/* Phone icon (optional) */}
                  <Icon
                    name="phone-iphone"
                    size={20}
                    color="#888888"
                    style={styles.inputIcon}
                  />
                </View>
              )}
              {errors.phoneNumber && (
                <Text style={styles.errorText}>{errors.phoneNumber}</Text>
              )}
            </View>

            {/* Verification Code Section */}
            {isCodeSent && (
              <>
                {/* Success Message */}
                {showSuccess && (
                  <View style={styles.successMessage}>
                    <Icon name="check-circle" size={20} color="#4CAF50" />
                    <Text style={styles.successText}>
                      تم إرسال الرمز إلى +218{phoneNumber}
                    </Text>
                  </View>
                )}             {/* Verification Input */}
                <View style={styles.inputContainer}>
                  <View
                    style={[
                      styles.phoneInputWrapper,
                      errors.verificationCode && styles.inputError,
                    ]}
                  >
                    <Icon
                      name="lock"
                      size={20}
                      color="#888888"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="رمز التحقق"
                      placeholderTextColor="#888888"
                      value={verificationCode}
                      onChangeText={(text) => {
                        setVerificationCode(text);
                        if (errors.verificationCode)
                          setErrors((prev) => ({
                            ...prev,
                            verificationCode: null,
                          }));
                      }}
                      keyboardType="numeric"
                      maxLength={6}
                      textAlign="right"
                    />
                  </View>
                  {errors.verificationCode && (
                    <Text style={styles.errorText}>
                      {errors.verificationCode}
                    </Text>
                  )}
                </View>

                {/* Resend Code Button */}
                <TouchableOpacity
                  onPress={handleResendCode}
                  style={[
                    styles.resendButton,
                    !canResend && styles.resendButtonDisabled,
                  ]}
                  disabled={!canResend || isLoading}
                >
                  {canResend ? (
                    <Text style={styles.resendButtonText}>
                      لم تتلق الرمز؟ إرسال مرة أخرى
                    </Text>
                  ) : (
                    <View style={styles.resendTimerContainer}>
                      <Text style={styles.resendDisabledText}>
                        يمكنك إرسال رمز جديد خلال{' '}
                      </Text>
                      <Icon
                        name="timer"
                        size={20}
                        color="#F47525"
                        style={{ marginLeft: 4 }}
                      />
                      <Text style={styles.resendDisabledText}>
                        {' '}
                        {formatTime(countdown)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Register Button */}
            {isCodeSent && (
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  isLoading && styles.registerButtonDisabled,
                ]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000000" size="small" />
                ) : (
                  <Text style={styles.registerButtonText}>إنشاء الحساب</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Back to Login Link */}
            <View style={styles.backToLoginContainer}>
              <TouchableOpacity onPress={handleBackToLogin}>
                <Text style={styles.backToLoginLink}>
                  لديك حساب؟ تسجيل الدخول
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Illustration */}
          <View style={styles.illustrationContainer}>
           <Svg width={400} height={300} viewBox="0 0 500 300">
      <G
        fill="none"
        stroke="#ff7d21ff"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Phone outer rounded rect */}
        <Rect x={180} y={30} width={140} height={220} rx={18} ry={18} />

        {/* Top notch/slot */}
        <Line x1={215} y1={50} x2={285} y2={50} strokeWidth={3} />

        {/* Small circular home button */}
        <Circle cx={250} cy={235} r={6} />

        {/* OTP message bubble inside screen */}
        <Rect x={205} y={100} width={90} height={50} rx={10} ry={10} />

        {/* Dots for OTP */}
        <Circle cx={225} cy={125} r={4} fill="#FF6A00" />
        <Circle cx={250} cy={125} r={4} fill="#FF6A00" />
        <Circle cx={275} cy={125} r={4} fill="#FF6A00" />

        {/* Shield with checkmark (verification) */}
        <Path d="M250 160 L230 170 Q230 190 250 200 Q270 190 270 170 Z" />
        <Path d="M240 175 L248 185 L265 168" />

        {/* Decorative floating icons */}
        <Path d="M130 110 L140 120 L130 130 L120 120 Z" />
        <Path d="M365 95 L375 105 L365 115 L355 105 Z" />
        <Circle cx={360} cy={150} r={6} />

        {/* Only bottom wave kept */}
        <Path d="M140 230 C200 205, 300 205, 360 230" strokeWidth={3} />
      </G>
    </Svg>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  keyboardAvoidingView: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20 },
  headerSection: { alignItems: 'center', marginBottom: 30 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 4, textAlign: 'center', fontFamily: 'NotoSansArabic-Bold' },
  subtitle: { fontSize: 14, color: '#AAA', textAlign: 'center', fontFamily: 'NotoSansArabic-Regular', lineHeight: 20 },
  formSection: { marginBottom: 30 },
  inputContainer: { marginBottom: 12 },
  phoneInputWrapper: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#2a2a2a', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#404040', minHeight: 50 },
  inputError: { borderColor: '#FF4444' },
  inputIcon: { marginRight: 8 },
  textInput: { flex: 1, fontSize: 14, color: '#FFF', fontWeight: '400', fontFamily: 'NotoSansArabic-Regular', writingDirection: 'rtl', paddingVertical: 10 },
  disabledInput: { color: '#888' },
  sendCodeButton: { backgroundColor: '#F47525', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 6 },
  sendCodeButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600', fontFamily: 'NotoSansArabic-Bold' },
  iconImage: { width: 120, height: 120 },
  countryCode: { color: '#FFF', fontSize: 14, marginRight: 4, fontFamily: 'NotoSansArabic-Bold' },
  successMessage: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1B4332', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#4CAF50' },
  successText: { fontSize: 14, color: '#4CAF50', fontWeight: '500', marginLeft: 6, fontFamily: 'NotoSansArabic-Regular' },
  countdownContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2a2a2a', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#404040' },
  countdownText: { fontSize: 14, color: '#F47525', fontWeight: '600', marginLeft: 6, textAlign: 'center', fontFamily: 'NotoSansArabic-Regular' },
  resendButton: { alignItems: 'center', marginBottom: 12, paddingVertical: 6 },
  resendButtonDisabled: { opacity: 0.5 },
  resendButtonText: { fontSize: 14, color: '#F47525', fontWeight: '600', fontFamily: 'NotoSansArabic-Regular', textDecorationLine: 'underline' },
  resendDisabledText: { color: '#888', fontSize: 14, fontWeight: '500', textAlign: 'center', fontFamily: 'NotoSansArabic-Regular' },
  resendTimerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  registerButton: { backgroundColor: '#F47525', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  registerButtonDisabled: { opacity: 0.7 },
  registerButtonText: { color: '#000', fontSize: 16, fontWeight: '600', fontFamily: 'NotoSansArabic-Bold' },
  backToLoginContainer: { alignItems: 'center', marginTop: 6 },
  backToLoginLink: { fontSize: 14, color: '#F47525', fontWeight: '600', fontFamily: 'NotoSansArabic-Regular', textDecorationLine: 'underline' },
  errorText: { fontSize: 12, color: '#FF4444', marginTop: 4, marginRight: 2, textAlign: 'right', fontFamily: 'NotoSansArabic-Regular' },
  illustrationContainer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', minHeight: 150,marginBottom: 100 },
  illustration: { opacity: 0.7 },
});


export default RegisterScreen;
