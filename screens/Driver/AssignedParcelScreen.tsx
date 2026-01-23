import React, {
    useState,
    useCallback,
    useMemo,
    useEffect,
    memo // Import memo
} from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    Platform,
    FlatList,
    RefreshControl,
    Image,
    Dimensions,
    Modal,
    Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {
    Search,
    Phone,
    FileText,
    Package,
    Box,
    MessageSquare,
    CheckCircle2,
    XCircle,
    User,
    Calendar,
    X,
    QrCode,
    Banknote,
    Hash,
    Check
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import { useDashboard } from "../../Context/DashboardContext";
import CustomAlert from "../../components/CustomAlert";
import { useFocusEffect } from "@react-navigation/native";

const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);
const { width } = Dimensions.get("window");

const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const MaterialTopBar = ({ title }) => {
    const insets = useSafeAreaInsets();
    return (
        <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
            <Text style={styles.topBarTitle}>{title}</Text>
        </View>
    );
};

const ParcelsSkeleton = () => {
    const shimmerColors = ["#FDF1EC", "#FEF8F5", "#FDF1EC"];
    return (
        <View style={{ paddingHorizontal: 12 }}>
            <ShimmerPlaceHolder style={styles.searchSkeleton} shimmerColors={shimmerColors} />
            <ShimmerPlaceHolder style={styles.cardSkeleton} shimmerColors={shimmerColors} />
            <ShimmerPlaceHolder style={styles.cardSkeleton} shimmerColors={shimmerColors} />
        </View>
    );
};

interface Parcel {
    intParcelCode: number;
    dcFee: number;
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
    strEntityName: string;
    strEntityPhone: string;
    bolIsOnlinePayment?: boolean;
    strOnlinePaymentStatus?: string;
    strOnlinePaymentQR?: string;
    bolIsMultiple?: boolean;
}

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
    } catch (e) {
        return isoString;
    }
};

// --- MEMOIZED PARCEL CARD COMPONENT ---
const ParcelCard = memo(({
    item,
    onReturn,
    onRemarks,
    onComplete,
    onPhoneCall,
    onOpenQR
}: {
    item: Parcel,
    onReturn: (item: Parcel) => void,
    onRemarks: (item: Parcel) => void,
    onComplete: (item: Parcel) => void,
    onPhoneCall: (phone: string) => void,
    onOpenQR: (qr: string) => void
}) => {
    const isPaid = item.strOnlinePaymentStatus === "Success";

    // UPDATED LOGIC: 
    // 1. Show QR if online payment is enabled AND not paid AND QR exists.
    const showQRButton = item.bolIsOnlinePayment && !isPaid && item.strOnlinePaymentQR;

    // 2. Hide Complete Button if bolIsOnlinePayment is true (regardless of status, per requirement)
    const showCompleteButton = !item.bolIsOnlinePayment;

    return (
        <View style={styles.modernTransactionItem}>
            <View style={styles.transactionHeader}>
                <View style={styles.parcelHeaderContent}>
                    <View style={styles.parcelIconBackground}>
                        <Package color="#fff" size={20} />
                    </View>
                    <View style={styles.parcelNameContainer}>
                        <Text style={styles.transactionDate}>
                            {item.ReferenceNo}
                        </Text>
                        <Text style={styles.runningTotalLabel}>{item.CityName}</Text>
                    </View>
                </View>
                <Text style={styles.parcelTotal}>
                    {item.Total.toFixed(2)} د.ل
                </Text>
            </View>

            {/* Online Payment Logic - Show QR Button */}
            {showQRButton && (
                <View style={styles.qrSectionContainer}>
                    <TouchableOpacity
                        style={styles.qrButton}
                        onPress={() => onOpenQR(item.strOnlinePaymentQR || "")}
                    >
                        <QrCode size={18} color="#FFF" />
                        <Text style={styles.qrButtonText}>عرض رمز QR</Text>
                    </TouchableOpacity>
                </View>
            )}
            {showQRButton && (
                <View style={[styles.paymentStatusBadge, isPaid ? styles.paidBadge : styles.unpaidBadge]}>
                    {isPaid ? <Check size={12} color="#065F46" /> : <X size={12} color="#9c5454" />}
                    <Text style={isPaid ? styles.paidBadgeText : styles.unpaidBadgeText}>
                        {isPaid ? "مدفوع" : "غير مدفوع"}
                    </Text>
                </View>
            )}
            <View style={[styles.parcelNameContainer, { marginTop: 12, marginBottom: 12 }]}>
                {item.strEntityName && (
                    <View style={styles.parcelInfoRow}>
                        <Text style={styles.dateFooterText}>اسم المتجر :</Text>
                        <Text style={styles.parcelInfoText}>{item.strEntityName}</Text>
                    </View>
                )}
                {item.strEntityPhone && (
                    <TouchableOpacity onPress={() => onPhoneCall(item.strEntityPhone)}>
                        <View style={styles.parcelInfoRow}>
                            <Phone size={14} color="#6B7280" />
                            <Text style={styles.dateFooterText}>رقم المتجر :</Text>
                            <Text style={[styles.parcelInfoText, { color: '#FF6B35', fontWeight: 'bold' }]}>
                                {item.strEntityPhone}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.parcelDetailsRow}>
                <View style={styles.parcelColumn}>
                    {item.RecipientName && (
                        <View style={styles.parcelInfoRow}>
                            <User size={14} color="#6B7280" />
                            <Text style={styles.parcelInfoText}>{item.RecipientName}</Text>
                        </View>
                    )}
                    <TouchableOpacity onPress={() => onPhoneCall(item.RecipientPhone)}>
                        <View style={styles.parcelInfoRow}>
                            <Phone size={14} color="#6B7280" />
                            <Text style={[styles.parcelInfoText, { color: '#FF6B35', fontWeight: 'bold' }]}>
                                {item.RecipientPhone}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.parcelInfoRow}>
                        <Box size={14} color="#6B7280" />
                        <Text style={styles.parcelInfoText}>الكمية: {item.Quantity}</Text>
                    </View>
                </View>

                <View style={styles.parcelColumn}>
                    <View style={styles.parcelInfoRow}>
                        <FileText size={14} color="#6B7280" />
                        <Text style={styles.parcelInfoText}>
                            {item.Remarks || 'لا توجد ملاحظات'}
                        </Text>
                    </View>
                    {item.strDriverRemarks && (
                        <Text style={styles.transactionRemarks}>
                            ملاحظات المندوب: {item.strDriverRemarks}
                        </Text>
                    )}
                </View>
            </View>

            <View style={styles.transactionFooter}>
                <TouchableOpacity
                    style={styles.actionButtonReturn}
                    onPress={() => onReturn(item)}
                >
                    <XCircle color="#E74C3C" size={16} />
                    <Text style={styles.actionButtonTextReturn}>إرجاع</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButtonRemarks}
                    onPress={() => onRemarks(item)}
                >
                    <MessageSquare color="#3498DB" size={16} />
                    <Text style={styles.actionButtonTextRemarks}>ملاحظات</Text>
                </TouchableOpacity>

                {/* Hide Complete button if Online Payment is true */}
                {showCompleteButton && (
                    <TouchableOpacity
                        style={styles.actionButtonComplete}
                        onPress={() => onComplete(item)}
                    >
                        <CheckCircle2 color="#27AE60" size={16} />
                        <Text style={styles.actionButtonTextComplete}>اكتمل</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.dateFooter}>
                <Calendar size={12} color="#9CA3AF" />
                <Text style={styles.dateFooterText}>{formatDateTime(item.CreatedAt)}</Text>
            </View>
        </View>
    );
}, (prevProps, nextProps) => {
    return prevProps.item === nextProps.item;
});

export default function AssignedParcelScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [allParcels, setAllParcels] = useState<Parcel[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const { user, setUser } = useDashboard();
    const [statusId, setStatusId] = useState<number | null>(null);

    // Modal states
    const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showRemarksModal, setShowRemarksModal] = useState(false);
    const [showCustomRemarkInput, setShowCustomRemarkInput] = useState(false);
    const [customRemark, setCustomRemark] = useState("");
    const [selectedRemarkOption, setSelectedRemarkOption] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // QR Modal State
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedQRImage, setSelectedQRImage] = useState<string | null>(null);

    // Multiple Complete Modal State
    const [showMultipleCompleteModal, setShowMultipleCompleteModal] = useState(false);
    const [deliveryQty, setDeliveryQty] = useState("");
    const [deliveryAmount, setDeliveryAmount] = useState("");

    // Alert states
    const [isAlertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSuccess, setAlertSuccess] = useState(false);

    const { setCurrentRoute } = useDashboard();

    const handlePhoneCall = useCallback((phoneNumber: string) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber}`);
        }
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            setCurrentRoute('ParcelsTab');
        }, [setCurrentRoute])
    );

    const loadData = useCallback(async () => {
        setIsRefreshing(false);
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
            if (countKeys.length === 0) {
                throw new Error("لم يتم العثور على أي بيانات 'Count' في لوحة التحكم");
            }
            const sortedStatusIds = countKeys
                .map(key => parseInt(key.slice(5), 10))
                .filter(num => !isNaN(num))
                .sort((a, b) => a - b);
            if (sortedStatusIds.length === 0) {
                throw new Error("لم يتم العثور على معرفات حالة صالحة");
            }
            const currentStatusId = sortedStatusIds[0];
            setStatusId(currentStatusId);

            const response = await axios.get(
                `https://tanmia-group.com:86/courierApi/Driverparcels/details/${parsedUser.userId}/${currentStatusId}`
            );

            if (response.data && response.data.Parcels) {
                setAllParcels(response.data.Parcels);
            } else {
                setAllParcels([]);
            }
        } catch (error) {
            console.error("Failed to load assigned parcels:", error);
            setAlertTitle("خطأ");
            setAlertMessage(error.message || "فشل في تحميل الطرود المعينة.");
            setAlertSuccess(false);
            setAlertVisible(true);
            setAllParcels([]);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user, setUser]);

    useEffect(() => {
        setIsLoading(true);
        loadData();
    }, [loadData]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadData();
    }, [loadData]);

    // --- API Handlers ---

    const handleCompleteParcel = useCallback(async () => {
        if (!selectedParcel || !statusId) return;

        setIsProcessing(true);
        try {
            await axios.post(
                `https://tanmia-group.com:86/courierApi/Parcel/Driver/UpdateStatus/${selectedParcel.intParcelCode}/${statusId}`
            );

            // Update List Immediately
            setAllParcels((prev) => prev.filter(p => p.intParcelCode !== selectedParcel.intParcelCode));

            setAlertTitle("نجاح");
            setAlertMessage("تم تحديث حالة الطرد بنجاح");
            setAlertSuccess(true);
            setAlertVisible(true);
            setShowCompleteModal(false);

            // Refresh from server
            loadData();
        } catch (error) {
            setAlertTitle("خطأ");
            setAlertMessage("فشل في تحديث حالة الطرد");
            setAlertSuccess(false);
            setAlertVisible(true);
        } finally {
            setIsProcessing(false);
        }
    }, [selectedParcel, statusId, loadData]);

    const handleCompleteParcelMultiple = useCallback(async () => {
        if (!selectedParcel) return;

        if (!deliveryQty || !deliveryAmount) {
            setAlertTitle("حقول مطلوبة");
            setAlertMessage("يرجى إدخال الكمية والمبلغ");
            setAlertSuccess(false);
            setAlertVisible(true);
            return;
        }

        // --- VALIDATION: Check Qty Logic ---
        const qty = parseFloat(deliveryQty);
        const amount = parseFloat(deliveryAmount);

        if (isNaN(qty) || qty < 0) {
            setAlertTitle("خطأ في الإدخال");
            setAlertMessage("لا يمكن أن تكون الكمية أقل من صفر");
            setAlertSuccess(false);
            setAlertVisible(true);
            return;
        }

        if (qty > selectedParcel.Quantity) {
            setAlertTitle("خطأ في الإدخال");
            setAlertMessage(`الكمية المدخلة (${qty}) أكبر من الكمية الأصلية (${selectedParcel.Quantity})`);
            setAlertSuccess(false);
            setAlertVisible(true);
            return;
        }

        if (isNaN(amount) || amount < 0) {
            setAlertTitle("خطأ في الإدخال");
            setAlertMessage("لا يمكن أن يكون المبلغ أقل من صفر");
            setAlertSuccess(false);
            setAlertVisible(true);
            return;
        }
        // -----------------------------------

        setIsProcessing(true);
        try {
            await axios.post(
                `https://tanmia-group.com:86/courierApi/Parcel/Driver/UpdateStatusMultiple/${selectedParcel.intParcelCode}/${deliveryQty}/${deliveryAmount}`
            );

            // Update List Immediately
            setAllParcels((prev) => prev.filter(p => p.intParcelCode !== selectedParcel.intParcelCode));

            setAlertTitle("نجاح");
            setAlertMessage("تم تأكيد التسليم الجزئي بنجاح");
            setAlertSuccess(true);
            setAlertVisible(true);
            setShowMultipleCompleteModal(false);

            // Refresh from server
            loadData();
        } catch (error) {
            console.error(error);
            setAlertTitle("خطأ");
            setAlertMessage("فشل في تحديث حالة الطرد");
            setAlertSuccess(false);
            setAlertVisible(true);
        } finally {
            setIsProcessing(false);
        }
    }, [selectedParcel, deliveryQty, deliveryAmount, loadData]);

    const handleReturnParcel = useCallback(async () => {
        if (!selectedParcel) return;

        setIsProcessing(true);
        try {
            await axios.post(
                `https://tanmia-group.com:86/courierApi/Parcel/Driver/ReturnOnTheWay/${selectedParcel.intParcelCode}`
            );

            setAllParcels((prev) => prev.filter(p => p.intParcelCode !== selectedParcel.intParcelCode));

            setAlertTitle("نجاح");
            setAlertMessage("تم إرجاع الطرد بنجاح");
            setAlertSuccess(true);
            setAlertVisible(true);
            setShowReturnModal(false);
            loadData();
        } catch (error) {
            setAlertTitle("خطأ");
            setAlertMessage("فشل في إرجاع الطرد");
            setAlertSuccess(false);
            setAlertVisible(true);
        } finally {
            setIsProcessing(false);
        }
    }, [selectedParcel, loadData]);

    const handleAddRemarks = async (remark: string) => {
        const trimmedRemark = remark.trim();
        if (!selectedParcel || !trimmedRemark) return;

        setIsProcessing(true);
        try {
            await axios.post(
                `https://tanmia-group.com:86/courierApi/Parcel/Driver/AddRemarks`,
                {
                    parcelID: selectedParcel.intParcelCode,
                    strRemarks: trimmedRemark
                }
            );

            setAlertTitle("نجاح");
            setAlertMessage("تم إضافة الملاحظات بنجاح");
            setAlertSuccess(true);
            setAlertVisible(true);
            setShowRemarksModal(false);
            setShowCustomRemarkInput(false);
            setCustomRemark("");
            setSelectedRemarkOption("");
            loadData();
        } catch (error) {
            setAlertTitle("خطأ");
            setAlertMessage("فشل في إضافة الملاحظات");
            setAlertSuccess(false);
            setAlertVisible(true);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemarkOptionSelect = (option: string) => {
        setSelectedRemarkOption(option);
        if (option === "العميل لا يرد على الهاتف") {
            handleAddRemarks(option);
        } else if (option === "الاخرون") {
            setShowCustomRemarkInput(true);
        }
    };

    const handleSaveCustomRemark = () => {
        if (customRemark.trim()) {
            handleAddRemarks(customRemark);
        }
    };

    // Memoized Card Handlers
    const onCardReturn = useCallback((item: Parcel) => {
        setSelectedParcel(item);
        setShowReturnModal(true);
    }, []);

    const onCardRemarks = useCallback((item: Parcel) => {
        setSelectedParcel(item);
        setShowRemarksModal(true);
    }, []);

    const onCardComplete = useCallback((item: Parcel) => {
        setSelectedParcel(item);
        if (item.bolIsMultiple) {
            setDeliveryQty("");
            setDeliveryAmount("");
            setShowMultipleCompleteModal(true);
        } else {
            setShowCompleteModal(true);
        }
    }, []);

    const onCardOpenQR = useCallback((qr: string) => {
        if (qr) {
            setSelectedQRImage(qr);
            setShowQRModal(true);
        }
    }, []);


    const filteredParcels = useMemo(() => {
        if (!searchQuery) return allParcels;
        return allParcels.filter(
            (parcel) =>
                parcel.ReferenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                parcel.RecipientPhone.includes(searchQuery) ||
                parcel.CityName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allParcels, searchQuery]);


    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Image
                source={require("../../assets/images/empty-reports.png")}
                style={styles.emptyImage}
            />
            <Text style={styles.emptyText}>
                {allParcels.length === 0 && !searchQuery
                    ? "لا توجد طرود معينة لك حاليًا"
                    : "لم يتم العثور على نتائج"}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <MaterialTopBar title="الطرد المعين" />

            {isLoading ? (
                <ParcelsSkeleton />
            ) : (
                <>
                    <View style={styles.headerContainer}>
                        <View style={styles.modernFilterSection}>
                            <Text style={styles.filterSectionTitle}>البحث في الطرود</Text>
                            <View style={styles.modernModalSearchContainer}>
                                <Search
                                    color="#9CA3AF"
                                    size={20}
                                    style={styles.modalSearchIcon}
                                />
                                <TextInput
                                    style={styles.modernModalSearchInput}
                                    placeholder="ابحث بالرقم المرجعي، الهاتف، أو المدينة..."
                                    placeholderTextColor="#9CA3AF"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>
                            <Text style={styles.sectionTitle}>
                                الطرود المعينة ({filteredParcels.length})
                            </Text>
                        </View>
                    </View>

                    <FlatList
                        data={filteredParcels}
                        renderItem={({ item }) => (
                            <ParcelCard
                                item={item}
                                onReturn={onCardReturn}
                                onRemarks={onCardRemarks}
                                onComplete={onCardComplete}
                                onPhoneCall={handlePhoneCall}
                                onOpenQR={onCardOpenQR}
                            />
                        )}
                        keyExtractor={(item) => item.intParcelCode.toString()}
                        contentContainerStyle={styles.listContentContainer}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={onRefresh}
                                colors={['#FF6B35']}
                                tintColor="#FF6B35"
                            />
                        }
                        ListEmptyComponent={renderEmptyComponent}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                    />
                </>
            )}

            {/* QR Code Modal */}
            <Modal
                visible={showQRModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowQRModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.qrModalContent}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowQRModal(false)}
                        >
                            <X color="#fff" size={24} />
                        </TouchableOpacity>
                        <Text style={styles.qrModalTitle}>مسح رمز الاستجابة السريعة</Text>
                        <View style={styles.qrImageContainer}>
                            {selectedQRImage && (
                                <Image
                                    source={{ uri: selectedQRImage }}
                                    style={styles.qrImage}
                                    resizeMode="contain"
                                />
                            )}
                        </View>
                        <Text style={styles.qrModalSubtitle}>امسح الرمز للدفع</Text>
                    </View>
                </View>
            </Modal>

            {/* Complete Confirmation Modal (Standard) */}
            <Modal
                visible={showCompleteModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCompleteModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmationModal}>
                        <Text style={styles.confirmationTitle}>تأكيد الإكتمال</Text>
                        <Text style={styles.confirmationMessage}>
                            متأكد/ة إنك بدك تأكد الطرد؟
                        </Text>
                        <View style={styles.confirmationButtons}>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.confirmButtonYes]}
                                onPress={handleCompleteParcel}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>نعم</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.confirmButtonNo]}
                                onPress={() => setShowCompleteModal(false)}
                                disabled={isProcessing}
                            >
                                <Text style={styles.confirmButtonTextNo}>لا</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Multiple Complete Modal (Updated with Parcel Info) */}
            <Modal
                visible={showMultipleCompleteModal}
                transparent
                animationType="fade"
                onRequestClose={() => !isProcessing && setShowMultipleCompleteModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.multipleModalContent}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowMultipleCompleteModal(false)}
                            disabled={isProcessing}
                        >
                            <X color="#fff" size={24} />
                        </TouchableOpacity>

                        <Text style={styles.multipleModalTitle}>إدخال تفاصيل التسليم</Text>

                        {/* Parcel Details Section */}
                        {selectedParcel && (
                            <View style={styles.miniParcelDetails}>
                                <Text style={styles.miniParcelRef}>{selectedParcel.ReferenceNo}</Text>
                                <Text style={styles.miniParcelCity}>{selectedParcel.CityName}</Text>
                                <Text style={styles.miniParcelTotal}>الإجمالي: {selectedParcel.Total.toFixed(2)} د.ل</Text>
                            </View>
                        )}

                        <View style={styles.multipleInputsRow}>
                            {/* Amount Input */}
                            <View style={styles.multipleInputContainer}>
                                <View style={styles.multipleLabelContainer}>
                                    <Banknote size={16} color="#10B981" style={{ marginRight: 4 }} />
                                    <Text style={styles.multipleLabel}>المبلغ (Amount)</Text>
                                </View>
                                <TextInput
                                    style={[styles.multipleInput, isProcessing && styles.disabledInput]}
                                    placeholder="أدخل المبلغ"
                                    placeholderTextColor="#A1A1AA"
                                    value={deliveryAmount}
                                    onChangeText={setDeliveryAmount}
                                    keyboardType="numeric"
                                    editable={!isProcessing}
                                />
                            </View>

                            <View style={{ width: 12 }} />

                            {/* Quantity Input */}
                            <View style={styles.multipleInputContainer}>
                                <View style={styles.multipleLabelContainer}>
                                    <Hash size={16} color="#3B82F6" style={{ marginRight: 4 }} />
                                    <Text style={styles.multipleLabel}>الكمية (Qty)</Text>
                                </View>
                                <TextInput
                                    style={[styles.multipleInput, isProcessing && styles.disabledInput]}
                                    placeholder="كم قطعة؟"
                                    placeholderTextColor="#A1A1AA"
                                    value={deliveryQty}
                                    onChangeText={setDeliveryQty}
                                    keyboardType="numeric"
                                    editable={!isProcessing}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.multipleSubmitButton, isProcessing && styles.disabledButton]}
                            onPress={handleCompleteParcelMultiple}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.multipleSubmitButtonText}>تأكيد التسليم مع الإدخالات</Text>
                                    <Check color="#fff" size={20} style={{ marginLeft: 8 }} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Return Confirmation Modal */}
            <Modal
                visible={showReturnModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowReturnModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmationModal}>
                        <Text style={styles.confirmationTitle}>تأكيد الحذف</Text>
                        <Text style={styles.confirmationMessage}>
                            متأكد/ة إنك بدك ترجع الطرد؟
                        </Text>
                        <View style={styles.confirmationButtons}>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.confirmButtonYes]}
                                onPress={handleReturnParcel}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>نعم</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.confirmButtonNo]}
                                onPress={() => setShowReturnModal(false)}
                                disabled={isProcessing}
                            >
                                <Text style={styles.confirmButtonTextNo}>لا</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Remarks Modal */}
            <Modal
                visible={showRemarksModal}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowRemarksModal(false);
                    setShowCustomRemarkInput(false);
                    setCustomRemark("");
                    setSelectedRemarkOption("");
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.remarksModal}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                setShowRemarksModal(false);
                                setShowCustomRemarkInput(false);
                                setCustomRemark("");
                                setSelectedRemarkOption("");
                            }}
                        >
                            <X color="#fff" size={24} />
                        </TouchableOpacity>

                        <Text style={styles.remarksTitle}>اضف ملاحظات المندوب</Text>

                        {!showCustomRemarkInput ? (
                            <>
                                <TouchableOpacity
                                    style={[
                                        styles.remarkOption,
                                        selectedRemarkOption === "العميل لا يرد على الهاتف" && styles.remarkOptionSelected
                                    ]}
                                    onPress={() => handleRemarkOptionSelect("العميل لا يرد على الهاتف")}
                                    disabled={isProcessing}
                                >
                                    <Text style={styles.remarkOptionText}>العميل لا يرد على الهاتف</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.remarkOption,
                                        selectedRemarkOption === "الاخرون" && styles.remarkOptionSelected
                                    ]}
                                    onPress={() => handleRemarkOptionSelect("الاخرون")}
                                    disabled={isProcessing}
                                >
                                    <Text style={styles.remarkOptionText}>الاخرون</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TextInput
                                    style={styles.customRemarkInput}
                                    placeholder="ملاحظات المندوب"
                                    placeholderTextColor="#9CA3AF"
                                    value={customRemark}
                                    onChangeText={setCustomRemark}
                                    multiline
                                    textAlign="right"
                                />
                                <TouchableOpacity
                                    style={styles.saveRemarkButton}
                                    onPress={handleSaveCustomRemark}
                                    disabled={isProcessing || !customRemark.trim()}
                                >
                                    {isProcessing ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.saveRemarkButtonText}>احفظ</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            <CustomAlert
                isVisible={isAlertVisible}
                title={alertTitle}
                message={alertMessage}
                confirmText="حسنًا"
                cancelText=""
                onConfirm={() => setAlertVisible(false)}
                onCancel={() => setAlertVisible(false)}
                success={alertSuccess}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    topBar: {
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: "#ffe0e0ff",
    },
    topBarTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1F2937",
        textAlign: "center",
    },
    headerContainer: {
        paddingHorizontal: 12,
    },
    listContentContainer: {
        paddingHorizontal: 12,
        paddingBottom: 120
    },
    modernFilterSection: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        padding: 20,
        marginTop: 10,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    filterSectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1F2937",
        marginBottom: 16,
        textAlign: "right",
    },
    modernModalSearchContainer: {
        flexDirection: "row-reverse",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    modalSearchIcon: { marginLeft: 8 },
    modernModalSearchInput: {
        flex: 1,
        color: "#1F2937",
        fontSize: 16,
        paddingVertical: Platform.OS === "ios" ? 12 : 8,
        textAlign: "right",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1F2937",
        marginBottom: 0,
        textAlign: "right",
    },
    modernTransactionItem: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    transactionHeader: {
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    parcelHeaderContent: {
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    parcelIconBackground: {
        width: 40,
        height: 40,
        backgroundColor: "#FF6B35",
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    parcelNameContainer: {
        flex: 1,
    },
    transactionDate: {
        color: "#1F2937",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "right",
        marginBottom: 2,
    },
    runningTotalLabel: {
        color: "#6B7280",
        fontSize: 12,
        textAlign: "right",
    },
    parcelTotal: {
        color: "#27AE60",
        fontSize: 16,
        fontWeight: "bold",
    },
    parcelDetailsRow: {
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        marginTop: 8,
    },
    parcelColumn: {
        flex: 1,
        paddingHorizontal: 6,
    },
    parcelInfoRow: {
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
    },
    parcelInfoText: {
        color: "#4B5563",
        fontSize: 14,
        flex: 1,
        textAlign: "right",
    },
    transactionRemarks: {
        color: "#9CA3AF",
        fontSize: 12,
        fontStyle: "italic",
        textAlign: "right",
        marginTop: 4,
    },
    transactionFooter: {
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        paddingTop: 12,
        marginTop: 8,
        gap: 8,
    },
    actionButtonReturn: {
        flexDirection: "row-reverse",
        alignItems: "center",
        backgroundColor: hexToRgba("#E74C3C", 0.1),
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
        flex: 1,
        justifyContent: "center",
    },
    actionButtonTextReturn: {
        color: "#E74C3C",
        fontSize: 14,
        fontWeight: "600",
    },
    actionButtonRemarks: {
        flexDirection: "row-reverse",
        alignItems: "center",
        backgroundColor: hexToRgba("#3498DB", 0.1),
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
        flex: 1,
        justifyContent: "center",
    },
    actionButtonTextRemarks: {
        color: "#3498DB",
        fontSize: 14,
        fontWeight: "600",
    },
    actionButtonComplete: {
        flexDirection: "row-reverse",
        alignItems: "center",
        backgroundColor: hexToRgba("#27AE60", 0.1),
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
        flex: 1,
        justifyContent: "center",
    },
    actionButtonTextComplete: {
        color: "#27AE60",
        fontSize: 14,
        fontWeight: "600",
    },
    dateFooter: {
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 6,
        marginTop: 8,
    },
    dateFooterText: {
        color: "#9CA3AF",
        fontSize: 12,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyImage: {
        width: width * 0.6,
        height: width * 0.6,
        marginBottom: 20,
        resizeMode: "contain",
    },
    emptyText: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
    },
    searchSkeleton: {
        height: 50,
        borderRadius: 8,
        marginBottom: 16,
    },
    cardSkeleton: {
        height: 200,
        borderRadius: 8,
        marginBottom: 12,
        width: 'auto'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    confirmationModal: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 24,
        width: "100%",
        maxWidth: 400,
    },
    confirmationTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1F2937",
        textAlign: "center",
        marginBottom: 12,
    },
    confirmationMessage: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 24,
    },
    confirmationButtons: {
        flexDirection: "row-reverse",
        gap: 12,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    confirmButtonYes: {
        backgroundColor: "#27AE60",
    },
    confirmButtonNo: {
        backgroundColor: "#F3F4F6",
    },
    confirmButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    confirmButtonTextNo: {
        color: "#1F2937",
        fontSize: 16,
        fontWeight: "600",
    },
    remarksModal: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 24,
        width: "100%",
        maxWidth: 400,
        position: "relative",
    },
    closeButton: {
        position: "absolute",
        top: 12,
        left: 12,
        backgroundColor: "#FF6B35",
        borderRadius: 20,
        padding: 6,
        zIndex: 1,
    },
    remarksTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1F2937",
        textAlign: "center",
        marginBottom: 24,
    },
    remarkOption: {
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    remarkOptionSelected: {
        backgroundColor: hexToRgba("#FF6B35", 0.1),
        borderColor: "#FF6B35",
    },
    remarkOptionText: {
        fontSize: 16,
        color: "#1F2937",
        textAlign: "center",
    },
    customRemarkInput: {
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        fontSize: 16,
        color: "#1F2937",
        minHeight: 100,
        textAlignVertical: "top",
    },
    saveRemarkButton: {
        backgroundColor: "#FF6B35",
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: "center",
    },
    saveRemarkButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    // QR Button and Modal Styles
    qrSectionContainer: {
        marginTop: 8,
        marginBottom: 4,
        alignItems: 'center',
    },
    qrButton: {
        backgroundColor: "#3498DB",
        borderRadius: 8,
        padding: 10,
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: '100%',
    },
    qrButtonText: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "bold",
    },
    qrModalContent: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 24,
        width: "100%",
        maxWidth: 350,
        alignItems: "center",
        position: "relative",
    },
    qrModalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1F2937",
        marginBottom: 20,
        marginTop: 10,
    },
    qrImageContainer: {
        width: 250,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    qrImage: {
        width: '100%',
        height: '100%',
    },
    qrModalSubtitle: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
    },
    // --- New Multiple Complete Modal Styles ---
    multipleModalContent: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 24,
        width: "100%",
        position: "relative",
    },
    multipleModalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1F2937",
        textAlign: "center",
        marginBottom: 24,
        marginTop: 10,
    },
    multipleInputsRow: {
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    multipleInputContainer: {
        flex: 1,
    },
    multipleLabelContainer: {
        flexDirection: "row-reverse",
        alignItems: "center",
        marginBottom: 8,
    },
    multipleLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
    },
    multipleInput: {
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
        color: "#1F2937",
        textAlign: "right",
    },
    multipleSubmitButton: {
        backgroundColor: "#10B981",
        borderRadius: 8,
        paddingVertical: 16,
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },
    multipleSubmitButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    disabledInput: {
        backgroundColor: "#E5E7EB",
        color: "#9CA3AF"
    },
    disabledButton: {
        opacity: 0.7
    },
    miniParcelDetails: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    miniParcelRef: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4
    },
    miniParcelCity: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4
    },
    miniParcelTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10B981'
    },
    paymentStatusBadge: { alignSelf: "flex-end", flexDirection: "row-reverse", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, },
    paidBadge: { backgroundColor: "#D1FAE5" },
    unpaidBadge: { backgroundColor: "#FEE2E2" },
    paidBadgeText: { color: "#065F46", fontSize: 12, fontWeight: "bold" },
    unpaidBadgeText: { color: "#991B1B", fontSize: 12, fontWeight: "bold" },
});