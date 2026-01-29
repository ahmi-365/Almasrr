import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    SafeAreaView,
    TouchableWithoutFeedback,
    TextInput,
    Platform,
    RefreshControl,
    Image,
    ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ChevronDown, Check, Search, MapPin, DollarSign } from 'lucide-react-native';
import CustomAlert from '../../components/CustomAlert';
import TopBar from '../../components/Entity/TopBarNew'; // Import the new TopBar component
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';

const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);

interface CityPrice {
    strCityName: string;
    DcOfficePrice: number;
    DcInsideCityPrice: number;
    DcOutSkirtPrice: number;
}

// Enhanced Skeleton loader with row-wise structure
const CityRatesSkeleton = () => {
    const shimmerColors = ["#FDF1EC", "#FEF8F5", "#FDF1EC"];

    // Table Header Skeleton
    const TableHeaderSkeleton = () => (
        <View style={styles.tableHeaderSkeleton}>

            <ShimmerPlaceHolder
                style={[styles.headerCellSkeleton, styles.cityColumnSkeleton]}
                shimmerColors={shimmerColors}
            />
            <ShimmerPlaceHolder
                style={[styles.headerCellSkeleton, styles.priceColumnSkeleton]}
                shimmerColors={shimmerColors}
            />
            <ShimmerPlaceHolder
                style={[styles.headerCellSkeleton, styles.priceColumnSkeleton]}
                shimmerColors={shimmerColors}
            />
            <ShimmerPlaceHolder
                style={[styles.headerCellSkeleton, styles.priceColumnSkeleton]}
                shimmerColors={shimmerColors}
            />
        </View>
    );

    // Table Row Skeleton
    const TableRowSkeleton = ({ isEven }) => (
        <View style={[styles.tableRowSkeleton, isEven && styles.evenRowSkeleton]}>
            {/* City Cell Skeleton */}
            <View style={[styles.cellSkeleton, styles.cityColumnSkeleton]}>
                <View style={styles.cityContentSkeleton}>
                    <ShimmerPlaceHolder
                        style={styles.cityIconSkeleton}
                        shimmerColors={shimmerColors}
                    />
                    <ShimmerPlaceHolder
                        style={styles.cityNameSkeleton}
                        shimmerColors={shimmerColors}
                    />
                </View>
            </View>

            {/* Price Cells Skeleton */}
            <View style={[styles.cellSkeleton, styles.priceColumnSkeleton]}>
                <ShimmerPlaceHolder
                    style={styles.priceSkeleton}
                    shimmerColors={shimmerColors}
                />
            </View>

            <View style={[styles.cellSkeleton, styles.priceColumnSkeleton]}>
                <ShimmerPlaceHolder
                    style={styles.priceSkeleton}
                    shimmerColors={shimmerColors}
                />
            </View>

            <View style={[styles.cellSkeleton, styles.priceColumnSkeleton]}>
                <ShimmerPlaceHolder
                    style={styles.priceSkeleton}
                    shimmerColors={shimmerColors}
                />
            </View>
        </View>
    );

    return (
        <View style={styles.skeletonContent}>
            {/* Filter Section Skeleton */}
            <View style={styles.filterSkeleton}>
                <ShimmerPlaceHolder
                    style={styles.filterTitleSkeleton}
                    shimmerColors={shimmerColors}
                />
                <ShimmerPlaceHolder
                    style={styles.dropdownSkeleton}
                    shimmerColors={shimmerColors}
                />
                <ShimmerPlaceHolder
                    style={styles.sectionTitleSkeleton}
                    shimmerColors={shimmerColors}
                />
            </View>

            {/* Enhanced Table Skeleton */}
            <View style={styles.tableSkeletonContainer}>
                <TableHeaderSkeleton />
                <ScrollView style={styles.tableSkeletonScrollView}>
                    {/* Generate 8 skeleton rows */}
                    {[...Array(8)].map((_, index) => (
                        <TableRowSkeleton
                            key={index}
                            isEven={index % 2 === 0}
                        />
                    ))}
                </ScrollView>
            </View>
        </View>
    );
};

// Table Header Component
const TableHeader = () => (
    <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.cityColumn]}>المدينة</Text>
        <Text style={[styles.tableHeaderText, styles.priceColumn]}>المكتب</Text>
        <Text style={[styles.tableHeaderText, styles.priceColumn]}>داخل المدينة</Text>
        <Text style={[styles.tableHeaderText, styles.priceColumn]}>الضواحي</Text>
    </View>
);

// Table Row Component
const TableRow = ({ item, index }: { item: CityPrice; index: number }) => (
    <View style={[styles.tableRow, index % 2 === 0 && styles.evenRow]}>
        <View style={styles.cityCell}>
            <View style={styles.cityNameContainer}>
                <MapPin color="#FF6B35" size={16} />
                <Text style={styles.cityNameText} numberOfLines={2}>
                    {item.strCityName}
                </Text>
            </View>
        </View>

        <View style={styles.priceCell}>
            <Text style={styles.priceCellText}>
                {item.DcOfficePrice?.toFixed(2) ?? 'N/A'}
            </Text>
        </View>

        <View style={styles.priceCell}>
            <Text style={styles.priceCellText}>
                {item.DcInsideCityPrice?.toFixed(2) ?? 'N/A'}
            </Text>
        </View>

        <View style={styles.priceCell}>
            <Text style={styles.priceCellText}>
                {item.DcOutSkirtPrice?.toFixed(2) ?? 'N/A'}
            </Text>
        </View>
    </View>
);

// Table Component
const PriceTable = ({ data }: { data: CityPrice[] }) => (
    <View style={styles.tableContainer}>
        <TableHeader />
        <ScrollView
            style={styles.tableScrollView}
            showsVerticalScrollIndicator={true}
            indicatorStyle="default"
            scrollIndicatorInsets={{ right: 2 }}
        >
            {data.map((item, index) => (
                <TableRow
                    key={`${item.strCityName}-${index}`}
                    item={item}
                    index={index}
                />
            ))}
        </ScrollView>
    </View>
);

export default function CityRatesScreen() {
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [allPrices, setAllPrices] = useState<CityPrice[]>([]);
    const [filteredPrices, setFilteredPrices] = useState<CityPrice[]>([]);
    const [filterCities, setFilterCities] = useState<string[]>(['الكل']);
    const [selectedCity, setSelectedCity] = useState<string>('الكل');
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Custom Alert states
    const [isAlertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertConfirmColor, setAlertConfirmColor] = useState('#E74C3C');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const userData = await AsyncStorage.getItem('user');
            if (!userData) {
                setLoading(false);
                return;
            }

            const parsedUser = JSON.parse(userData);
            const userCityCode = parsedUser?.intCityCode;

            if (!userCityCode) {
                setLoading(false);
                return;
            }

            const response = await axios.get(`http://tanmia-group.com:90/courierApi/City/GetCityPrices/${userCityCode}`);
            const priceData: CityPrice[] = response.data || [];

            setAllPrices(priceData);
            setFilteredPrices(priceData);

            const cityNames = ['الكل', ...new Set(priceData.map(p => p.strCityName).filter(name => name))].sort();
            setFilterCities(cityNames);
        } catch (error) {
            console.error("Failed to fetch city prices:", error);
            setAlertTitle('خطأ');
            setAlertMessage('فشل في جلب بيانات الأسعار.');
            setAlertConfirmColor('#E74C3C');
            setAlertVisible(true);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        setLoading(true);
        fetchData();
    }, [fetchData]));

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchData();
    }, [fetchData]);

    const displayedCities = useMemo(() => {
        if (!searchQuery) {
            return filterCities;
        }
        return filterCities.filter(city =>
            city.toLowerCase().includes(searchQuery.toLowerCase()) || city === 'الكل'
        );
    }, [searchQuery, filterCities]);

    const handleFilterChange = (city: string) => {
        setSelectedCity(city);
        setModalVisible(false);
        setSearchQuery('');
        if (city === 'الكل') {
            setFilteredPrices(allPrices);
        } else {
            setFilteredPrices(allPrices.filter(p => p.strCityName === city));
        }
    };

    const renderFilterSection = () => (
        <View style={styles.modernFilterSection}>
            <Text style={styles.filterSectionTitle}>تصفية أسعار المدن</Text>

            {/* City Filter Dropdown */}
            <TouchableOpacity
                style={styles.modernDropdown}
                onPress={() => {
                    setSearchQuery('');
                    setModalVisible(true);
                }}
            >
                <View style={styles.dropdownContent}>
                    <Text style={styles.dropdownLabel}>اختر المدينة</Text>
                    <View style={styles.dropdownValueContainer}>
                        <Text style={styles.dropdownValue}>{selectedCity}</Text>
                        <ChevronDown color="#6B7280" size={20} />
                    </View>
                </View>
            </TouchableOpacity>

            {filteredPrices.length > 0 && (
                <Text style={styles.sectionTitle}>
                    أسعار المدن ({filteredPrices.length})
                </Text>
            )}
        </View>
    );

    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Image
                source={require("../../assets/images/empty-reports.png")}
                style={styles.emptyImage}
            />
            <Text style={styles.emptyText}>
                {allPrices.length === 0
                    ? "لا توجد بيانات أسعار متاحة"
                    : "لم يتم العثور على نتائج"}
            </Text>
            {allPrices.length === 0 && (
                <Text style={styles.emptySubText}>
                    يرجى المحاولة مرة أخرى لاحقاً
                </Text>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Use the new TopBar component */}
            {!loading && <TopBar title="أسعار المدن" />}

            <ScrollView
                style={styles.scrollContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={['#FF6B35']}
                        tintColor="#FF6B35"
                    />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 120 }}
            >
                {!loading && renderFilterSection()}

                {!loading && filteredPrices.length > 0 && (
                    <PriceTable data={filteredPrices} />
                )}

                {!loading && filteredPrices.length === 0 && renderEmptyComponent()}
            </ScrollView>

            {loading && (
                <View style={styles.skeletonContainer}>
                    {/* Render the TopBar here as well */}
                    <TopBar title="أسعار المدن" />
                    <CityRatesSkeleton />
                </View>
            )}

            {/* City Filter Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <SafeAreaView style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>اختر المدينة</Text>
                            </View>

                            <View style={styles.modalSearchContainer}>
                                <Search color="#9CA3AF" size={20} style={styles.modalSearchIcon} />
                                <TextInput
                                    style={styles.modalSearchInput}
                                    placeholder="ابحث عن مدينة..."
                                    placeholderTextColor="#9CA3AF"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>

                            <FlatList
                                data={displayedCities}
                                keyExtractor={item => item}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.modalItem}
                                        onPress={() => handleFilterChange(item)}
                                    >
                                        <Text style={[
                                            styles.modalItemText,
                                            selectedCity === item && styles.modalItemSelected
                                        ]}>
                                            {item}
                                        </Text>
                                        {selectedCity === item && <Check color="#FF6B35" size={20} />}
                                    </TouchableOpacity>
                                )}
                            />
                        </SafeAreaView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Custom Alert */}
            <CustomAlert
                isVisible={isAlertVisible}
                title={alertTitle}
                message={alertMessage}
                confirmText="حسنًا"
                cancelText=""
                onConfirm={() => setAlertVisible(false)}
                onCancel={() => setAlertVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA"
    },

    scrollContainer: {
        flex: 1,
    },

    // Filter Section
    modernFilterSection: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        padding: 20,
        marginBottom: 20,
        marginTop: 10,
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1F2937",
        marginTop: 16,
        marginBottom: 0,
        textAlign: "right",
    },

    // Modern Dropdown
    modernDropdown: {
        backgroundColor: "#F9FAFB",
        borderColor: "#E5E7EB",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    dropdownContent: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownLabel: {
        color: '#6B7280',
        fontSize: 14,
        marginRight: 10
    },
    dropdownValueContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8
    },
    dropdownValue: {
        color: '#1F2937',
        fontSize: 16,
        fontWeight: '600'
    },

    // Table Styles
    tableContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },

    tableHeader: {
        flexDirection: 'row-reverse',
        backgroundColor: '#FF6B35',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },

    tableHeaderText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },

    cityColumn: {
        flex: 2,
        paddingHorizontal: 4,
    },

    priceColumn: {
        flex: 1,
        paddingHorizontal: 4,
    },

    tableScrollView: {
        flex: 1,
    },

    tableRow: {
        flexDirection: 'row-reverse',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        minHeight: 50,
        alignItems: 'center',
    },

    evenRow: {
        backgroundColor: '#F9FAFB',
    },

    cityCell: {
        flex: 2,
        paddingHorizontal: 4,
        justifyContent: 'center',
    },

    cityNameContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },

    cityNameText: {
        color: '#1F2937',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'right',
        flex: 1,
    },

    priceCell: {
        flex: 1,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },

    priceCellText: {
        color: '#1F2937',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },

    // Empty State
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
    emptySubText: {
        color: "#6B7280",
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        width: '100%',
        maxHeight: '70%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    modalHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    modalTitle: {
        color: "#1F2937",
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
    },
    modalSearchContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        margin: 20,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    modalSearchInput: {
        flex: 1,
        color: '#1F2937',
        fontSize: 16,
        paddingVertical: Platform.OS === "ios" ? 12 : 8,
        textAlign: 'right'
    },
    modalSearchIcon: {
        marginLeft: 8
    },
    modalItem: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    modalItemText: {
        color: '#1F2937',
        fontSize: 16
    },
    modalItemSelected: {
        color: '#FF6B35',
        fontWeight: 'bold'
    },

    // Enhanced Skeleton Styles
    skeletonContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#F8F9FA",
        zIndex: 1000,
    },
    skeletonContent: {
        paddingHorizontal: 12,
        paddingTop: 10,
        flex: 1,
    },
    filterSkeleton: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        padding: 20,
        marginBottom: 20,
        marginTop: 10, // Adjusted this value
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    filterTitleSkeleton: {
        height: 22,
        borderRadius: 4,
        marginBottom: 16,
        width: '60%',
        alignSelf: 'flex-end',
    },
    dropdownSkeleton: {
        height: 50,
        borderRadius: 8,
        marginBottom: 16,
    },
    sectionTitleSkeleton: {
        height: 22,
        borderRadius: 4,
        width: '40%',
        alignSelf: 'flex-end',
    },

    // Table Skeleton Container
    tableSkeletonContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
        height: 400,
    },

    // Table Header Skeleton
    tableHeaderSkeleton: {
        flexDirection: 'row-reverse',
        backgroundColor: '#FDF1EC',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },

    headerCellSkeleton: {
        height: 16,
        borderRadius: 4,
        marginHorizontal: 4,
    },

    // Table Row Skeleton
    tableRowSkeleton: {
        flexDirection: 'row-reverse',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        minHeight: 50,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },

    evenRowSkeleton: {
        backgroundColor: '#F9FAFB',
    },

    tableSkeletonScrollView: {
        flex: 1,
    },

    // Cell Skeletons
    cellSkeleton: {
        paddingHorizontal: 4,
        justifyContent: 'center',
    },

    cityColumnSkeleton: {
        flex: 2,
    },

    priceColumnSkeleton: {
        flex: 1,
    },

    // City Content Skeleton
    cityContentSkeleton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
    },

    cityIconSkeleton: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },

    cityNameSkeleton: {
        height: 14,
        borderRadius: 4,
        flex: 1,
        maxWidth: 120,
    },

    // Price Skeleton
    priceSkeleton: {
        height: 14,
        width: 50,
        borderRadius: 4,
        alignSelf: 'center',
    },
});