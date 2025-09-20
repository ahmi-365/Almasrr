import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  FlatList,
  Dimensions,
  Image,
} from 'react-native';
import {
  Package,
  CircleCheck as CheckCircle,
  Truck,
  Wallet,
  Clipboard,
  Undo2,
  HelpCircle,
  BarChart,
} from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDashboard } from '../../Context/DashboardContext';
import { useFocusEffect } from '@react-navigation/native';

import TopBar, { HEADER_EXPANDED_HEIGHT } from '../../components/Entity/TopBar';

// --- Horizontal Stat Card with Progress ---
const StatCounterCard = ({ item }) => (
  <View style={styles.statCounterCard}>
    <View style={[styles.statIconBackground, { backgroundColor: item.iconColor }]}>
      <item.icon color="#FFFFFF" size={20} />
    </View>
    <Text style={styles.statCounterNumber}>{item.number}</Text>
    <Text style={styles.statCounterLabel} numberOfLines={2}>{item.label}</Text>
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarFill, { width: `${item.progress * 100}%`, backgroundColor: item.progressColor }]} />
    </View>
  </View>
);

// --- COMPONENT 1: Auto-scrolling Image Banner ---
const { width: screenWidth } = Dimensions.get('window');
const SLIDER_WIDTH = screenWidth - 30;

const IMAGE_BANNER_DATA = [
  { id: '1', uri: 'https://via.placeholder.com/350x150.png/E67E22/FFFFFF?text=Banner+1' },
  { id: '2', uri: 'https://via.placeholder.com/350x150.png/3498DB/FFFFFF?text=Banner+2' },
  { id: '3', uri: 'https://via.placeholder.com/350x150.png/2ECC71/FFFFFF?text=Banner+3' },
];

const ImageBanner = ({ item }) => (
  <View style={styles.imageBannerContainer}>
    <Image source={{ uri: item.uri }} style={styles.bannerImage} resizeMode="cover" />
  </View>
);

// --- COMPONENT 2: Manual Promotional Text Slider ---
const PROMO_SLIDER_DATA = [
  {
    title: "تتبع شحناتك بسهولة",
    description: "احصل على تحديثات فورية ومباشرة.",
    icon: Truck,
    color: "#3498DB",
  },
  {
    title: "إحصائيات متقدمة",
    description: "حلل أداءك من خلال لوحة تحكم تفصيلية.",
    icon: BarChart,
    color: "#2ECC71",
  },
  {
    title: "خدمة عملاء مميزة",
    description: "فريقنا جاهز لمساعدتك على مدار الساعة.",
    icon: HelpCircle,
    color: "#E67E22",
  },
];

const PromoSliderItem = ({ item }) => (
  <View style={[styles.promoSliderItem, { backgroundColor: item.color }]}>
    <item.icon color="#FFF" size={28} style={styles.promoSliderIcon} />
    <View style={styles.promoSliderInfo}>
      <Text style={styles.promoSliderTitle}>{item.title}</Text>
      <Text style={styles.promoSliderDescription}>{item.description}</Text>
    </View>
  </View>
);

// --- Main Dashboard Component ---
interface StatCardData {
  number: string;
  label: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  progressColor: string;
  progress: number;
}

const CARD_DEFINITIONS = [
  { label: 'في انتظار التصديق', icon: Package, iconColor: '#E67E22', progressColor: '#D35400' },
  { label: 'في الفرع', icon: Clipboard, iconColor: '#3498DB', progressColor: '#2980B9' },
  { label: 'في الطريق', icon: Truck, iconColor: '#F39C12', progressColor: '#F39C12' },
  { label: 'التوصيل ناجح', icon: CheckCircle, iconColor: '#27AE60', progressColor: '#2ECC71' },
  { label: 'الطرود المرتجعة', icon: Undo2, iconColor: '#E74C3C', progressColor: '#C0392B' },
];

export default function EntityDashboard() {
  // 1. Loading state is initialized to `true` to show the loader on mount
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { dashboardData, setDashboardData, dcBalance, setDcBalance } = useDashboard();
  const scrollY = useRef(new Animated.Value(0)).current;
  const imageSliderRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (imageSliderRef.current) {
        imageSliderRef.current.scrollToIndex({
          index: Math.floor(Math.random() * IMAGE_BANNER_DATA.length),
          animated: true,
        });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true); // Ensure loader shows during focus fetches and refresh
    try {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) { return; }
      const parsedUser = JSON.parse(userData);
      const userId = parsedUser?.userId;
      if (!userId) { return; }
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
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      Alert.alert('خطأ', 'فشل في جلب بيانات لوحة القيادة.');
    } finally {
      // 3. Loading is set to `false` after the fetch is complete (success or fail)
      setLoading(false);
      setRefreshing(false);
    }
  }, [setDashboardData, setDcBalance]);

  useFocusEffect(useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statsData: StatCardData[] = useMemo(() => {
    if (!dashboardData) return [];
    const countKeys = Object.keys(dashboardData)
      .filter(key => key.startsWith('Count'))
      .sort((a, b) => parseInt(a.substring(5), 10) - parseInt(b.substring(5), 10));
    const totalCount = countKeys.reduce((sum, key) => sum + (Number(dashboardData[key]) || 0), 0);
    return countKeys.map((key, index) => {
      const count = Number(dashboardData[key]) || 0;
      const definition = CARD_DEFINITIONS[index] || {
        label: `Unknown State ${index + 1}`, icon: HelpCircle, iconColor: '#95A5A6', progressColor: '#7F8C8D',
      };
      return {
        number: String(count),
        label: definition.label,
        icon: definition.icon,
        iconColor: definition.iconColor,
        progressColor: definition.progressColor,
        progress: totalCount > 0 ? count / totalCount : 0,
      };
    });
  }, [dashboardData]);

  // 2. This block checks the loading state and returns the ActivityIndicator
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <TopBar animatedValue={scrollY} />
        <View style={styles.center}><ActivityIndicator size="large" color="#E67E22" /></View>
      </View>
    );
  }

  // This is the main view shown only after loading is false
  return (
    <View style={styles.container}>
      <TopBar animatedValue={scrollY} />
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E67E22']} />
        }
      >
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.iconBackground}><Wallet color="#FFF" size={24} /></View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>المبلغ المستحق</Text>
              <Text style={styles.balanceAmount}>{dcBalance ?? '0.00'}<Text style={styles.currency}> د.ل</Text></Text>
            </View>
          </View>
        </View>

        <View style={styles.imageSliderContainer}>
          <FlatList
            ref={imageSliderRef}
            data={IMAGE_BANNER_DATA}
            renderItem={({ item }) => <ImageBanner item={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          />
        </View>

        <View style={styles.promoSliderContainer}>
          <FlatList
            data={PROMO_SLIDER_DATA}
            renderItem={({ item }) => <PromoSliderItem item={item} />}
            keyExtractor={(item) => item.title}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          />
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>ملخص الطرود</Text>
          <FlatList
            data={statsData}
            renderItem={({ item }) => <StatCounterCard item={item} />}
            keyExtractor={(item) => item.label}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsListContent}
          />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: HEADER_EXPANDED_HEIGHT,
    paddingBottom: 80,
  },
  balanceCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#E67E22',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 20,
  },
  balanceHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBackground: {
    width: 50,
    height: 50,
    backgroundColor: '#E67E22',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  balanceInfo: { flex: 1, alignItems: 'flex-end' },
  balanceLabel: { color: '#B28A5C', fontSize: 14, marginBottom: 4 },
  balanceAmount: { color: '#D35400', fontSize: 24, fontWeight: 'bold' },
  currency: { fontSize: 20, fontWeight: 'normal', color: '#B28A5C' },

  imageSliderContainer: {
    height: 150,
    marginBottom: 20,
  },
  imageBannerContainer: {
    width: SLIDER_WIDTH,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },

  promoSliderContainer: {
    height: 90,
    marginBottom: 25,
  },
  promoSliderItem: {
    width: SLIDER_WIDTH,
    height: 90,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    overflow: 'hidden',
  },
  promoSliderIcon: {
    marginLeft: 15,
  },
  promoSliderInfo: { flex: 1 },
  promoSliderTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'right',
  },
  promoSliderDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'right',
  },

  statsSection: { marginBottom: 25 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343A40',
    marginBottom: 15,
    textAlign: 'right',
  },
  statsListContent: { gap: 12 },
  statCounterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    width: 115,
    height: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    justifyContent: 'space-between',
  },
  statIconBackground: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  statCounterNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  statCounterLabel: {
    fontSize: 10,
    color: '#6C757D',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 2,
  },
  progressBarContainer: {
    height: 4,
    width: '100%',
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
}); 