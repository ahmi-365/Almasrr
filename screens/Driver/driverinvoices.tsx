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
import notifee, { EventType } from '@notifee/react-native';
import FileViewer from 'react-native-file-viewer';
import CustomAlert from "../../components/CustomAlert";
import RNFS from 'react-native-fs';

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
    const [downloadingInvoiceNo, setDownloadingInvoiceNo] = useState<string | null>(null);

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
            const url = `https://tanmia-group.com:86/courierApi/parcels/GetAssignedInvoicesByParcelForDriver/${user.userId}`;
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

    const handleDownloadPdf = async (invoice: Invoice) => {
        setDownloadingInvoiceNo(invoice.strInvoiceNo);

        // 1. Check Permissions (Only requests on Android 9 or lower)
        if (Platform.OS === 'android' && Platform.Version < 29) {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    Alert.alert('صلاحيات مفقودة', 'يرجى السماح للتطبيق بالوصول إلى التخزين.');
                    setDownloadingInvoiceNo(null);
                    return;
                }
            } catch (err) {
                console.warn(err);
                setDownloadingInvoiceNo(null);
                return;
            }
        }

        // 2. Notification Setup
        const channelId = await notifee.createChannel({ id: 'downloads', name: 'Downloads' });
        await notifee.displayNotification({
            id: invoice.strInvoiceNo,
            title: 'جاري التحميل',
            body: `جاري تحميل الفاتورة ${invoice.strInvoiceNo}...`,
            android: { channelId, progress: { max: 10, current: 5, indeterminate: true } },
        });

        try {
            const url = `https://tanmia-group.com:86/courierApi/Parcel/ReturnInvoicePdfForDriver/${invoice.strInvoiceNo}/${invoice.intDriverCode}`;

            // 3. Define Path (Directly to Downloads folder)
            const fileName = `DriverInvoice_${invoice.strInvoiceNo}.pdf`;
            const filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

            // 4. Download File
            const options = {
                fromUrl: url,
                toFile: filePath,
            };

            await RNFS.downloadFile(options).promise;

            // 5. Success Notification
            await notifee.displayNotification({
                id: invoice.strInvoiceNo,
                title: 'اكتمل التحميل',
                body: 'تم حفظ الفاتورة في التنزيلات. انقر للفتح.',
                data: { filePath: filePath },
                android: { channelId, pressAction: { id: 'open-pdf' } },
            });

            // 6. Attempt to Open
            try {
                await FileViewer.open(filePath, { showOpenWithDialog: true });
            } catch (e) {
                console.log("Error opening file viewer:", e);
                // If viewer fails, just tell them it's in downloads
                setAlertTitle("نجاح");
                setAlertMessage(`تم حفظ الفاتورة في مجلد التنزيلات`);
                setAlertSuccess(true);
                setAlertVisible(true);
                return;
            }
        } catch (error) {
            console.error('Download error:', error);
            setAlertTitle("خطأ");
            setAlertMessage("فشل التحميل. تأكد من الإنترنت.");
            setAlertSuccess(false);
            setAlertVisible(true);
        } finally {
            setDownloadingInvoiceNo(null);
        }
    };

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
                    disabled={!!downloadingInvoiceNo}
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

                {renderHeader()}

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
                success={alertSuccess} cancelText={undefined} onCancel={undefined} />
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