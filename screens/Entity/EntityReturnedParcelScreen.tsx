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
    Alert,
    PermissionsAndroid,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {
    Search,
    Phone,
    FileText,
    PackageX,
    Box,
    Calendar,
    User,
    ChevronDown,
    Check,
    Store as StoreIcon,
    ChevronLeft,
    CreditCard,
    Download,
    X,
} from "lucide-react-native";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import { WebView } from "react-native-webview";
import { useDashboard } from "../../Context/DashboardContext";
import CustomAlert from "../../components/CustomAlert";
import TopBar from "../../components/Entity/TopBarNew";
import FileViewer from 'react-native-file-viewer';
// PDF Download Libraries
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import notifee, { EventType } from '@notifee/react-native';

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

interface Invoice {
    intEntityCode: number;
    strInvoiceNo: string;
    strEntityName: string;
    AssignedDate: string;
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
    intStatusCode: number;
    strDriverPhone?: string;
    bolIsOnlinePayment?: boolean;
    strOnlinePaymentStatus?: string | null;
}

interface ReturnStatus {
    Disabled: boolean; Group: any; Selected: boolean; Text: string; Value: string;
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

const openDialer = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
};

const ParcelCard = ({ item, onTrackPress }: { item: Parcel, onTrackPress: (parcel: Parcel) => void }) => {
    return (
        <View style={styles.modernTransactionItem}>
            <TouchableOpacity onPress={() => onTrackPress(item)} activeOpacity={0.7}>
                <View style={styles.transactionHeader}>
                    <View style={styles.parcelHeaderContent}>
                        <View style={[styles.parcelIconBackground, { backgroundColor: '#F59E0B' }]}>
                            <PackageX color="#fff" size={20} />
                        </View>
                        <View style={styles.parcelNameContainer}>
                            <Text style={styles.transactionDate}>{item.ReferenceNo}</Text>
                            <Text style={styles.runningTotalLabel}>{item.CityName}</Text>
                        </View>
                    </View>
                    <View style={styles.parcelHeaderRight}>
                        <Text style={[styles.parcelTotal, { color: '#E74C3C' }]}>{item.Total.toFixed(2)} د.ل</Text>
                    </View>
                </View>
            </TouchableOpacity>

            <View style={styles.parcelDetailsRow}>
                <View style={styles.parcelColumn}>
                    {item.RecipientName && (
                        <View style={styles.parcelInfoRow}><User size={14} color="#6B7280" /><Text style={styles.parcelInfoText}>{item.RecipientName}</Text></View>
                    )}
                    <TouchableOpacity onPress={() => openDialer(item.RecipientPhone)} style={styles.parcelInfoRow}>
                        <Phone size={14} color="#6B7280" />
                        <Text style={styles.parcelInfoText}>{item.RecipientPhone}</Text>
                    </TouchableOpacity>

                    {item.strDriverPhone ? (
                        <TouchableOpacity onPress={() => openDialer(item.strDriverPhone!)} style={[styles.parcelInfoRow, { marginTop: 4 }]}>
                            <Phone size={14} color="#F59E0B" />
                            <Text style={[styles.parcelInfoText, { color: '#F59E0B', fontWeight: 'bold' }]}>رقم المندوب: {item.strDriverPhone}</Text>
                        </TouchableOpacity>
                    ) : null}

                    <View style={styles.parcelInfoRow}><Box size={14} color="#6B7280" /><Text style={styles.parcelInfoText}>الكمية: {item.Quantity}</Text></View>
                </View>

                <View style={styles.parcelColumn}>
                    <View style={styles.parcelInfoRow}><FileText size={14} color="#6B7280" /><Text style={styles.parcelInfoText}>{item.Remarks || 'لا توجد ملاحظات'}</Text></View>

                    {item.bolIsOnlinePayment && (
                        <View style={[styles.parcelInfoRow, { marginTop: 4 }]}>
                            <CreditCard size={14} color="#6B7280" />
                            <View style={styles.paymentContainer}>
                                <Text style={styles.paymentLabel}>الدفع الإلكتروني:</Text>
                                <View style={[styles.paymentBadge, item.strOnlinePaymentStatus === "Success" ? styles.paidBadge : styles.unpaidBadge]}>
                                    <Text style={item.strOnlinePaymentStatus === "Success" ? styles.paidText : styles.unpaidText}>
                                        {item.strOnlinePaymentStatus === "Success" ? "مدفوع" : "غير مدفوع"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {item.strDriverRemarks && (<Text style={styles.transactionRemarks}>ملاحظات المندوب: {item.strDriverRemarks}</Text>)}
                </View>
            </View>
            <View style={styles.dateFooter}><Calendar size={12} color="#9CA3AF" /><Text style={styles.dateFooterText}>{formatDateTime(item.CreatedAt)}</Text></View>
        </View>
    );
};

const FilterSection = ({ selectedEntity, setEntityModalVisible, selectedReturnStatus, setStatusModalVisible, handleSearch, loading, onInvoicePress, loadingInvoices }) => (
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

        <TouchableOpacity style={styles.modernDropdown} onPress={() => setStatusModalVisible(true)} activeOpacity={0.7}>
            <View style={styles.modernDropdownContent}>
                <View style={styles.modernDropdownIcon}><PackageX color="#FF6B35" size={20} /></View>
                <View style={styles.modernDropdownText}>
                    <Text style={styles.modernDropdownLabel}>حالة الإرجاع</Text>
                    <Text style={styles.modernDropdownValue}>{selectedReturnStatus ? selectedReturnStatus.Text : "جميع الحالات"}</Text>
                </View>
                <ChevronDown color="#9CA3AF" size={20} />
            </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.modernSearchButton} onPress={handleSearch} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#FFF" size="small" /> : (
                <><Search size={20} color="#FFF" /><Text style={styles.modernSearchButtonText}>بحث عن الطرود</Text></>
            )}
        </TouchableOpacity>

        <TouchableOpacity
            style={[styles.globalInvoiceButton, loadingInvoices && { opacity: 0.7 }]}
            onPress={onInvoicePress}
            disabled={loadingInvoices}
            activeOpacity={0.8}
        >
            {loadingInvoices ? (
                <ActivityIndicator color="#FFF" size="small" />
            ) : (
                <>
                    <FileText size={18} color="#FFF" />
                    <Text style={styles.globalInvoiceButtonText}>عرض الفواتير المرتجعة</Text>
                </>
            )}
        </TouchableOpacity>
    </View>
);

export default function ReturnedParcelsScreen() {
    const [loading, setLoading] = useState(false);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [allParcels, setAllParcels] = useState<Parcel[]>([]);
    const { user, setUser } = useDashboard();
    const [isInvoiceModalVisible, setInvoiceModalVisible] = useState(false);
    const [invoiceData, setInvoiceData] = useState<Invoice[]>([]);
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

    const [webViewVisible, setWebViewVisible] = useState(false);
    const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
    const [initialFetchDone, setInitialFetchDone] = useState(false);

    const [invoiceSearchQuery, setInvoiceSearchQuery] = useState(""); // NEW: Search State

    const filteredInvoices = useMemo(() => {
        if (!invoiceSearchQuery) return invoiceData;
        const query = invoiceSearchQuery.toLowerCase();
        return invoiceData.filter((invoice) =>
            invoice.strInvoiceNo.toLowerCase().includes(query) ||
            invoice.strEntityName.toLowerCase().includes(query)
        );
    }, [invoiceData, invoiceSearchQuery]);

    const requestStoragePermission = async () => {
        if (Platform.OS === 'android' && Platform.Version < 33) {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                return false;
            }
        }
        return true;
    };

    const handleDownloadPdf = async (invoice: Invoice) => {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
            Alert.alert('صلاحيات مفقودة', 'يرجى السماح للتطبيق بالوصول إلى التخزين لتنزيل الملف.');
            return;
        }
        setIsDownloading(true);

        const notificationId = `download-${invoice.strInvoiceNo}`;
        const channelId = await notifee.createChannel({
            id: 'downloads',
            name: 'Downloads',
        });

        // Initial Progress Notification
        await notifee.displayNotification({
            id: notificationId,
            title: 'بدء تحميل الفاتورة',
            body: `جاري تحميل الفاتورة رقم ${invoice.strInvoiceNo}`,
            android: {
                channelId,
                progress: { max: 100, current: 0 },
            },
        });

        try {
            const url = `http://tanmia-group.com:90/courierApi/Parcel/ReturnInvoicePdf/${invoice.strInvoiceNo}/${invoice.intEntityCode}`;
            const fileName = `ReturnInvoice_${invoice.strInvoiceNo}_${Date.now()}.pdf`;
            const tempDownloadPath = `${RNFS.TemporaryDirectoryPath}/${fileName}`;

            const downloadResult = RNFS.downloadFile({
                fromUrl: url,
                toFile: tempDownloadPath,
                progress: (res) => {
                    const progress = (res.bytesWritten / res.contentLength) * 100;
                    notifee.displayNotification({
                        id: notificationId,
                        title: 'جاري تحميل الفاتورة',
                        body: `${Math.round(progress)}% مكتمل`,
                        android: {
                            channelId,
                            progress: { max: 100, current: Math.round(progress) },
                        },
                    });
                },
            }).promise;

            const result = await downloadResult;

            if (result.statusCode !== 200) throw new Error(`Server error: ${result.statusCode}`);

            if (Platform.OS === 'android') {
                const almasarFolderPath = `${RNFS.DownloadDirectoryPath}/Almasar`;
                await RNFS.mkdir(almasarFolderPath);
                const finalPdfPath = `${almasarFolderPath}/${fileName}`;

                await RNFS.moveFile(tempDownloadPath, finalPdfPath);
                await RNFS.scanFile(finalPdfPath); // Make it visible in File Manager

                // Final Success Notification with PRESS ACTION
                await notifee.displayNotification({
                    id: notificationId,
                    title: 'اكتمل التحميل',
                    body: 'تم حفظ الفاتورة بنجاح. انقر للفتح.',
                    data: {
                        filePath: finalPdfPath, // Pass path to the listener
                    },
                    android: {
                        channelId,
                        pressAction: {
                            id: 'open-pdf', // Matches the listener ID
                        },
                    },
                });

                setAlertTitle("نجاح");
                setAlertMessage("تم حفظ الملف بنجاح في مجلد التنزيلات/Almasar");
                setAlertSuccess(true);
                setAlertVisible(true);

            } else {
                // iOS Logic
                await Share.open({
                    url: `file://${tempDownloadPath}`,
                    type: 'application/pdf',
                    title: 'فتح الفاتورة',
                });
                await notifee.cancelNotification(notificationId);
            }
        } catch (error) {
            console.error('Download error:', error);
            setAlertTitle("خطأ");
            setAlertMessage("حدث خطأ أثناء تحميل الملف.");
            setAlertVisible(true);
        } finally {
            setIsDownloading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
            // Check if the user pressed the notification or the 'open-pdf' action
            if (type === EventType.PRESS && detail.pressAction?.id === 'open-pdf') {
                const filePath = detail.notification?.data?.filePath;
                if (filePath && typeof filePath === 'string') {
                    FileViewer.open(filePath)
                        .then(() => console.log('File opened successfully'))
                        .catch(error => {
                            console.error('Error opening file:', error);
                            Alert.alert('خطأ', 'لا يمكن فتح الملف. يرجى التأكد من وجود تطبيق لعرض ملفات PDF.');
                        });
                }
            }
        });

        return () => unsubscribe(); // Cleanup on unmount
    }, []);

    useEffect(() => {
        const fetchReturnStatuses = async () => {
            try {
                const response = await axios.get(`http://tanmia-group.com:90/courierApi/parcels/GetSelectedStatuses`);
                setReturnStatuses(response.data?.Statuses || []);
            } catch (error) { console.error(error); }
        };
        fetchReturnStatuses();
    }, []);

    const handleGlobalInvoiceFetch = async () => {
        if (!user?.userId) return;
        setLoadingInvoices(true);
        try {
            const response = await axios.get(`http://tanmia-group.com:90/courierApi/parcels/GetAssignedInvoicesByParcel/${user.userId}`);
            if (response.data && response.data.length > 0) {
                setInvoiceData(response.data);
                setInvoiceModalVisible(true);
            } else {
                setAlertTitle("لا توجد فواتير");
                setAlertMessage("لا توجد فواتير مرتبطة بهذا الحساب.");
                setAlertVisible(true);
            }
        } catch (error) {
            setAlertTitle("خطأ");
            setAlertMessage("فشل جلب البيانات.");
            setAlertVisible(true);
        } finally { setLoadingInvoices(false); }
    };

    useFocusEffect(
        useCallback(() => {
            const fetchFilterEntities = async () => {
                if (!user) return;
                try {
                    const dashboardDataString = await AsyncStorage.getItem("dashboard_data");
                    const dashboardData = JSON.parse(dashboardDataString!);
                    const countKeys = Object.keys(dashboardData).filter(key => key.startsWith('Count'));
                    const sortedStatusIds = countKeys.map(key => parseInt(key.slice(5), 10)).sort((a, b) => a - b);
                    const response = await axios.get(`http://tanmia-group.com:90/courierApi/Entity/GetHistoryEntities/${user.userId}/${sortedStatusIds[4]}`);
                    setEntities(response.data || []);
                } catch (error) { console.error(error); }
            };
            fetchFilterEntities();
        }, [user])
    );

    const handleSearch = useCallback(async () => {
        setLoading(true);
        setAllParcels([]);
        try {
            const dashboardDataString = await AsyncStorage.getItem("dashboard_data");
            const dashboardData = JSON.parse(dashboardDataString!);
            const countKeys = Object.keys(dashboardData).filter(key => key.startsWith('Count'));
            const sortedStatusIds = countKeys.map(key => parseInt(key.slice(5), 10)).sort((a, b) => a - b);
            const targetId = selectedEntity ? selectedEntity.intEntityCode : user?.userId;

            const response = await axios.get(`http://tanmia-group.com:90/courierApi/parcels/details/${targetId}/${sortedStatusIds[4]}`);
            let parcels = response.data?.Parcels || [];
            if (selectedReturnStatus?.Value) {
                parcels = parcels.filter(parcel => parcel.intStatusCode.toString() === selectedReturnStatus.Value);
            }
            setAllParcels(parcels);
        } catch (error) {
            setAlertTitle("خطأ");
            setAlertMessage("فشل تحميل البيانات.");
            setAlertVisible(true);
        } finally { setLoading(false); setIsRefreshing(false); }
    }, [user, selectedEntity, selectedReturnStatus]);

    useEffect(() => {
        if (user && !initialFetchDone) { handleSearch(); setInitialFetchDone(true); }
    }, [user, handleSearch, initialFetchDone]);

    const filteredParcels = useMemo(() => {
        if (!parcelSearchQuery) return allParcels;
        const query = parcelSearchQuery.toLowerCase();
        return allParcels.filter(p => (p.ReferenceNo || '').toLowerCase().includes(query) || (p.RecipientPhone || '').includes(parcelSearchQuery) || (p.CityName || '').toLowerCase().includes(query));
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
                renderItem={({ item }) => (
                    <ParcelCard item={item} onTrackPress={(p) => { setSelectedParcel(p); setWebViewVisible(true); }} />
                )} keyExtractor={(item) => item.intParcelCode.toString()}
                contentContainerStyle={styles.listContentContainer}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); handleSearch(); }} colors={['#FF6B35']} tintColor="#FF6B35" />}
                ListHeaderComponent={
                    <>
                        <FilterSection
                            selectedEntity={selectedEntity}
                            setEntityModalVisible={setEntityModalVisible}
                            selectedReturnStatus={selectedReturnStatus}
                            setStatusModalVisible={setStatusModalVisible}
                            handleSearch={handleSearch}
                            loading={loading && !isRefreshing}
                            onInvoicePress={handleGlobalInvoiceFetch}
                            loadingInvoices={loadingInvoices}
                        />
                        {allParcels.length > 0 && !loading && (
                            <View style={styles.resultsHeader}>
                                <Text style={styles.sectionTitle}>الطرود المرتجعة ({filteredParcels.length})</Text>
                                <View style={styles.parcelSearchContainer}>
                                    <Search color="#9CA3AF" size={20} />
                                    <TextInput style={styles.modernModalSearchInput} placeholder="ابحث في النتائج..." value={parcelSearchQuery} onChangeText={setParcelSearchQuery} />
                                </View>
                            </View>
                        )}
                    </>
                }
                ListEmptyComponent={loading ? <ParcelsSkeleton /> : <View style={styles.emptyContainer}><Image source={require("../../assets/images/empty-reports.png")} style={styles.emptyImage} /><Text style={styles.emptyText}>لا توجد طرود مرتجعة</Text></View>}
            />

            {/* Entity Modal */}
            <Modal visible={entityModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <SafeAreaView style={styles.modernModalContent}>
                        <Text style={styles.modalTitle}>اختيار المتجر</Text>
                        <FlatList
                            data={[allStoresOption, ...displayedEntities]}
                            keyExtractor={(item) => item.intEntityCode.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modernModalItem} onPress={() => { setSelectedEntity(item.intEntityCode === 0 ? null : item); setEntityModalVisible(false); }}>
                                    <View style={styles.modalItemContent}><Text style={styles.modernModalItemText}>{item.strEntityName}</Text></View>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity onPress={() => setEntityModalVisible(false)} style={styles.closeInvoiceModalButton}><Text style={styles.closeModalButtonText}>إغلاق</Text></TouchableOpacity>
                    </SafeAreaView>
                </View>
            </Modal>

            {/* Status Modal */}
            <Modal visible={isStatusModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <SafeAreaView style={styles.modernModalContent}>
                        <Text style={styles.modalTitle}>اختيار حالة الإرجاع</Text>
                        <FlatList
                            data={[allStatusesOption, ...returnStatuses]}
                            keyExtractor={(item) => item.Value.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modernModalItem} onPress={() => { setSelectedReturnStatus(item.Value === "" ? null : item); setStatusModalVisible(false); }}>
                                    <View style={styles.modalItemContent}><Text style={styles.modernModalItemText}>{item.Text}</Text></View>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity onPress={() => setStatusModalVisible(false)} style={styles.closeInvoiceModalButton}><Text style={styles.closeModalButtonText}>إغلاق</Text></TouchableOpacity>
                    </SafeAreaView>
                </View>
            </Modal>

            {/* Global Invoice Modal */}
            <Modal animationType="slide" transparent={true} visible={isInvoiceModalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.invoiceModalContent}>
                        <Text style={styles.invoiceModalTitle}>الفواتير المرتجعة</Text>

                        {/* NEW: Search Bar */}
                        <View style={styles.invoiceSearchContainer}>
                            <Search color="#9CA3AF" size={20} />
                            <TextInput
                                style={styles.invoiceSearchInput}
                                placeholder="ابحث برقم الفاتورة أو اسم المتجر..."
                                placeholderTextColor="#9CA3AF"
                                value={invoiceSearchQuery}
                                onChangeText={setInvoiceSearchQuery}
                            />
                        </View>

                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>رقم الفاتورة</Text>
                            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>اسم المتجر</Text>
                            <Text style={[styles.tableHeaderText, { flex: 1 }]}>التاريخ</Text>
                            <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>ملف</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ScrollView showsVerticalScrollIndicator={true}>
                                {/* UPDATED: Use filteredInvoices instead of invoiceData */}
                                {filteredInvoices.length > 0 ? filteredInvoices.map((invoice, index) => (
                                    <View key={index} style={styles.tableRow}>
                                        <Text style={[styles.tableCellText, { flex: 1.2 }]}>{invoice.strInvoiceNo}</Text>
                                        <Text style={[styles.tableCellText, { flex: 1.5 }]}>{invoice.strEntityName}</Text>
                                        <Text style={[styles.tableCellText, { flex: 1 }]}>{invoice.AssignedDate.split(' ')[0]}</Text>
                                        <TouchableOpacity style={[styles.pdfButton, { flex: 0.5 }]} onPress={() => handleDownloadPdf(invoice)}><Download size={16} color="#3498DB" /></TouchableOpacity>
                                    </View>
                                )) : <Text style={styles.noInvoicesText}>لا توجد فواتير مطابقة</Text>}
                            </ScrollView>
                        </View>
                        <TouchableOpacity style={styles.closeInvoiceModalButton} onPress={() => { setInvoiceModalVisible(false); setInvoiceSearchQuery(""); }}><Text style={styles.closeModalButtonText}>إغلاق</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
            {/* <Modal animationType="slide" transparent={true} visible={isInvoiceModalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.invoiceModalContent}>
                        <Text style={styles.invoiceModalTitle}>الفواتير المرتجعة</Text>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>رقم الفاتورة</Text>
                            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>اسم المتجر</Text>
                            <Text style={[styles.tableHeaderText, { flex: 1 }]}>التاريخ</Text>
                            <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>ملف</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ScrollView showsVerticalScrollIndicator={true}>
                                {invoiceData.length > 0 ? invoiceData.map((invoice, index) => (
                                    <View key={index} style={styles.tableRow}>
                                        <Text style={[styles.tableCellText, { flex: 1.2 }]}>{invoice.strInvoiceNo}</Text>
                                        <Text style={[styles.tableCellText, { flex: 1.5 }]}>{invoice.strEntityName}</Text>
                                        <Text style={[styles.tableCellText, { flex: 1 }]}>{invoice.AssignedDate.split(' ')[0]}</Text>
                                        <TouchableOpacity style={[styles.pdfButton, { flex: 0.5 }]} onPress={() => handleDownloadPdf(invoice)}><Download size={16} color="#3498DB" /></TouchableOpacity>
                                    </View>
                                )) : <Text style={styles.noInvoicesText}>لا توجد فواتير</Text>}
                            </ScrollView>
                        </View>
                        <TouchableOpacity style={styles.closeInvoiceModalButton} onPress={() => setInvoiceModalVisible(false)}><Text style={styles.closeModalButtonText}>إغلاق</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal> */}

            <Modal visible={webViewVisible} animationType="slide"><SafeAreaView style={{ flex: 1 }}><View style={styles.modalHeader}><TouchableOpacity onPress={() => setWebViewVisible(false)}><ChevronLeft size={24} color="#1F2937" /></TouchableOpacity><Text style={styles.modalHeaderTitle}>تتبع</Text><View style={{ width: 40 }} /></View>{selectedParcel && <WebView source={{ uri: `http://tanmia-group.com:90/admin/tracking/DirectReturnParcel?trackingNumber=${selectedParcel.ReferenceNo}` }} style={{ flex: 1 }} startInLoadingState={true} />}</SafeAreaView></Modal>

            <CustomAlert isVisible={isAlertVisible} title={alertTitle} message={alertMessage} confirmText="حسنًا" onConfirm={() => setAlertVisible(false)} success={alertSuccess} cancelText={undefined} onCancel={undefined} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8F9FA" },
    listContentContainer: { paddingHorizontal: 12, paddingBottom: 120 },
    modernFilterSection: { backgroundColor: "#FFFFFF", borderRadius: 8, padding: 20, marginVertical: 10, shadowColor: "#000", shadowOpacity: 0.1, elevation: 3 },
    modernDropdown: { marginBottom: 16 },
    modernDropdownContent: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 8, padding: 16, borderWidth: 1, borderColor: "#E5E7EB" },
    modernDropdownIcon: { width: 40, height: 40, backgroundColor: hexToRgba("#FF6B35", 0.1), borderRadius: 8, justifyContent: "center", alignItems: "center", marginLeft: 12 },
    modernDropdownText: { flex: 1 },
    modernDropdownLabel: { color: "#6B7280", fontSize: 12, textAlign: "right", marginBottom: 2 },
    modernDropdownValue: { color: "#1F2937", fontSize: 16, fontWeight: "600", textAlign: "right" },
    modernSearchButton: { backgroundColor: "#FF6B35", borderRadius: 8, padding: 16, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    modernSearchButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
    globalInvoiceButton: { backgroundColor: "#3498DB", borderRadius: 8, padding: 14, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 10 },
    globalInvoiceButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "bold" },
    resultsHeader: { marginBottom: 10 },
    sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937", marginBottom: 16, textAlign: "right" },
    parcelSearchContainer: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "#E5E7EB" },
    modernModalSearchInput: { flex: 1, color: "#1F2937", fontSize: 16, paddingVertical: 12, textAlign: "right" },
    modernTransactionItem: { backgroundColor: "#FFFFFF", borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#F3F4F6" },
    transactionHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    parcelHeaderContent: { flexDirection: "row-reverse", alignItems: "center", gap: 12, flex: 1 },
    parcelIconBackground: { width: 40, height: 40, borderRadius: 8, justifyContent: "center", alignItems: "center" },
    parcelNameContainer: { flex: 1 },
    transactionDate: { color: "#1F2937", fontSize: 16, fontWeight: "600", textAlign: "right", marginBottom: 2 },
    runningTotalLabel: { color: "#6B7280", fontSize: 12, textAlign: "right" },
    parcelTotal: { fontSize: 16, fontWeight: "bold" },
    parcelHeaderRight: { alignItems: 'flex-end', gap: 8 },
    parcelDetailsRow: { flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
    parcelColumn: { flex: 1, paddingHorizontal: 6 },
    parcelInfoRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8, marginBottom: 12 },
    parcelInfoText: { color: "#4B5563", fontSize: 14, flex: 1, textAlign: "right" },
    transactionRemarks: { color: "#9CA3AF", fontSize: 12, fontStyle: "italic", textAlign: "right", marginTop: 4 },
    dateFooter: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start', marginTop: 12, gap: 6 },
    dateFooterText: { fontSize: 12, color: '#9CA3AF' },
    paymentContainer: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
    paymentLabel: { fontSize: 12, color: '#6B7280' },
    paymentBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    paidBadge: { backgroundColor: '#DEF7EC' },
    unpaidBadge: { backgroundColor: '#FDE8E8' },
    paidText: { color: '#03543F', fontSize: 10, fontWeight: 'bold' },
    unpaidText: { color: '#9B1C1C', fontSize: 10, fontWeight: 'bold' },
    emptyContainer: { backgroundColor: "#FFFFFF", borderRadius: 8, paddingVertical: 40, paddingHorizontal: 20, alignItems: "center", marginTop: 20 },
    emptyImage: { width: 200, height: 120, marginBottom: 16, opacity: 0.7 },
    emptyText: { color: "#374151", fontSize: 18, fontWeight: "600", marginBottom: 4 },
    cardSkeleton: { height: 180, width: "100%", borderRadius: 8, marginBottom: 12 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center", padding: 6 },
    modernModalContent: { backgroundColor: "#FFFFFF", borderRadius: 8, width: "100%", maxHeight: "70%", padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1F2937", textAlign: "right", marginBottom: 16 },
    modernModalItem: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
    modalItemContent: { flex: 1 },
    modernModalItemText: { color: "#1F2937", fontSize: 16, fontWeight: "500", textAlign: "right" },
    invoiceModalContent: { backgroundColor: '#FFFFFF', borderRadius: 12, width: '98%', height: '80%', padding: 15 },
    invoiceModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', textAlign: 'right', marginBottom: 16 },
    tableHeader: { flexDirection: 'row-reverse', borderBottomWidth: 2, borderBottomColor: '#E5E7EB', paddingBottom: 10, marginBottom: 5 },
    tableHeaderText: { fontSize: 12, fontWeight: 'bold', color: '#6B7280', textAlign: 'center' },
    tableRow: { flexDirection: 'row-reverse', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
    tableCellText: { fontSize: 11, color: '#1F2937', textAlign: 'center' },
    noInvoicesText: { textAlign: 'center', marginTop: 30, color: '#9CA3AF', fontSize: 15 },
    pdfButton: { backgroundColor: '#EBF5FB', padding: 8, borderRadius: 4, alignItems: 'center', marginHorizontal: 8 },
    closeInvoiceModalButton: { marginTop: 10, backgroundColor: '#FF6B35', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    closeModalButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    modalHeader: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderBottomColor: '#E5E7EB', borderBottomWidth: 1, backgroundColor: '#FFFFFF' },
    modalHeaderTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
    invoiceSearchContainer: {
        flexDirection: "row-reverse",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        height: 45
    },
    invoiceSearchInput: {
        flex: 1,
        color: "#1F2937",
        fontSize: 14,
        textAlign: "right",
        paddingHorizontal: 8
    },
});