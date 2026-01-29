import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    SafeAreaView,
    TouchableWithoutFeedback,
    TextInput,
    Platform,
    FlatList,
    RefreshControl,
    Image,
    ScrollView,
    Linking,
    Clipboard,
    LayoutAnimation,
    UIManager,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {
    Search,
    Package,
    Calendar,
    ChevronDown,
    Check,
    Store as StoreIcon,
    ChevronLeft,
    Edit,
    Trash2,
    User,
    Phone,
    MapPin,
    Hash,
    ShoppingBag,
    CreditCard,
    FileText,
    Box,
    Copy,
    X,
    AlignLeft,
} from "lucide-react-native";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import { WebView } from "react-native-webview";
import { useDashboard } from "../../Context/DashboardContext";
import CustomAlert from "../../components/CustomAlert";
import TopBar from "../../components/Entity/TopBarNew";

const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);
const COUNTRY_CODE = "+218";

// --- Enable LayoutAnimation on Android ---
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

// ... [Helper Functions & Interfaces remain same] ...
const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const formatDateTime = (isoString: string) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}`;
    } catch (e) { return isoString; }
};

const openDialer = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
};

interface EntityForFilter {
    intEntityCode: number;
    strEntityName: string;
    strEntityCode: string;
    strStatus: string;
}

interface Parcel {
    intParcelCode: number;
    ReferenceNo: string;
    CityName: string;
    StatusName: string;
    TypeName: string;
    RecipientName: string | null;
    RecipientPhone: string;
    Quantity: number;
    CreatedAt: string;
    Remarks: string;
    Total: number;
    strDriverRemarks: string;
    intSenderEntityCode: number;
    strSenderEntityName?: string; // Added optional prop for display
    dcFee: number;
    dcEntityFees: number;
    dcCompanyFees: number;
    intParcelTypeCode: number;
    strCityPriceName: string;
    strPaymentBy: string;
    strRecipientAddress: string;
    strDeliveryType: string;
    dcLength: number;
    dcWidth: number;
    dcHeight: number;
    intToCityCode: number;
    bolIsOnlinePayment?: boolean;
    strOnlinePaymentStatus?: string;
    strOnlinePaymentURL?: string;
    StrParcelCategory?: string;
}

interface CityPrice {
    intCityCode: number;
    strCityName: string;
    DcOfficePrice: number;
    DcInsideCityPrice: number;
    DcOutSkirtPrice: number;
}
interface ParcelType { Text: string; Value: string; }
interface DeliveryType { Text: string; Value: string; }
interface DeliveryStats {
    success: boolean;
    total: number;
    delivered: number;
    percent: number;
}

// ... [ParcelCard Component remains same] ...
const ParcelCard = ({
    item,
    onIconPress,
    onEdit,
    onDelete,
    onCopyLink
}: {
    item: Parcel,
    onIconPress: (parcel: Parcel) => void,
    onEdit: (parcel: Parcel) => void,
    onDelete: (parcel: Parcel) => void,
    onCopyLink: (url: string) => void
}) => {
    const isPaid = item.strOnlinePaymentStatus === "Success";

    return (
        <View style={styles.premiumCard}>
            <View style={[styles.premiumCardHeader, { backgroundColor: '#FF6B35' }]}>
                <View style={styles.premiumHeaderLeft}>
                    <TouchableOpacity onPress={() => onIconPress(item)}>
                        <View style={styles.premiumIconBackground}>
                            <Package size={18} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.premiumReferenceNo}>{item.ReferenceNo}</Text>
                        <View style={styles.premiumDateContainer}>
                            <Calendar size={12} color="#FFF" style={{ opacity: 0.8 }} />
                            <Text style={styles.premiumDateText}>{formatDateTime(item.CreatedAt)}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.premiumStatusBadge}>
                    <Text style={styles.premiumStatusText}>{item.CityName}</Text>
                </View>
            </View>

            <View style={styles.premiumCardBody}>
                <View style={styles.premiumSection}>
                    <Text style={styles.premiumSectionTitle}>معلومات المستلم</Text>
                    {item.RecipientName ? (
                        <View style={styles.premiumInfoRow}>
                            <Text style={styles.premiumInfoLabel}>الاسم:</Text>
                            <Text style={styles.premiumInfoValue}>{item.RecipientName}</Text>
                        </View>
                    ) : null}
                    <TouchableOpacity onPress={() => openDialer(item.RecipientPhone)} style={styles.premiumInfoRow}>
                        <Text style={styles.premiumInfoLabel}>الهاتف:</Text>
                        <Text style={[styles.premiumInfoValue, { color: '#FF6B35', fontWeight: 'bold', margin: 8 }]}>{item.RecipientPhone}</Text>
                        <Phone size={14} color="#FF6B35" />
                    </TouchableOpacity>
                </View>

                {item.StrParcelCategory ? (
                    <View style={styles.premiumSection}>
                        <Text style={styles.premiumSectionTitle}>تفاصيل المنتج</Text>
                        <View style={styles.premiumInfoRow}>
                            <Text style={styles.premiumInfoLabel}>الوصف:</Text>
                            <Text style={styles.premiumInfoValue}>{item.StrParcelCategory}</Text>
                        </View>
                    </View>
                ) : null}

                {item.bolIsOnlinePayment && (
                    <View style={styles.premiumSection}>
                        <Text style={styles.premiumSectionTitle}>الدفع الإلكتروني</Text>

                        {!isPaid && (
                            <TouchableOpacity
                                style={styles.paymentButton}
                                onPress={() => onCopyLink(item.strOnlinePaymentURL || "")}
                            >
                                <CreditCard size={14} color="#FFF" />
                                <Text style={styles.paymentButtonText}>الدفع الإلكتروني</Text>
                            </TouchableOpacity>
                        )}
                        <View style={[styles.paymentStatusBadge, isPaid ? styles.paidBadge : styles.unpaidBadge]}>
                            {isPaid ? <Check size={12} color="#065F46" /> : <X size={12} color="#991B1B" />}
                            <Text style={isPaid ? styles.paidBadgeText : styles.unpaidBadgeText}>
                                {isPaid ? "مدفوع" : "غير مدفوع"}
                            </Text>
                        </View>
                    </View>
                )}

                <View style={styles.premiumSection}>
                    <Text style={styles.premiumSectionTitle}>تفاصيل الطلب</Text>
                    <View style={styles.premiumInfoRow}>
                        <Text style={styles.premiumInfoLabel}>الكمية:</Text>
                        <Text style={styles.premiumInfoValue}>{item.Quantity}</Text>
                    </View>
                    <View style={styles.premiumInfoRow}>
                        <Text style={styles.premiumInfoLabel}>نوع الطرد:</Text>
                        <Text style={styles.premiumInfoValue}>{item.TypeName}</Text>
                    </View>
                </View>

                {(item.Remarks || item.strDriverRemarks) && (
                    <View style={styles.premiumSection}>
                        <Text style={styles.premiumSectionTitle}>الملاحظات</Text>
                        <View style={styles.premiumRemarksContainer}>
                            {item.Remarks && <Text style={styles.premiumRemarksText}>{item.Remarks}</Text>}
                            {item.strDriverRemarks && (
                                <Text style={[styles.premiumRemarksText, item.Remarks ? { marginTop: 8 } : {}]}>
                                    <Text style={{ fontWeight: 'bold' }}>المندوب:</Text> {item.strDriverRemarks}
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                <View style={styles.premiumCardFooter}>
                    <Text style={styles.premiumTotalLabel}>الإجمالي</Text>
                    <Text style={[styles.premiumTotalValue, { color: '#3498DB' }]}>{item.Total.toFixed(2)} د.ل</Text>
                </View>

                {!isPaid && (
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity style={styles.editButton} onPress={() => onEdit(item)}>
                            <Edit color="#27AE60" size={16} />
                            <Text style={styles.editButtonText}>تعديل</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item)}>
                            <Trash2 color="#E74C3C" size={16} />
                            <Text style={styles.deleteButtonText}>حذف</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

// ... [Input Components remain same] ...
const FormInput = ({ label, icon: Icon, value, onChangeText, keyboardType = "default", editable = true, rightComponent = null, required = false, onBlur = undefined }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.label}>
            {label}
            {required && <Text style={{ color: "#EF4444" }}> *</Text>}
        </Text>
        <View style={[styles.inputWrapper, !editable && styles.disabledInput]}>
            {rightComponent && <View style={styles.rightComponentWrapper}>{rightComponent}</View>}
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                editable={editable}
                placeholderTextColor="#A1A1AA"
                keyboardType={keyboardType as any}
                onBlur={onBlur} // Passed down
            />
            {Icon && <Icon color="#A1A1AA" size={20} style={styles.leftIcon} />}
        </View>
    </View>
);

const FormPicker = ({ label, icon: Icon, value, onPress, placeholder, required = false }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.label}>
            {label}
            {required && <Text style={{ color: "#EF4444" }}> *</Text>}
        </Text>
        <TouchableOpacity style={styles.inputWrapper} onPress={onPress}>
            <Text style={[styles.input, !value && { color: "#A1A1AA" }]}>{value || placeholder}</Text>
            {Icon && <ChevronDown color="#A1A1AA" size={20} />}
        </TouchableOpacity>
    </View>
);

const PriceOptionCard = ({ label, price, isSelected, onPress }) => (
    <TouchableOpacity style={[styles.priceOptionCard, isSelected && styles.priceOptionCardSelected]} onPress={onPress}>
        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
            {isSelected && <View style={styles.radioInnerCircle} />}
        </View>
        <Text style={styles.priceOptionLabel}>{label}</Text>
        <Text style={styles.priceOptionValue}>{price?.toFixed(2) ?? "0.00"}</Text>
    </TouchableOpacity>
);

const DimensionInput = ({ label, value, onChangeText, required = false }) => (
    <View style={styles.dimensionInputContainer}>
        <Text style={styles.dimensionLabel}>
            {label}
            {required && <Text style={{ color: "#EF4444" }}> *</Text>}
        </Text>
        <TextInput
            style={styles.dimensionInput}
            placeholder="0"
            value={value}
            onChangeText={onChangeText}
            keyboardType="numeric"
        />
    </View>
);

// --- EDIT PARCEL MODAL ---
const EditParcelModal = ({ visible, onClose, parcel, onUpdateSuccess, onError }) => {
    const [isLoading, setIsLoading] = useState(false);

    // Lists
    const [parcelTypes, setParcelTypes] = useState<ParcelType[]>([]);
    const [cityPrices, setCityPrices] = useState<CityPrice[]>([]);
    const [deliveryTypes, setDeliveryTypes] = useState<DeliveryType[]>([]);

    // Form Fields
    const [recipientName, setRecipientName] = useState("");
    const [recipientPhone, setRecipientPhone] = useState("");
    const [recipientStats, setRecipientStats] = useState<DeliveryStats | null>(null); // New Stats State

    const [recipientAddress, setRecipientAddress] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [productPrice, setProductPrice] = useState("");
    const [notes, setNotes] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("المستلم");
    const [productDescription, setProductDescription] = useState("");

    // Dimensions
    const [length, setLength] = useState("");
    const [width, setWidth] = useState("");
    const [height, setHeight] = useState("");

    // Selections
    const [selectedParcelType, setSelectedParcelType] = useState<ParcelType | null>(null);
    const [selectedDeliveryType, setSelectedDeliveryType] = useState<DeliveryType | null>(null);
    const [selectedCity, setSelectedCity] = useState<CityPrice | null>(null);
    const [shippingType, setShippingType] = useState<"office" | "inside" | "outskirts" | null>(null);
    const [shippingPrice, setShippingPrice] = useState(0);

    // Visibility
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [showCityModal, setShowCityModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);

    useEffect(() => {
        if (visible && parcel) {
            loadDropdownsAndPopulate();
        }
    }, [visible, parcel]);

    // --- API Logic: Fetch Stats ---
    const fetchDeliveryStats = async () => {
        // We use parcel.intSenderEntityCode because in Edit mode, the store is fixed
        if (!parcel?.intSenderEntityCode || !recipientPhone || recipientPhone.length < 7) {
            return;
        }

        try {
            const phoneClean = recipientPhone.replace(/\D/g, '').replace(/^0+/, '');
            const countryCodeClean = COUNTRY_CODE.replace('+', '');
            const fullPhone = `${countryCodeClean}${phoneClean}`;
            const entityId = parcel.intSenderEntityCode;

            const response = await axios.post(
                `http://tanmia-group.com:90/api/stats/recipient-delivery/${entityId}/${fullPhone}`,
                {}
            );

            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

            if (response.data?.success) {
                setRecipientStats(response.data);
            } else {
                setRecipientStats(null);
            }
        } catch (error) {
            console.log("Error fetching stats:", error);
            setRecipientStats(null);
        }
    };

    const displayedShippingPrice = useMemo(() => {
        let finalPrice = shippingPrice;
        if (selectedParcelType?.Text === "طرد كبير") {
            const l = parseFloat(length) || 0;
            const w = parseFloat(width) || 0;
            const h = parseFloat(height) || 0;
            if (l > 0 && w > 0 && h > 0) finalPrice += (l * w * h) / 4000;
        }
        return finalPrice;
    }, [shippingPrice, selectedParcelType, length, width, height]);

    const electronicPaymentSurcharge = useMemo(() => {
        if (paymentMethod === "الدفع الإلكتروني") {
            const baseTotal = (parseFloat(productPrice) || 0) + displayedShippingPrice;
            return baseTotal * 0.02; // 2% surcharge
        } else if (paymentMethod === "الدفع بالبطاقة") {
            const baseTotal = (parseFloat(productPrice) || 0) + displayedShippingPrice;
            return baseTotal * 0.015; // 1.5% surcharge
        }
        return 0;
    }, [paymentMethod, productPrice, displayedShippingPrice]);

    const totalAmount = useMemo(() => {
        return (parseFloat(productPrice) || 0) + displayedShippingPrice + electronicPaymentSurcharge;
    }, [productPrice, displayedShippingPrice, electronicPaymentSurcharge]);

    const loadDropdownsAndPopulate = async () => {
        setIsLoading(true);
        setRecipientStats(null); // Reset stats on load
        try {
            const userDataString = await AsyncStorage.getItem("user");
            const parsedUser = JSON.parse(userDataString || "{}");

            const [typesRes, citiesRes, deliveryRes] = await Promise.all([
                axios.get("http://tanmia-group.com:90/courierApi/parcels/GetParcelTypes"),
                axios.get(`http://tanmia-group.com:90/courierApi/City/GetCityPrices/${parsedUser?.intCityCode || 0}`),
                axios.get("http://tanmia-group.com:90/courierApi/parcels/GetDeliveryTypes")
            ]);

            const types = typesRes.data?.ParcelTypes || [];
            const cities = citiesRes.data || [];
            const delTypes = deliveryRes.data?.DeliveryTypes || [];

            setParcelTypes(types);
            setCityPrices(cities);
            setDeliveryTypes(delTypes);

            // Populate Form Fields
            setRecipientName(parcel.RecipientName || "");

            let phone = parcel.RecipientPhone || "";
            if (phone.startsWith(COUNTRY_CODE)) phone = phone.replace(COUNTRY_CODE, "");
            else if (phone.startsWith("218")) phone = phone.substring(3);
            setRecipientPhone(phone);

            // Trigger Stats Fetch right after setting phone (if available)
            // We use a small timeout to let state update, or call it directly with the value
            if (phone) {
                // Manually trigger stats for the initial phone
                const phoneClean = phone.replace(/\D/g, '').replace(/^0+/, '');
                const countryCodeClean = COUNTRY_CODE.replace('+', '');
                const fullPhone = `${countryCodeClean}${phoneClean}`;
                axios.post(
                    `http://tanmia-group.com:90/api/stats/recipient-delivery/${parcel.intSenderEntityCode}/${fullPhone}`,
                    {}
                ).then(res => {
                    if (res.data?.success) setRecipientStats(res.data);
                }).catch(err => console.log("Init stats err", err));
            }

            setRecipientAddress(parcel.strRecipientAddress || "");
            setQuantity(parcel.Quantity.toString());
            setProductPrice(parcel.dcEntityFees.toString());
            setNotes(parcel.Remarks || "");
            setPaymentMethod(parcel.strPaymentBy || "المستلم");
            setProductDescription(parcel.StrParcelCategory || "");

            setLength(parcel.dcLength?.toString() || "");
            setWidth(parcel.dcWidth?.toString() || "");
            setHeight(parcel.dcHeight?.toString() || "");

            // 1. Parcel Type
            const matchedType = types.find(t => t.Value.toString() === parcel.intParcelTypeCode.toString());
            setSelectedParcelType(matchedType || types.find(t => t.Text === parcel.TypeName) || null);

            // 2. City Matching
            let matchedCity = null;
            if (parcel.intToCityCode) {
                matchedCity = cities.find(c => c.intCityCode === parcel.intToCityCode);
            }
            if (!matchedCity && parcel.CityName) {
                const targetCityName = parcel.CityName.trim().toLowerCase();
                matchedCity = cities.find(c => c.strCityName?.trim().toLowerCase() === targetCityName);
            }
            setSelectedCity(matchedCity || null);

            // 3. Delivery Type
            if (parcel.strDeliveryType) {
                const matchedDelivery = delTypes.find(d => d.Value === parcel.strDeliveryType);
                if (matchedDelivery) setSelectedDeliveryType(matchedDelivery);
            }

            // 4. Shipping Price Calculation
            let calculatedVolumetric = 0;
            if (parcel.TypeName === "طرد كبير" || parcel.intParcelTypeCode === 3) {
                const l = parseFloat(parcel.dcLength?.toString() || "0");
                const w = parseFloat(parcel.dcWidth?.toString() || "0");
                const h = parseFloat(parcel.dcHeight?.toString() || "0");
                if (l > 0 && w > 0 && h > 0) {
                    calculatedVolumetric = (l * w * h) / 4000;
                }
            }

            const apiTotal = parcel.Total || 0;
            const apiProduct = parcel.dcEntityFees || 0;

            let localSurcharge = 0;
            if (parcel.strPaymentBy === "الدفع الإلكتروني") {
                const baseTotal = apiTotal / 1.02;
                localSurcharge = apiTotal - baseTotal;
            } else if (parcel.strPaymentBy === "الدفع بالبطاقة") {
                const baseTotal = apiTotal / 1.015;
                localSurcharge = apiTotal - baseTotal;
            }

            const derivedBaseShipping = apiTotal - apiProduct - calculatedVolumetric - localSurcharge;
            setShippingPrice(derivedBaseShipping);

            // 5. Determine Shipping Type Selection
            let determinedType: "office" | "inside" | "outskirts" = "inside";
            const rawPriceName = parcel.strCityPriceName || "";

            if (rawPriceName === "Office") {
                determinedType = "office";
            } else if (rawPriceName === "OutSkirt") {
                determinedType = "outskirts";
            } else if (rawPriceName === "InsideCity") {
                determinedType = "inside";
            } else if (matchedCity) {
                if (Math.abs(derivedBaseShipping - matchedCity.DcOfficePrice) < 5) determinedType = "office";
                else if (Math.abs(derivedBaseShipping - matchedCity.DcOutSkirtPrice) < 5) determinedType = "outskirts";
                else determinedType = "inside";
            }

            setShippingType(determinedType);

        } catch (error) {
            console.error("Error loading edit data", error);
            onError("فشل تحميل بيانات الطرد");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectShipping = (type: "office" | "inside" | "outskirts") => {
        setShippingType(type);
        if (!selectedCity) return;
        if (type === "office") setShippingPrice(selectedCity.DcOfficePrice);
        if (type === "inside") setShippingPrice(selectedCity.DcInsideCityPrice);
        if (type === "outskirts") setShippingPrice(selectedCity.DcOutSkirtPrice);
    };

    const handleUpdate = async () => {
        if (!recipientPhone.trim()) return onError("يرجى إدخال رقم هاتف المستلم.");
        if (!selectedParcelType) return onError("يرجى اختيار نوع الطرد.");

        if (selectedParcelType.Text === "طرد كبير") {
            if (!(parseFloat(length) > 0) || !(parseFloat(width) > 0) || !(parseFloat(height) > 0)) {
                return onError("للطرد الكبير، يجب أن تكون الأبعاد (الطول، العرض، الارتفاع) أكبر من صفر.");
            }
        }

        if (!selectedCity) return onError("يرجى اختيار مدينة.");
        if (!shippingType) return onError("يرجى اختيار سعر الشحن.");

        if ((parseFloat(productPrice) < 0) || !(parseInt(quantity, 10) >= 0)) {
            return onError("لا يمكن أن يكون السعر أو الكمية أقل من صفر.");
        }

        if (!paymentMethod) return onError("يرجى اختيار طريقة الدفع.");

        if (!selectedDeliveryType && parseInt(quantity, 10) > 1) {
            return onError("يرجى اختيار نوع التسليم.");
        }

        setIsLoading(true);
        const strCityPriceNameMap = { office: "Office", inside: "InsideCity", outskirts: "OutSkirt" };
        const fullRecipientPhone = recipientPhone.trim() ? (COUNTRY_CODE + recipientPhone) : "";
        const prodPrice = parseFloat(productPrice) || 0;
        const companyFees = displayedShippingPrice;

        const payload = {
            intParcelCode: parcel.intParcelCode,
            intSenderEntityCode: parcel.intSenderEntityCode,
            strRecipientName: recipientName,
            strRecipientPhone: fullRecipientPhone,
            strRecipientAddress: recipientAddress,
            intParcelTypeCode: selectedParcelType.Value,
            dcFee: totalAmount,
            dcDriverFees: 0,
            dcEntityFees: prodPrice,
            dcCompanyFees: companyFees,
            strPaymentBy: paymentMethod,
            intToCityCode: selectedCity.intCityCode,
            intQty: parseInt(quantity),
            strRemarks: notes,
            dcShippingCharge: shippingPrice,
            strCityPriceName: strCityPriceNameMap[shippingType],
            strDeliveryType: selectedDeliveryType?.Value || "",
            dcLength: parseFloat(length) || 0,
            dcWidth: parseFloat(width) || 0,
            dcHeight: parseFloat(height) || 0,
            StrParcelCategory: productDescription,
        };

        try {
            const response = await axios.post('http://tanmia-group.com:90/courierApi/parcels/updateparcel', payload);
            if (response.data && response.data.Success !== false) {
                onUpdateSuccess(response.data.Message || "تم تحديث الطرد بنجاح");
            } else {
                onError(response.data.Message || "فشل التحديث");
            }
        } catch (error) {
            console.error("Update Error: ", error.response?.data);
            onError("حدث خطأ أثناء التحديث");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={onClose} style={styles.modalBackButton}>
                        <ChevronLeft size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.modalHeaderTitle}>تعديل الطرد</Text>
                    <View style={{ width: 40 }} />
                </View>

                {isLoading && !selectedCity ? (
                    <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 50 }} />
                ) : (
                    <ScrollView contentContainerStyle={{ padding: 20 }}>

                        {/* Display Selected Store at Top */}
                        {/* <View style={styles.inputContainer}>
                            <Text style={styles.label}>المتجر</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
                                <Text style={[styles.input, { color: '#6B7280' }]}>
                                    {parcel?.strSenderEntityName || "Store ID: " + parcel?.intSenderEntityCode}
                                </Text>
                                <StoreIcon color="#9CA3AF" size={20} style={styles.leftIcon} />
                            </View>
                        </View> */}

                        <FormInput label="اسم المستلم" icon={User} value={recipientName} onChangeText={setRecipientName} />

                        <FormInput
                            label="هاتف المستلم"
                            icon={Phone}
                            value={recipientPhone}
                            onChangeText={setRecipientPhone}
                            keyboardType="phone-pad"
                            required
                            rightComponent={<Text style={styles.countryCodeText}>{COUNTRY_CODE}</Text>}
                            onBlur={fetchDeliveryStats} // Trigger stats on blur
                        />

                        {/* Delivery Stats Component */}
                        {recipientStats && (
                            <View style={styles.statsContainer}>
                                <View style={styles.statsRow}>
                                    <View style={styles.statsTextWrapper}>
                                        <Text style={styles.statsTitle}>نسبة التسليم لهذا الرقم</Text>
                                        <Text style={styles.statsSubtitle}>حسب سجل الشحنات السابقة</Text>
                                    </View>
                                    <View style={styles.percentBadge}>
                                        <Text style={styles.percentText}>{recipientStats.percent}%</Text>
                                    </View>
                                </View>

                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${recipientStats.percent}%` }]} />
                                </View>

                                <Text style={styles.statsFooter}>كلما زادت النسبة، زادت موثوقية التسليم لهذا الرقم.</Text>
                            </View>
                        )}

                        <FormInput label="العنوان" icon={MapPin} value={recipientAddress} onChangeText={setRecipientAddress} required={false} />

                        <FormInput
                            label="وصف المنتج"
                            icon={AlignLeft}
                            value={productDescription}
                            onChangeText={setProductDescription}
                            required={false}
                        />

                        <FormPicker
                            label="المدينة"
                            icon={Package}
                            value={selectedCity?.strCityName}
                            onPress={() => setShowCityModal(true)}
                            placeholder="اختر المدينة"
                            required
                        />

                        {selectedCity && (
                            <View style={{ marginBottom: 20 }}>
                                <Text style={styles.label}>
                                    سعر الشحن
                                    <Text style={{ color: "#EF4444" }}> *</Text>
                                </Text>
                                <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
                                    <PriceOptionCard label="مكتب" price={selectedCity.DcOfficePrice} isSelected={shippingType === "office"} onPress={() => handleSelectShipping("office")} />
                                    <PriceOptionCard label="مدينة" price={selectedCity.DcInsideCityPrice} isSelected={shippingType === "inside"} onPress={() => handleSelectShipping("inside")} />
                                    <PriceOptionCard label="ضواحي" price={selectedCity.DcOutSkirtPrice} isSelected={shippingType === "outskirts"} onPress={() => handleSelectShipping("outskirts")} />
                                </View>
                            </View>
                        )}

                        <FormPicker
                            label="نوع الطرد"
                            icon={Box}
                            value={selectedParcelType?.Text}
                            onPress={() => setShowTypeModal(true)}
                            placeholder="اختر النوع"
                            required
                        />

                        {selectedParcelType?.Text === "طرد كبير" && (
                            <View style={styles.dimensionsRow}>
                                <DimensionInput label="الارتفاع" value={height} onChangeText={setHeight} required />
                                <DimensionInput label="العرض" value={width} onChangeText={setWidth} required />
                                <DimensionInput label="الطول" value={length} onChangeText={setLength} required />
                            </View>
                        )}

                        <View style={{ flexDirection: 'row-reverse', gap: 15 }}>
                            <View style={{ flex: 1 }}>
                                <FormInput label="سعر المنتج" icon={ShoppingBag} value={productPrice} onChangeText={setProductPrice} keyboardType="numeric" required />
                            </View>
                            <View style={{ flex: 1 }}>
                                <FormInput label="الكمية" icon={Hash} value={quantity} onChangeText={setQuantity} keyboardType="numeric" required />
                            </View>
                        </View>

                        <FormPicker
                            label="طريقة الدفع"
                            icon={CreditCard}
                            value={paymentMethod}
                            onPress={() => setShowPaymentModal(true)}
                            placeholder="اختر"
                            required
                        />

                        {parseInt(quantity) > 1 && (
                            <FormPicker
                                label="نوع التسليم"
                                icon={Package}
                                value={selectedDeliveryType?.Text}
                                onPress={() => setShowDeliveryModal(true)}
                                placeholder="اختر نوع التسليم"
                                required
                            />
                        )}

                        <FormInput label="ملاحظات" icon={FileText} value={notes} onChangeText={setNotes} />

                        <View style={styles.detailsCard}>
                            <Text style={styles.cardTitle}>تفاصيل المبلغ</Text>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>سعر المنتج</Text>
                                <Text style={styles.priceValue}>{(parseFloat(productPrice) || 0).toFixed(2)} د.ل</Text>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>سعر الشحن</Text>
                                <Text style={styles.priceValue}>{displayedShippingPrice.toFixed(2)} د.ل</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.priceRow}>
                                <Text style={styles.totalLabel}>المبلغ الإجمالي</Text>
                                <Text style={styles.totalValue}>{totalAmount.toFixed(2)} د.ل</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
                            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>حفظ التغييرات</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                )}

                {/* ... [Modals: City, Type, Payment, Delivery remain same] ... */}
                <Modal visible={showCityModal} transparent animationType="fade" onRequestClose={() => setShowCityModal(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modernModalContent}>
                            <FlatList
                                data={cityPrices}
                                keyExtractor={item => item.intCityCode.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.modernModalItem} onPress={() => { setSelectedCity(item); setShippingType(null); setShippingPrice(0); setShowCityModal(false); }}>
                                        <Text style={styles.modernModalItemText}>{item.strCityName}</Text>
                                        {selectedCity?.intCityCode === item.intCityCode && <Check color="#FF6B35" size={20} />}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>

                <Modal visible={showTypeModal} transparent animationType="fade" onRequestClose={() => setShowTypeModal(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modernModalContent}>
                            <FlatList
                                data={parcelTypes}
                                keyExtractor={item => item.Value}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.modernModalItem} onPress={() => { setSelectedParcelType(item); setShowTypeModal(false); }}>
                                        <Text style={styles.modernModalItemText}>{item.Text}</Text>
                                        {selectedParcelType?.Value === item.Value && <Check color="#FF6B35" size={20} />}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>

                <Modal visible={showPaymentModal} transparent animationType="fade" onRequestClose={() => setShowPaymentModal(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modernModalContent}>
                            {["المرسل", "المستلم", "الدفع الإلكتروني", "الدفع بالبطاقة"].map(item => (
                                <TouchableOpacity key={item} style={styles.modernModalItem} onPress={() => { setPaymentMethod(item); setShowPaymentModal(false); }}>
                                    <Text style={styles.modernModalItemText}>{item}</Text>
                                    {paymentMethod === item && <Check color="#FF6B35" size={20} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </Modal>

                <Modal visible={showDeliveryModal} transparent animationType="fade" onRequestClose={() => setShowDeliveryModal(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modernModalContent}>
                            <FlatList
                                data={deliveryTypes}
                                keyExtractor={item => item.Value}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.modernModalItem} onPress={() => { setSelectedDeliveryType(item); setShowDeliveryModal(false); }}>
                                        <Text style={styles.modernModalItemText}>{item.Text}</Text>
                                        {selectedDeliveryType?.Value === item.Value && <Check color="#FF6B35" size={20} />}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </Modal>
    );
}

// ... [Main Screen and Styles remain same] ...
export default function PendingApprovalScreen() {
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [allParcels, setAllParcels] = useState<Parcel[]>([]);
    const { user, setUser } = useDashboard();

    const [entities, setEntities] = useState<EntityForFilter[]>([]);
    const [selectedEntity, setSelectedEntity] = useState<EntityForFilter | null>(null);
    const [entityModalVisible, setEntityModalVisible] = useState(false);
    const [modalSearchQuery, setModalSearchQuery] = useState("");
    const [parcelSearchQuery, setParcelSearchQuery] = useState("");

    // Alert State
    const [isAlertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSuccess, setAlertSuccess] = useState(false);
    const [alertConfirmAction, setAlertConfirmAction] = useState<(() => void) | undefined>(undefined);
    const [alertCancelAction, setAlertCancelAction] = useState<(() => void) | undefined>(undefined);

    // WebView State
    const [webViewVisible, setWebViewVisible] = useState(false);
    const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [parcelToEdit, setParcelToEdit] = useState<Parcel | null>(null);

    const [initialFetchDone, setInitialFetchDone] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const fetchFilterEntities = async () => {
                if (!user) return;
                try {
                    const dashboardDataString = await AsyncStorage.getItem("dashboard_data");
                    if (!dashboardDataString) throw new Error("لم يتم العثور على بيانات لوحة التحكم");
                    const dashboardData = JSON.parse(dashboardDataString);

                    const countKeys = Object.keys(dashboardData).filter(key => key.startsWith('Count'));
                    const sortedStatusIds = countKeys.map(key => parseInt(key.slice(5), 10)).filter(num => !isNaN(num)).sort((a, b) => a - b);
                    if (sortedStatusIds.length < 1) throw new Error("بيانات غير كافية لتحديد الحالة");
                    const statusIdForFilter = sortedStatusIds[0];

                    const response = await axios.get(`http://tanmia-group.com:90/courierApi/Entity/GetHistoryEntities/${user.userId}/${statusIdForFilter}`);
                    setEntities(response.data || []);
                } catch (error) {
                    console.error("Failed to fetch filter entities:", error);
                }
            };
            fetchFilterEntities();
        }, [user])
    );

    const handleSearch = useCallback(async () => {
        setLoading(true);
        setParcelSearchQuery("");
        setAllParcels([]);
        try {
            let parsedUser = user;
            if (!parsedUser) {
                const userDataString = await AsyncStorage.getItem("user");
                if (!userDataString) throw new Error("لم يتم العثور على المستخدم");
                parsedUser = JSON.parse(userDataString);
                setUser(parsedUser);
            }

            const dashboardDataString = await AsyncStorage.getItem("dashboard_data");
            if (!dashboardDataString) throw new Error("لم يتم العثور على بيانات لوحة التحكم");
            const dashboardData = JSON.parse(dashboardDataString);

            const countKeys = Object.keys(dashboardData).filter(key => key.startsWith('Count'));
            const sortedStatusIds = countKeys.map(key => parseInt(key.slice(5), 10)).filter(num => !isNaN(num)).sort((a, b) => a - b);
            if (sortedStatusIds.length < 1) throw new Error("بيانات لوحة التحكم غير كافية");

            const statusId = sortedStatusIds[0];
            const targetId = selectedEntity ? selectedEntity.intEntityCode : parsedUser.userId;

            const response = await axios.get(`http://tanmia-group.com:90/courierApi/parcels/details/${targetId}/${statusId}`);
            setAllParcels(response.data?.Parcels || []);
        } catch (error) {
            console.error("Failed to load pending parcels:", error);
            setAlertTitle("خطأ");
            setAlertMessage(error.message || "فشل تحميل الطرود قيد الانتظار.");
            setAlertVisible(true);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [user, setUser, selectedEntity]);

    useEffect(() => {
        if (user && !initialFetchDone) {
            handleSearch();
            setInitialFetchDone(true);
        }
    }, [user, handleSearch, initialFetchDone]);

    // --- ACTIONS ---
    const handleIconPress = (parcel: Parcel) => {
        setSelectedParcel(parcel);
        setWebViewVisible(true);
    };

    // --- ACTIONS ---
    const handleDeletePress = (parcel: Parcel) => {
        setAlertTitle("حذف الطرد");
        setAlertMessage(`هل أنت متأكد من حذف الطرد ${parcel.ReferenceNo}؟`);
        setAlertSuccess(false);
        // We set the confirm action here
        setAlertConfirmAction(() => () => confirmDelete(parcel.intParcelCode));
        setAlertCancelAction(() => () => setAlertVisible(false));
        setAlertVisible(true);
    };

    const confirmDelete = async (id: number) => {
        // 1. Close the confirmation dialog immediately
        setAlertVisible(false);
        setAlertConfirmAction(undefined);
        setAlertCancelAction(undefined);

        try {
            const response = await axios.post(`http://tanmia-group.com:90/courierApi/parcels/deleteparcel/${id}`);

            if (response.data && response.data.parcelID) {
                // 2. Animate the list update
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

                // 3. Update state (Using != instead of !== to handle potential string/number mismatches)
                setAllParcels((prev) => prev.filter((p) => p.intParcelCode != id));

                // 4. Show Success Alert after a brief delay so the user sees the item disappear first
                setTimeout(() => {
                    setAlertTitle("نجاح");
                    setAlertMessage(response.data.Message || "تم حذف الطرد بنجاح");
                    setAlertSuccess(true);
                    setAlertVisible(true);
                }, 400);
            } else {
                // Handle API error
                setTimeout(() => {
                    setAlertTitle("خطأ");
                    setAlertMessage(response.data?.Message || "فشل الحذف");
                    setAlertSuccess(false);
                    setAlertVisible(true);
                }, 400);
            }
        } catch (error) {
            // Handle Network error
            setTimeout(() => {
                setAlertTitle("خطأ");
                setAlertMessage("حدث خطأ أثناء الاتصال بالخادم");
                setAlertSuccess(false);
                setAlertVisible(true);
            }, 400);
        }
    };

    const handleEditPress = (parcel: Parcel) => {
        setParcelToEdit(parcel);
        setEditModalVisible(true);
    };

    const handleCopyLink = (url: string) => {
        if (!url) return;
        Clipboard.setString(url);
        setAlertTitle("نجاح");
        setAlertMessage("تم نسخ رابط الدفع بنجاح");
        setAlertSuccess(true);
        setAlertVisible(true);
    };

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        handleSearch();
    }, [handleSearch]);

    // --- FILTERS ---
    const filteredParcels = useMemo(() => {
        if (!parcelSearchQuery) return allParcels;
        return allParcels.filter(p =>
            p.ReferenceNo.toLowerCase().includes(parcelSearchQuery.toLowerCase()) ||
            p.RecipientPhone.includes(parcelSearchQuery) ||
            p.CityName.toLowerCase().includes(parcelSearchQuery.toLowerCase())
        );
    }, [allParcels, parcelSearchQuery]);

    const displayedEntities = useMemo(() => {
        if (!modalSearchQuery) return entities;
        return entities.filter(e => e.strEntityName.toLowerCase().includes(modalSearchQuery.toLowerCase()));
    }, [modalSearchQuery, entities]);

    const allStoresOption: EntityForFilter = { intEntityCode: 0, strEntityName: "كل المتاجر", strEntityCode: "All", strStatus: "" };

    return (
        <View style={styles.container}>
            <TopBar title="في انتظار التصديق" />

            <FlatList
                data={filteredParcels}
                extraData={allParcels}
                renderItem={({ item }) => (
                    <ParcelCard
                        item={item}
                        onIconPress={handleIconPress}
                        onEdit={handleEditPress}
                        onDelete={handleDeletePress}
                        onCopyLink={handleCopyLink}
                    />
                )}
                keyExtractor={(item) => item.intParcelCode.toString()}
                contentContainerStyle={styles.listContentContainer}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#FF6B35']} tintColor="#FF6B35" />}
                ListHeaderComponent={
                    <>
                        <View style={styles.modernFilterSection}>
                            <TouchableOpacity style={styles.modernDropdown} onPress={() => setEntityModalVisible(true)} activeOpacity={0.7}>
                                <View style={styles.modernDropdownContent}>
                                    <View style={styles.modernDropdownIcon}><StoreIcon color="#FF6B35" size={20} /></View>
                                    <View style={styles.modernDropdownText}>
                                        <Text style={styles.modernDropdownLabel}>المتجر المحدد</Text>
                                        <Text style={styles.modernDropdownValue}>{selectedEntity ? selectedEntity.strEntityName : "كل المتاجر"}</Text>
                                    </View>
                                    <ChevronDown color="#9CA3AF" size={20} />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modernSearchButton} onPress={handleSearch} disabled={loading && !isRefreshing} activeOpacity={0.8}>
                                {loading && !isRefreshing ? <ActivityIndicator color="#FFF" size="small" /> : (<><Search size={20} color="#FFF" /><Text style={styles.modernSearchButtonText}>بحث عن الطرود</Text></>)}
                            </TouchableOpacity>
                        </View>

                        {allParcels.length > 0 && !loading && (
                            <View style={styles.resultsHeader}>
                                <Text style={styles.sectionTitle}>الطرود قيد الانتظار ({filteredParcels.length})</Text>
                                <View style={styles.parcelSearchContainer}>
                                    <Search color="#9CA3AF" size={20} style={styles.modalSearchIcon} />
                                    <TextInput style={styles.modernModalSearchInput} placeholder="ابحث في النتائج..." placeholderTextColor="#9CA3AF" value={parcelSearchQuery} onChangeText={setParcelSearchQuery} />
                                </View>
                            </View>
                        )}
                    </>
                }
                ListEmptyComponent={
                    loading ? <View style={{ paddingHorizontal: 12, marginTop: 20 }}>
                        <ShimmerPlaceHolder style={styles.cardSkeleton} shimmerColors={["#FDF1EC", "#FEF8F5", "#FDF1EC"]} />
                    </View> : (
                        <View style={styles.emptyContainer}>
                            <Image source={require("../../assets/images/empty-reports.png")} style={styles.emptyImage} />
                            <Text style={styles.emptyText}>{allParcels.length === 0 ? "لا توجد طرود قيد الانتظار لعرضها" : ""}</Text>
                        </View>
                    )
                }
            />

            {/* Modals */}
            <Modal visible={entityModalVisible} animationType="fade" transparent={true} onRequestClose={() => setEntityModalVisible(false)}>
                <TouchableWithoutFeedback onPress={() => setEntityModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <SafeAreaView style={styles.modernModalContent}>
                                <Text style={styles.modalTitle}>اختيار المتجر</Text>
                                <View style={styles.modernModalSearchContainer}>
                                    <Search color="#9CA3AF" size={20} style={styles.modalSearchIcon} />
                                    <TextInput style={styles.modernModalSearchInput} placeholder="ابحث عن متجر..." placeholderTextColor="#9CA3AF" value={modalSearchQuery} onChangeText={setModalSearchQuery} />
                                </View>
                                <FlatList
                                    data={[allStoresOption, ...displayedEntities]}
                                    keyExtractor={(item) => item.intEntityCode.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={styles.modernModalItem} onPress={() => { setSelectedEntity(item.intEntityCode === 0 ? null : item); setEntityModalVisible(false); setModalSearchQuery(""); }}>
                                            <View style={styles.modalItemContent}>
                                                <Text style={[styles.modernModalItemText, (selectedEntity?.intEntityCode === item.intEntityCode || (!selectedEntity && item.intEntityCode === 0)) && styles.modalItemSelected]}>{item.strEntityName}</Text>
                                            </View>
                                            {(selectedEntity?.intEntityCode === item.intEntityCode || (!selectedEntity && item.intEntityCode === 0)) && (<Check color="#FF6B35" size={20} />)}
                                        </TouchableOpacity>
                                    )}
                                />
                            </SafeAreaView>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <Modal visible={webViewVisible} animationType="slide" onRequestClose={() => setWebViewVisible(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setWebViewVisible(false)} style={styles.modalBackButton}><ChevronLeft size={24} color="#1F2937" /></TouchableOpacity>
                        <Text style={styles.modalHeaderTitle}>{selectedParcel ? `تتبع: ${selectedParcel.ReferenceNo}` : 'تتبع الشحنة'}</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    {selectedParcel && (
                        <WebView
                            source={{ uri: `http://tanmia-group.com:90/admin/tracking/Index?trackingNumber=${selectedParcel.ReferenceNo}` }}
                            style={{ flex: 1 }}
                            startInLoadingState={true}
                        />
                    )}
                </SafeAreaView>
            </Modal>

            {/* EDIT PARCEL MODAL COMPONENT */}
            <EditParcelModal
                visible={editModalVisible}
                parcel={parcelToEdit}
                onClose={() => setEditModalVisible(false)}
                onUpdateSuccess={(msg) => {
                    setEditModalVisible(false);
                    setAlertTitle("نجاح");
                    setAlertMessage(msg);
                    setAlertSuccess(true);
                    setAlertVisible(true);
                    handleSearch(); // Refresh list
                }}
                onError={(msg) => {
                    setAlertTitle("خطأ");
                    setAlertMessage(msg);
                    setAlertSuccess(false);
                    setAlertVisible(true);
                }}
            />

            <CustomAlert
                isVisible={isAlertVisible}
                title={alertTitle}
                message={alertMessage}
                confirmText={alertConfirmAction ? "نعم" : "حسنًا"}
                cancelText={alertConfirmAction ? "إلغاء" : undefined}
                onConfirm={() => {
                    if (alertConfirmAction) alertConfirmAction();
                    else setAlertVisible(false);
                }}
                onCancel={alertCancelAction}
                success={alertSuccess}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8F9FA" },
    listContentContainer: { paddingHorizontal: 12, paddingBottom: 120 },
    modernFilterSection: { backgroundColor: "#FFFFFF", borderRadius: 8, padding: 20, marginVertical: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
    modernDropdown: { marginBottom: 16 },
    modernDropdownContent: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 8, padding: 16, borderWidth: 1, borderColor: "#E5E7EB" },
    modernDropdownIcon: { width: 40, height: 40, backgroundColor: hexToRgba("#FF6B35", 0.1), borderRadius: 8, justifyContent: "center", alignItems: "center", marginLeft: 12 },
    modernDropdownText: { flex: 1 },
    modernDropdownLabel: { color: "#6B7280", fontSize: 12, textAlign: "right", marginBottom: 2 },
    modernDropdownValue: { color: "#1F2937", fontSize: 16, fontWeight: "600", textAlign: "right" },
    modernSearchButton: { backgroundColor: "#FF6B35", borderRadius: 8, padding: 16, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8 },
    modernSearchButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
    resultsHeader: { marginBottom: 10, marginTop: 12 },
    sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937", marginBottom: 16, textAlign: "right" },
    parcelSearchContainer: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "#E5E7EB" },

    // Card Styles
    premiumCard: { backgroundColor: "#FFFFFF", borderRadius: 12, marginBottom: 12, overflow: "hidden", borderWidth: 1, borderColor: '#E5E7EB' },
    premiumCardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 16, },
    premiumHeaderLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, },
    premiumIconBackground: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
    premiumReferenceNo: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    premiumDateContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 4 },
    premiumDateText: { color: '#FFFFFF', fontSize: 12, opacity: 0.9 },
    premiumStatusBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    premiumStatusText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
    premiumCardBody: { padding: 16, gap: 12 },
    premiumSection: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', },
    premiumSectionTitle: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', textAlign: 'right', marginBottom: 8 },
    premiumInfoRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    premiumInfoLabel: { color: '#6B7280', fontSize: 14 },
    premiumInfoValue: { color: '#1F2937', fontSize: 14, fontWeight: '500', flex: 1, textAlign: 'left' },
    premiumRemarksContainer: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12 },
    premiumRemarksText: { color: '#4B5563', fontSize: 14, textAlign: 'right', lineHeight: 20 },
    premiumCardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginTop: -1, },
    premiumTotalLabel: { color: '#1F2937', fontSize: 16, fontWeight: '600' },
    premiumTotalValue: { fontSize: 20, fontWeight: 'bold' },

    // Action Buttons
    actionButtonsContainer: { flexDirection: 'row-reverse', gap: 10, marginTop: 15, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 15 },
    editButton: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: hexToRgba('#27AE60', 0.1), padding: 12, borderRadius: 8, gap: 6 },
    editButtonText: { color: '#27AE60', fontWeight: '600' },
    deleteButton: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: hexToRgba('#E74C3C', 0.1), padding: 12, borderRadius: 8, gap: 6 },
    deleteButtonText: { color: '#E74C3C', fontWeight: '600' },

    // Empty State & Skeletons
    emptyContainer: { backgroundColor: "#FFFFFF", borderRadius: 8, paddingVertical: 40, paddingHorizontal: 20, alignItems: "center", marginTop: 20 },
    emptyImage: { width: 200, height: 120, marginBottom: 16, opacity: 0.7 },
    emptyText: { color: "#374151", fontSize: 18, fontWeight: "600", marginBottom: 4 },
    cardSkeleton: { height: 300, width: "100%", borderRadius: 12, marginBottom: 12 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
    modernModalContent: { backgroundColor: "#FFFFFF", borderRadius: 8, width: "100%", maxHeight: "70%", padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1F2937", textAlign: "right", marginBottom: 16, marginHorizontal: 20, },
    modernModalSearchContainer: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, borderWidth: 1, borderColor: "#E5E7EB", marginHorizontal: 20, },
    modalSearchIcon: { marginLeft: 8 },
    modernModalSearchInput: { flex: 1, color: "#1F2937", fontSize: 16, paddingVertical: Platform.OS === "ios" ? 12 : 8, textAlign: "right" },
    modernModalItem: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", marginHorizontal: 20, },
    modalItemContent: { flex: 1 },
    modernModalItemText: { color: "#1F2937", fontSize: 16, fontWeight: "500", textAlign: "right", marginBottom: 2 },
    modalItemSelected: { color: "#FF6B35", fontWeight: "bold" },
    modalHeader: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFFFFF', },
    modalBackButton: { padding: 10 },
    modalHeaderTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', textAlign: 'center', flex: 1, marginHorizontal: 10 },

    // Form Styles
    inputContainer: { marginBottom: 16 },
    label: { fontSize: 14, color: "#3F3F46", marginBottom: 8, textAlign: "right", fontWeight: "500" },
    inputWrapper: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 8, borderWidth: 1, borderColor: "#D4D4D8", paddingHorizontal: 12, height: 48 },
    input: { flex: 1, fontSize: 16, color: "#18181B", textAlign: "right" },
    leftIcon: { marginRight: 8 },
    disabledInput: { backgroundColor: "#F3F4F6" },
    saveButton: { backgroundColor: "#FF6B35", borderRadius: 8, padding: 16, alignItems: "center", marginTop: 20, marginBottom: 40 },
    saveButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
    priceOptionCard: { flex: 1, borderWidth: 1, borderColor: "#D4D4D8", borderRadius: 8, padding: 10, alignItems: "center", backgroundColor: "#FFFFFF" },
    priceOptionCardSelected: { borderColor: "#F97316", backgroundColor: "#FFF7ED" },
    radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#D4D4D8", justifyContent: "center", alignItems: "center", marginBottom: 6 },
    radioCircleSelected: { borderColor: "#F97316" },
    radioInnerCircle: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#F97316" },
    priceOptionLabel: { fontSize: 12, color: "#3F3F46", marginBottom: 2 },
    priceOptionValue: { fontSize: 14, color: "#10B981", fontWeight: "bold" },
    countryCodeText: { color: "#A1A1AA", fontSize: 16, marginLeft: 8, fontWeight: "500" },
    rightComponentWrapper: { marginLeft: 8, justifyContent: "center", alignItems: "center" },

    // Details Card
    detailsCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 15, borderWidth: 1, borderColor: "#E4E4E7", marginBottom: 20 },
    cardTitle: { fontSize: 16, fontWeight: "bold", color: "#27272A", textAlign: "right", marginBottom: 12 },
    priceRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    priceLabel: { fontSize: 14, color: "#71717A" },
    priceValue: { fontSize: 14, color: "#3F3F46", fontWeight: "500" },
    divider: { height: 1, backgroundColor: "#E4E4E7", marginVertical: 8 },
    totalLabel: { fontSize: 16, color: "#18181B", fontWeight: "bold" },
    totalValue: { fontSize: 16, color: "#F97316", fontWeight: "bold" },

    // Dimensions
    dimensionsRow: { flexDirection: "row-reverse", gap: 12, marginBottom: 20 },
    dimensionInputContainer: { flex: 1, position: "relative" },
    dimensionInput: { backgroundColor: "#FFFFFF", borderRadius: 8, borderWidth: 1, borderColor: "#D4D4D8", paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: "#18181B", textAlign: "center" },
    dimensionLabel: { position: "absolute", top: -10, alignSelf: "center", backgroundColor: "#F8F9FA", paddingHorizontal: 4, fontSize: 12, color: "#3F3F46", zIndex: 1 },

    // Added Payment Styles
    paymentButton: { backgroundColor: "#3498DB", borderRadius: 8, padding: 12, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8, },
    paymentButtonText: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
    paymentStatusBadge: { alignSelf: "flex-end", flexDirection: "row-reverse", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, },
    paidBadge: { backgroundColor: "#D1FAE5" },
    unpaidBadge: { backgroundColor: "#FEE2E2" },
    paidBadgeText: { color: "#065F46", fontSize: 12, fontWeight: "bold" },
    unpaidBadgeText: { color: "#991B1B", fontSize: 12, fontWeight: "bold" },

    // --- New Stats Styles (Copied from previous task) ---
    statsContainer: {
        backgroundColor: "#E0F2FE", // Light blue bg
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#BAE6FD",
    },
    statsRow: {
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    statsTextWrapper: {
        flex: 1,
    },
    statsTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#0369A1", // Dark blue
        textAlign: "right",
        marginBottom: 4,
    },
    statsSubtitle: {
        fontSize: 13,
        color: "#0284C7",
        textAlign: "right",
    },
    percentBadge: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        minWidth: 70,
    },
    percentText: {
        color: "#059669", // Green
        fontWeight: "bold",
        fontSize: 18,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: "#DBEAFE",
        borderRadius: 4,
        width: "100%",
        overflow: "hidden",
        flexDirection: "row-reverse",
        marginBottom: 8,
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#0EA5E9", // Blue fill
        borderRadius: 4,
    },
    statsFooter: {
        fontSize: 12,
        color: "#52525B",
        textAlign: "right",
    },
});