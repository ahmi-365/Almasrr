import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Package,
  CircleCheck as CheckCircle,
  Truck,
  Wallet,
  Clipboard,
  Undo2,
  HelpCircle,
} from 'lucide-react-native';
import axios from 'axios';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDashboard } from '../../Context/DashboardContext';
import { useFocusEffect } from '@react-navigation/native';

import TopBar from '../../components/Entity/TopBar';
import StatCard from '../../components/Entity/Statecard';

interface StatCardData {
  number: string;
  label: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  progressColor: string;
  rawCount: number;
}

const CARD_DEFINITIONS = [
  { label: 'في انتظار التصديق', icon: Package, iconColor: '#E67E22', progressColor: '#D35400' },
  { label: 'في الفرع', icon: Clipboard, iconColor: '#3498DB', progressColor: '#2980B9' },
  { label: 'في الطريق', icon: Truck, iconColor: '#F39C12', progressColor: '#F39C12' },
  { label: 'التوصيل ناجح', icon: CheckCircle, iconColor: '#27AE60', progressColor: '#2ECC71' },
  { label: 'الطرود المرتجعة', icon: Undo2, iconColor: '#E74C3C', progressColor: '#C0392B' },
];

const BalanceCardBackground = () => (
  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <Svg height="100%" width="100%" viewBox="0 0 300 100">
      <Path d="M-50 100 L50 100 L100 0 L0 0 Z M200 100 L250 100 L300 50 L250 0 L150 0 Z" fill="#FFFFFF" opacity={0.1} />
      <Path d="M-70 100 L30 100 L80 10 L-20 10 Z M220 100 L270 100 L320 60 L270 10 L170 10 Z" fill="#FFFFFF" opacity={0.05} />
    </Svg>
  </View>
);

export default function EntityDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { dashboardData, setDashboardData, dcBalance, setDcBalance } = useDashboard();

  const fetchDashboardData = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        setLoading(false);
        return;
      }

      const parsedUser = JSON.parse(userData);
      const userId = parsedUser?.userId;
      if (!userId) {
        setLoading(false);
        return;
      }

      const [dashboardResponse, entitiesResponse] = await Promise.all([
        axios.get(`https://tanmia-group.com:84/courierApi/entityparcels/DashboardData/${userId}`),
        axios.get(`https://tanmia-group.com:84/courierApi/Entity/GetEntities/${userId}`),
      ]);

      if (dashboardResponse.data) {
        setDashboardData(dashboardResponse.data);
        setDcBalance(String(dashboardResponse.data?.DCBalance?.toFixed(2) ?? '0.00'));
      }

      if (entitiesResponse.data) {
        await AsyncStorage.setItem('user_entities', JSON.stringify(entitiesResponse.data));
        console.log('User entities updated successfully in AsyncStorage.');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      Alert.alert('خطأ', 'فشل في جلب بيانات لوحة القيادة.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setDashboardData, setDcBalance]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statsDataWithMax = useMemo(() => {
    if (!dashboardData) return { data: [], max: 1000 };

    // Get keys that start with "Count" and sort by number
    const countKeys = Object.keys(dashboardData)
      .filter((key) => key.startsWith('Count'))
      .sort((a, b) => {
        const numA = parseInt(a.substring(5), 10);
        const numB = parseInt(b.substring(5), 10);
        return numA - numB;
      });

    const data = countKeys.map((key, index) => {
      const count = Number(dashboardData[key]) || 0;

      const definition = CARD_DEFINITIONS[index] || {
        label: `Unknown State ${index + 1}`,
        icon: HelpCircle,
        iconColor: '#95A5A6',
        progressColor: '#7F8C8D',
      };

      return {
        number: String(count),
        label: definition.label,
        icon: definition.icon,
        iconColor: definition.iconColor,
        progressColor: definition.progressColor,
        rawCount: count,
      };
    });

    const max = 1000;  // <-- fixed maxValue

    return { data, max };
  }, [dashboardData]);


  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <TopBar title="لوحة القيادة" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2C3E50" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar title="لوحة القيادة" />
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E67E22']} />
        }
      >
        <View style={styles.balanceCard}>
          <BalanceCardBackground />
          <View style={styles.balanceHeader}>
            <View style={styles.iconBackground}>
              <Wallet color="#FFF" size={20} />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>المبلغ المستحق</Text>
              <Text style={styles.balanceAmount}>
                {dcBalance ?? '0.00'}
                <Text style={styles.currency}> د.ل</Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            {statsDataWithMax.data.slice(0, 2).map((stat, idx) => (
              <StatCard key={`stat-card-${idx}`} {...stat} maxValue={statsDataWithMax.max} />
            ))}
          </View>
          <View style={styles.statsRow}>
            {statsDataWithMax.data.slice(2, 4).map((stat, idx) => (
              <StatCard key={`stat-card-${idx + 2}`} {...stat} maxValue={statsDataWithMax.max} />
            ))}
          </View>
          {statsDataWithMax.data.length > 4 && (
            <View style={styles.bannerRow}>
              <StatCard
                key="stat-card-banner"
                {...statsDataWithMax.data[4]}
                maxValue={statsDataWithMax.max}
                isBanner
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 80 },
  balanceCard: {
    backgroundColor: '#2C3E50',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
  },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', zIndex: 1 },
  iconBackground: {
    width: 40,
    height: 40,
    backgroundColor: '#E67E22',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  balanceInfo: { flex: 1 },
  balanceLabel: { color: '#BDC3C7', fontSize: 13, textAlign: 'right', marginBottom: 3 },
  balanceAmount: { color: '#FFF', fontSize: 20, fontWeight: 'bold', textAlign: 'right' },
  currency: { fontSize: 16 },
  statsGrid: {
    marginTop: 15,
    marginBottom: 20,
    gap: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  bannerRow: {},
});
