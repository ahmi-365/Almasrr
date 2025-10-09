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
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {
    Search,
    Phone,
    FileText,
    PackageX, // Correct Icon for "Returned"
    Box,
    Calendar,
    User,
    ChevronDown,
    Check,
    Store as StoreIcon,
    ChevronLeft, // Import for WebView back button
} from "lucide-react-native";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import { WebView } from "react-native-webview"; // Import WebView
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
    // Add intStatusCode to the interface to match the data structure
    intStatusCode: number;
}
interface ReturnStatus {
    Disabled: boolean;
    Group: any;
    Selected: boolean;
    Text: string;
    Value: string;
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

// --- MODIFIED ParcelCard to handle tracking press ---
const ParcelCard = ({ item, onTrackPress }: { item: Parcel, onTrackPress: (parcel: Parcel) => void }) => (
    <View style={styles.modernTransactionItem}>
        <TouchableOpacity onPress={() => onTrackPress(item)} activeOpacity={0.7}>
            <View style={styles.transactionHeader}>
                <View style={styles.parcelHeaderContent}>
                    <View style={[styles.parcelIconBackground, { backgroundColor: '#F59E0B' }]}>
                        <PackageX color="#fff" size={20} />
                    </View>
                    <View style={styles.parcelNameContainer}>
                        <Text style={styles.transactionDate} numberOfLines={1}>{item.ReferenceNo}</Text>
                        <Text style={styles.runningTotalLabel}>{item.CityName}</Text>
                    </View>
                </View>
                <Text style={[styles.parcelTotal, { color: '#E74C3C' }]}>{item.Total.toFixed(2)} د.ل</Text>
            </View>
        </TouchableOpacity>
        <View style={styles.parcelDetailsRow}>
            <View style={styles.parcelColumn}>
                {item.RecipientName && (
                    <View style={styles.parcelInfoRow}><User size={14} color="#6B7280" /><Text style={styles.parcelInfoText}>{item.RecipientName}</Text></View>
                )}
                <View style={styles.parcelInfoRow}><Phone size={14} color="#6B7280" /><Text style={styles.parcelInfoText}>{item.RecipientPhone}</Text></View>
                <View style={styles.parcelInfoRow}><Box size={14} color="#6B7280" /><Text style={styles.parcelInfoText}>الكمية: {item.Quantity}</Text></View>
            </View>
            <View style={styles.parcelColumn}>
                <View style={styles.parcelInfoRow}><FileText size={14} color="#6B7280" /><Text style={styles.parcelInfoText} numberOfLines={2}>{item.Remarks || 'لا توجد ملاحظات'}</Text></View>
                {item.strDriverRemarks && (<Text style={styles.transactionRemarks} numberOfLines={2}>ملاحظات المندوب: {item.strDriverRemarks}</Text>)}
            </View>
        </View>
        <View style={styles.dateFooter}><Calendar size={12} color="#9CA3AF" /><Text style={styles.dateFooterText}>{formatDateTime(item.CreatedAt)}</Text></View>
    </View>
);

const FilterSection = ({ selectedEntity, setEntityModalVisible, selectedReturnStatus, setStatusModalVisible, handleSearch, loading }) => (
    <View style={styles.modernFilterSection}>
        <TouchableOpacity style={styles.modernDropdown} onPress={() => setEntityModalVisible(true)} activeOpacity={0.7}>
            <View style={styles.modernDropdownContent}>
                <View style={styles.modernDropdownIcon}><StoreIcon color="#FF6B35" size={20} /></View>
                <View style={styles.modernDropdownText}>
                    <Text style={styles.modernDropdownLabel}>المتجر المحدد</Text>
                    <Text style={styles.modernDropdownValue} numberOfLines={1}>
                        {selectedEntity ? selectedEntity.strEntityName : "كل المتاجر"}
                    </Text>
                </View>
                <ChevronDown color="#9CA3AF" size={20} />
            </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.modernDropdown} onPress={() => setStatusModalVisible(true)} activeOpacity={0.7}>
            <View style={styles.modernDropdownContent}>
                <View style={styles.modernDropdownIcon}><PackageX color="#FF6B35" size={20} /></View>
                <View style={styles.modernDropdownText}>
                    <Text style={styles.modernDropdownLabel}>حالة الإرجاع</Text>
                    <Text style={styles.modernDropdownValue} numberOfLines={1}>
                        {selectedReturnStatus ? selectedReturnStatus.Text : "جميع الحالات"}
                    </Text>
                </View>
                <ChevronDown color="#9CA3AF" size={20} />
            </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.modernSearchButton} onPress={handleSearch} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#FFF" size="small" /> : (
                <><Search size={20} color="#FFF" /><Text style={styles.modernSearchButtonText}>بحث عن الطرود</Text></>
            )}
        </TouchableOpacity>
    </View>
);

export default function ReturnedParcelsScreen() {
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [allParcels, setAllParcels] = useState<Parcel[]>([]);
    const { user, setUser } = useDashboard();

    const [entities, setEntities] = useState<EntityForFilter[]>([]);
    const [selectedEntity, setSelectedEntity] = useState<EntityForFilter | null>(null);
    const [entityModalVisible, setEntityModalVisible] = useState(false);
    const [modalSearchQuery, setModalSearchQuery] = useState("");
    const [parcelSearchQuery, setParcelSearchQuery] = useState("");
    const [returnStatuses, setReturnStatuses] = useState<ReturnStatus[]>([]);
    const [selectedReturnStatus, setSelectedReturnStatus] = useState<ReturnStatus | null>(null);
    const [isStatusModalVisible, setStatusModalVisible] = useState(false);
    const [isAlertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSuccess, setAlertSuccess] = useState(false);

    // --- State for WebView Modal ---
    const [webViewVisible, setWebViewVisible] = useState(false);
    const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);

    useEffect(() => {
        const fetchReturnStatuses = async () => {
            try {
                const response = await axios.get(`https://tanmia-group.com:84/courierApi/parcels/GetSelectedStatuses`);
                const fetchedStatuses = Array.isArray(response.data?.Statuses) ? response.data.Statuses : [];
                setReturnStatuses(fetchedStatuses);
            } catch (error) {
                console.error("Error fetching return statuses:", error);
                setReturnStatuses([]);
            }
        };
        fetchReturnStatuses();
    }, []);

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
                    if (sortedStatusIds.length < 5) throw new Error("بيانات غير كافية لتحديد الحالة");

                    const statusIdForFilter = sortedStatusIds[4];

                    const response = await axios.get(`https://tanmia-group.com:84/courierApi/Entity/GetHistoryEntities/${user.userId}/${statusIdForFilter}`);
                    setEntities(response.data || []);
                } catch (error) {
                    console.error("Failed to fetch filter entities:", error);
                    setAlertTitle("خطأ");
                    setAlertMessage("فشل في تحميل قائمة المتاجر للفلتر.");
                    setAlertVisible(true);
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
            if (sortedStatusIds.length < 5) throw new Error("بيانات لوحة التحكم غير كافية");

            const statusId = sortedStatusIds[4];
            const targetId = selectedEntity ? selectedEntity.intEntityCode : parsedUser.userId;

            const response = await axios.get(`https://tanmia-group.com:84/courierApi/parcels/details/${targetId}/${statusId}`);

            let parcels = response.data?.Parcels || [];
            if (selectedReturnStatus?.Value) {
                parcels = parcels.filter(parcel => parcel.intStatusCode.toString() === selectedReturnStatus.Value);
            }
            setAllParcels(parcels);
        } catch (error) {
            console.error("Failed to load returned parcels:", error);
            setAlertTitle("خطأ");
            setAlertMessage(error.message || "فشل تحميل الطرود المرتجعة.");
            setAlertVisible(true);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [user, setUser, selectedEntity, selectedReturnStatus]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        handleSearch();
    }, [handleSearch]);

    // --- Handler for opening the WebView ---
    const handleTrackPress = (parcel: Parcel) => {
        setSelectedParcel(parcel);
        setWebViewVisible(true);
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
    const allStatusesOption: ReturnStatus = { Disabled: false, Group: null, Selected: true, Text: "جميع الحالات", Value: "" };

    return (
        <View style={styles.container}>
            <TopBar title="الطرود المرتجعة" />
            <FlatList
                data={filteredParcels}
                renderItem={({ item }) => <ParcelCard item={item} onTrackPress={handleTrackPress} />}
                keyExtractor={(item) => item.intParcelCode.toString()}
                contentContainerStyle={styles.listContentContainer}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#FF6B35']} tintColor="#FF6B35" />}
                ListHeaderComponent={
                    <>
                        <FilterSection
                            selectedEntity={selectedEntity}
                            setEntityModalVisible={setEntityModalVisible}
                            selectedReturnStatus={selectedReturnStatus}
                            setStatusModalVisible={setStatusModalVisible}
                            handleSearch={handleSearch}
                            loading={loading && !isRefreshing}
                        />
                        {allParcels.length > 0 && !loading && (
                            <View style={styles.resultsHeader}>
                                <Text style={styles.sectionTitle}>الطرود المرتجعة ({filteredParcels.length})</Text>
                                <View style={styles.parcelSearchContainer}>
                                    <Search color="#9CA3AF" size={20} style={styles.modalSearchIcon} />
                                    <TextInput
                                        style={styles.modernModalSearchInput}
                                        placeholder="ابحث في النتائج..."
                                        placeholderTextColor="#9CA3AF"
                                        value={parcelSearchQuery}
                                        onChangeText={setParcelSearchQuery}
                                    />
                                </View>
                            </View>
                        )}
                    </>
                }
                ListEmptyComponent={
                    loading ? <ParcelsSkeleton /> : (
                        <View style={styles.emptyContainer}>
                            <Image source={require("../../assets/images/empty-reports.png")} style={styles.emptyImage} />
                            <Text style={styles.emptyText}>{allParcels.length === 0 ? "لا توجد طرود مرتجعة لعرضها" : ""}</Text>
                            <Text style={styles.emptySubText}>يرجى تحديد فلتر والضغط على بحث</Text>
                        </View>
                    )
                }
            />

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
                                        <TouchableOpacity style={styles.modernModalItem} onPress={() => { setSelectedEntity(item.intEntityCode === 0 ? null : item); setEntityModalVisible(false); setModalSearchQuery(""); }} activeOpacity={0.7}>
                                            <View style={styles.modalItemContent}>
                                                <Text style={[styles.modernModalItemText, (selectedEntity?.intEntityCode === item.intEntityCode || (!selectedEntity && item.intEntityCode === 0)) && styles.modalItemSelected]}>{item.strEntityName}</Text>
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

            <Modal visible={isStatusModalVisible} animationType="fade" transparent={true} onRequestClose={() => setStatusModalVisible(false)}>
                <TouchableWithoutFeedback onPress={() => setStatusModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <SafeAreaView style={styles.modernModalContent}>
                                <Text style={styles.modalTitle}>اختيار حالة الإرجاع</Text>
                                <FlatList
                                    data={[allStatusesOption, ...returnStatuses]}
                                    keyExtractor={(item) => item.Value.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={styles.modernModalItem} onPress={() => { setSelectedReturnStatus(item.Value === "" ? null : item); setStatusModalVisible(false); }} activeOpacity={0.7}>
                                            <View style={styles.modalItemContent}>
                                                <Text style={[styles.modernModalItemText, (selectedReturnStatus?.Value === item.Value || (!selectedReturnStatus && item.Value === "")) && styles.modalItemSelected]}>{item.Text}</Text>
                                            </View>
                                            {(selectedReturnStatus?.Value === item.Value || (!selectedReturnStatus && item.Value === "")) && (<Check color="#FF6B35" size={20} />)}
                                        </TouchableOpacity>
                                    )}
                                />
                            </SafeAreaView>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* --- WebView Modal for Tracking --- */}
            <Modal visible={webViewVisible} animationType="slide" onRequestClose={() => setWebViewVisible(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setWebViewVisible(false)} style={styles.modalBackButton}>
                            <ChevronLeft size={24} color="#1F2937" />
                        </TouchableOpacity>
                        <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                            {selectedParcel ? `تتبع: ${selectedParcel.ReferenceNo}` : 'تتبع الشحنة'}
                        </Text>
                        <View style={{ width: 40 }} />
                    </View>
                    {selectedParcel && (
                        <WebView
                            source={{ uri: `https://tanmia-group.com:84/admin/tracking/DirectReturnParcel?trackingNumber=${selectedParcel.ReferenceNo}` }}
                            style={{ flex: 1 }}
                            startInLoadingState={true}
                            renderLoading={() => (
                                <ActivityIndicator
                                    color="#F59E0B" // Match the screen's theme color
                                    size="large"
                                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                                />
                            )}
                        />
                    )}
                </SafeAreaView>
            </Modal>

            <CustomAlert isVisible={isAlertVisible} title={alertTitle} message={alertMessage} confirmText="حسنًا" onConfirm={() => setAlertVisible(false)} success={alertSuccess} cancelText={undefined} onCancel={undefined} />
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

    resultsHeader: { marginBottom: 10 },
    sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937", marginBottom: 16, textAlign: "right" },
    parcelSearchContainer: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "#E5E7EB" },
    modernModalSearchInput: { flex: 1, color: "#1F2937", fontSize: 16, paddingVertical: Platform.OS === "ios" ? 12 : 8, textAlign: "right" },

    modernTransactionItem: { backgroundColor: "#FFFFFF", borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#F3F4F6" },
    transactionHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    parcelHeaderContent: { flexDirection: "row-reverse", alignItems: "center", gap: 12, flex: 1 },
    parcelIconBackground: { width: 40, height: 40, borderRadius: 8, justifyContent: "center", alignItems: "center" },
    parcelNameContainer: { flex: 1 },
    transactionDate: { color: "#1F2937", fontSize: 16, fontWeight: "600", textAlign: "right", marginBottom: 2 },
    runningTotalLabel: { color: "#6B7280", fontSize: 12, textAlign: "right" },
    parcelTotal: { fontSize: 16, fontWeight: "bold" },
    parcelDetailsRow: { flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
    parcelColumn: { flex: 1, paddingHorizontal: 6 },
    parcelInfoRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8, marginBottom: 6 },
    parcelInfoText: { color: "#4B5563", fontSize: 14, flex: 1, textAlign: "right" },
    transactionRemarks: { color: "#9CA3AF", fontSize: 12, fontStyle: "italic", textAlign: "right", marginTop: 4 },
    dateFooter: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start', marginTop: 12, gap: 6 },
    dateFooterText: { fontSize: 12, color: '#9CA3AF' },

    emptyContainer: { backgroundColor: "#FFFFFF", borderRadius: 8, paddingVertical: 40, paddingHorizontal: 20, alignItems: "center", marginTop: 20 },
    emptyImage: { width: 200, height: 120, marginBottom: 16, opacity: 0.7 },
    emptyText: { color: "#374151", fontSize: 18, fontWeight: "600", marginBottom: 4 },
    emptySubText: { color: "#6B7280", fontSize: 14, textAlign: "center", lineHeight: 20 },
    cardSkeleton: { height: 180, width: "100%", borderRadius: 8, marginBottom: 12 },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
    modernModalContent: { backgroundColor: "#FFFFFF", borderRadius: 8, width: "100%", maxHeight: "70%", padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1F2937", textAlign: "right", marginBottom: 16 },
    modernModalSearchContainer: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, borderWidth: 1, borderColor: "#E5E7EB" },
    modalSearchIcon: { marginLeft: 8 },
    modernModalItem: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
    modalItemContent: { flex: 1 },
    modernModalItemText: { color: "#1F2937", fontSize: 16, fontWeight: "500", textAlign: "right", marginBottom: 2 },
    modalItemCode: { color: "#6B7280", fontSize: 12, textAlign: "right" },
    modalItemSelected: { color: "#FF6B35", fontWeight: "bold" },

    // --- Styles for WebView Modal Header ---
    modalHeader: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    modalBackButton: {
        padding: 10,
    },
    modalHeaderTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
        flex: 1,
        marginHorizontal: 10,
    },
});