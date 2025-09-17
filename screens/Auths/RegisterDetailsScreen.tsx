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
    Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RegisterDetailsRouteProp = RouteProp<RootStackParamList, 'RegisterDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const RegisterDetailsScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RegisterDetailsRouteProp>();
    const { mobileNumber } = route.params;

    const [entityName, setEntityName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [address, setAddress] = useState('');
    const [entityDescription, setEntityDescription] = useState(''); // <-- 1. ADD STATE
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});

    const validateInputs = () => {
        const newErrors: any = {};
        if (!entityName) newErrors.entityName = 'اسم المؤسسة مطلوب';
        if (!ownerName) newErrors.ownerName = 'اسم المالك مطلوب';
        if (!address) newErrors.address = 'العنوان مطلوب';
        if (!entityDescription) newErrors.entityDescription = 'وصف المؤسسة مطلوب'; // <-- 2. ADD VALIDATION
        if (!password) {
            newErrors.password = 'كلمة المرور مطلوبة';
        } else if (password.length < 3) {
            newErrors.password = 'كلمة المرور يجب أن تكون 3 أحرف على الأقل';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFinalRegister = async () => {
        if (!validateInputs()) return;
        setIsLoading(true);

        const formBody = new URLSearchParams({
            EntityName: entityName,
            OwnerName: ownerName,
            Address: address,
            strPassword: password,
            MobileNumber: `92${mobileNumber}`,
            EntityDescription: entityDescription, // <-- 3. ADD TO API CALL
        }).toString();

        try {
            const response = await fetch('https://tanmia-group.com:84/courierApi/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formBody,
            });

            const responseData = await response.json();

            if (responseData.Success) {
                Alert.alert('تم التسجيل بنجاح', 'يمكنك الآن تسجيل الدخول بحسابك الجديد.', [
                    {
                        text: 'تسجيل الدخول',
                        onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }),
                    },
                ]);
            } else {
                Alert.alert('خطأ في التسجيل', responseData.Message || 'حدث خطأ ما، يرجى المحاولة مرة أخرى.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            Alert.alert('خطأ في الاتصال', 'يرجى التحقق من اتصالك بالإنترنت.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Content Wrapper */}
                    <View>
                        <View style={styles.topSection}>
                            <Image source={require('../../assets/images/NavLogo.png')} style={styles.iconImage} resizeMode="contain" />
                            <Text style={styles.welcomeTitle}>إكمال التسجيل</Text>
                            <Text style={styles.welcomeSubtitle}>بقي خطوة واحدة فقط</Text>
                        </View>

                        <View style={styles.formSection}>
                            <View style={styles.inputContainer}>
                                <View style={[styles.inputWrapper, { backgroundColor: '#333' }]}>
                                    <Icon name="phone-iphone" size={20} color="#888" style={styles.inputIcon} />
                                    <Text style={styles.verifiedNumberText}>+92{mobileNumber}</Text>
                                </View>
                            </View>
                            <View style={styles.inputContainer}>
                                <View style={[styles.inputWrapper, errors.entityName && styles.inputError]}>
                                    <Icon name="store" size={20} color="#888" style={styles.inputIcon} />
                                    <TextInput style={styles.textInput} placeholder="اسم المؤسسة" placeholderTextColor="#888" value={entityName} onChangeText={setEntityName} textAlign="right" />
                                </View>
                                {errors.entityName && <Text style={styles.errorText}>{errors.entityName}</Text>}
                            </View>
                            <View style={styles.inputContainer}>
                                <View style={[styles.inputWrapper, errors.ownerName && styles.inputError]}>
                                    <Icon name="person" size={20} color="#888" style={styles.inputIcon} />
                                    <TextInput style={styles.textInput} placeholder="اسم المالك" placeholderTextColor="#888" value={ownerName} onChangeText={setOwnerName} textAlign="right" />
                                </View>
                                {errors.ownerName && <Text style={styles.errorText}>{errors.ownerName}</Text>}
                            </View>
                            <View style={styles.inputContainer}>
                                <View style={[styles.inputWrapper, errors.address && styles.inputError]}>
                                    <Icon name="location-on" size={20} color="#888" style={styles.inputIcon} />
                                    <TextInput style={styles.textInput} placeholder="العنوان" placeholderTextColor="#888" value={address} onChangeText={setAddress} textAlign="right" />
                                </View>
                                {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
                            </View>

                            {/* --- 4. ADD THE NEW DESCRIPTION FIELD --- */}
                            <View style={styles.inputContainer}>
                                <View style={[styles.inputWrapper, errors.entityDescription && styles.inputError]}>
                                    <Icon name="description" size={20} color="#888" style={styles.inputIcon} />
                                    <TextInput style={styles.textInput} placeholder="وصف المؤسسة" placeholderTextColor="#888" value={entityDescription} onChangeText={setEntityDescription} textAlign="right" />
                                </View>
                                {errors.entityDescription && <Text style={styles.errorText}>{errors.entityDescription}</Text>}
                            </View>
                            {/* -------------------------------------- */}

                            <View style={styles.inputContainer}>
                                <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                                    <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.passwordIconContainer}>
                                        <Icon name={isPasswordVisible ? 'lock-open' : 'lock'} size={20} color="#888" />
                                    </TouchableOpacity>
                                    <TextInput style={styles.textInput} placeholder="كلمة المرور" placeholderTextColor="#888" value={password} onChangeText={setPassword} secureTextEntry={!isPasswordVisible} textAlign="right" />
                                </View>
                                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                            </View>
                            <TouchableOpacity style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} onPress={handleFinalRegister} disabled={isLoading}>
                                {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.loginButtonText}>إنشاء الحساب</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/* Flexible spacer to push content up */}
                    <View style={{ flex: 1 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1a1a1a' },
    // Remove justifyContent to prevent forced centering
    scrollContainer: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 60, paddingBottom: 40 },
    topSection: { alignItems: 'center', marginBottom: 40 },
    iconImage: { width: 120, height: 120 },
    welcomeTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginBottom: 8, textAlign: 'center' },
    welcomeSubtitle: { fontSize: 16, color: '#AAA', textAlign: 'center' },
    formSection: { width: '100%' },
    inputContainer: { marginBottom: 20 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a2a', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: '#404040' },
    inputError: { borderColor: '#FF4444' },
    textInput: { flex: 1, fontSize: 16, color: '#FFF', fontWeight: '400', writingDirection: 'rtl' },
    inputIcon: { marginRight: 12 },
    passwordIconContainer: { marginRight: 12, padding: 4 },
    errorText: { fontSize: 12, color: '#FF4444', marginTop: 6, marginRight: 4, textAlign: 'right' },
    loginButton: { backgroundColor: '#F47525', borderRadius: 12, paddingVertical: 18, alignItems: 'center', marginTop: 20 },
    loginButtonDisabled: { opacity: 0.7 },
    loginButtonText: { color: '#000', fontSize: 18, fontWeight: '600' },
    verifiedNumberText: { flex: 1, fontSize: 16, color: '#CCC', fontWeight: 'bold', textAlign: 'right' },
});

export default RegisterDetailsScreen;