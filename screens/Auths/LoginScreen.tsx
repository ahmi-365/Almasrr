import React, { useState } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import { Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  type Errors = {
    phoneNumber?: string | null;
    password?: string | null;
  };
  const [errors, setErrors] = useState<Errors>({});

  const validateInputs = () => {
    const newErrors: Errors = {};
    if (!phoneNumber) {
      newErrors.phoneNumber = 'رقم الجوال مطلوب';
    } else if (!/^09[0-9]{8}$/.test(phoneNumber)) {
      newErrors.phoneNumber = 'يرجى إدخال رقم جوال صحيح (09xxxxxxxx)';
    }
    if (!password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (password.length < 3) {
      newErrors.password = 'كلمة المرور يجب أن تكون 3 أحرف على الأقل';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleLogin = async () => {
  if (!validateInputs()) return;
  setIsLoading(true);

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
    console.log('Login response:', responseData);

    // ✅ Check API success field, not just response.ok
    if (response.ok && responseData.success) {
      // Save user data in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(responseData));

      Alert.alert('تم تسجيل الدخول بنجاح', 'مرحباً بك مرة أخرى في التطبيق');
      console.log('Login successful:', responseData);

      // Navigate based on role
      if (responseData.roleName === 'Entity') {
        navigation.replace('EntityDashboard');
      } else if (responseData.roleName === 'Driver') {
        navigation.replace('DriverDashboard');
      } else {
        navigation.replace('MainTabs'); // fallback
      }
    } else {
      // 🔹 Login failed
      Alert.alert('خطأ في تسجيل الدخول', responseData.message || 'يرجى التحقق من بياناتك');
    }
  } catch (error) {
    console.error('Login error:', error);
    Alert.alert('خطأ في الاتصال', 'يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى');
  } finally {
    setIsLoading(false);
  }
};


const handleCreateAccount = () => {
  navigation.navigate('Register');
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
          {/* Top Section */}
          <View style={styles.topSection}>
            {/* Warning Icon */}
           <View style={styles.iconContainer}>
  <Image 
    source={require('../../assets/images/NavLogo.png')}  // 👈 apni image ka path
    style={styles.iconImage}
    resizeMode="contain"
  />
</View>


            {/* Welcome Text */}
            <Text style={styles.welcomeTitle}>أهلاً بك مجدداً</Text>
            <Text style={styles.welcomeSubtitle}>سجل دخولك للمتابعة</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Mobile Number Input */}
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, errors.phoneNumber && styles.inputError]}>
                <Icon name="phone-iphone" size={20} color="#888888" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="رقم الجوال"
                  placeholderTextColor="#888888"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: null }));
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                  textAlign="right"
                />
              </View>
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <TouchableOpacity 
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)} 
                  style={styles.passwordIconContainer}
                >
                  <Icon 
                    name={isPasswordVisible ? 'lock-open' : 'lock'} 
                    size={20} 
                    color="#888888" 
                  />
                </TouchableOpacity>
                <TextInput
                  style={styles.textInput}
                  placeholder="كلمة المرور"
                  placeholderTextColor="#888888"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  secureTextEntry={!isPasswordVisible}
                  textAlign="right"
                />
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
              onPress={handleLogin} 
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <View style={styles.loginButtonContent}>
                  <Icon name="arrow-back" size={20} color="#000000" style={styles.loginArrow} />
                  <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <TouchableOpacity onPress={handleCreateAccount}>
                <Text style={styles.signUpLink}>إنشاء حساب</Text>
              </TouchableOpacity>
              <Text style={styles.signUpText}> ليس لديك حساب؟</Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Wave */}
      </KeyboardAvoidingView>
        <View style={styles.bottomWave}>
          <Svg viewBox="0 0 500 120" width="100%" height={120}>
      {/* Orange curve */}
      <Path
        d="M10 80 C150 20, 350 140, 490 80"
        stroke="#FF8C2E"
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
      {/* Brown filled wave */}
      <Path
        d="M0 90 C150 40, 350 140, 500 90 L500 120 L0 120 Z"
        fill="#6A3A14"
      />
    </Svg>

        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 120,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'NotoSansArabic-Bold', // Add Arabic font if available
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    fontFamily: 'NotoSansArabic-Regular', // Add Arabic font if available
  },
  formSection: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#404040',
  },
  inputError: {
    borderColor: '#FF4444',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '400',
    fontFamily: 'NotoSansArabic-Regular', // Add Arabic font if available
    writingDirection: 'rtl',
  },
  inputIcon: {
    marginRight: 12,
    marginLeft: 0,
  },
  passwordIconContainer: {
    marginRight: 12,
    marginLeft: 0,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF4444',
    marginTop: 6,
    marginRight: 4,
    marginLeft: 0,
    textAlign: 'right',
    fontFamily: 'NotoSansArabic-Regular', // Add Arabic font if available
  },
  loginButton: {
    backgroundColor: '#F47525',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 0,
    fontFamily: 'NotoSansArabic-Bold', // Add Arabic font if available
  },
  loginArrow: {
    marginRight: 4,
    marginLeft: 0,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#AAAAAA',
    fontFamily: 'NotoSansArabic-Regular', 
  },
  signUpLink: {
    fontSize: 14,
    color: '#F47525',
    fontWeight: '600',
    fontFamily: 'NotoSansArabic-Bold', 
  },
  bottomWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  iconImage: {
  width: 150,
  height: 150,
},

});

export default LoginScreen;