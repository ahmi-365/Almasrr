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
    Package,
    Box,
    Calendar,
    User,
    ChevronDown,
    Check,
    Store as StoreIcon,
} from "lucide-react-native";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
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

const ParcelCard = ({ item }: { item: Parcel }) => (
    <View style={styles.premiumCard}>
        {/* MODIFICATION: Themed for "At Branch" status */}
        <View style={[styles.premiumCardHeader, { backgroundColor: '#E67E22' }]}>
            <View style={styles.premiumHeaderLeft}>
                <View style={styles.premiumIconBackground}>
                    <Package size={18} color="#FFF" />
                </View>
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
                {item.RecipientName && (
                    <View style={styles.premiumInfoRow}>
                        <Text style={styles.premiumInfoLabel}>الاسم:</Text>
                        <Text style={styles.premiumInfoValue}>{item.RecipientName}</Text>
                    </View>
                )}
                <View style={styles.premiumInfoRow}>
                    <Text style={styles.premiumInfoLabel}>الهاتف:</Text>
                    <Text style={styles.premiumInfoValue}>{item.RecipientPhone}</Text>
                </View>
            </View>

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
                {/* MODIFICATION: Themed for "At Branch" status */}
                <Text style={[styles.premiumTotalValue, { color: '#E67E22' }]}>{item.Total.toFixed(2)} د.ل</Text>
            </View>
        </View>
    </View>
);

const FilterSection = ({ selectedEntity, setEntityModalVisible, handleSearch, loading }) => (
    <View style={styles.modernFilterSection}>
        <TouchableOpacity style={styles.modernDropdown} onPress={() => setEntityModalVisible(true)} activeOpacity={0.7}>
            <View style={styles.modernDropdownContent}>
                <View style={styles.modernDropdownIcon}><StoreIcon color="#FF6B35" size={20} /></View>
                <View style={styles.modernDropdownText}>
                    <Text style={styles.modernDropdownLabel}>المتجر المحدد</Text>
                    <Text style={styles.modernDropdownValue} numberOfLines={1}>{selectedEntity ? selectedEntity.strEntityName : "كل المتاجر"}</Text>
                </View>
                <ChevronDown color="#9CA3AF" size={20} />
            </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modernSearchButton} onPress={handleSearch} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#FFF" size="small" /> : (<><Search size={20} color="#FFF" /><Text style={styles.modernSearchButtonText}>بحث عن الطرود</Text></>)}
        </TouchableOpacity>
    </View>
);

export default function AtBranchScreen() {
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
                    // MODIFICATION: Check for the 2nd count
                    if (sortedStatusIds.length < 2) throw new Error("بيانات غير كافية لتحديد الحالة");

                    // MODIFICATION: Use the 2nd count for the filter API
                    const statusIdForFilter = sortedStatusIds[1];

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
            // MODIFICATION: Check for the 2nd count
            if (sortedStatusIds.length < 2) throw new Error("بيانات لوحة التحكم غير كافية");

            // MODIFICATION: Use the 2nd count (e.g., 1)
            const statusId = sortedStatusIds[1];
            const targetId = selectedEntity ? selectedEntity.intEntityCode : parsedUser.userId;

            const response = await axios.get(`https://tanmia-group.com:84/courierApi/parcels/details/${targetId}/${statusId}`);
            setAllParcels(response.data?.Parcels || []);
        } catch (error) {
            console.error("Failed to load at-branch parcels:", error);
            setAlertTitle("خطأ");
            setAlertMessage(error.message || "فشل تحميل الطرود التي في الفرع.");
            setAlertVisible(true);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [user, setUser, selectedEntity]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        handleSearch();
    }, [handleSearch]);

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
            {/* MODIFICATION: Updated Title */}
            <TopBar title="في الفرع" />
            <FlatList
                data={filteredParcels}
                renderItem={({ item }) => <ParcelCard item={item} />}
                keyExtractor={(item) => item.intParcelCode.toString()}
                contentContainerStyle={styles.listContentContainer}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#FF6B35']} tintColor="#FF6B35" />}
                ListHeaderComponent={
                    <>
                        <FilterSection selectedEntity={selectedEntity} setEntityModalVisible={setEntityModalVisible} handleSearch={handleSearch} loading={loading && !isRefreshing} />
                        {allParcels.length > 0 && !loading && (
                            <View style={styles.resultsHeader}>
                                {/* MODIFICATION: Updated Section Title */}
                                <Text style={styles.sectionTitle}>الطرود في الفرع ({filteredParcels.length})</Text>
                                <View style={styles.parcelSearchContainer}>
                                    <Search color="#9CA3AF" size={20} style={styles.modalSearchIcon} />
                                    <TextInput style={styles.modernModalSearchInput} placeholder="ابحث في النتائج..." placeholderTextColor="#9CA3AF" value={parcelSearchQuery} onChangeText={setParcelSearchQuery} />
                                </View>
                            </View>
                        )}
                    </>
                }
                ListEmptyComponent={
                    loading ? <ParcelsSkeleton /> : (
                        <View style={styles.emptyContainer}>
                            <Image source={require("../../assets/images/empty-reports.png")} style={styles.emptyImage} />
                            {/* MODIFICATION: Updated Empty State Text */}
                            <Text style={styles.emptyText}>{allParcels.length === 0 ? "لا توجد طرود في الفرع لعرضها" : ""}</Text>
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

    premiumCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, },
    premiumCardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12, },
    premiumHeaderLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, },
    premiumIconBackground: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
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
    premiumCardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#F9FAFB', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, },
    premiumTotalLabel: { color: '#1F2937', fontSize: 16, fontWeight: '600' },
    premiumTotalValue: { fontSize: 20, fontWeight: 'bold' },

    emptyContainer: { backgroundColor: "#FFFFFF", borderRadius: 8, paddingVertical: 40, paddingHorizontal: 20, alignItems: "center", marginTop: 20 },
    emptyImage: { width: 200, height: 120, marginBottom: 16, opacity: 0.7 },
    emptyText: { color: "#374151", fontSize: 18, fontWeight: "600", marginBottom: 4 },
    emptySubText: { color: "#6B7280", fontSize: 14, textAlign: "center", lineHeight: 20 },
    cardSkeleton: { height: 300, width: "100%", borderRadius: 12, marginBottom: 12 },

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
});