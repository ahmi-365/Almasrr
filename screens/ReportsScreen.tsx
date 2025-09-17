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
import TopBar from '../components/Entity/TopBar';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ChevronDown, Check, Search } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

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
      const loadEntities = async () => {
        const storedEntities = await AsyncStorage.getItem('user_entities');
        if (storedEntities) {
          const parsedEntities: Entity[] = JSON.parse(storedEntities);
          setEntities(parsedEntities);
          if (parsedEntities.length > 0 && !selectedEntity) {
            setSelectedEntity(parsedEntities[0]);
          }
        }
      };
      loadEntities();
    }, [selectedEntity])
  );

  const handleSearch = useCallback(async () => {
    if (!selectedEntity) {
      Alert.alert('خطأ', 'يرجى اختيار متجر أولاً.');
      return;
    }
    setLoading(true);
    setTransactions([]);
    try {
      const formattedFromDate = formatDate(fromDate);
      const formattedToDate = formatDate(toDate);
      const response = await axios.get(
        `https://tanmia-group.com:84/courierApi/Entity/GetTransaction/${selectedEntity.intEntityCode}/${formattedFromDate}/${formattedToDate}`
      );
      setTransactions(response.data || []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      Alert.alert('خطأ', 'فشل في جلب بيانات المعاملات.');
    } finally {
      setLoading(false);
    }
  }, [selectedEntity, fromDate, toDate]);

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

  // --- THIS IS THE CORRECTED CALCULATION LOGIC ---
  const totals = useMemo(() => {
    if (transactions.length === 0) {
      return { totalCredit: 0, totalDebit: 0, finalBalance: 0 };
    }

    // Calculate the sum of ALL credits (deposits) from the entire response.
    const totalCredit = transactions.reduce((sum, tx) => sum + tx.CreditAmount, 0);

    // Calculate the sum of ALL debits (withdrawals) from the entire response.
    const totalDebit = transactions.reduce((sum, tx) => sum + tx.DebitAmount, 0);

    // The final balance is the running total of the very last entry provided by the API.
    const finalBalance = transactions[transactions.length - 1]?.RunningTotal ?? 0;

    return { totalCredit, totalDebit, finalBalance };
  }, [transactions]);
  // -----------------------------------------------------------

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
              <TouchableOpacity style={styles.dropdown} onPress={() => setEntityModalVisible(true)}>
                <View>
                  <Text style={styles.dropdownLabel}>يرجى اختيار المتجر</Text>
                  <Text style={styles.dropdownValue}>{selectedEntity ? `${selectedEntity.strEntityName} - ${selectedEntity.strEntityCode}` : 'لم يتم الاختيار'}</Text>
                </View>
                <ChevronDown color="#7F8C8D" size={24} />
              </TouchableOpacity>
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
            {loading ? (
              <ActivityIndicator size="large" color="#E67E22" />
            ) : (
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

      <Modal visible={entityModalVisible} animationType="fade" transparent={true} onRequestClose={() => setEntityModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setEntityModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <SafeAreaView style={styles.modalContent}>
                <View style={styles.modalSearchContainer}>
                  <TextInput style={styles.modalSearchInput} placeholder="ابحث عن متجر..." placeholderTextColor="#95A5A6" value={searchQuery} onChangeText={setSearchQuery} />
                  <Search color="#95A5A6" size={20} style={styles.modalSearchIcon} />
                </View>
                <FlatList
                  data={displayedEntities}
                  keyExtractor={item => item.intEntityCode.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.modalItem} onPress={() => { setSelectedEntity(item); setEntityModalVisible(false); setSearchQuery(''); }}>
                      <Text style={[styles.modalItemText, selectedEntity?.intEntityCode === item.intEntityCode && styles.modalItemSelected]}>
                        {item.strEntityName} - {item.strEntityCode}
                      </Text>
                      {selectedEntity?.intEntityCode === item.intEntityCode && <Check color="#E67E22" size={20} />}
                    </TouchableOpacity>
                  )}
                />
              </SafeAreaView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  filterSection: { padding: 16, backgroundColor: '#374151' },
  dropdown: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5E5', marginBottom: 16 },
  dropdownLabel: { color: '#7F8C8D', fontSize: 14, textAlign: 'right' },
  dropdownValue: { color: '#2C3E50', fontSize: 16, fontWeight: 'bold', marginTop: 4, textAlign: 'right' },
  dateRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 4 },
  searchButton: { backgroundColor: '#E67E22', padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dateField: { flex: 1, backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5E5' },
  dateLabel: { color: '#7F8C8D', fontSize: 12, textAlign: 'right' },
  dateValue: { color: '#2C3E50', fontSize: 16, fontWeight: 'bold', textAlign: 'right', marginTop: 4 },

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
  footerContainer: { backgroundColor: '#374151', padding: 16, borderTopWidth: 2, borderTopColor: '#E5E5E5', gap: 8, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  footerRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { color: '#ffffff', fontSize: 14 },
  footerValue: { color: '#34495E', fontSize: 16, fontWeight: 'bold' },
  footerTotalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#ECF0F1' },
  footerTotalLabel: { color: '#ffffff', fontWeight: 'bold' },
  footerTotalValue: { color: '#E67E22', fontSize: 18 },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 12, width: '85%', maxHeight: '70%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  modalSearchContainer: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 8, margin: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: '#E5E5E5' },
  modalSearchInput: { flex: 1, color: '#2C3E50', fontSize: 16, paddingVertical: Platform.OS === 'ios' ? 12 : 8, textAlign: 'right' },
  modalSearchIcon: { marginLeft: 8 },
  modalItem: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F2F2F2', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  modalItemText: { color: '#34495E', fontSize: 16 },
  modalItemSelected: { color: '#E67E22', fontWeight: 'bold' },
});