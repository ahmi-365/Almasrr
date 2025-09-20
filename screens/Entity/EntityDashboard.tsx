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
  TouchableOpacity,
  Easing,
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

import TopBar from '../../components/Entity/TopBar';
import Svg, { Path } from 'react-native-svg';

// Define the constant based on the TopBar component's HEADER_HEIGHT
const HEADER_EXPANDED_HEIGHT = 1;

// Helper function to convert hex color to rgba with opacity
const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// --- StatCounterCard (Modern + Clean) ---
const StatCounterCard = ({ item }) => (
  <View style={[styles.statCounterCard, { backgroundColor: hexToRgba(item.iconColor, 0.08) }]}>
    {/* Icon Circle */}
    <View style={[styles.statIconBackground, { backgroundColor: item.iconColor }]}>
      <item.icon color="#fff" size={22} />
    </View>

    {/* Number */}
    <Text style={styles.statCounterNumber}>{item.number}</Text>

    {/* Label */}
    <Text style={styles.statCounterLabel} numberOfLines={2}>
      {item.label}
    </Text>

    {/* Progress Bar */}
    <View style={[styles.progressBarContainer, { backgroundColor: hexToRgba(item.iconColor, 0.15) }]}>
      <View
        style={[
          styles.progressBarFill,
          { width: `${item.progress * 100}%`, backgroundColor: item.iconColor },
        ]}
      />
    </View>
  </View>
);

// --- COMPONENT 1: Auto-scrolling Image Banner ---
const { width: screenWidth } = Dimensions.get('window');
const SLIDER_WIDTH = screenWidth - 30;
const SLIDER_HEIGHT = 150; // Add this constant for the height

const IMAGE_BANNER_DATA = [
  { id: '1', uri: 'https://images.unsplash.com/photo-1548695607-9c73430ba065?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGRlbGl2ZXJ5fGVufDB8fDB8fHww' },
  { id: '2', uri: 'https://plus.unsplash.com/premium_photo-1682146662576-900a71864a11?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8ZGVsaXZlcnl8ZW58MHx8MHx8fDA%3D' },
  { id: '3', uri: 'https://plus.unsplash.com/premium_photo-1682090260563-191f8160ca48?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZGVsaXZlcnl8ZW58MHx8MHx8fDA%3D' },
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

const AnimatedPath = Animated.createAnimatedComponent(Path);

const AnimatedBalanceBackground = () => {
  const waveOffset1 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveOffset1, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(waveOffset1, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const wavePath1 = waveOffset1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      'M0,60 Q100,20 200,80 T400,40 L400,200 L0,200 Z', 
      'M0,40 Q100,100 200,30 T400,80 L400,200 L0,200 Z', 
      'M0,60 Q100,20 200,80 T400,40 L400,200 L0,200 Z'  
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
        <AnimatedPath d={wavePath1} fill="#FFFFFF" opacity={0.2} />
      </Svg>
    </View>
  );
};

export default function EntityDashboard() {
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
    setLoading(true);
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

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        {/* Remove animatedValue prop - TopBar doesn't accept it */}
        <TopBar />
        <View style={styles.center}><ActivityIndicator size="large" color="#E67E22" /></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Remove animatedValue prop - TopBar doesn't accept it */}
      <TopBar />
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
        <TouchableOpacity 
          style={styles.balanceCard}
          activeOpacity={0.95}
          onPress={() => {
            Alert.alert('المبلغ المستحق', `الرصيد الحالي: ${dcBalance} د.ل`);
          }}
        >
          <AnimatedBalanceBackground />
          <View style={styles.balanceContent}>
            <View style={styles.balanceHeader}>
              <View style={styles.iconWrapper}>
                <Wallet color="#FFFFFF" size={24} strokeWidth={2} />
              </View>
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceTitle}>المبلغ المستحق</Text>
                <Text style={styles.balanceValue}>
                  {dcBalance ?? '0.00'} <Text style={styles.currencyText}>د.ل</Text>
                </Text>
              </View>
            </View>
            <View style={styles.balanceFooter}>
              <Text style={styles.tapHint}>اضغط للمزيد من التفاصيل</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.imageSliderContainer}>
          <FlatList
            ref={imageSliderRef}
            data={IMAGE_BANNER_DATA}
            renderItem={({ item }) => <ImageBanner item={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ width: 15 }} />}
            getItemLayout={(data, index) => (
              { length: SLIDER_WIDTH + 15, offset: (SLIDER_WIDTH + 15) * index, index }
            )}
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

      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: HEADER_EXPANDED_HEIGHT,
    paddingBottom: 80,
  },

  iconBackground: {
    width: 50,
    height: 50,
    backgroundColor: '#E67E22',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
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
  statCounterCard: {
    width: 140,
    padding: 16,
    borderRadius: 16,
    // backgroundColor removed - now set dynamically based on icon color
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.08,
    // shadowRadius: 4,
    // elevation: 2,
    alignItems: "center",
    marginRight: 12,
    marginBottom: 14, 
  },
  statIconBackground: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statCounterNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  statCounterLabel: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  progressBarContainer: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    // backgroundColor removed - now set dynamically based on icon color
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  
  // Clean Minimalist Balance Card
  balanceCard: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    marginBottom: 28,
    // shadowColor: '#FF6B35',
    // shadowOffset: { width: 0, height: 6 },
    // shadowOpacity: 0.2,
    // shadowRadius: 10,
    // elevation: 6,
    overflow: 'hidden',
  },
  balanceContent: {
    padding: 7,
    zIndex: 2,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    marginTop: 15,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'right',
    marginBottom: 6,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'right',
    letterSpacing: 0.5,
  },
  currencyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  balanceFooter: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  tapHint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontStyle: 'italic',
  },
});