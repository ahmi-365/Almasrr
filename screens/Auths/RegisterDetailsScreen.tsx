import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
  Image,
  Dimensions,
  Animated,
  Easing,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import CustomAlert from '../../components/CustomAlert';

type RegisterDetailsRouteProp = RouteProp<RootStackParamList, 'RegisterDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

// --- Reusable Input Field Component ---
interface CustomInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  placeholder?: string;
  error?: string | null;
  secureTextEntry?: boolean;
  isPassword?: boolean;
  togglePasswordVisibility?: () => void;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: string;
}

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  placeholder,
  error,
  secureTextEntry = false,
  isPassword = false,
  togglePasswordVisibility,
  maxLength,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={inputStyles.container}>
      <Text style={inputStyles.label}>{label}</Text>
      <View
        style={[
          inputStyles.wrapper,
          multiline && inputStyles.multilineWrapper,
          { borderColor: error ? Colors.errorRed : (isFocused ? Colors.primaryOrange : Colors.borderGrey) },
        ]}
      >
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={22}
            color={Colors.greyText}
            style={inputStyles.leftIcon}
          />
        )}
        <TextInput
          style={[inputStyles.textInput, multiline && inputStyles.multilineText]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          textAlign="right"
          placeholderTextColor={Colors.greyText}
          secureTextEntry={secureTextEntry}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
        {isPassword && togglePasswordVisibility && (
          <TouchableOpacity onPress={togglePasswordVisibility} style={inputStyles.passwordToggle}>
            <Icon
              name={secureTextEntry ? 'visibility-off' : 'visibility'}
              size={22}
              color={Colors.greyText}
            />
          </TouchableOpacity>
        )}
      </View>
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
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
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
  multilineWrapper: {
    minHeight: 100,
    alignItems: 'flex-start',
    paddingTop: 14,
    paddingBottom: 14,
  },
  leftIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkText,
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
    writingDirection: 'rtl',
    textAlign: 'right',
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  multilineText: {
    paddingVertical: 0,
    height: '100%',
    textAlignVertical: 'top',
  },
  passwordToggle: {
    marginLeft: 10,
  },
  errorText: {
    fontSize: 12,
    color: Colors.errorRed,
    marginTop: 5,
    textAlign: 'right',
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
  },
});

const RegisterDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RegisterDetailsRouteProp>();
  // *** MODIFICATION HERE ***
  // Destructure both mobileNumber and intCityCode from route params
  const { mobileNumber, intCityCode } = route.params;

  const [entityName, setEntityName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [address, setAddress] = useState('');
  const [entityDescription, setEntityDescription] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!entityName.trim()) newErrors.entityName = 'اسم المؤسسة مطلوب';
    if (!ownerName.trim()) newErrors.ownerName = 'اسم المالك مطلوب';
    if (!address.trim()) newErrors.address = 'العنوان مطلوب';
    if (!entityDescription.trim()) newErrors.entityDescription = 'وصف المؤسسة مطلوب';

    if (!password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (password.length < 3) {
      newErrors.password = 'كلمة المرور يجب أن تكون 3 أحرف على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFinalRegister = async (): Promise<void> => {
    if (!validateInputs()) return;

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

    // *** MODIFICATION HERE ***
    // Add intCityCode to the form body
    const formBody = new URLSearchParams({
      EntityName: entityName.trim(),
      OwnerName: ownerName.trim(),
      Address: address.trim(),
      strPassword: password,
      MobileNumber: `218${mobileNumber}`,
      EntityDescription: entityDescription.trim(),
      intParentEntityCode: '0',
      intCityCode: String(intCityCode), // Add the city code here
    }).toString();

    try {
      const response = await fetch('https://tanmia-group.com:84/courierApi/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formBody,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.Success) {
        setAlertTitle('تم التسجيل بنجاح');
        setAlertMessage('يمكنك الآن تسجيل الدخول بحسابك الجديد.');
        setAlertConfirmColor(Colors.successGreen);
        setAlertVisible(true);
      } else {
        setAlertTitle('خطأ في التسجيل');
        setAlertMessage(responseData.Message || 'حدث خطأ ما، يرجى المحاولة مرة أخرى.');
        setAlertConfirmColor(Colors.errorRed);
        setAlertVisible(true);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setAlertTitle('خطأ في الاتصال');
      setAlertMessage('يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.');
      setAlertConfirmColor(Colors.errorRed);
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = (): void => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
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
          <Text style={styles.welcometitle}>إكمال التسجيل</Text>
          <Text style={styles.welcomeSubtitle}>بقي خطوة واحدة فقط</Text>
        </Animated.View>

        {/* Form Section */}
        <Animated.View style={[styles.formSection, { opacity: formOpacityAnim }]}>
          {/* Verified Phone Number Display */}
          <View style={styles.verifiedPhoneContainer}>
            <Icon name="check-circle" size={20} color={Colors.successGreen} />
            <Text style={styles.verifiedNumberText}>+218{mobileNumber} (تم التحقق)</Text>
          </View>

          <CustomInput
            label="*اسم المؤسسة"
            value={entityName}
            onChangeText={(text) => {
              setEntityName(text);
              setErrors((prev) => ({ ...prev, entityName: undefined }));
            }}
            placeholder="أدخل اسم مؤسستك"
            leftIcon="store"
            error={errors.entityName}
          />

          <CustomInput
            label="*اسم المالك"
            value={ownerName}
            onChangeText={(text) => {
              setOwnerName(text);
              setErrors((prev) => ({ ...prev, ownerName: undefined }));
            }}
            placeholder="أدخل اسم المالك"
            leftIcon="person"
            error={errors.ownerName}
          />

          <CustomInput
            label="*العنوان"
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              setErrors((prev) => ({ ...prev, address: undefined }));
            }}
            placeholder="أدخل العنوان الكامل"
            leftIcon="location-on"
            error={errors.address}
          />

          <CustomInput
            label="*وصف المؤسسة"
            value={entityDescription}
            onChangeText={(text) => {
              setEntityDescription(text);
              setErrors((prev) => ({ ...prev, entityDescription: undefined }));
            }}
            placeholder="اكتب وصفاً مختصراً لمؤسستك"
            multiline={true}
            numberOfLines={4}
            leftIcon="description"
            error={errors.entityDescription}
          />

          <CustomInput
            label="*كلمة المرور"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="اختر كلمة مرور قوية"
            secureTextEntry={!isPasswordVisible}
            isPassword={true}
            togglePasswordVisibility={() => setIsPasswordVisible(!isPasswordVisible)}
            leftIcon="lock"
            error={errors.password}
          />
        </Animated.View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Orange decorative elements in top corners */}
          <View style={styles.topLeftDecor} />
          <View style={styles.topRightDecor} />

          {/* Register Button */}
          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
            <TouchableOpacity
              style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
              onPress={handleFinalRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.actionButtonText}>إنشاء الحساب</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Back to Login Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>لديك حساب بالفعل؟ </Text>
            <TouchableOpacity onPress={handleBackToLogin}>
              <Text style={styles.signUpLink}>تسجيل الدخول</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom indicator */}
          <View style={styles.bottomIndicator} />
        </View>
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        isVisible={isAlertVisible}
        title={alertTitle}
        message={alertMessage}
        confirmText="حسنًا"
        cancelText=""
        onConfirm={() => {
          setAlertVisible(false);
          if (alertTitle === 'تم التسجيل بنجاح') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }}
        onCancel={() => setAlertVisible(false)}
      />
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
    width: 80,
    height: 80,
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
  verifiedPhoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.successGreen,
  },
  verifiedNumberText: {
    fontSize: 14,
    color: Colors.successGreen,
    fontWeight: '600',
    fontFamily: 'System',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
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
    marginTop: 30,
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
  actionButton: {
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
  actionButtonDisabled: {
    opacity: 0.7,
    backgroundColor: Colors.borderGrey,
  },
  actionButtonText: {
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

export default RegisterDetailsScreen;