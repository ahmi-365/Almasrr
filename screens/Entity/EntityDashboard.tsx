import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Package, CircleCheck as CheckCircle, Truck, Wallet, Clipboard } from 'lucide-react-native';
import axios from 'axios';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDashboard } from '../../Context/DashboardContext';

import TopBar from '../../components/Entity/TopBar';
import StatCard from '../../components/Entity/Statecard';

interface StatCardData {
  number: string;
  label: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  progressColor: string;
}

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
  const { dashboardData, setDashboardData, dcBalance, setDcBalance } = useDashboard();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get user data from AsyncStorage
        const userData = await AsyncStorage.getItem('user');
        if (!userData) {
          console.warn('No user found in storage');
          setLoading(false);
          return;
        }

        const parsedUser = JSON.parse(userData);
        const userId = parsedUser?.id;
        if (!userId) {
          console.warn('No user ID found in user data');
          setLoading(false);
          return;
        }

        // Fetch dashboard data only if not already in context
        if (!dashboardData) {
          const response = await axios.get(
            `https://tanmia-group.com:84/courierApi/entityparcels/DashboardData/${userId}`
          );
          console.log('Fetched dashboard data:', response.data);

          setDashboardData(response.data);
          setDcBalance(String(response.data?.DCBalance ?? '0.00')); // update balance in context
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statsData: StatCardData[] = useMemo(() => {
    if (!dashboardData) return [];
    return [
      { number: String(dashboardData?.Count1 ?? 0), label: 'في الفرع', icon: Clipboard, iconColor: '#3498DB', progressColor: '#2980B9' },
      { number: String(dashboardData?.Count2 ?? 0), label: 'في انتظار التصديق', icon: Package, iconColor: '#E67E22', progressColor: '#D35400' },
      { number: String(dashboardData?.Count3 ?? 0), label: 'الوصول بنجح', icon: CheckCircle, iconColor: '#27AE60', progressColor: '#2ECC71' },
      { number: String(dashboardData?.Count4 ?? 0), label: 'في الطريق', icon: Truck, iconColor: '#E67E22', progressColor: '#F39C12' },
    ];
  }, [dashboardData]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2C3E50" />
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
      >
        {/* Balance Card */}
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

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            {statsData.slice(0, 2).map((stat, idx) => (
              <StatCard
                key={idx}
                number={stat.number}
                label={stat.label}
                icon={stat.icon}
                iconColor={stat.iconColor}
                progressColor={stat.progressColor}
                progress={0.5}
              />
            ))}
          </View>
          <View style={styles.statsRow}>
            {statsData.slice(2, 4).map((stat, idx) => (
              <StatCard
                key={idx}
                number={stat.number}
                label={stat.label}
                icon={stat.icon}
                iconColor={stat.iconColor}
                progressColor={stat.progressColor}
                progress={0.5}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 80 },
  balanceCard: {
    backgroundColor: '#2C3E50',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
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
  statsGrid: { marginBottom: 20 },
  statsRow: { flexDirection: 'row', marginBottom: 10, justifyContent: 'center', gap: 20 },
});
