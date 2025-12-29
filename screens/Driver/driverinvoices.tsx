import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    Image,
    TextInput,
    TouchableOpacity,
    Platform,
    Alert,
    PermissionsAndroid
} from "react-native";
import { useDashboard } from "../../Context/DashboardContext";
import axios from "axios";
import TopBar from "../../components/Entity/TopBarNew";
import { Search, Download } from "lucide-react-native";
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import notifee, { EventType } from '@notifee/react-native';
import FileViewer from 'react-native-file-viewer';
import CustomAlert from "../../components/CustomAlert";

interface Invoice {
    intDriverCode: number;
    strInvoiceNo: string;
    strEntityName: string;
    AssignedDate: string;
}

export default function DriverInvoicesScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // CHANGED: Use string | null to track specific invoice being downloaded
    const [downloadingInvoiceNo, setDownloadingInvoiceNo] = useState<string | null>(null);

    // Alert State
    const [isAlertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSuccess, setAlertSuccess] = useState(false);

    const { user } = useDashboard();

    const fetchInvoices = useCallback(async () => {
        if (!user?.userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const url = `http://tanmia-group.com:90/courierApi/parcels/GetAssignedInvoicesByParcelForDriver/${user.userId}`;
            const response = await axios.get(url);

            if (Array.isArray(response.data)) {
                setInvoices(response.data);
            } else {
                setInvoices([]);
            }

        } catch (error) {
            console.error("Failed to fetch invoices:", error);
            setAlertTitle("خطأ");
            setAlertMessage("فشل جلب الفواتير");
            setAlertSuccess(false);
            setAlertVisible(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

    // Download Logic
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

        // CHANGED: Set specific invoice ID
        setDownloadingInvoiceNo(invoice.strInvoiceNo);

        const notificationId = `download-${invoice.strInvoiceNo}`;
        const channelId = await notifee.createChannel({
            id: 'downloads',
            name: 'Downloads',
        });

        await notifee.displayNotification({
            id: notificationId,
            title: 'بدء تحميل الفاتورة',
            body: `جاري تحميل الفاتورة رقم ${invoice.strInvoiceNo}`,
            android: { channelId, progress: { max: 100, current: 0 } },
        });

        try {
            const url = `http://tanmia-group.com:90/courierApi/Parcel/ReturnInvoicePdfForDriver/${invoice.strInvoiceNo}/${invoice.intDriverCode}`;

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
                        android: { channelId, progress: { max: 100, current: Math.round(progress) } },
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
                await RNFS.scanFile(finalPdfPath);

                await notifee.displayNotification({
                    id: notificationId,
                    title: 'اكتمل التحميل',
                    body: 'تم حفظ الفاتورة بنجاح. انقر للفتح.',
                    data: { filePath: finalPdfPath },
                    android: { channelId, pressAction: { id: 'open-pdf' } },
                });

                setAlertTitle("نجاح");
                setAlertMessage("تم حفظ الملف بنجاح في مجلد التنزيلات/Almasar");
                setAlertSuccess(true);
                setAlertVisible(true);

            } else {
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
            setAlertSuccess(false);
            setAlertVisible(true);
        } finally {
            // CHANGED: Reset downloading state
            setDownloadingInvoiceNo(null);
        }
    };

    // Notification Listener
    useEffect(() => {
        const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
            if (type === EventType.PRESS && detail.pressAction?.id === 'open-pdf') {
                const filePath = detail.notification?.data?.filePath;
                if (filePath && typeof filePath === 'string') {
                    FileViewer.open(filePath).catch(error => {
                        console.error('Error opening file:', error);
                        Alert.alert('خطأ', 'لا يمكن فتح الملف.');
                    });
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const filteredInvoices = useMemo(() => {
        if (!searchQuery) return invoices;
        const query = searchQuery.toLowerCase();
        return invoices.filter((invoice) =>
            (invoice.strInvoiceNo && invoice.strInvoiceNo.toLowerCase().includes(query)) ||
            (invoice.strEntityName && invoice.strEntityName.toLowerCase().includes(query))
        );
    }, [invoices, searchQuery]);

    const renderHeader = () => (
        <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>رقم الفاتورة</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>اسم المتجر</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>التاريخ</Text>
            <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>ملف</Text>
        </View>
    );

    const renderItem = ({ item }: { item: Invoice }) => {
        // CHANGED: Check if this specific item is downloading
        const isItemDownloading = downloadingInvoiceNo === item.strInvoiceNo;

        return (
            <View style={styles.tableRow}>
                <Text style={[styles.tableCellText, { flex: 1.2 }]}>{item.strInvoiceNo}</Text>
                <Text style={[styles.tableCellText, { flex: 1.5 }]}>{item.strEntityName}</Text>
                <Text style={[styles.tableCellText, { flex: 1 }]}>
                    {item.AssignedDate ? item.AssignedDate.split(' ')[0] : '-'}
                </Text>
                <TouchableOpacity
                    style={[styles.pdfButton, { flex: 0.5 }]}
                    onPress={() => handleDownloadPdf(item)}
                    disabled={!!downloadingInvoiceNo} // Disable all buttons if *any* download is in progress to prevent conflicts
                >
                    {isItemDownloading ? (
                        <ActivityIndicator size="small" color="#3498DB" />
                    ) : (
                        <Download size={16} color="#3498DB" />
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <TopBar title="فواتير السائق" />

            <View style={styles.contentContainer}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search color="#9CA3AF" size={20} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="ابحث برقم الفاتورة أو اسم المتجر..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Table Header */}
                {renderHeader()}

                {/* Content */}
                {loading ? (
                    <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={filteredInvoices}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInvoices(); }} colors={['#FF6B35']} />}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Image source={require("../../assets/images/empty-reports.png")} style={styles.emptyImg} />
                                <Text style={styles.emptyText}>
                                    {searchQuery ? "لا توجد نتائج بحث" : "لا توجد فواتير حالياً"}
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>

            <CustomAlert
                isVisible={isAlertVisible}
                title={alertTitle}
                message={alertMessage}
                confirmText="حسنًا"
                onConfirm={() => setAlertVisible(false)}
                success={alertSuccess}
                cancelText={undefined}
                onCancel={undefined}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8F9FA" },
    contentContainer: { flex: 1, padding: 15 },
    searchContainer: {
        flexDirection: "row-reverse",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        height: 50,
        elevation: 1
    },
    searchInput: {
        flex: 1,
        color: "#1F2937",
        fontSize: 14,
        textAlign: "right",
        paddingHorizontal: 8
    },
    tableHeader: {
        flexDirection: 'row-reverse',
        backgroundColor: '#E5E7EB',
        paddingVertical: 12,
        paddingHorizontal: 5,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        marginBottom: 5
    },
    tableHeaderText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4B5563',
        textAlign: 'center'
    },
    list: { paddingBottom: 50 },
    tableRow: {
        flexDirection: 'row-reverse',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 5
    },
    tableCellText: {
        fontSize: 12,
        color: '#1F2937',
        textAlign: 'center'
    },
    pdfButton: {
        backgroundColor: '#EBF5FB',
        padding: 8,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4
    },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyImg: { width: 150, height: 100, opacity: 0.5 },
    emptyText: { color: '#9CA3AF', marginTop: 10, fontSize: 16 }
});