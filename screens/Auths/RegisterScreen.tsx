import React, { useState, useEffect, useCallback } from 'react'; // <-- Import useCallback
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
// --- 1. IMPORT useFocusEffect ---
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { G, Rect, Line, Circle, Path } from 'react-native-svg';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<any>({});

  // --- 2. THIS IS THE FIX ---
  // This effect will run every time the user navigates TO this screen.
  useFocusEffect(
    useCallback(() => {
      // Reset all state variables to their initial values
      setPhoneNumber('');
      setVerificationCode('');
      setIsCodeSent(false);
      setIsLoading(false);
      setCountdown(0);
      setErrors({});

      // This cleanup function is not strictly necessary but is good practice
      return () => { };
    }, [])
  );
  // -------------------------

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
        Alert.alert('تم الإرسال', responseData.Message);
      } else {
        Alert.alert('خطأ', responseData.Message || 'فشل إرسال الرمز.');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      Alert.alert('خطأ في الاتصال', 'يرجى التحقق من اتصالك بالإنترنت.');
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
        Alert.alert('خطأ في التحقق', responseData.Message || 'الرمز الذي أدخلته غير صحيح أو انتهت صلاحيته.');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      Alert.alert('خطأ في الاتصال', 'يرجى التحقق من اتصالك بالإنترنت.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => navigation.navigate('Login');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View>
            <View style={styles.logoContainer}>
              <Image source={require('../../assets/images/NavLogo.png')} style={styles.logoImage} resizeMode="contain" />
            </View>
            <View style={styles.introSection}>
              <View style={styles.introTextContainer}>
                <Text style={styles.title}>إنشاء حساب جديد</Text>
                <Text style={styles.subtitle}>
                  {!isCodeSent ? 'أدخل رقم جوالك لتلقي رمز التحقق' : 'أدخل رمز التحقق المرسل إلى جوالك'}
                </Text>
              </View>
              <View style={styles.introSvgContainer}>
                <Svg width={150} height={150} viewBox="0 0 500 300">
                  <G fill="none" stroke="#ff7d21ff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
                    <Rect x={180} y={30} width={140} height={220} rx={18} ry={18} />
                    <Line x1={215} y1={50} x2={285} y2={50} strokeWidth={3} />
                    <Circle cx={250} cy={235} r={6} />
                    <Rect x={205} y={100} width={90} height={50} rx={10} ry={10} />
                    <Circle cx={225} cy={125} r={4} fill="#FF6A00" />
                    <Circle cx={250} cy={125} r={4} fill="#FF6A00" />
                    <Circle cx={275} cy={125} r={4} fill="#FF6A00" />
                    <Path d="M250 160 L230 170 Q230 190 250 200 Q270 190 270 170 Z" />
                    <Path d="M240 175 L248 185 L265 168" />
                    <Path d="M130 110 L140 120 L130 130 L120 120 Z" />
                    <Path d="M365 95 L375 105 L365 115 L355 105 Z" />
                    <Circle cx={360} cy={150} r={6} />
                    <Path d="M140 230 C200 205, 300 205, 360 230" strokeWidth={3} />
                  </G>
                </Svg>
              </View>
            </View>
            <View style={styles.formSection}>
              {!isCodeSent ? (
                <View style={styles.inputContainer}>
                  <View style={[styles.phoneInputWrapper, errors.phoneNumber && styles.inputError]}>
                    <TouchableOpacity style={styles.sendCodeButton} onPress={handleSendVerificationCode} disabled={isLoading}>
                      {isLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.sendCodeButtonText}>إرسال</Text>}
                    </TouchableOpacity>
                    <TextInput style={[styles.textInput, { textAlign: 'right' }]} placeholder="XXXXXXXX" placeholderTextColor="#888888" value={phoneNumber} onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))} keyboardType="phone-pad" maxLength={12} editable={!isLoading} />
                    <Text style={styles.countryCode}>+92</Text>
                    <Icon name="phone-iphone" size={20} color="#888888" style={styles.inputIcon} />
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
                    <View style={[styles.phoneInputWrapper, errors.verificationCode && styles.inputError]}>
                      <Icon name="lock" size={20} color="#888888" style={styles.inputIcon} />
                      <TextInput style={styles.textInput} placeholder="رمز التحقق" placeholderTextColor="#888888" value={verificationCode} onChangeText={setVerificationCode} keyboardType="numeric" maxLength={6} textAlign="right" />
                    </View>
                    {errors.verificationCode && <Text style={styles.errorText}>{errors.verificationCode}</Text>}
                  </View>
                  <TouchableOpacity style={[styles.registerButton, isLoading && styles.registerButtonDisabled]} onPress={handleVerifyOtp} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#000000" size="small" /> : <Text style={styles.registerButtonText}>التحقق والمتابعة</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSendVerificationCode} style={[styles.resendButton, countdown > 0 && styles.resendButtonDisabled]} disabled={countdown > 0 || isLoading}>
                    {countdown > 0 ? (
                      <View style={styles.resendTimerContainer}>
                        <Text style={styles.resendDisabledText}>يمكنك إرسال رمز جديد خلال </Text>
                        <Icon name="timer" size={20} color="#F47525" style={{ marginLeft: 4 }} />
                        <Text style={styles.resendDisabledText}> {formatTime(countdown)}</Text>
                      </View>
                    ) : (
                      <Text style={styles.resendButtonText}>لم تتلق الرمز؟ إرسال مرة أخرى</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
              <View style={styles.backToLoginContainer}>
                <TouchableOpacity onPress={handleBackToLogin}>
                  <Text style={styles.backToLoginLink}>لديك حساب؟ تسجيل الدخول</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={{ flex: 1 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Styles are unchanged
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  keyboardAvoidingView: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logoImage: { width: 100, height: 100 },
  introSection: { flexDirection: 'row-reverse', alignItems: 'center', marginTop: 20, marginBottom: 50, paddingHorizontal: 10 },
  introTextContainer: { paddingRight: 10 },
  introSvgContainer: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 6, textAlign: 'right', fontFamily: 'NotoSansArabic-Bold' },
  subtitle: { fontSize: 14, color: '#AAA', textAlign: 'right', fontFamily: 'NotoSansArabic-Regular', lineHeight: 22 },
  formSection: { marginBottom: 30 },
  inputContainer: { marginBottom: 12 },
  phoneInputWrapper: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#2a2a2a', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#404040', minHeight: 50 },
  inputError: { borderColor: '#FF4444' },
  inputIcon: { marginRight: 8 },
  textInput: { flex: 1, fontSize: 14, color: '#FFF', fontWeight: '400', fontFamily: 'NotoSansArabic-Regular', writingDirection: 'rtl', paddingVertical: 10 },
  sendCodeButton: { backgroundColor: '#F47525', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginLeft: 6 },
  sendCodeButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600', fontFamily: 'NotoSansArabic-Bold' },
  countryCode: { color: '#FFF', fontSize: 14, marginRight: 4, fontFamily: 'NotoSansArabic-Bold' },
  successMessage: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1B4332', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#4CAF50' },
  successText: { fontSize: 14, color: '#4CAF50', fontWeight: '500', marginLeft: 6, fontFamily: 'NotoSansArabic-Regular' },
  resendButton: { alignItems: 'center', marginBottom: 12, paddingVertical: 6 },
  resendButtonDisabled: { opacity: 0.5 },
  resendButtonText: { fontSize: 14, color: '#F47525', fontWeight: '600', fontFamily: 'NotoSansArabic-Regular', textDecorationLine: 'underline' },
  resendDisabledText: { color: '#888', fontSize: 14, fontWeight: '500', textAlign: 'center', fontFamily: 'NotoSansArabic-Regular' },
  resendTimerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  registerButton: { backgroundColor: '#F47525', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  registerButtonDisabled: { opacity: 0.7 },
  registerButtonText: { color: '#000', fontSize: 16, fontWeight: '600', fontFamily: 'NotoSansArabic-Bold' },
  backToLoginContainer: { alignItems: 'center', marginTop: 30 },
  backToLoginLink: { fontSize: 14, color: '#F47525', fontWeight: '600', fontFamily: 'NotoSansArabic-Regular', textDecorationLine: 'underline' },
  errorText: { fontSize: 12, color: '#FF4444', marginTop: 4, marginRight: 2, textAlign: 'right', fontFamily: 'NotoSansArabic-Regular' },
});

export default RegisterScreen;