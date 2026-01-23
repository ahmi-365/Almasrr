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
    KeyboardAvoidingView,
    Linking, // Added for Dialer
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {
    Search,
    Phone,
    Package,
    Calendar,
    ChevronDown,
    Check,
    Store as StoreIcon,
    MapPin,
    Truck,
    Box,
    Bell,
    ChevronLeft,
    X, // Added for unpaid status
} from "lucide-react-native";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import { WebView } from "react-native-webview";
import { useDashboard } from "../../Context/DashboardContext";
import CustomAlert from "../../components/CustomAlert";
import TopBar from "../../components/Entity/TopBarNew";

const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);

const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const ParcelsSkeleton = () => {
    const shimmerColors = ["#FDF1EC", "#FEF8F5", "#FDF1EC"];
    return (
        <View style={{ paddingHorizontal: 12, marginTop: 20 }}>
            <ShimmerPlaceHolder style={styles.cardSkeleton} shimmerColors={shimmerColors} />
            <ShimmerPlaceHolder style={styles.cardSkeleton} shimmerColors={shimmerColors} />
            <ShimmerPlaceHolder style={styles.cardSkeleton} shimmerColors={shimmerColors} />
        </View>
    );
};

interface EntityForFilter {
    intEntityCode: number;
    strEntityName: string;
    strEntityCode: string;
    strStatus: string;
}

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
    // New fields from your JSON
    strDriverPhone?: string;
    bolIsOnlinePayment?: boolean;
    strOnlinePaymentStatus?: string | null;
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
    } catch (e) { return isoString; }
};

// Helper for opening Dialer
const makeCall = (phoneNumber: string) => {
    if (phoneNumber) {
        Linking.openURL(`tel:${phoneNumber}`);
    }
};

const DeliveryCard = ({ item, onNotifyPress, onTrackPress }: { item: Parcel, onNotifyPress: (parcel: Parcel) => void, onTrackPress: (parcel: Parcel) => void }) => (
    <View style={styles.modernTransactionItem}>
        <View style={styles.cardHeader}>
            <View style={styles.headerTopRow}>
                <View style={styles.statusBadge}><Text style={styles.statusText}>{item.CityName}</Text></View>
                <View style={styles.dateContainer}>
                    <Calendar size={12} color="#FFF" />
                    <Text style={styles.dateText}>{formatDateTime(item.CreatedAt)}</Text>
                </View>
            </View>
            <View style={styles.headerBottomRow}>
                <TouchableOpacity onPress={() => onTrackPress(item)} style={styles.orderIdContainer}>
                    <View style={styles.packageIconBackground}><Package color="#FFF" size={20} /></View>
                    <Text style={styles.orderId}>{item.ReferenceNo}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.notifyButton} onPress={() => onNotifyPress(item)}>
                    <Bell size={14} color="#FFF" />
                    <Text style={styles.notifyButtonText}>إشعار</Text>
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.cardContent}>
            {/* Section: Recipient Information */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}><View style={styles.dot} /><Text style={styles.sectionTitle}>معلومات المستلم</Text></View>
                <View style={styles.infoBox}>
                    {item.RecipientName && (
                        <View style={styles.infoRow}><MapPin size={14} color="#6B7280" /><Text style={styles.recipientText}>{item.RecipientName}</Text></View>
                    )}
                    <TouchableOpacity onPress={() => makeCall(item.RecipientPhone)} style={styles.infoRow}>
                        <Phone size={14} color="#6B7280" />
                        <Text style={styles.phoneText}>{item.RecipientPhone}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* NEW Section: Driver Phone (Shown only if it exists) */}
            {item.strDriverPhone ? (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}><View style={styles.dot} /><Text style={styles.sectionTitle}>رقم المندوب</Text></View>
                    <View style={styles.infoBox}>
                        <TouchableOpacity onPress={() => makeCall(item.strDriverPhone!)} style={styles.infoRow}>
                            <Phone size={14} color="#6B7280" />
                            <Text style={styles.phoneText}>{item.strDriverPhone}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : null}

            <View style={styles.section}>
                <View style={styles.sectionHeader}><View style={styles.dot} /><Text style={styles.sectionTitle}>تفاصيل الطلب</Text></View>
                <View style={styles.detailsRow}>
                    <View style={styles.detailBox}><Text style={styles.detailNumber}>{item.Quantity}</Text><Text style={styles.detailLabel}>الكمية</Text></View>
                    <View style={styles.detailBox}><Text style={[styles.detailNumber, { fontSize: 16 }]}>{item.TypeName}</Text><Text style={styles.detailLabel}>نوع الطرد</Text></View>
                </View>
            </View>

            {/* NEW Section: Online Payment (Shown only if bolIsOnlinePayment is true) */}
            {item.bolIsOnlinePayment && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}><View style={styles.dot} /><Text style={styles.sectionTitle}>الدفع الإلكتروني</Text></View>
                    <View style={styles.paymentBadgeContainer}>
                        {item.strOnlinePaymentStatus === "Success" ? (
                            <View style={[styles.paymentBadge, styles.paidBadge]}>
                                <Check size={12} color="#065F46" />
                                <Text style={styles.paidBadgeText}>مدفوع</Text>
                            </View>
                        ) : (
                            <View style={[styles.paymentBadge, styles.unpaidBadge]}>
                                <X size={12} color="#991B1B" />
                                <Text style={styles.unpaidBadgeText}>غير مدفوع</Text>
                            </View>
                        )}
                    </View>
                </View>
            )}

            {(item.Remarks || item.strDriverRemarks) && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}><View style={styles.dot} /><Text style={styles.sectionTitle}>الملاحظات</Text></View>
                    <View style={styles.remarksBox}>
                        {item.Remarks && <Text style={styles.remarksText}>{item.Remarks}</Text>}
                        {item.strDriverRemarks && <Text style={[styles.remarksText, { marginTop: item.Remarks ? 8 : 0 }]}><Text style={{ fontWeight: 'bold' }}>المندوب:</Text> {item.strDriverRemarks}</Text>}
                    </View>
                </View>
            )}

            <View style={styles.section}>
                <View style={styles.sectionHeader}><View style={styles.dot} /><Text style={styles.sectionTitle}>التكلفة</Text></View>
                <View style={styles.pricingContainer}>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>قيمة الطرد</Text>
                        <View style={styles.priceValueContainer}><Text style={styles.priceValue}>{item.dcFee.toFixed(2)} د.ل</Text></View>
                    </View>
                    <View style={styles.totalBox}>
                        <Text style={styles.totalLabel}>الإجمالي</Text>
                        <View style={styles.totalValueContainer}><Text style={styles.totalValue}>{item.Total.toFixed(2)} د.ل</Text></View>
                    </View>
                </View>
            </View>
        </View>
    </View>
);

export default function OnTheWayScreen() {
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [allParcels, setAllParcels] = useState<Parcel[]>([]);
    const { user, setUser } = useDashboard();

    const [entities, setEntities] = useState<EntityForFilter[]>([]);
    const [selectedEntity, setSelectedEntity] = useState<EntityForFilter | null>(null);
    const [entityModalVisible, setEntityModalVisible] = useState(false);
    const [modalSearchQuery, setModalSearchQuery] = useState("");
    const [parcelSearchQuery, setParcelSearchQuery] = useState("");

    const [isAlertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSuccess, setAlertSuccess] = useState(false);

    const [parcelToNotify, setParcelToNotify] = useState<Parcel | null>(null);
    const [isRemarksModalVisible, setRemarksModalVisible] = useState(false);
    const [entityRemarks, setEntityRemarks] = useState("");
    const [isSending, setIsSending] = useState(false);

    const [webViewVisible, setWebViewVisible] = useState(false);
    const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);

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
                    if (sortedStatusIds.length < 3) throw new Error("بيانات غير كافية لتحديد الحالة");

                    const statusIdForFilter = sortedStatusIds[2];

                    const response = await axios.get(`https://tanmia-group.com:86/courierApi/Entity/GetHistoryEntities/${user.userId}/${statusIdForFilter}`);
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
            if (sortedStatusIds.length < 3) throw new Error("بيانات لوحة التحكم غير كافية");

            const statusId = sortedStatusIds[2];
            const targetId = selectedEntity ? selectedEntity.intEntityCode : parsedUser.userId;

            const response = await axios.get(`https://tanmia-group.com:86/courierApi/parcels/details/${targetId}/${statusId}`);
            setAllParcels(response.data?.Parcels || []);
        } catch (error) {
            console.error("Failed to load on-the-way parcels:", error);
            setAlertTitle("خطأ");
            setAlertMessage("فشل تحميل الطرود التي في الطريق.");
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

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        handleSearch();
    }, [handleSearch]);

    const handleNotifyPress = (parcel: Parcel) => {
        setParcelToNotify(parcel);
        setEntityRemarks("");
        setRemarksModalVisible(true);
    };

    const handleTrackPress = (parcel: Parcel) => {
        setSelectedParcel(parcel);
        setWebViewVisible(true);
    };

    const handleSendNotification = async () => {
        if (!parcelToNotify || !entityRemarks.trim() || isSending) {
            setAlertTitle("تنبيه");
            setAlertMessage("الرجاء كتابة الملاحظات قبل الإرسال.");
            setAlertSuccess(false);
            setAlertVisible(true);
            return;
        }

        setIsSending(true);
        setRemarksModalVisible(false);

        try {
            const params = new URLSearchParams();
            params.append('parcelCode', parcelToNotify.intParcelCode.toString());
            params.append('entityRemarks', entityRemarks);

            const response = await axios.post(
                'https://tanmia-group.com:86/courierApi/notifications/entity-to-driver',
                params,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            if (response.data.Success) {
                setAlertTitle("نجاح");
                setAlertMessage(response.data.Message || "تم إرسال الإشعار بنجاح.");
                setAlertSuccess(true);
            } else {
                throw new Error(response.data.Message || "فشل إرسال الإشعار.");
            }
        } catch (error) {
            setAlertTitle("خطأ");
            setAlertMessage("حدث خطأ غير متوقع.");
            setAlertSuccess(false);
        } finally {
            setAlertVisible(true);
            setIsSending(false);
            setParcelToNotify(null);
            setEntityRemarks("");
        }
    };


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
            <TopBar title="في الطريق" />
            <FlatList
                data={filteredParcels}
                renderItem={({ item }) => (
                    <DeliveryCard
                        item={item}
                        onNotifyPress={handleNotifyPress}
                        onTrackPress={handleTrackPress}
                    />
                )}
                keyExtractor={(item) => item.intParcelCode.toString()}
                contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 120 }}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#FF6B35']} tintColor="#FF6B35" />}
                ListHeaderComponent={
                    <View style={styles.modernFilterSection}>
                        <Text style={styles.filterSectionTitle}>البحث والفلترة</Text>
                        <TouchableOpacity style={styles.dropdown} onPress={() => setEntityModalVisible(true)}>
                            <Text style={styles.dropdownText}>{selectedEntity ? selectedEntity.strEntityName : "كل المتاجر"}</Text>
                            <ChevronDown color="#9CA3AF" size={20} />
                        </TouchableOpacity>
                        <View style={styles.modernModalSearchContainer}>
                            <Search color="#9CA3AF" size={20} style={styles.modalSearchIcon} />
                            <TextInput
                                style={styles.modernModalSearchInput}
                                placeholder="ابحث في النتائج..."
                                placeholderTextColor="#9CA3AF"
                                value={parcelSearchQuery}
                                onChangeText={setParcelSearchQuery}
                            />
                        </View>
                        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading}>
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.searchButtonText}>بحث</Text>}
                        </TouchableOpacity>
                        {filteredParcels.length > 0 && !loading && (
                            <Text style={styles.sectionTitleResult}>الطرود ({filteredParcels.length})</Text>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    loading ? <ParcelsSkeleton /> : (
                        <View style={styles.emptyContainer}>
                            <Image source={require('../../assets/images/empty-reports.png')} style={styles.emptyImage} />
                            <Text style={styles.emptyText}>{allParcels.length === 0 ? "لا توجد طرود في الطريق حالياً" : "لم يتم العثور على نتائج"}</Text>
                            <Text style={styles.emptySubText}>{allParcels.length === 0 ? 'يرجى تحديد فلتر والضغط على بحث' : 'جرب البحث بكلمات مختلفة'}</Text>
                        </View>
                    )
                }
            />

            {/* Entity Modal */}
            <Modal visible={entityModalVisible} animationType="fade" transparent={true} onRequestClose={() => setEntityModalVisible(false)}>
                <TouchableWithoutFeedback onPress={() => setEntityModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <SafeAreaView style={styles.modalContent}>
                                <Text style={styles.modalTitle}>اختيار المتجر</Text>
                                <View style={styles.modalSearchContainer}>
                                    <Search color="#9CA3AF" size={20} style={styles.modalSearchIcon} />
                                    <TextInput style={styles.modalSearchInput} placeholder="ابحث عن متجر..." placeholderTextColor="#9CA3AF" value={modalSearchQuery} onChangeText={setModalSearchQuery} />
                                </View>
                                <FlatList
                                    data={[allStoresOption, ...displayedEntities]}
                                    keyExtractor={(item) => item.intEntityCode.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={styles.modalItem} onPress={() => { setSelectedEntity(item.intEntityCode === 0 ? null : item); setEntityModalVisible(false); setModalSearchQuery(""); }} activeOpacity={0.7}>
                                            <View style={styles.modalItemContent}>
                                                <Text style={[styles.modalItemText, (selectedEntity?.intEntityCode === item.intEntityCode || (!selectedEntity && item.intEntityCode === 0)) && styles.modalItemSelected]}>{item.strEntityName}</Text>
                                                {item.intEntityCode !== 0 && <Text style={styles.modalItemCode}>{item.strStatus}</Text>}
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

            {/* Tracking Modal */}
            <Modal visible={webViewVisible} animationType="slide" onRequestClose={() => setWebViewVisible(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setWebViewVisible(false)} style={styles.modalBackButton}>
                            <ChevronLeft size={24} color="#1F2937" />
                        </TouchableOpacity>
                        <Text style={styles.modalHeaderTitle}>{selectedParcel ? `تتبع: ${selectedParcel.ReferenceNo}` : 'تتبع الشحنة'}</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    {selectedParcel && (
                        <WebView
                            source={{ uri: `https://tanmia-group.com:86/admin/tracking/Index?trackingNumber=${selectedParcel.ReferenceNo}` }}
                            style={{ flex: 1 }}
                            startInLoadingState={true}
                            renderLoading={() => (<ActivityIndicator color="#FF6B35" size="large" style={{ position: 'absolute', width: '100%', height: '100%' }} />)}
                        />
                    )}
                </SafeAreaView>
            </Modal>

            {/* Notification Modal */}
            <Modal visible={isRemarksModalVisible} animationType="fade" transparent={true} onRequestClose={() => setRemarksModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.remarksModalOverlay}>
                    <TouchableWithoutFeedback onPress={() => setRemarksModalVisible(false)}>
                        <View style={StyleSheet.absoluteFill} />
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback>
                        <View style={styles.remarksModalContent}>
                            <Text style={styles.modalTitle}>إرسال إشعار للمندوب</Text>
                            <Text style={styles.modalSubTitle}>أدخل ملاحظاتك بخصوص الشحنة: <Text style={{ fontWeight: 'bold' }}>{parcelToNotify?.ReferenceNo}</Text></Text>
                            <TextInput
                                style={styles.remarksModalInput}
                                placeholder="مثال: الرجاء تسليم الشحنة اليوم قبل الساعة 5 مساءً"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                value={entityRemarks}
                                onChangeText={setEntityRemarks}
                            />
                            <View style={styles.modalButtonContainer}>
                                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setRemarksModalVisible(false)}>
                                    <Text style={[styles.modalButtonText, styles.cancelButtonText]}>إلغاء</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalButton, styles.sendButton]} onPress={handleSendNotification} disabled={isSending}>
                                    {isSending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalButtonText}>إرسال</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>

            <CustomAlert isVisible={isAlertVisible} title={alertTitle} message={alertMessage} confirmText="حسنًا" onConfirm={() => setAlertVisible(false)} success={alertSuccess} cancelText={undefined} onCancel={undefined} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8F9FA" },
    modernFilterSection: { backgroundColor: "#FFFFFF", borderRadius: 8, padding: 20, marginVertical: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
    filterSectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937", marginBottom: 16, textAlign: "right" },
    dropdown: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    dropdownText: { color: "#1F2937", fontSize: 14, flex: 1, textAlign: "right" },
    modernModalSearchContainer: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, borderWidth: 1, borderColor: "#E5E7EB" },
    modalSearchIcon: { marginLeft: 8 },
    modernModalSearchInput: { flex: 1, color: "#1F2937", fontSize: 16, paddingVertical: Platform.OS === "ios" ? 12 : 8, textAlign: "right", },
    searchButton: { backgroundColor: '#FF6B35', padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    searchButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    sectionTitleResult: { fontSize: 18, fontWeight: "bold", color: "#1F2937", textAlign: "right", marginTop: 8 },

    modernTransactionItem: { backgroundColor: "#FFFFFF", borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: "#F3F4F6", overflow: "hidden" },
    cardHeader: { backgroundColor: "#FF6B35", padding: 16 },
    headerTopRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    headerBottomRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { backgroundColor: hexToRgba("#FFFFFF", 0.2), paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    statusText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
    dateContainer: { flexDirection: "row-reverse", alignItems: "center", gap: 4 },
    dateText: { color: "#FFF", fontSize: 12, opacity: 0.9 },
    orderIdContainer: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
    packageIconBackground: { width: 32, height: 32, backgroundColor: hexToRgba("#FFFFFF", 0.2), borderRadius: 6, justifyContent: "center", alignItems: "center" },
    orderId: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
    notifyButton: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16 },
    notifyButtonText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
    cardContent: { padding: 16 },
    section: { marginBottom: 12 },
    sectionHeader: { flexDirection: "row-reverse", alignItems: "center", marginBottom: 8, gap: 6 },
    dot: { width: 6, height: 6, backgroundColor: "#FF6B35", borderRadius: 3 },
    sectionTitle: { color: "#374151", fontSize: 14, fontWeight: "600" },
    infoBox: { backgroundColor: "#F9FAFB", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#F3F4F6", gap: 8 },
    infoRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
    recipientText: { color: "#1F2937", fontSize: 16, fontWeight: "600", flex: 1, textAlign: "right" },
    phoneText: { color: "#6B7280", fontSize: 14, flex: 1, textAlign: "right" },
    detailsRow: { flexDirection: "row-reverse", gap: 12 },
    detailBox: { flex: 1, backgroundColor: "#F9FAFB", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 8, borderWidth: 1, borderColor: "#F3F4F6", alignItems: "center", justifyContent: 'center', minHeight: 60 },
    detailNumber: { color: "#FF6B35", fontSize: 18, fontWeight: "bold", textAlign: 'center' },
    detailLabel: { color: "#9CA3AF", fontSize: 10, marginTop: 2 },
    remarksBox: { backgroundColor: "#F9FAFB", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#F3F4F6" },
    remarksText: { color: '#4B5563', fontSize: 13, textAlign: 'right', lineHeight: 18 },
    pricingContainer: { gap: 8 },
    priceRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
    priceLabel: { color: "#9CA3AF", fontSize: 14 },
    priceValueContainer: { flexDirection: "row-reverse", alignItems: "center", gap: 4 },
    priceValue: { color: "#374151", fontSize: 14, fontWeight: "600" },
    totalBox: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", backgroundColor: hexToRgba("#28a745", 0.1), borderColor: hexToRgba("#28a745", 0.2), padding: 12, borderRadius: 8, borderWidth: 1 },
    totalLabel: { color: "#28a745", fontWeight: "bold", fontSize: 14 },
    totalValueContainer: { flexDirection: "row-reverse", alignItems: "center", gap: 4 },
    totalValue: { color: "#28a745", fontSize: 18, fontWeight: "bold" },

    // Added styles for Payment logic
    paymentBadgeContainer: { flexDirection: 'row-reverse' },
    paymentBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
    paidBadge: { backgroundColor: '#DEF7EC' },
    unpaidBadge: { backgroundColor: '#FDE8E8' },
    paidBadgeText: { color: '#03543F', fontSize: 12, fontWeight: 'bold' },
    unpaidBadgeText: { color: '#9B1C1C', fontSize: 12, fontWeight: 'bold' },

    emptyContainer: { backgroundColor: "#FFFFFF", borderRadius: 8, paddingVertical: 40, paddingHorizontal: 20, alignItems: "center", marginTop: 20 },
    emptyText: { color: "#374151", fontSize: 18, fontWeight: "600", marginBottom: 4, textAlign: "center" },
    emptySubText: { color: "#6B7280", fontSize: 14, textAlign: "center", lineHeight: 20 },
    cardSkeleton: { height: 350, width: "100%", borderRadius: 8, marginBottom: 12 },
    emptyImage: { width: 200, height: 120, marginBottom: 20, opacity: 0.7 },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
    modalContent: { backgroundColor: "#FFFFFF", borderRadius: 8, width: "100%", maxHeight: "70%", padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1F2937", textAlign: "right", marginBottom: 8 },
    modalSubTitle: { fontSize: 14, color: '#6B7280', textAlign: 'right', marginBottom: 16, lineHeight: 20 },
    modalSearchContainer: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, borderWidth: 1, borderColor: "#E5E7EB" },
    modalSearchInput: { flex: 1, color: "#1F2937", fontSize: 16, paddingVertical: Platform.OS === "ios" ? 12 : 8, textAlign: "right" },
    modalItem: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
    modalItemContent: { flex: 1 },
    modalItemText: { color: "#1F2937", fontSize: 16, fontWeight: "500", textAlign: "right", marginBottom: 2 },
    modalItemCode: { color: "#6B7280", fontSize: 12, textAlign: "right" },
    modalItemSelected: { color: "#FF6B35", fontWeight: "bold" },

    modalHeader: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
    modalBackButton: { padding: 10 },
    modalHeaderTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', textAlign: 'center', flex: 1, marginHorizontal: 10 },

    remarksModalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
    remarksModalContent: { backgroundColor: "#FFFFFF", borderRadius: 8, width: "100%", padding: 20, alignItems: 'flex-end' },
    remarksModalInput: { width: '100%', height: 100, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, padding: 12, textAlign: 'right', textAlignVertical: 'top', fontSize: 14, marginBottom: 20 },
    modalButtonContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    cancelButton: { backgroundColor: '#F3F4F6', marginRight: 8 },
    sendButton: { backgroundColor: '#FF6B35', marginLeft: 8 },
    modalButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
    cancelButtonText: { color: '#374151' },
});