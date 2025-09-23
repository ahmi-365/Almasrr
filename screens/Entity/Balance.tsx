import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Store as StoreIcon, DollarSign } from 'lucide-react-native';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import TopBar from '../../components/Entity/TopBarNew';

const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);
const { width } = Dimensions.get('window');

const BASE_URL = 'https://tanmia-group.com:84/courierApi';

// A refined, professional color palette
const Colors = {
  primary: '#FF6B35', // Tangerine
  background: '#F9FAFB', // Very light gray
  cardBackground: '#FFFFFF',
  textPrimary: '#1F2937', // Dark gray
  textSecondary: '#6B7280', // Medium gray
  border: '#E5E7EB', // Lighter gray for borders
  positive: '#27AE60', // Green
  negative: '#E74C3C', // Red
};

interface BalanceEntity {
  intEntityCode: number;
  EntityName: string;
  Balance: number;
}

const MaterialTopBar = ({ title }: { title: string }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.topBarTitle}>{title}</Text>
    </View>
  );
};

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

const BalanceCard = ({ item }: { item: BalanceEntity }) => (
  <View style={styles.balanceCard}>
    {/* Header Section */}
    <View style={styles.cardHeader}>
      <View style={styles.storeIconWrapper}>
        <StoreIcon color={Colors.cardBackground} size={20} />
      </View>
      <View style={styles.storeDetails}>
        <Text style={styles.storeName} numberOfLines={1}>
          {item.EntityName}
        </Text>
        <Text style={styles.storeCode}>Code: {item.intEntityCode}</Text>
      </View>
    </View>
    
    {/* Balance Details Section */}
    <View style={styles.balanceSection}>
      <View style={styles.balanceRow}>
        <DollarSign size={16} color={Colors.textSecondary} />
        <Text style={styles.balanceLabel}>الرصيد:</Text>
        <Text style={[
          styles.balanceValue,
          item.Balance < 0 ? styles.negativeBalance : styles.positiveBalance
        ]}>
          {item.Balance.toFixed(2)}
        </Text>
      </View>
    </View>
  </View>
);

const EntitiesBalanceScreen = () => {
  const [balances, setBalances] = useState<BalanceEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBalances = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/Entity/getentitybalances/${userId}`);
      if (response.data && Array.isArray(response.data)) {
        setBalances(response.data);
        setError(null);
      } else {
        setBalances([]);
        setError('No balance data found or unexpected response format.');
      }
    } catch (err) {
      console.error('API Error:', err);
      setError('فشل في جلب البيانات. يرجى التحقق من اتصالك بالإنترنت.');
      Alert.alert('خطأ', 'فشل في جلب الأرصدة. يرجى التحقق من اتصالك بالشبكة.');
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
      setIsLoading(true);
      fetchBalances();
    }
  }, [userId, fetchBalances]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchBalances();
  }, [fetchBalances]);

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../../assets/images/empty-reports.png')}
        style={styles.emptyImage}
      />
      <Text style={styles.emptyText}>
        {error ? error : "لا توجد أرصدة لعرضها"}
      </Text>
      {!error && (
        <Text style={styles.emptySubText}>
          تأكد من أن لديك متاجر مرتبطة بهذا الحساب
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <TopBar title="أرصدة المتاجر" />

      {isLoading && <BalanceItemSkeleton />}

      {!isLoading && (
        <FlatList
          data={balances}
          keyExtractor={(item) => item.intEntityCode.toString()}
          renderItem={({ item }) => <BalanceCard item={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    paddingHorizontal: 24, // Consistent padding
    paddingBottom: 16,
    backgroundColor: Colors.background,
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  // Skeleton Styles
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cardSkeleton: {
    height: 100,
    width: '100%',
    borderRadius: 12,
    marginBottom: 16,
  },

  // Main List Content
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 8,
  },

  // Balance Card Styles
  balanceCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Card Header Section
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  storeIconWrapper: {
    width: 44,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeDetails: {
    flex: 1,
    flexDirection: 'row-reverse', // To place name and code in one row
    justifyContent: 'space-between', // To push them to opposite ends
    alignItems: 'center',
  },
  storeName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right', // Keep the name on the right
  },
  storeCode: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'left', // Place code on the left
  },

  // Balance Details Section
  balanceSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
    marginTop: 4,
  },
  balanceRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  balanceLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  positiveBalance: {
    color: Colors.positive,
  },
  negativeBalance: {
    color: Colors.negative,
  },

  // Empty State Styles
  emptyContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingVertical: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyImage: {
    width: 200,
    height: 120,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EntitiesBalanceScreen;