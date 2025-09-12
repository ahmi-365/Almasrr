import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather'; // for Search, Calendar, FileText, Plus

export default function ReportsDashboard() {
  const [fromDate, setFromDate] = useState('2025-09-06');
  const [toDate, setToDate] = useState('2025-09-06');

  const reportData = {
    totalOrders: 904,
    totalAmount: 70027,
    deliveredAmount: 70931,
    currentBalance: 904,
    previousBalance: 70027,
    deliveredBalance: 70931,
    timestamp: '00:00 06-09-25'
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Store Filter */}
      <View style={styles.dropdown}>
        <Text style={styles.dropdownLabel}>يرجى اختيار المتجر</Text>
        <View style={styles.dropdownRight}>
          <Text style={styles.dropdownValue}>بنوتي هاوس - 5006</Text>
          <Icon name="chevron-down" size={16} color="#9ca3af" />
        </View>
      </View>

      {/* Date Selector */}
      <View style={styles.dateRow}>
        <View style={styles.iconCircle}>
          <Icon name="search" size={18} color="#fff" />
        </View>

        <View style={styles.dateFields}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>من تاريخ</Text>
            <TextInput
              style={styles.dateInput}
              value={fromDate}
              onChangeText={setFromDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>إلى تاريخ</Text>
            <TextInput
              style={styles.dateInput}
              value={toDate}
              onChangeText={setToDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>
      </View>

      {/* Report Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerCell}>ملاحظات</Text>
          <Text style={styles.headerCell}>الرصيد الحالي</Text>
          <Text style={styles.headerCell}>سحب</Text>
          <Text style={styles.headerCell}>إيداع</Text>
          <Text style={styles.headerCell}>الوصف</Text>
          <Text style={styles.headerCell}>التاريخ</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.cell}>{reportData.totalOrders}</Text>
          <Text style={[styles.cell, styles.red]}>- {reportData.totalAmount.toLocaleString()}</Text>
          <Text style={[styles.cell, styles.green]}>{reportData.deliveredAmount.toLocaleString()}</Text>
          <Text style={styles.cell}></Text>
          <Text style={styles.cell}></Text>
          <Text style={styles.cell}></Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={[styles.cell, styles.green]}>{reportData.currentBalance}</Text>
          <Text style={[styles.cell, styles.red]}>- {reportData.previousBalance.toLocaleString()}</Text>
          <Text style={[styles.cell, styles.green]}>{reportData.deliveredBalance.toLocaleString()}</Text>
          <Text style={styles.cell}></Text>
          <Text style={[styles.cell, styles.orange]}>الرصيد السابق</Text>
          <Text style={[styles.cell, styles.small]}>{reportData.timestamp}</Text>
        </View>
      </View>

      {/* Stat Cards */}
      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <View>
            <Text style={[styles.cardValue, styles.orange]}>{reportData.totalOrders}</Text>
            <Text style={styles.cardLabel}>إجمالي الطلبات</Text>
          </View>
          <View style={[styles.cardIcon, { backgroundColor: '#f97316' }]}>
            <Icon name="file-text" size={20} color="#fff" />
          </View>
        </View>

        <View style={styles.card}>
          <View>
            <Text style={[styles.cardValue, styles.red]}>- {reportData.totalAmount.toLocaleString()}</Text>
            <Text style={styles.cardLabel}>إجمالي المبلغ</Text>
          </View>
          <View style={[styles.cardIcon, { backgroundColor: '#ef4444' }]}>
            <Icon name="calendar" size={20} color="#fff" />
          </View>
        </View>

        <View style={styles.card}>
          <View>
            <Text style={[styles.cardValue, styles.green]}>{reportData.deliveredBalance.toLocaleString()}</Text>
            <Text style={styles.cardLabel}>المبلغ المسلم</Text>
          </View>
          <View style={[styles.cardIcon, { backgroundColor: '#22c55e' }]}>
            <Icon name="plus" size={20} color="#fff" />
          </View>
        </View>
      </View>

      {/* Empty State */}
      <View style={styles.empty}>
        <Icon name="file-text" size={40} color="#9ca3af" />
        <Text style={styles.emptyText}>لا توجد بيانات إضافية لعرضها</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1f2937', padding: 16, direction: 'rtl' },
  dropdown: { backgroundColor: '#374151', borderColor: '#4b5563', borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dropdownLabel: { color: '#e5e7eb' },
  dropdownRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dropdownValue: { color: '#d1d5db', fontSize: 12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  iconCircle: { backgroundColor: '#f97316', padding: 10, borderRadius: 30 },
  dateFields: { flexDirection: 'row', flex: 1, gap: 12 },
  dateField: { flex: 1 },
  dateLabel: { color: '#9ca3af', fontSize: 11, marginBottom: 4 },
  dateInput: { backgroundColor: '#374151', borderColor: '#4b5563', borderWidth: 1, borderRadius: 8, padding: 10, color: '#f3f4f6', fontSize: 13 },
  table: { backgroundColor: '#374151', borderRadius: 10, overflow: 'hidden' },
  tableHeader: { backgroundColor: '#f97316', flexDirection: 'row', justifyContent: 'space-around', padding: 10 },
  headerCell: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 12, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 10, borderBottomWidth: 1, borderColor: '#4b5563' },
  cell: { flex: 1, textAlign: 'center', color: '#d1d5db', fontSize: 12 },
  red: { color: '#ef4444' },
  green: { color: '#22c55e' },
  orange: { color: '#f97316' },
  small: { fontSize: 10 },
  cardsRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  card: { flex: 1, backgroundColor: '#374151', borderColor: '#4b5563', borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardValue: { fontSize: 20, fontWeight: 'bold' },
  cardLabel: { color: '#d1d5db', fontSize: 12 },
  cardIcon: { padding: 8, borderRadius: 30 },
  empty: { alignItems: 'center', marginTop: 30 },
  emptyText: { color: '#9ca3af', marginTop: 6, fontSize: 12 }
});
