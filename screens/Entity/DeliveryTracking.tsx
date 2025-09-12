import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Search } from 'lucide-react-native';
import TopBar from '../../components/Entity/TopBar';

export default function DeliveryTracking() {
  const [searchText, setSearchText] = useState('');

  const deliveryItems = [
    {
      id: '2506-0068',
      recipient: 'تسليم',
      phone: '218924597227',
      quantity: 1,
      notes: 'BS302',
      deliveryFee: '360 د.ل',
      total: '385 د.ل',
      date: '02-06-25 17:25',
      status: 'بنغازي',
    },
    {
      id: '2506-0069',
      recipient: '',
      phone: '218920388577',
      quantity: 1,
      notes: 'BS665',
      deliveryFee: '424 د.ل',
      total: '449 د.ل',
      date: '',
      status: 'بنغازي',
    },
  ];

  return (
  <View style={styles.container}>
  <TopBar title="لوحة القيادة" />

  <ScrollView
    style={{ flex: 1 }}
    contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 16 }}
  >
      {/* Filter Dropdown */}
      <View style={styles.dropdown}>
        <View style={styles.dropdownInner}>
          <Text style={styles.dropdownLabel}>يرجى اختيار المتجر</Text>
          <View style={styles.dropdownRight}>
            <Text style={styles.dropdownInfo}>بنوتي هاوس - 5006 - الطلبات: 200</Text>
            <Text style={styles.arrow}>▼</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="ابحث هنا"
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
          textAlign="right"
        />
        <Search style={styles.searchIcon} color="#999" size={20} />
      </View>

      {/* Delivery Items */}
      <View style={styles.cardsContainer}>
        {deliveryItems.map((item) => (
          <View key={item.id} style={styles.card}>
            
            {/* Top Section */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
                {item.date ? (
                  <Text style={styles.dateText}>{item.date}</Text>
                ) : null}
              </View>
              <Text style={styles.itemId}>{item.id}</Text>
            </View>

            {/* Content */}
            <View style={styles.cardContent}>

              {/* Recipient Info */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.dot} />
                  <Text style={styles.sectionTitle}>معلومات المستلم</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.recipientText}>{item.recipient || 'غير محدد'}</Text>
                  <Text style={styles.phoneText}>{item.phone}</Text>
                </View>
              </View>

              {/* Order Details */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.dot} />
                  <Text style={styles.sectionTitle}>تفاصيل الطلب</Text>
                </View>
                <View style={styles.detailsRow}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailNumber}>{item.quantity}</Text>
                    <Text style={styles.detailLabel}>الكمية</Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailNumber}>{item.notes}</Text>
                    <Text style={styles.detailLabel}>رقم المنتج</Text>
                  </View>
                </View>
              </View>

              {/* Pricing */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.dot} />
                  <Text style={styles.sectionTitle}>التكلفة</Text>
                </View>
                <View style={{ gap: 6 }}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>قيمة الشحن</Text>
                    <Text style={styles.priceValue}>{item.deliveryFee}</Text>
                  </View>
                  <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>الإجمالي</Text>
                    <Text style={styles.totalValue}>{item.total}</Text>
                  </View>
                </View>
              </View>

            </View>
          </View>
        ))}
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },


  // Content
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 80 },

  dropdown: { marginBottom: 16 },
  dropdownInner: {
    backgroundColor: '#fff',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownLabel: { color: '#374151', fontSize: 14 },
  dropdownRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dropdownInfo: { color: '#4B5563', fontSize: 12 },
  arrow: { color: '#9CA3AF', fontSize: 12 },

  searchContainer: { marginBottom: 20 },
  searchInput: {
    backgroundColor: '#fff',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    paddingRight: 36,
  },
  searchIcon: { position: 'absolute', right: 10, top: 14 },

  cardsContainer: { gap: 16 },

  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  cardHeader: {
    backgroundColor: '#F97316',
    padding: 14,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  statusBadge: { backgroundColor: '#ffffff33', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 12 },
  dateText: { color: '#fff', opacity: 0.9, fontSize: 12 },
  itemId: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  cardContent: { padding: 16 },
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 6, height: 6, backgroundColor: '#F97316', borderRadius: 3, marginLeft: 6 },
  sectionTitle: { color: '#D1D5DB', fontSize: 13, fontWeight: '600' },
  infoBox: { backgroundColor: '#4B5563', padding: 10, borderRadius: 10, gap: 4 },
  recipientText: { color: '#F3F4F6', fontSize: 16, fontWeight: 'bold' },
  phoneText: { color: '#D1D5DB', fontSize: 12 },

  detailsRow: { flexDirection: 'row', gap: 10 },
  detailBox: { flex: 1, backgroundColor: '#4B5563', borderRadius: 10, padding: 10, alignItems: 'center' },
  detailNumber: { color: '#F97316', fontSize: 20, fontWeight: 'bold' },
  detailLabel: { color: '#9CA3AF', fontSize: 10, marginTop: 2 },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { color: '#9CA3AF', fontSize: 12 },
  priceValue: { color: '#E5E7EB', fontSize: 14, fontWeight: '600' },

  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9731622',
    padding: 10,
    borderRadius: 10,
  },
  totalLabel: { color: '#FDBA74', fontWeight: 'bold' },
  totalValue: { color: '#F97316', fontSize: 18, fontWeight: 'bold' },
});
