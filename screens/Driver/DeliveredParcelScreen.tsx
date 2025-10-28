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
    TouchableOpacity,
    TextInput,
    Platform,
    FlatList,
    RefreshControl,
    Image,
    Dimensions,
} from "react-native";
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
    SendHorizonal,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import { useDashboard } from "../../Context/DashboardContext";
import CustomAlert from "../../components/CustomAlert";
import TopBar from "../../components/Entity/TopBarNew";

const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);



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

// Helper function to format date and time
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
        return isoString; // Fallback to original string if format is invalid
    }
};

const ParcelCard = ({ item }: { item: Parcel }) => (
    <View style={styles.modernTransactionItem}>
        {/* Header */}
        <View style={styles.transactionHeader}>
            <View style={styles.parcelHeaderContent}>
                {/* Remember to adjust the icon/color for each screen */}
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

        <View style={[styles.parcelNameContainer, { marginTop: 12 }]}>
            {item.strEntityName && (
                <View style={styles.parcelInfoRow}>
                    <Text style={styles.dateFooterText}>اسم المتجر :</Text>
                    <Text style={styles.parcelInfoText}>{item.strEntityName}</Text>
                </View>
            )}
        </View>


        {/* Details Section */}
        <View style={styles.parcelDetailsRow}>
            {/* Left Column */}
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

            {/* Right Column (DATE IS REMOVED FROM HERE) */}
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

        {/* Date Footer (Placed as the last item) */}
        <View style={styles.dateFooter}>
            <Calendar size={12} color="#9CA3AF" />
            <Text style={styles.dateFooterText}>{formatDateTime(item.CreatedAt)}</Text>
        </View>
    </View>
);

export default function DeliveredParcelScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [allParcels, setAllParcels] = useState<Parcel[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const { user, setUser } = useDashboard();

    // State for Custom Alert
    const [isAlertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSuccess, setAlertSuccess] = useState(false);

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
            if (countKeys.length < 2) { // Need at least two counts for this screen
                throw new Error("لا يمكن تحديد معرف حالة الطرود المسلمة");
            }
            const sortedStatusIds = countKeys
                .map(key => parseInt(key.slice(5), 10))
                .filter(num => !isNaN(num))
                .sort((a, b) => a - b);

            if (sortedStatusIds.length < 2) {
                throw new Error("بيانات لوحة التحكم غير كافية لجلب الطرود المسلمة");
            }

            // MODIFICATION: Take the SECOND status ID from the sorted list (e.g., 7)
            const statusId = sortedStatusIds[1];

            const response = await axios.get(
                `https://tanmia-group.com:84/courierApi/Driverparcels/details/${parsedUser.userId}/${statusId}`
            );

            if (response.data && response.data.Parcels) {
                setAllParcels(response.data.Parcels);
            } else {
                setAllParcels([]);
            }
        } catch (error) {
            console.error("Failed to load delivered parcels:", error);
            setAlertTitle("خطأ");
            setAlertMessage(error.message || "فشل في تحميل الطرود المسلمة.");
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
                    ? "لا توجد طرود مسلمة حاليًا"
                    : "لم يتم العثور على نتائج"}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* MODIFICATION: Updated Title */}

            <TopBar title="الطرود المسلمة" />

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
                                الطرود المسلمة ({filteredParcels.length})
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
        backgroundColor: "#27AE60", // Green for delivered
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
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
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
        fontWeight: "500",
        textAlign: "right",
    },
    transactionRemarks: {
        color: "#9CA3AF",
        fontSize: 12,
        fontStyle: "italic",
        textAlign: "right",
        marginTop: 4,
    },
    emptyContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        paddingVertical: 40,
        paddingHorizontal: 20,
        alignItems: "center",
        marginTop: 20,
    },
    emptyImage: {
        width: 200,
        height: 120,
        marginBottom: 16,
        opacity: 0.7
    },
    emptyText: {
        color: "#374151",
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 4,
        textAlign: "center",
    },
    searchSkeleton: {
        height: 180,
        borderRadius: 8,
        width: "100%",
        marginBottom: 12,
    },
    cardSkeleton: {
        height: 180, // Adjusted height since footer is removed
        width: "100%",
        borderRadius: 8,
        marginBottom: 12,
    },

    dateFooter: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'flex-start', // Aligns to the right
        marginTop: 12,
        gap: 6,
    },
    dateFooterText: {
        fontSize: 12,
        color: '#9CA3AF', // Lighter color for metadata
    },
});