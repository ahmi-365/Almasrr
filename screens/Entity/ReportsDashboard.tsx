import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  TouchableWithoutFeedback,
  Alert,
  TextInput,
  Platform,
  FlatList,
} from 'react-native';
import TopBar from '../../components/Entity/TopBar';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ChevronDown, Check, Search, FileDown } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// --- IMPORTS FOR PDF DOWNLOAD ---
// import RNFS from 'react-native-fs';
// import Share from 'react-native-share';
// --------------------------------

interface User {
  userId: number;
  roleName: 'Entity' | 'Driver';
  [key: string]: any;
}
interface Entity {
  intEntityCode: number;
  strEntityName: string;
  strEntityCode: string;
}
interface Transaction {
  TransactionID: number;
  BranchName: string;
  CreditAmount: number;
  DebitAmount: number;
  RunningTotal: number;
  Remarks: string;
  CreatedAt: string;
}

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

export default function ReportsDashboard() {
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [entityModalVisible, setEntityModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState<'from' | 'to' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      const loadInitialData = async () => {
        const userDataString = await AsyncStorage.getItem('user');
        if (userDataString) {
          const parsedUser: User = JSON.parse(userDataString);
          setUser(parsedUser);

          if (parsedUser.roleName === 'Entity') {
            const storedEntities = await AsyncStorage.getItem('user_entities');
            if (storedEntities) {
              const parsedEntities: Entity[] = JSON.parse(storedEntities);
              setEntities(parsedEntities);
              if (parsedEntities.length > 0 && !selectedEntity) {
                setSelectedEntity(parsedEntities[0]);
              }
            }
          }
        }
      };
      loadInitialData();
    }, [selectedEntity])
  );

  const handleSearch = useCallback(async () => {
    if (user?.roleName === 'Entity' && !selectedEntity) {
      Alert.alert('خطأ', 'يرجى اختيار متجر أولاً.');
      return;
    }
    if (!user) return; // Should not happen if logged in

    setLoading(true);
    setTransactions([]);
    try {
      const formattedFromDate = formatDate(fromDate);
      const formattedToDate = formatDate(toDate);
      let url = '';

      if (user.roleName === 'Entity') {
        url = `https://tanmia-group.com:84/courierApi/Entity/GetTransaction/${selectedEntity!.intEntityCode}/${formattedFromDate}/${formattedToDate}`;
      } else { // Driver
        url = `https://tanmia-group.com:84/courierApi/Driver/GetTransaction/${user.userId}/${formattedFromDate}/${formattedToDate}`;
      }

      const response = await axios.get(url);
      setTransactions(response.data || []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      Alert.alert('خطأ', 'فشل في جلب بيانات المعاملات.');
    } finally {
      setLoading(false);
    }
  }, [selectedEntity, fromDate, toDate, user]);

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setDatePickerVisible(null);
    if (event.type === 'set' && selectedDate) {
      if (datePickerVisible === 'from') setFromDate(selectedDate);
      else setToDate(selectedDate);
    }
  };

  const displayedEntities = useMemo(() => {
    if (!searchQuery) return entities;
    return entities.filter(e =>
      e.strEntityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.strEntityCode.includes(searchQuery)
    );
  }, [searchQuery, entities]);

  const totals = useMemo(() => {
    if (transactions.length === 0) {
      return { totalCredit: 0, totalDebit: 0, finalBalance: 0 };
    }
    const totalCredit = transactions.reduce((sum, tx) => sum + tx.CreditAmount, 0);
    const totalDebit = transactions.reduce((sum, tx) => sum + tx.DebitAmount, 0);
    const finalBalance = transactions[transactions.length - 1]?.RunningTotal ?? 0;
    return { totalCredit, totalDebit, finalBalance };
  }, [transactions]);

  // --- THIS IS THE DEFINITIVE DIRECT DOWNLOAD LOGIC ---
  // const handleDownloadPdf = useCallback(async () => {
  //   if (!selectedEntity || transactions.length === 0) {
  //     Alert.alert('خطأ', 'لا توجد بيانات لتصديرها.');
  //     return;
  //   }
  //   setIsDownloading(true);

  //   try {
  //     const formattedFromDate = formatDate(fromDate);
  //     const formattedToDate = formatDate(toDate);

  //     const url = `https://tanmia-group.com:84/courierApi/Entity/GenerateTransactionReportPdf/${selectedEntity.intEntityCode}/${formattedFromDate}/${formattedToDate}`;
  //     const fileName = `Report-${selectedEntity.strEntityCode}-${formattedFromDate}-${Date.now()}.pdf`;

  //     // Define a temporary path in the app's cache directory
  //     const tempDownloadPath = `${RNFS.TemporaryDirectoryPath}/${fileName}`;

  //     // Download the file to the temporary path first
  //     const downloadResult = await RNFS.downloadFile({
  //       fromUrl: url,
  //       toFile: tempDownloadPath,
  //     }).promise;

  //     if (downloadResult.statusCode !== 200) {
  //       throw new Error(`Server responded with status code ${downloadResult.statusCode}`);
  //     }

  //     console.log('File downloaded successfully to temporary path:', tempDownloadPath);

  //     if (Platform.OS === 'android') {
  //       // For Android, define the final destination in the public Downloads folder
  //       const downloadsPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
  //       // Move the file from the temporary path to the public Downloads folder
  //       await RNFS.moveFile(tempDownloadPath, downloadsPath);
  //       Alert.alert('نجاح', `تم حفظ الملف بنجاح في مجلد التنزيلات.`);
  //       console.log('File moved to:', downloadsPath);
  //     } else {
  //       // For iOS, the Share dialog is the only way to let the user save the file.
  //       // We share from the temporary path.
  //       await Share.open({
  //         url: `file://${tempDownloadPath}`,
  //         type: 'application/pdf',
  //         failOnCancel: false,
  //         title: 'تنزيل التقرير',
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error downloading or saving PDF:', error);
  //     Alert.alert('خطأ', 'حدث خطأ أثناء تحميل أو حفظ ملف PDF.');
  //   } finally {
  //     setIsDownloading(false);
  //   }
  // }, [selectedEntity, fromDate, toDate, transactions]);
  // --------------------------------------------------------------------

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View style={styles.tableRow}>
      <Text style={styles.cell}>{new Date(item.CreatedAt).toLocaleString('ar', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
      <Text style={styles.cell}>{item.BranchName}</Text>
      <Text style={[styles.cell, styles.green]}>{item.CreditAmount > 0 ? item.CreditAmount.toLocaleString() : '-'}</Text>
      <Text style={[styles.cell, styles.red]}>{item.DebitAmount > 0 ? `- ${item.DebitAmount.toLocaleString()}` : '-'}</Text>
      <Text style={styles.cell}>{item.RunningTotal.toLocaleString()}</Text>
      <Text style={styles.cell}>{item.Remarks || '-'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TopBar title="تقرير المعاملات" />
      <FlatList
        data={transactions}
        keyExtractor={(item, index) => `${item.TransactionID}-${index}`}
        renderItem={renderTransactionItem}
        ListHeaderComponent={
          <>
            <View style={styles.filterSection}>
              {user?.roleName === 'Entity' && (
                <TouchableOpacity style={styles.dropdown} onPress={() => setEntityModalVisible(true)}>
                  <View>
                    <Text style={styles.dropdownLabel}>يرجى اختيار المتجر</Text>
                    <Text style={styles.dropdownValue}>{selectedEntity ? `${selectedEntity.strEntityName} - ${selectedEntity.strEntityCode}` : 'لم يتم الاختيار'}</Text>
                  </View>
                  <ChevronDown color="#D1D5DB" size={24} />
                </TouchableOpacity>
              )}
              <View style={styles.dateRow}>
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Search size={24} color="#FFF" />}
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateField} onPress={() => setDatePickerVisible('to')}>
                  <Text style={styles.dateLabel}>إلى تاريخ</Text>
                  <Text style={styles.dateValue}>{formatDate(toDate)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateField} onPress={() => setDatePickerVisible('from')}>
                  <Text style={styles.dateLabel}>من تاريخ</Text>
                  <Text style={styles.dateValue}>{formatDate(fromDate)}</Text>
                </TouchableOpacity>
              </View>
              {/* {transactions.length > 0 && !loading && (
                <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPdf} disabled={isDownloading}>
                  {isDownloading ? (<ActivityIndicator color="#1F2937" />) : (
                    <>
                      <FileDown color="#1F2937" size={20} />
                      <Text style={styles.downloadButtonText}>تصدير PDF</Text>
                    </>
                  )}
                </TouchableOpacity>
              )} */}
            </View>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.headerCell}>التاريخ</Text>
                <Text style={styles.headerCell}>الوصف</Text>
                <Text style={styles.headerCell}>إيداع</Text>
                <Text style={styles.headerCell}>سحب</Text>
                <Text style={styles.headerCell}>الرصيد الإجمالي</Text>
                <Text style={styles.headerCell}>ملاحظات</Text>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (<ActivityIndicator size="large" color="#F97316" />) : (
              <>
                <Text style={styles.emptyText}>لا توجد معاملات لعرضها.</Text>
                <Text style={styles.emptySubText}>يرجى تحديد متجر وتاريخ والضغط على بحث.</Text>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          transactions.length > 0 && !loading ? (
            <View style={styles.footerContainer}>
              <View style={styles.footerRow}>
                <Text style={styles.footerLabel}>إجمالي الإيداع:</Text>
                <Text style={[styles.footerValue, styles.green]}>{totals.totalCredit.toLocaleString()}</Text>
              </View>
              <View style={styles.footerRow}>
                <Text style={styles.footerLabel}>إجمالي السحب:</Text>
                <Text style={[styles.footerValue, styles.red]}>- {totals.totalDebit.toLocaleString()}</Text>
              </View>
              <View style={[styles.footerRow, styles.footerTotalRow]}>
                <Text style={[styles.footerLabel, styles.footerTotalLabel]}>الرصيد النهائي:</Text>
                <Text style={[styles.footerValue, styles.footerTotalValue]}>{totals.finalBalance.toLocaleString()}</Text>
              </View>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      {datePickerVisible && (
        <DateTimePicker
          value={datePickerVisible === 'from' ? fromDate : toDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {user?.roleName === 'Entity' && (
        <Modal visible={entityModalVisible} animationType="fade" transparent={true} onRequestClose={() => setEntityModalVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setEntityModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <SafeAreaView style={styles.modalContent}>
                  <View style={styles.modalSearchContainer}>
                    <TextInput style={styles.modalSearchInput} placeholder="ابحث عن متجر..." placeholderTextColor="#9CA3AF" value={searchQuery} onChangeText={setSearchQuery} />
                    <Search color="#9CA3AF" size={20} style={styles.modalSearchIcon} />
                  </View>
                  <FlatList
                    data={displayedEntities}
                    keyExtractor={item => item.intEntityCode.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={styles.modalItem} onPress={() => { setSelectedEntity(item); setEntityModalVisible(false); setSearchQuery(''); }}>
                        <Text style={[styles.modalItemText, selectedEntity?.intEntityCode === item.intEntityCode && styles.modalItemSelected]}>
                          {item.strEntityName} - {item.strEntityCode}
                        </Text>
                        {selectedEntity?.intEntityCode === item.intEntityCode && <Check color="#F97316" size={20} />}
                      </TouchableOpacity>
                    )}
                  />
                </SafeAreaView>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  filterSection: { padding: 16, backgroundColor: '#374151' },
  dropdown: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5E5', marginBottom: 16 },
  dropdownLabel: { color: '#7F8C8D', fontSize: 14, textAlign: 'right' },
  dropdownValue: { color: '#2C3E50', fontSize: 16, fontWeight: 'bold', marginTop: 4, textAlign: 'right' },
  dateRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 16 },
  searchButton: { backgroundColor: '#E67E22', padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dateField: { flex: 1, backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5E5' },
  dateLabel: { color: '#7F8C8D', fontSize: 12, textAlign: 'right' },
  dateValue: { color: '#2C3E50', fontSize: 16, fontWeight: 'bold', textAlign: 'right', marginTop: 4 },
  downloadButton: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', paddingVertical: 14, borderRadius: 12, gap: 8 },
  downloadButtonText: { color: '#1F2937', fontSize: 16, fontWeight: 'bold' },
  footerContainer: { backgroundColor: '#374151', padding: 16, borderTopWidth: 2, borderTopColor: '#4B5563', gap: 8 },
  footerRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { color: '#9CA3AF', fontSize: 14 },
  footerValue: { color: '#F3F4F6', fontSize: 16, fontWeight: 'bold' },
  footerTotalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#4B5563' },
  footerTotalLabel: { color: '#F3F4F6', fontWeight: 'bold' },
  footerTotalValue: { color: '#F97316', fontSize: 18 },
  table: { backgroundColor: '#FFF', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderWidth: 1, borderTopWidth: 0, borderColor: '#E5E5E5', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row-reverse', backgroundColor: '#ECF0F1', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  headerCell: { flex: 1.5, color: '#7F8C8D', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  tableRow: { flexDirection: 'row-reverse', paddingVertical: 14, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#F2F2F2', alignItems: 'center', backgroundColor: '#FFF' },
  cell: { flex: 1.5, color: '#34495E', fontSize: 12, textAlign: 'center' },
  green: { color: '#27AE60', fontWeight: 'bold' },
  red: { color: '#E74C3C', fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', padding: 40, backgroundColor: '#FFF', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  emptyText: { color: '#34495E', fontSize: 16, fontWeight: 'bold' },
  emptySubText: { color: '#7F8C8D', fontSize: 12, marginTop: 8, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#374151', borderRadius: 12, width: '85%', maxHeight: '70%' },
  modalSearchContainer: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#4B5563', borderRadius: 8, margin: 10, paddingHorizontal: 10 },
  modalSearchInput: { flex: 1, color: '#E5E7EB', fontSize: 16, paddingVertical: Platform.OS === 'ios' ? 12 : 8, textAlign: 'right' },
  modalSearchIcon: { marginLeft: 8 },
  modalItem: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#4B5563', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  modalItemText: { color: '#E5E7EB', fontSize: 16 },
  modalItemSelected: { color: '#F97316', fontWeight: 'bold' },
});