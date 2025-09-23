import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { 
  Search, 
  ChevronDown, 
  Package, 
  Phone, 
  MapPin, 
  Truck, 
  Calendar, 
  DollarSign 
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopBar from '../../components/Entity/TopBarNew';

// Helper function for color transparency
const hexToRgba = (hex, opacity) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const MaterialTopBar = ({ title }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { paddingTop: insets.top + 30 }]}>
      <Text style={styles.topBarTitle}>{title}</Text>
    </View>
  );
};

const DeliveryCard = ({ item }) => (
  <View style={styles.modernTransactionItem}>
    {/* Header with Status and Package Icon */}
    <View style={styles.cardHeader}>
      <View style={styles.headerRow}>
        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          {item.date ? (
            <View style={styles.dateContainer}>
              <Calendar size={12} color="#FFF" style={styles.dateIcon} />
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.orderIdContainer}>
        <View style={styles.packageIconBackground}>
          <Package color="#FFF" size={20} />
        </View>
        <Text style={styles.orderId}>{item.id}</Text>
      </View>
    </View>

    {/* Content Sections */}
    <View style={styles.cardContent}>
      {/* Recipient Info Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.dot} />
          <Text style={styles.sectionTitle}>معلومات المستلم</Text>
        </View>
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.recipientText}>
              {item.recipient || 'غير محدد'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Phone size={14} color="#6B7280" />
            <Text style={styles.phoneText}>{item.phone}</Text>
          </View>
        </View>
      </View>

      {/* Order Details Section */}
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

      {/* Pricing Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.dot} />
          <Text style={styles.sectionTitle}>التكلفة</Text>
        </View>
        <View style={styles.pricingContainer}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>قيمة الشحن</Text>
            <View style={styles.priceValueContainer}>
              <DollarSign size={14} color="#6B7280" />
              <Text style={styles.priceValue}>{item.deliveryFee}</Text>
            </View>
          </View>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>الإجمالي</Text>
            <View style={styles.totalValueContainer}>
              <DollarSign size={16} color="#28a745" />
              <Text style={styles.totalValue}>{item.total}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  </View>
);

export default function DeliveryTrackingScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedStore, setSelectedStore] = useState('بنوتي هاوس - 5006');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const stores = [
    { value: 'بنوتي هاوس - 5006', label: 'بنوتي هاوس - 5006 - الطلبات: 200' },
    { value: 'متجر الأزياء - 5007', label: 'متجر الأزياء - 5007 - الطلبات: 150' },
    { value: 'متجر الإلكترونيات - 5008', label: 'متجر الإلكترونيات - 5008 - الطلبات: 100' },
  ];

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
    {
      id: '2506-0070',
      recipient: 'أحمد محمد',
      phone: '218912345678',
      quantity: 2,
      notes: 'BS888',
      deliveryFee: '200 د.ل',
      total: '225 د.ل',
      date: '03-06-25 14:30',
      status: 'طرابلس',
    },
  ];

  const filteredItems = useMemo(() => {
    if (!searchText.trim()) return deliveryItems;
    return deliveryItems.filter(item =>
      item.id.toLowerCase().includes(searchText.toLowerCase()) ||
      item.recipient.toLowerCase().includes(searchText.toLowerCase()) ||
      item.phone.includes(searchText) ||
      item.notes.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  const renderListHeaderComponent = () => (
    <View style={styles.modernFilterSection}>
      <Text style={styles.filterSectionTitle}>البحث والفلترة</Text>
      
      {/* Store Dropdown */}
      <View style={styles.dropdownContainer}>
        <Text style={styles.dropdownLabel}>يرجى اختيار المتجر</Text>
        <TouchableOpacity 
          style={styles.dropdown}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Text style={styles.dropdownText}>
            {stores.find(store => store.value === selectedStore)?.label}
          </Text>
          <ChevronDown color="#9CA3AF" size={20} />
        </TouchableOpacity>
        
        {showDropdown && (
          <View style={styles.dropdownOptions}>
            {stores.map((store) => (
              <TouchableOpacity
                key={store.value}
                style={styles.dropdownOption}
                onPress={() => {
                  setSelectedStore(store.value);
                  setShowDropdown(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>{store.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.modernModalSearchContainer}>
        <Search
          color="#9CA3AF"
          size={20}
          style={styles.modalSearchIcon}
        />
        <TextInput
          style={styles.modernModalSearchInput}
          placeholder="ابحث برقم الطلب، اسم المستلم، أو رقم الهاتف..."
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      
      {filteredItems.length > 0 && (
        <Text style={styles.sectionTitle}>
          الطلبات ({filteredItems.length})
        </Text>
      )}
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Truck color="#9CA3AF" size={64} style={styles.emptyIcon} />
      <Text style={styles.emptyText}>
        {deliveryItems.length === 0 ? 'لا توجد طلبات' : 'لم يتم العثور على نتائج'}
      </Text>
      <Text style={styles.emptySubText}>
        {deliveryItems.length === 0 
          ? 'لم يتم إضافة أي طلبات بعد'
          : 'جرب البحث بكلمات مختلفة'
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TopBar title="لوحة القيادة" />

      <FlatList
        data={filteredItems}
        renderItem={({ item }) => <DeliveryCard item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
        ListHeaderComponent={renderListHeaderComponent}
        ListEmptyComponent={renderEmptyComponent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8F9FA" 
  },
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#F8F9FA",
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
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
  
  // Dropdown Styles
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownLabel: {
    color: "#6B7280",
    fontSize: 12,
    textAlign: "right",
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    color: "#1F2937",
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
  dropdownOptions: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownOptionText: {
    color: "#1F2937",
    fontSize: 14,
    textAlign: "right",
  },
  
  // Search Container
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
    textAlign: "right",
  },
  
  // Card Styles
  modernTransactionItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
  },
  
  // Card Header
  cardHeader: {
    backgroundColor: "#FF6B35",
    padding: 16,
  },
  headerRow: {
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    backgroundColor: hexToRgba("#FFFFFF", 0.2),
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  dateContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  dateIcon: {
    marginRight: 4,
  },
  dateText: {
    color: "#FFF",
    fontSize: 12,
    opacity: 0.9,
  },
  orderIdContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  packageIconBackground: {
    width: 32,
    height: 32,
    backgroundColor: hexToRgba("#FFFFFF", 0.2),
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  orderId: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  
  // Card Content
  cardContent: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    backgroundColor: "#FF6B35",
    borderRadius: 3,
  },
  
  // Info Box
  infoBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    gap: 8,
  },
  infoRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  recipientText: {
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  phoneText: {
    color: "#6B7280",
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
  
  // Details Row
  detailsRow: {
    flexDirection: "row-reverse",
    gap: 12,
  },
  detailBox: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    alignItems: "center",
  },
  detailNumber: {
    color: "#FF6B35",
    fontSize: 20,
    fontWeight: "bold",
  },
  detailLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    marginTop: 2,
  },
  
  // Pricing
  pricingContainer: {
    gap: 8,
  },
  priceRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  priceValueContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  priceValue: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
   totalBox: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    // Change these two lines
    backgroundColor: hexToRgba("#28a745", 0.1), // Greenish background
    borderColor: hexToRgba("#28a745", 0.2), // Greenish border
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  totalLabel: {
    color: "#28a745",
    fontWeight: "bold",
    fontSize: 14,
  },
  totalValueContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  totalValue: {
    color: "#28a745",
    fontSize: 18,
    fontWeight: "bold",
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
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
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
});