import React, {
    useState,
    useCallback,
    useMemo,
    useEffect,
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
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import { useDashboard } from "../..//Context/DashboardContext";
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
        <View style={[styles.topBar, { paddingTop: insets.top + 30 }]}>
            <Text style={styles.topBarTitle}>{title}</Text>
        </View>
    );
};

const ParcelsSkeleton = () => {
    const shimmerColors = ["#FDF1EC", "#FEF8F5", "#FDF1EC"];
    return (
        <View style={{ paddingHorizontal: 12 }}>
            <ShimmerPlaceHolder
                style={styles.searchSkeleton}
                shimmerColors={shimmerColors}
            />
            <ShimmerPlaceHolder
                style={styles.cardSkeleton}
                shimmerColors={shimmerColors}
            />
            <ShimmerPlaceHolder
                style={styles.cardSkeleton}
                shimmerColors={shimmerColors}
            />
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

    // Alert states
    const [isAlertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSuccess, setAlertSuccess] = useState(false);


    const { setCurrentRoute } = useDashboard(); // Get the setter function



    useFocusEffect(
        React.useCallback(() => {
            // Announce that this is now the current route
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
                `https://tanmia-group.com:84/courierApi/Driverparcels/details/${parsedUser.userId}/${currentStatusId}`
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

    // API Handlers
    const handleCompleteParcel = async () => {
        if (!selectedParcel || !statusId) return;

        setIsProcessing(true);
        try {
            await axios.post(
                `https://tanmia-group.com:84/courierApi/Parcel/Driver/UpdateStatus/${selectedParcel.intParcelCode}/${statusId}`
            );

            setAlertTitle("نجاح");
            setAlertMessage("تم تحديث حالة الطرد بنجاح");
            setAlertSuccess(true);
            setAlertVisible(true);
            setShowCompleteModal(false);
            loadData();
            console.log('Parcel status updated:', selectedParcel.intParcelCode);
        } catch (error) {
            setAlertTitle("خطأ");
            setAlertMessage("فشل في تحديث حالة الطرد");
            setAlertSuccess(false);
            setAlertVisible(true);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReturnParcel = async () => {
        if (!selectedParcel) return;

        setIsProcessing(true);
        try {
            await axios.post(
                `https://tanmia-group.com:84/courierApi/Parcel/Driver/ReturnOnTheWay/${selectedParcel.intParcelCode}`
            );

            setAlertTitle("نجاح");
            setAlertMessage("تم إرجاع الطرد بنجاح");
            setAlertSuccess(true);
            setAlertVisible(true);
            setShowReturnModal(false);
            console.log('Parcel returned:', selectedParcel.intParcelCode);
            loadData();
        } catch (error) {
            setAlertTitle("خطأ");
            setAlertMessage("فشل في إرجاع الطرد");
            setAlertSuccess(false);
            setAlertVisible(true);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddRemarks = async (remark: string) => {
        if (!selectedParcel || !remark.trim()) return;

        setIsProcessing(true);
        try {
            await axios.post(
                `https://tanmia-group.com:84/courierApi/Parcel/Driver/AddRemarks/${selectedParcel.intParcelCode}/${encodeURIComponent(remark)}`
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
            console.log('Remarks added:', remark);
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

    const filteredParcels = useMemo(() => {
        if (!searchQuery) return allParcels;
        return allParcels.filter(
            (parcel) =>
                parcel.ReferenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                parcel.RecipientPhone.includes(searchQuery) ||
                parcel.CityName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allParcels, searchQuery]);

    const ParcelCard = ({ item }: { item: Parcel }) => (
        <View style={styles.modernTransactionItem}>
            <View style={styles.transactionHeader}>
                <View style={styles.parcelHeaderContent}>
                    <View style={styles.parcelIconBackground}>
                        <Package color="#fff" size={20} />
                    </View>
                    <View style={styles.parcelNameContainer}>
                        <Text style={styles.transactionDate} numberOfLines={1}>
                            {item.ReferenceNo}
                        </Text>
                        <Text style={styles.runningTotalLabel}>{item.CityName}</Text>
                    </View>
                </View>
                <Text style={styles.parcelTotal}>
                    {item.Total.toFixed(2)} د.ل
                </Text>
            </View>

            <View style={[styles.parcelNameContainer, { marginTop: 12 }]}>
                {item.strEntityName && (
                    <View style={styles.parcelInfoRow}>
                        <Text style={styles.dateFooterText}>اسم المتجر :</Text>
                        <Text style={styles.parcelInfoText}>{item.strEntityName}</Text>
                    </View>
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
                    <View style={styles.parcelInfoRow}>
                        <Phone size={14} color="#6B7280" />
                        <Text style={styles.parcelInfoText}>{item.RecipientPhone}</Text>
                    </View>
                    <View style={styles.parcelInfoRow}>
                        <Box size={14} color="#6B7280" />
                        <Text style={styles.parcelInfoText}>الكمية: {item.Quantity}</Text>
                    </View>
                </View>

                <View style={styles.parcelColumn}>
                    <View style={styles.parcelInfoRow}>
                        <FileText size={14} color="#6B7280" />
                        <Text style={styles.parcelInfoText} numberOfLines={2}>
                            {item.Remarks || 'لا توجد ملاحظات'}
                        </Text>
                    </View>
                    {item.strDriverRemarks && (
                        <Text style={styles.transactionRemarks} numberOfLines={2}>
                            ملاحظات المندوب: {item.strDriverRemarks}
                        </Text>
                    )}
                </View>
            </View>

            <View style={styles.transactionFooter}>
                <TouchableOpacity
                    style={styles.actionButtonReturn}
                    onPress={() => {
                        setSelectedParcel(item);
                        setShowReturnModal(true);
                    }}
                >
                    <XCircle color="#E74C3C" size={16} />
                    <Text style={styles.actionButtonTextReturn}>إرجاع</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButtonRemarks}
                    onPress={() => {
                        setSelectedParcel(item);
                        setShowRemarksModal(true);
                    }}
                >
                    <MessageSquare color="#3498DB" size={16} />
                    <Text style={styles.actionButtonTextRemarks}>ملاحظات</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButtonComplete}
                    onPress={() => {
                        setSelectedParcel(item);
                        setShowCompleteModal(true);
                    }}
                >
                    <CheckCircle2 color="#27AE60" size={16} />
                    <Text style={styles.actionButtonTextComplete}>اكتمل</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.dateFooter}>
                <Calendar size={12} color="#9CA3AF" />
                <Text style={styles.dateFooterText}>{formatDateTime(item.CreatedAt)}</Text>
            </View>
        </View>
    );

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
                        renderItem={({ item }) => <ParcelCard item={item} />}
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
                    />
                </>
            )}

            {/* Complete Confirmation Modal */}
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
});