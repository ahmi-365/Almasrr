import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  Animated,
  Easing,
  RefreshControl,
  Dimensions,
} from 'react-native';
import TopBar from '../../components/Entity/TopBar';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { 
  ChevronDown, 
  Check, 
  Search, 
  FileDown, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
} from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Svg, { Path } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');
const HEADER_EXPANDED_HEIGHT = 1;

// Helper function to convert hex color to rgba with opacity
const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Animated Background Component (similar to dashboard)
const AnimatedPath = Animated.createAnimatedComponent(Path);

const AnimatedReportsBackground = () => {
  const waveOffset1 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveOffset1, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(waveOffset1, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const wavePath1 = waveOffset1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      'M0,50 Q100,10 200,70 T400,30 L400,200 L0,200 Z', 
      'M0,30 Q100,90 200,20 T400,70 L400,200 L0,200 Z', 
      'M0,50 Q100,10 200,70 T400,30 L400,200 L0,200 Z'  
    ],
  });        

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0, 
      }}
      pointerEvents="none"
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 200" 
        preserveAspectRatio="none"
      >
        <AnimatedPath d={wavePath1} fill="#FFFFFF" opacity={0.15} />
      </Svg>
    </View>
  );
};

// Modern Stats Card Component
const StatsCard = ({ icon: Icon, title, value, color, subtitle }) => (
  <View style={[styles.statsCard, { backgroundColor: hexToRgba(color, 0.08) }]}>
    <View style={[styles.statsIconBackground, { backgroundColor: color }]}>
      <Icon color="#fff" size={20} />
    </View>
    <Text style={styles.statsValue}>{value}</Text>
    <Text style={styles.statsTitle} numberOfLines={1}>{title}</Text>
    {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
  </View>
);

// Modern Filter Section Component
const FilterSection = ({ 
  user, 
  selectedEntity, 
  setEntityModalVisible, 
  fromDate, 
  toDate, 
  setDatePickerVisible, 
  handleSearch, 
  loading 
}) => (
  <View style={styles.modernFilterSection}>
    <Text style={styles.filterSectionTitle}>فلتر التقارير</Text>
    
    {user?.roleName === 'Entity' && (
      <TouchableOpacity 
        style={styles.modernDropdown} 
        onPress={() => setEntityModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.modernDropdownContent}>
          <View style={styles.modernDropdownIcon}>
            <BarChart3 color="#FF6B35" size={20} />
          </View>
          <View style={styles.modernDropdownText}>
            <Text style={styles.modernDropdownLabel}>المتجر المحدد</Text>
            <Text style={styles.modernDropdownValue} numberOfLines={1}>
              {selectedEntity ? `${selectedEntity.strEntityName}` : 'اختر المتجر'}
            </Text>
          </View>
          <ChevronDown color="#9CA3AF" size={20} />
        </View>
      </TouchableOpacity>
    )}
    
    <View style={styles.modernDateRow}>
      <TouchableOpacity 
        style={styles.modernDateField} 
        onPress={() => setDatePickerVisible('from')}
        activeOpacity={0.7}
      >
        <View style={styles.modernDateIcon}>
          <Calendar color="#3498DB" size={18} />
        </View>
        <View style={styles.modernDateContent}>
          <Text style={styles.modernDateLabel}>من تاريخ</Text>
          <Text style={styles.modernDateValue}>{fromDate.toLocaleDateString('ar')}</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.modernDateField} 
        onPress={() => setDatePickerVisible('to')}
        activeOpacity={0.7}
      >
        <View style={styles.modernDateIcon}>
          <Calendar color="#E67E22" size={18} />
        </View>
        <View style={styles.modernDateContent}>
          <Text style={styles.modernDateLabel}>إلى تاريخ</Text>
          <Text style={styles.modernDateValue}>{toDate.toLocaleDateString('ar')}</Text>
        </View>
      </TouchableOpacity>
    </View>
    
    <TouchableOpacity 
      style={styles.modernSearchButton} 
      onPress={handleSearch} 
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#FFF" size="small" />
      ) : (
        <>
          <Search size={20} color="#FFF" />
          <Text style={styles.modernSearchButtonText}>بحث عن المعاملات</Text>
        </>
      )}
    </TouchableOpacity>
  </View>
);

// Modern Transaction Item Component
const ModernTransactionItem = ({ item, index }) => (
  <View style={[styles.modernTransactionItem, index % 2 === 0 && styles.alternateRow]}>
    <View style={styles.transactionHeader}>
      <Text style={styles.transactionDate}>
        {new Date(item.CreatedAt).toLocaleDateString('ar', { 
          day: '2-digit', 
          month: 'short', 
          year: '2-digit' 
        })}
      </Text>
      <Text style={styles.transactionTime}>
        {new Date(item.CreatedAt).toLocaleTimeString('ar', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
    
    <Text style={styles.transactionBranch}>{item.BranchName}</Text>
    
    <View style={styles.transactionAmounts}>
      {item.CreditAmount > 0 && (
        <View style={styles.creditAmount}>
          <TrendingUp size={16} color="#27AE60" />
          <Text style={styles.creditText}>+{item.CreditAmount.toLocaleString()}</Text>
        </View>
      )}
      {item.DebitAmount > 0 && (
        <View style={styles.debitAmount}>
          <TrendingDown size={16} color="#E74C3C" />
          <Text style={styles.debitText}>-{item.DebitAmount.toLocaleString()}</Text>
        </View>
      )}
    </View>
    
    <View style={styles.transactionFooter}>
      <Text style={styles.runningTotalLabel}>الرصيد:</Text>
      <Text style={styles.runningTotal}>{item.RunningTotal.toLocaleString()}</Text>
    </View>
    
    {item.Remarks && (
      <Text style={styles.transactionRemarks}>{item.Remarks}</Text>
    )}
  </View>
);

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
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [entityModalVisible, setEntityModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState<'from' | 'to' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;

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
    if (!user) return;

    setLoading(true);
    setTransactions([]);
    try {
      const formattedFromDate = formatDate(fromDate);
      const formattedToDate = formatDate(toDate);
      let url = '';

      if (user.roleName === 'Entity') {
        url = `https://tanmia-group.com:84/courierApi/Entity/GetTransaction/${selectedEntity!.intEntityCode}/${formattedFromDate}/${formattedToDate}`;
      } else {
        url = `https://tanmia-group.com:84/courierApi/Driver/GetTransaction/${user.userId}/${formattedFromDate}/${formattedToDate}`;
      }

      const response = await axios.get(url);
      setTransactions(response.data || []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      Alert.alert('خطأ', 'فشل في جلب بيانات المعاملات.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedEntity, fromDate, toDate, user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    handleSearch();
  }, [handleSearch]);

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

  const renderTransactionItem = ({ item, index }) => (
    <ModernTransactionItem item={item} index={index} />
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <TopBar title="تقرير المعاملات" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>جاري تحميل التقارير...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar title="تقرير المعاملات" />
      
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
      >
        <FilterSection 
          user={user}
          selectedEntity={selectedEntity}
          setEntityModalVisible={setEntityModalVisible}
          fromDate={fromDate}
          toDate={toDate}
          setDatePickerVisible={setDatePickerVisible}
          handleSearch={handleSearch}
          loading={loading}
        />

        {transactions.length > 0 && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>ملخص المعاملات</Text>
            <View style={styles.summaryCards}>
              <StatsCard
                icon={TrendingUp}
                title="إجمالي الإيداع"
                value={totals.totalCredit.toLocaleString()}
                color="#27AE60"
              />
              <StatsCard
                icon={TrendingDown}
                title="إجمالي السحب"
                value={totals.totalDebit.toLocaleString()}
                color="#E74C3C"
              />
              <StatsCard
                icon={DollarSign}
                title="الرصيد النهائي"
                value={totals.finalBalance.toLocaleString()}
                color="#FF6B35"
              />
            </View>
          </View>
        )}

        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>
            {transactions.length > 0 ? `المعاملات (${transactions.length})` : 'المعاملات'}
          </Text>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AnimatedReportsBackground />
              <View style={styles.emptyContent}>
                <BarChart3 color="#9CA3AF" size={48} />
                <Text style={styles.emptyText}>لا توجد معاملات</Text>
                <Text style={styles.emptySubText}>
                  يرجى تحديد {user?.roleName === 'Entity' ? 'متجر و' : ''}تاريخ والضغط على بحث
                </Text>
              </View>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item, index) => `${item.TransactionID}-${index}`}
              renderItem={renderTransactionItem}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            />
          )}
        </View>
      </Animated.ScrollView>

      {datePickerVisible && (
        <DateTimePicker
          value={datePickerVisible === 'from' ? fromDate : toDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {user?.roleName === 'Entity' && (
        <Modal 
          visible={entityModalVisible} 
          animationType="fade" 
          transparent={true} 
          onRequestClose={() => setEntityModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setEntityModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <SafeAreaView style={styles.modernModalContent}>
                  <Text style={styles.modalTitle}>اختيار المتجر</Text>
                  
                  <View style={styles.modernModalSearchContainer}>
                    <Search color="#9CA3AF" size={20} style={styles.modalSearchIcon} />
                    <TextInput 
                      style={styles.modernModalSearchInput} 
                      placeholder="ابحث عن متجر..." 
                      placeholderTextColor="#9CA3AF" 
                      value={searchQuery} 
                      onChangeText={setSearchQuery} 
                    />
                  </View>
                  
                  <FlatList
                    data={displayedEntities}
                    keyExtractor={item => item.intEntityCode.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={styles.modernModalItem} 
                        onPress={() => { 
                          setSelectedEntity(item); 
                          setEntityModalVisible(false); 
                          setSearchQuery(''); 
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.modalItemContent}>
                          <Text style={[
                            styles.modernModalItemText, 
                            selectedEntity?.intEntityCode === item.intEntityCode && styles.modalItemSelected
                          ]}>
                            {item.strEntityName}
                          </Text>
                          <Text style={styles.modalItemCode}>{item.strEntityCode}</Text>
                        </View>
                        {selectedEntity?.intEntityCode === item.intEntityCode && (
                          <Check color="#FF6B35" size={20} />
                        )}
                      </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
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
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: HEADER_EXPANDED_HEIGHT,
    paddingBottom: 80,
  },
  
  // Modern Filter Section
  modernFilterSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'right',
  },
  
  modernDropdown: {
    marginBottom: 16,
  },
  modernDropdownContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modernDropdownIcon: {
    width: 40,
    height: 40,
    backgroundColor: hexToRgba('#FF6B35', 0.1),
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  modernDropdownText: {
    flex: 1,
  },
  modernDropdownLabel: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 2,
  },
  modernDropdownValue: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  
  modernDateRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 16,
  },
  modernDateField: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modernDateIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modernDateContent: {
    flex: 1,
  },
  modernDateLabel: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 2,
  },
  modernDateValue: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  
  modernSearchButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modernSearchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Summary Section
  summarySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'right',
  },
  summaryCards: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  
  // Stats Card
  statsCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statsIconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statsTitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
  },
  
  // Transactions Section
  transactionsSection: {
    marginBottom: 20,
  },
  
  // Modern Transaction Item
  modernTransactionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alternateRow: {
    backgroundColor: '#FAFAFA',
  },
  transactionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionDate: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionTime: {
    color: '#6B7280',
    fontSize: 12,
  },
  transactionBranch: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'right',
  },
  transactionAmounts: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 8,
  },
  creditAmount: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: hexToRgba('#27AE60', 0.1),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  creditText: {
    color: '#27AE60',
    fontSize: 14,
    fontWeight: '600',
  },
  debitAmount: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: hexToRgba('#E74C3C', 0.1),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  debitText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  runningTotalLabel: {
    color: '#6B7280',
    fontSize: 12,
  },
  runningTotal: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionRemarks: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  
  // Empty State
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  emptyContent: {
    alignItems: 'center',
    zIndex: 2,
  },
  emptyText: {
    color: '#374151',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
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
  modernModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 16,
  },
  modernModalSearchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalSearchIcon: {
    marginLeft: 8,
  },
  modernModalSearchInput: {
    flex: 1,
    color: '#1F2937',
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    textAlign: 'right',
  },
  modernModalItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemContent: {
    flex: 1,
  },
  modernModalItemText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
    marginBottom: 2,
  },
  modalItemCode: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'right',
  },
  modalItemSelected: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
});