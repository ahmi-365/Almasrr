import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  FlatList,
  Dimensions,
  Easing,
} from 'react-native';
import { 
  Search, 
  X, 
  Package, 
  MapPin, 
  User,
  DollarSign,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const COLORS = {
  primary: '#FF6B35',
  secondary: '#E67E22',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#343A40',
  textSecondary: '#6C757D',
  border: '#E9ECEF',
  success: '#27AE60',
  warning: '#F39C12',
  danger: '#E74C3C',
  info: '#3498DB'
};

const STATUS_CONFIG = {
  'غير مؤكد': { color: COLORS.warning },
  'في الفرع': { color: COLORS.info },
  'في الطريق إلى الفرع الوجهة': { color: COLORS.secondary },
  'في الطريق': { color: COLORS.secondary },
  'تم التسليم للمستلم': { color: COLORS.success },
  'مرتجع': { color: COLORS.danger },
  'في الطريق للرجوع': { color: COLORS.danger },
  'تم إعادة تسليم الطرد إلى المتجر': { color: COLORS.danger },
  'راجع في المخزن': { color: COLORS.danger },
  'جارٍ تسليم الطرد إلى عميل جديد': { color: COLORS.info },
  'مؤكد': { color: '#2ECC71' },
};

interface Parcel {
  intParcelCode: number;
  dcFee: number;
  ReferenceNo: string;
  CityName: string;
  StatusName: string;
  TypeName: string;
  RecipientName: string;
  RecipientPhone: string;
  Quantity: number;
  CreatedAt: string;
  Remarks: string;
  Total: number;
  intStatusCode: number;
  strDriverRemarks: string;
}

interface RealTimeSearchDropdownProps {
  allParcels: Parcel[];
  onParcelSelect: (parcel: Parcel) => void;
}

const RealTimeSearchDropdown: React.FC<RealTimeSearchDropdownProps> = ({ 
  allParcels, 
  onParcelSelect 
}) => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredResults, setFilteredResults] = useState<Parcel[]>([]);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  // Real-time search effect
  useEffect(() => {
    if (searchQuery.length > 0) {
      const query = searchQuery.toLowerCase().trim();
      const results = allParcels.filter(parcel => 
        Object.values(parcel).some(value => 
          value?.toString().toLowerCase().includes(query)
        )
      );
      
      setFilteredResults(results);
      
      // Animate dropdown opening
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate dropdown closing
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setFilteredResults([]);
      });
    }
  }, [searchQuery, allParcels]);
const handleParcelSelect = (parcel: Parcel) => {
    console.log('Selected parcel:', parcel);
    navigation.navigate('ParcelDetailsScreen' as never, { parcel } as never);
    setSearchQuery(""); // Clear search after selection
  };
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  const opacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const formatCurrency = (amount: number) => {
    return `${parseFloat(amount?.toString() || '0').toFixed(2)} د.ل`;
  };

  const SearchResultItem = ({ item, index }: { item: Parcel; index: number }) => {
    const itemAnim = useRef(new Animated.Value(0)).current;
    const statusConfig = STATUS_CONFIG[item.StatusName] || STATUS_CONFIG['غير مؤكد'];

    useEffect(() => {
      Animated.spring(itemAnim, {
        toValue: 1,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    }, []);

    const scale = itemAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });

    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={styles.searchResultItem}
        onPress={() => handleParcelSelect(item)} 
          activeOpacity={0.7}
        >
          <View style={styles.resultItemHeader}>
            <View style={styles.parcelIdContainer}>
              <Package size={16} color={COLORS.primary} />
              <Text style={styles.parcelId}>#{item.intParcelCode}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
              <Text style={styles.statusText}>{item.StatusName}</Text>
            </View>
          </View>

          <View style={styles.resultItemBody}>
            <View style={styles.infoRow}>
              <MapPin size={14} color={COLORS.textSecondary} />
              <Text style={styles.cityText}>{item.CityName}</Text>
            </View>
            
            {item.RecipientName && (
              <View style={styles.infoRow}>
                <User size={14} color={COLORS.textSecondary} />
                <Text style={styles.recipientText}>{item.RecipientName}</Text>
              </View>
            )}

            <View style={styles.financialRow}>
              <Text style={styles.amountText}>{formatCurrency(item.Total)}</Text>
              <Text style={styles.referenceText}>{item.ReferenceNo}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchInputWrapper}>
        <Search size={20} color={COLORS.primary} />
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث برقم الطرد، اسم المستلم، المدينة..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.textSecondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <X size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Dropdown */}
      {searchQuery.length > 0 && filteredResults.length > 0 && (
        <Animated.View 
          style={[
            styles.searchDropdown,
            {
              opacity,
              transform: [{ translateY }]
            }
          ]}
        >
          <View style={styles.dropdownHeader}>
            <Text style={styles.resultsCount}>
              {filteredResults.length} نتيجة
            </Text>
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Results List */}
         {/* Scrollable Results List */}
<FlatList
  ref={flatListRef}
  data={filteredResults}
  renderItem={({ item, index }) => (
    <SearchResultItem item={item} index={index} />
  )}
  keyExtractor={(item) => item.intParcelCode.toString()}
  style={styles.resultsList}
  contentContainerStyle={styles.resultsContent}
  showsVerticalScrollIndicator={true}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
         
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchInputWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'right',
    padding: 0,
    marginHorizontal: 10,
  },
  searchDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 400, // This enables scrolling
    overflow: 'hidden',
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingBottom: 8,
  },
  dropdownHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  searchResultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultItemHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  parcelIdContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  parcelId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resultItemBody: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  cityText: {
    fontSize: 14,
    color: COLORS.text,
  },
  recipientText: {
    fontSize: 14,
    color: COLORS.text,
  },
  financialRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  referenceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default RealTimeSearchDropdown;