// /src/screens/AddParcelWhatsappScreen.js

import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Modal,
    SafeAreaView,
    FlatList,
    TouchableWithoutFeedback,
    Platform,
    ActivityIndicator,
    KeyboardTypeOptions,
    Image,
} from 'react-native';
import {
    Store,
    ChevronDown,
    Search,
    Check,
    Calendar,
    Hash,
    ShoppingBag,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import TopBar from '../../components/Entity/TopBarNew';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomAlert from '../../components/CustomAlert';
import DateTimePicker from '@react-native-community/datetimepicker';

// --- Shimmer Placeholder Imports ---
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);
const shimmerColors = ["#FDF1EC", "#FEF8F5", "#FDF1EC"];


// --- Type Definitions ---
interface Entity {
    intEntityCode: number;
    strEntityName: string;
    strEntityCode: string;
}

// --- Reusable UI Components ---
const FormInput = ({ label, icon: Icon, placeholder, value, onChangeText, keyboardType = 'default', editable = true, required = false }) => (<View style={styles.inputContainer}><Text style={styles.label}>{label}{required && <Text style={styles.requiredStar}> *</Text>}</Text><View style={[styles.inputWrapper, !editable && styles.disabledInput]}><TextInput style={styles.input} placeholder={placeholder} placeholderTextColor="#A1A1AA" value={value} onChangeText={onChangeText} keyboardType={keyboardType as KeyboardTypeOptions} editable={editable} />{Icon && <Icon color="#A1A1AA" size={20} />}</View></View>);
const FormPicker = ({ label, icon: Icon, value, onPress, placeholder, disabled = false, required = false }) => (<View style={styles.inputContainer}><Text style={styles.label}>{label}{required && <Text style={styles.requiredStar}> *</Text>}</Text><TouchableOpacity style={[styles.inputWrapper, disabled && styles.disabledInput]} onPress={onPress} disabled={disabled}><Text style={[styles.input, !value && styles.placeholderText]}>{value || placeholder}</Text>{Icon && <ChevronDown color="#A1A1AA" size={20} />}</TouchableOpacity></View>);

// --- Skeleton Component for Initial Loading ---
const FormSkeleton = () => (
    <View>
        {[...Array(4)].map((_, index) => (
            <View key={index} style={styles.inputContainer}>
                <ShimmerPlaceholder style={skeletonStyles.label} shimmerColors={shimmerColors} />
                <ShimmerPlaceholder style={skeletonStyles.input} shimmerColors={shimmerColors} />
            </View>
        ))}
        <ShimmerPlaceholder style={skeletonStyles.button} shimmerColors={shimmerColors} />
    </View>
);

export default function AddParcelWhatsappScreen() {
    const insets = useSafeAreaInsets();

    // --- State Management ---
    const [stores, setStores] = useState<Entity[]>([]);
    const [selectedStore, setSelectedStore] = useState<Entity | null>(null);
    const [isStoreModalVisible, setStoreModalVisible] = useState(false);
    const [storeSearchQuery, setStoreSearchQuery] = useState('');
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSending, setIsSending] = useState(false);

    const [orderDate, setOrderDate] = useState(new Date());
    const [isPickerVisible, setPickerVisible] = useState(false);
    const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

    const [quantity, setQuantity] = useState('');
    const [productPrice, setProductPrice] = useState('');

    const [alertConfig, setAlertConfig] = useState({ isVisible: false, title: '', message: '', confirmText: 'حسناً', success: false, onConfirmAction: () => { } });

    const showAlert = (config) => {
        setAlertConfig({
            isVisible: true,
            title: config.title,
            message: config.message,
            confirmText: config.confirmText || 'حسناً',
            onConfirmAction: config.onConfirm || (() => { }),
            success: config.success || false,
        });
    };

    const handleAlertConfirm = () => {
        alertConfig.onConfirmAction();
        setAlertConfig(prev => ({ ...prev, isVisible: false }));
    };

    // --- Data Fetching ---
    useEffect(() => {
        const loadStores = async () => {
            try {
                const userDataString = await AsyncStorage.getItem('user');
                if (!userDataString) throw new Error("User not found");
                const parsedUser = JSON.parse(userDataString);
                const userId = parsedUser?.userId;
                if (!userId) throw new Error("User ID not found");

                const storesResponse = await axios.get(`https://tanmia-group.com:84/courierApi/Entity/GetEntities/${userId}`);
                if (storesResponse.data) {
                    setStores(storesResponse.data);
                }
            } catch (error) {
                console.error("Failed to load stores:", error);
                showAlert({ title: "خطأ", message: "لا يمكن تحميل قائمة المتاجر." });
            } finally {
                setIsLoadingData(false);
            }
        };
        loadStores();
    }, []);

    const displayedStores = useMemo(() =>
        stores.filter(e => e.strEntityName.toLowerCase().includes(storeSearchQuery.toLowerCase())),
        [storeSearchQuery, stores]
    );

    // --- Handlers ---
    const handleSelectStore = (store: Entity) => {
        setSelectedStore(store);
        setStoreModalVisible(false);
        setStoreSearchQuery("");
    };

    const showPicker = (currentMode: 'date' | 'time') => {
        setPickerVisible(true);
        setPickerMode(currentMode);
    };

    const onPickerChange = (event: any, selectedValue?: Date) => {
        setPickerVisible(Platform.OS === 'ios');
        if (event.type === 'set' && selectedValue) {
            if (pickerMode === 'date') {
                setOrderDate(selectedValue);
                if (Platform.OS === 'android') {
                    setPickerVisible(false);
                    showPicker('time');
                }
            } else {
                const newTime = selectedValue;
                const combinedDate = new Date(orderDate);
                combinedDate.setHours(newTime.getHours());
                combinedDate.setMinutes(newTime.getMinutes());
                setOrderDate(combinedDate);
                if (Platform.OS === 'android') {
                    setPickerVisible(false);
                }
            }
        } else {
            setPickerVisible(false);
        }
    };

    const resetForm = () => {
        setQuantity('');
        setProductPrice('');
        setSelectedStore(null);
        setOrderDate(new Date());
    };

    // --- UPDATED: Handler now only sends to API ---
    const handleSendRequest = async () => {
        if (!selectedStore) return showAlert({ title: 'حقل مطلوب', message: 'يرجى اختيار المتجر أولاً.' });
        if (!quantity.trim() || !(parseInt(quantity, 10) > 0)) return showAlert({ title: 'قيمة غير صالحة', message: 'يرجى إدخال كمية صحيحة أكبر من صفر.' });
        if (!productPrice.trim() || !(parseFloat(productPrice) > 0)) return showAlert({ title: 'قيمة غير صالحة', message: 'يرجى إدخال سعر منتج صحيح أكبر من صفر.' });

        setIsSending(true);

        try {
            const year = orderDate.getFullYear();
            const month = (orderDate.getMonth() + 1).toString().padStart(2, '0');
            const day = orderDate.getDate().toString().padStart(2, '0');
            const hour = orderDate.getHours().toString().padStart(2, '0');
            const minute = orderDate.getMinutes().toString().padStart(2, '0');
            const apiDateTime = `${year}-${month}-${day}T${hour}-${minute}`;

            const userDataString = await AsyncStorage.getItem('user');
            if (!userDataString) throw new Error("User not found");
            const parsedUser = JSON.parse(userDataString);
            const userId = parsedUser?.userId;
            const entitycode = userId;
            // const entitycode = selectedStore.intEntityCode;
            const qty = quantity;
            const amount = productPrice;

            const apiUrl = `https://tanmia-group.com:84/courierApi/parcels/RequestParcelWhatsapp/${entitycode}/${apiDateTime}/${qty}/${amount}`;

            const response = await axios.get(apiUrl);

            if (response.status === 200) {
                showAlert({
                    title: 'نجاح',
                    message: 'تم إرسال الطلب بنجاح.',
                    confirmText: 'إضافة طلب جديد',
                    onConfirm: resetForm,
                    success: true
                });
            } else {
                throw new Error("API responded with an error");
            }

        } catch (error) {
            console.error("Failed to send request:", error);
            showAlert({ title: 'خطأ', message: 'فشل تسجيل الطلب. يرجى المحاولة مرة أخرى.' });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <View style={styles.container}>
            <TopBar title="إضافة طلب واتساب" />

            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                {isLoadingData ? (
                    <FormSkeleton />
                ) : (
                    <>
                        <FormPicker label="المتجر" icon={Store} value={selectedStore?.strEntityName} onPress={() => setStoreModalVisible(true)} placeholder="اختر المتجر" required />

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>تاريخ ووقت الطلب<Text style={styles.requiredStar}> *</Text></Text>
                            <TouchableOpacity style={styles.inputWrapper} onPress={() => showPicker('date')}>
                                <Text style={styles.input}>
                                    {`${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')}   ${orderDate.getDate().toString().padStart(2, '0')}-${(orderDate.getMonth() + 1).toString().padStart(2, '0')}-${orderDate.getFullYear()}`}
                                </Text>
                                <Calendar color="#A1A1AA" size={20} />
                            </TouchableOpacity>
                        </View>

                        <FormInput label="الكمية" icon={Hash} value={quantity} onChangeText={setQuantity} placeholder="1" keyboardType="number-pad" required />
                        <FormInput label="سعر المنتج" icon={ShoppingBag} value={productPrice} onChangeText={setProductPrice} placeholder="0.00" keyboardType="numeric" required />
                    </>


                )}

                <View style={styles.imageContainer}>
                    <Image source={require('../../assets/images/Messenger-pana.png')} style={styles.image} />
                </View>
            </ScrollView>

            <View style={[styles.footerContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 }]}>
                <TouchableOpacity style={[styles.submitButton, isSending && styles.disabledButton]} onPress={handleSendRequest} disabled={isSending}>
                    {isSending ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>إرسال الطلب</Text>
                    )}
                </TouchableOpacity>
            </View>

            {isPickerVisible && (
                <DateTimePicker
                    value={orderDate}
                    mode={pickerMode}
                    is24Hour={true}
                    display="default"
                    onChange={onPickerChange}
                />
            )}


            <CustomAlert isVisible={alertConfig.isVisible} title={alertConfig.title} message={alertConfig.message} confirmText={alertConfig.confirmText} onConfirm={handleAlertConfirm} cancelText={null} success={alertConfig.success} onCancel={undefined} />

            <Modal visible={isStoreModalVisible} animationType="fade" transparent={true} onRequestClose={() => setStoreModalVisible(false)}><TouchableWithoutFeedback onPress={() => setStoreModalVisible(false)}><View style={styles.modalOverlay}><TouchableWithoutFeedback><SafeAreaView style={styles.modernModalContent}><Text style={styles.modalTitle}>اختيار المتجر</Text><View style={styles.modernModalSearchContainer}><Search color="#9CA3AF" size={20} style={styles.modalSearchIcon} /><TextInput style={styles.modernModalSearchInput} placeholder="ابحث عن متجر..." placeholderTextColor="#9CA3AF" value={storeSearchQuery} onChangeText={setStoreSearchQuery} /></View><FlatList data={displayedStores} keyExtractor={(item) => item.intEntityCode.toString()} renderItem={({ item }) => (<TouchableOpacity style={styles.modernModalItem} onPress={() => handleSelectStore(item)}><View style={styles.modalItemContent}><Text style={[styles.modernModalItemText, selectedStore?.intEntityCode === item.intEntityCode && styles.modalItemSelected]}>{item.strEntityName}</Text><Text style={styles.modalItemCode}>{item.strEntityCode}</Text></View>{selectedStore?.intEntityCode === item.intEntityCode && <Check color="#FF6B35" size={20} />}</TouchableOpacity>)} /></SafeAreaView></TouchableWithoutFeedback></View></TouchableWithoutFeedback></Modal>
        </View>
    );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    scrollContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
    footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#E4E4E7' },
    inputContainer: { marginBottom: 20 },
    label: { fontSize: 14, color: '#3F3F46', marginBottom: 8, textAlign: 'right', fontWeight: '500' },
    inputWrapper: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#D4D4D8', paddingHorizontal: 12, minHeight: 48 },
    input: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#18181B', textAlign: 'right' },
    placeholderText: { color: '#A1A1AA' },
    submitButton: { backgroundColor: '#F97316', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    disabledInput: { backgroundColor: '#F3F4F6', opacity: 0.7 },
    disabledButton: { backgroundColor: '#FDBA74' },
    requiredStar: { color: '#EF4444', fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
    modernModalContent: { backgroundColor: "#FFFFFF", borderRadius: 8, width: "100%", maxHeight: "70%", padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1F2937", textAlign: "right", marginBottom: 16 },
    modernModalSearchContainer: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, borderWidth: 1, borderColor: "#E5E7EB" },
    modalSearchIcon: { marginLeft: 8 },
    modernModalSearchInput: { flex: 1, color: "#1F2937", fontSize: 16, paddingVertical: Platform.OS === "ios" ? 12 : 8, textAlign: "right" },
    modernModalItem: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
    modalItemContent: { flex: 1 },
    modernModalItemText: { color: "#1F2937", fontSize: 16, fontWeight: "500", textAlign: "right", marginBottom: 2 },
    modalItemCode: { color: "#6B7280", fontSize: 12, textAlign: "right" },
    modalItemSelected: { color: "#FF6B35", fontWeight: "bold" },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',   // vertical centering
        alignItems: 'center',       // horizontal centering
        marginTop: 12,
    },

    image: {
        width: 200,
        height: 200,
    },
});

const skeletonStyles = StyleSheet.create({
    label: { width: '30%', height: 16, borderRadius: 4, marginBottom: 8, alignSelf: 'flex-end' },
    input: { width: '100%', height: 48, borderRadius: 8 },
    button: { width: '100%', height: 52, borderRadius: 12, marginTop: 16 },
});