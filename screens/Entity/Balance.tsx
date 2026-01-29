import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Dimensions,
  TouchableOpacity, // Import TouchableOpacity
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Store as StoreIcon } from 'lucide-react-native';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import TopBar from '../../components/Entity/TopBarNew';
import CustomAlert from '../../components/CustomAlert';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import { TabParamList } from '../../navigation/MainTabNavigator'; // Assuming this path
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);
const { width } = Dimensions.get('window');
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const BASE_URL = 'http://tanmia-group.com:90/courierApi';

const Colors = {
  primary: '#FF6B35',
  background: '#F9FAFB',
  cardBackground: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  positive: '#27AE60',
  negative: '#E74C3C',
};

interface BalanceEntity {
  intEntityCode: number;
  EntityName: string;
  Balance: number;
}

const BalanceItemSkeleton = () => {
  const shimmerColors = [Colors.background, Colors.cardBackground, Colors.background];
  return (
    <View style={styles.skeletonContainer}>
      <ShimmerPlaceHolder style={styles.cardSkeleton} shimmerColors={shimmerColors} />
      <ShimmerPlaceHolder style={styles.cardSkeleton} shimmerColors={shimmerColors} />
      <ShimmerPlaceHolder style={styles.cardSkeleton} shimmerColors={shimmerColors} />
    </View>
  );
};

// MODIFICATION: BalanceCard now accepts an onPress prop
interface BalanceCardProps {
  item: BalanceEntity;
  onPress: (entityCode: number, entityName: string) => void;
}

const BalanceCard = ({ item, onPress }: BalanceCardProps) => (
  <TouchableOpacity onPress={() => onPress(item.intEntityCode, item.EntityName)} style={styles.balanceCard}>
    <View style={styles.cardHeader}>
      <View style={styles.storeIconWrapper}>
        <StoreIcon color={Colors.cardBackground} size={20} />
      </View>
      <View style={styles.storeDetails}>
        <Text style={styles.storeName} numberOfLines={1}>{item.EntityName}</Text>
      </View>
    </View>

    <View style={styles.balanceSection}>
      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>الرصيد:</Text>
        <Text style={[styles.balanceValue, item.Balance < 0 ? styles.negativeBalance : styles.positiveBalance]}>
          {item.Balance.toFixed(2)} د.ل
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

const EntitiesBalanceScreen = () => {
  const navigation = useNavigation<NavigationProp>(); // Get navigation object

  const [balances, setBalances] = useState<BalanceEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [isAlertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const loadUserId = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserId(parsedUser.userId);
      } else {
        setError('User ID not found. Please log in again.');
      }
    } catch (e) {
      console.error('Failed to load user ID from storage:', e);
      setError('An error occurred while retrieving user data.');
    }
  }, []);

  const fetchBalances = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/Entity/getentitybalances/${userId}`);
      if (response.data && Array.isArray(response.data)) {
        setBalances(response.data);
        setError(null);
      } else {
        setBalances([]);
        setError('No balance data found.');
      }
    } catch (err) {
      console.error('API Error:', err);
      setError('فشل في جلب البيانات. يرجى التحقق من اتصالك بالإنترنت.');
      setAlertTitle('خطأ');
      setAlertMessage('فشل في جلب الأرصدة. يرجى التحقق من اتصالك بالشبكة.');
      setAlertVisible(true);
      setBalances([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserId();
  }, [loadUserId]);

  useEffect(() => {
    if (userId) {
      fetchBalances();
    } else {
      setIsLoading(false);
    }
  }, [userId, fetchBalances]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchBalances();
  }, [fetchBalances]);

  // MODIFICATION: Calculate total balance
  const totalBalance = useMemo(() => {
    return balances.reduce((sum, item) => sum + item.Balance, 0);
  }, [balances]);

  // MODIFICATION: Handler for BalanceCard press
  const handleBalanceCardPress = useCallback((entityCode: number, entityName: string) => {
    // Navigate to ReportsDashboard and pass the entityCode as a parameter
    navigation.navigate('MainTabs', {
      screen: 'ReportsTab',
      params: { entityCode },
    });
    console.log(`Navigating to reports for entity:  ${entityCode}`);
  }, [navigation]);

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Image source={require('../../assets/images/empty-reports.png')} style={styles.emptyImage} />
      <Text style={styles.emptyText}>{error ? error : "لا توجد أرصدة لعرضها"}</Text>
      {!error && <Text style={styles.emptySubText}>تأكد من أن لديك متاجر مرتبطة بهذا الحساب</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <TopBar title="أرصدة المتاجر" />
      <FlatList
        data={balances}
        keyExtractor={(item) => item.intEntityCode.toString()}
        renderItem={({ item }) => <BalanceCard item={item} onPress={handleBalanceCardPress} />} // Pass onPress handler
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
        ListEmptyComponent={!isLoading ? renderEmptyComponent : null}
        ListHeaderComponent={isLoading ? <BalanceItemSkeleton /> : null}
        showsVerticalScrollIndicator={false}
      />

      {/* MODIFICATION: Add total balance footer */}
      {!isLoading && balances.length > 0 && (
        <View style={styles.totalFooter}>
          <Text style={styles.totalLabel}>الرصيد الإجمالي:</Text>
          <Text style={[styles.totalValue, totalBalance < 0 ? styles.negativeBalance : styles.positiveBalance]}>
            {totalBalance.toFixed(2)} د.ل
          </Text>
        </View>
      )}

      <CustomAlert
        isVisible={isAlertVisible}
        title={alertTitle}
        message={alertMessage}
        confirmText="حسنًا"
        onConfirm={() => setAlertVisible(false)} cancelText={undefined} onCancel={undefined} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  skeletonContainer: { paddingHorizontal: 16, paddingTop: 16 },
  cardSkeleton: { height: 100, width: '100%', borderRadius: 12, marginBottom: 16 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }, // Added paddingBottom
  balanceCard: { backgroundColor: Colors.cardBackground, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 12 },
  storeIconWrapper: { width: 44, height: 44, backgroundColor: Colors.primary, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  storeDetails: { flex: 1, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  storeName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600', textAlign: 'right' },
  balanceSection: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16, marginTop: 4 },
  balanceRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  balanceLabel: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500', textAlign: 'right' },
  balanceValue: { fontSize: 18, fontWeight: '700', textAlign: 'right' },
  positiveBalance: { color: Colors.positive },
  negativeBalance: { color: Colors.negative },
  emptyContainer: { backgroundColor: Colors.cardBackground, borderRadius: 12, paddingVertical: 50, paddingHorizontal: 20, alignItems: 'center', marginTop: 20, marginHorizontal: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  emptyImage: { width: 200, height: 120, marginBottom: 20, opacity: 0.7 },
  emptyText: { color: Colors.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  emptySubText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  // Total Footer Styles
  totalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 24, // Extra padding for home indicator
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  totalLabel: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default EntitiesBalanceScreen;