import React, {
  useMemo,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Alert,
  Animated,
  FlatList,
  Dimensions,
  Image,
  TouchableOpacity,
  Easing,
  TextInput,
} from "react-native";
import {
  Wallet,
  HelpCircle,
  BarChart,
  Truck as TruckIconLucide,
  Search,
  X,
  Package,
  Wallet2,
} from "lucide-react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDashboard } from "../../Context/DashboardContext";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import TopBar from "../../components/Entity/TopBar";
import Svg, { Path } from "react-native-svg";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import CustomAlert from "../../components/CustomAlert";
import { navigate } from "../../navigation/NavigationService";
import { useNotifications } from '../../Context/NotificationContext';
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabParamList } from "../../navigation/MainTabNavigator";

const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);
const HEADER_EXPANDED_HEIGHT = 1;

const { width: screenWidth } = Dimensions.get("window");
const SLIDER_WIDTH = screenWidth - 30;

// Color configuration
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

const hexToRgba = (hex, opacity) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Stat Counter Card Component
const StatCounterCard = ({ item, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[
      styles.statCounterCard,
      { backgroundColor: hexToRgba(item.color, 0.08) },
    ]}
  >
    <View style={styles.statImageContainer}>
      <Image source={item.icon} style={styles.statImage} />
      <View
        style={[
          styles.badgeContainer,
          { borderColor: hexToRgba(item.color, 0.1) },
        ]}
      >
        <Text style={[styles.badgeText, { color: item.color }]}>
          {item.number}
        </Text>
      </View>
    </View>
    <Text style={styles.statCounterLabel} numberOfLines={2}>
      {item.label}
    </Text>
    <View
      style={[
        styles.progressBarContainer,
        { backgroundColor: hexToRgba(item.color, 0.15) },
      ]}
    >
      <View
        style={[
          styles.progressBarFill,
          { width: `${item.progress * 100}%`, backgroundColor: item.color },
        ]}
      />
    </View>
  </TouchableOpacity>
);

// Image Banner Component
const ImageBanner = ({ item }) => (
  <View style={styles.imageBannerContainer}>
    <Image
      source={{ uri: item.url }}
      style={styles.bannerImage}
      resizeMode="cover"
    />
  </View>
);

// Promo Slider Data
const PROMO_SLIDER_DATA = [
  {
    title: "تبع شحناتك بسهوله",
    // description: "احصل على تحديثات فورية عن موقع شحنتك وموعد تسليمها",
    icon: TruckIconLucide,
    color: "#3498DB",
  },
  // {
  //   title: "إحصائيات متقدمة",
  //   description: "حلل أداءك من خلال لوحة تحكم تفصيلية.",
  //   icon: BarChart,
  //   color: "#2ECC71",
  // },
  // {
  //   title: "خدمة عملاء مميزة",
  //   description: "فريقنا جاهز لمساعدتك على مدار الساعة.",
  //   icon: HelpCircle,
  //   color: "#E67E22",
  // },
];

// Promo Slider Item Component
const PromoSliderItem = ({ item }) => (
  <View style={[styles.promoSliderItem, { backgroundColor: item.color }]}>
    <item.icon color="#FFF" size={28} style={styles.promoSliderIcon} />
    <View style={styles.promoSliderInfo}>
      <Text style={styles.promoSliderTitle}>{item.title}</Text>
      {/* <Text style={styles.promoSliderDescription}>{item.description}</Text> */}
    </View>
  </View>
);

// Dashboard Skeleton Component
const DashboardSkeleton = () => {
  const shimmerColors = ["#FDF1EC", "#FEF8F5", "#FDF1EC"];

  const StatCardSkeleton = () => (
    <View style={[styles.statCounterCard, { backgroundColor: "#FFF" }]}>
      <ShimmerPlaceHolder
        style={{ width: 50, height: 50, borderRadius: 8, marginBottom: 12 }}
        shimmerColors={shimmerColors}
      />
      <ShimmerPlaceHolder
        style={{ width: "80%", height: 15, borderRadius: 4, marginBottom: 10 }}
        shimmerColors={shimmerColors}
      />
      <ShimmerPlaceHolder
        style={{ width: "100%", height: 6, borderRadius: 4 }}
        shimmerColors={shimmerColors}
      />
    </View>
  );

  return (
    <View style={{ paddingHorizontal: 15, paddingTop: 1, paddingBottom: 80 }}>
      <ShimmerPlaceHolder
        style={[
          styles.balanceCard,
          { height: 100, width: "100%", backgroundColor: "#FDF1EC" },
        ]}
        shimmerColors={shimmerColors}
      />
      <ShimmerPlaceHolder
        style={{
          width: SLIDER_WIDTH,
          height: 150,
          borderRadius: 8,
          marginBottom: 20,
        }}
        shimmerColors={shimmerColors}
      />
      <View style={styles.statsSection}>
        <ShimmerPlaceHolder
          style={{
            width: 120,
            height: 22,
            marginBottom: 15,
            alignSelf: "flex-end",
          }}
          shimmerColors={shimmerColors}
        />
        <View style={{ flexDirection: "row" }}>
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <View style={{ display: screenWidth > 400 ? "flex" : "none" }}>
            <StatCardSkeleton />
          </View>
        </View>
      </View>
      <ShimmerPlaceHolder
        style={{ width: SLIDER_WIDTH, height: 90, borderRadius: 8 }}
        shimmerColors={shimmerColors}
      />
    </View>
  );
};

// Card Definitions
const CARD_DEFINITIONS = [
  {
    label: "في انتظار التصديق",
    icon: require("../../assets/pending.png"),
    color: "#E67E22",
    navigateTo: "PendingApprovalScreen",
  },
  {
    label: "في الفرع",
    icon: require("../../assets/branch.png"),
    color: "#3498DB",
    navigateTo: "AtBranchScreen",
  },
  {
    label: "في الطريق",
    icon: require("../../assets/truck.png"),
    color: "#F39C12",
    navigateTo: "OnTheWayScreen",
  },
  {
    label: "التوصيل ناجح",
    icon: require("../../assets/delivered.png"),
    color: "#27AE60",
    navigateTo: "SuccessfulDeliveryScreen",
  },
  {
    label: "الطرود المرتجعة",
    icon: require("../../assets/returned.png"),
    color: "#E74C3C",
    navigateTo: "ReturnedParcelsScreen",
  },
];

// Animated Balance Background
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
      "M0,60 Q100,20 200,80 T400,40 L400,200 L0,200 Z",
      "M0,40 Q100,100 200,30 T400,80 L400,200 L0,200 Z",
      "M0,60 Q100,20 200,80 T400,40 L400,200 L0,200 Z",
    ],
  });

  return (
    <View
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
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

// Main Dashboard Component
export default function EntityDashboard() {
  const {
    dashboardData,
    setDashboardData,
    dcBalance,
    setDcBalance,
    user,
    setUser,
  } = useDashboard();

  const [loading, setLoading] = useState(!dashboardData);
  const [refreshing, setRefreshing] = useState(false);
  const [allParcels, setAllParcels] = useState([]);
  const [isAlertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const { fetchNotifications, unreadCount } = useNotifications();
  const [imageBanners, setImageBanners] = useState([]);


  const scrollY = useRef(new Animated.Value(0)).current;
  const imageSliderRef = useRef(null);
  const navigation = useNavigation();
  const navigationstack = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const { setCurrentRoute } = useDashboard(); // Get the setter
  // ✅ REPLACE WITH THIS SINGLE HOOK

  useFocusEffect(
    React.useCallback(() => {
      // Set current route
      setCurrentRoute('EntityDashboard');

      // Fetch notifications only when dashboard comes into focus
      if (user?.userId) {
        console.log('🔔 Dashboard focused - refreshing notifications');
        fetchNotifications();
      }
    }, [setCurrentRoute, user, fetchNotifications])
  );

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      if (!user) {
        try {
          const userDataString = await AsyncStorage.getItem("user");
          // console.log("Loaded user from AsyncStorage:", userDataString);
          if (userDataString) {
            setUser(JSON.parse(userDataString));
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error("Failed to load user from AsyncStorage", error);
          setLoading(false);
        }
      }
    };
    loadUser();
  }, [user, setUser]);

  // Fetch promo images
  useEffect(() => {

    const fetchPromoImages = async () => {
      const userDataString = await AsyncStorage.getItem('user');
      if (!userDataString) {
        console.log('❌ No branch found'); // Clarified message

        return;
      }

      const userData = JSON.parse(userDataString);

      const branchCode = userData.intFromBranchCode || userData.branchCode || userData.BranchCode;
      if (branchCode) {
        try {
          const response = await axios.get(`http://tanmia-group.com:90/courierapi/promoimages/${branchCode}`);
          setImageBanners(response.data);
        } catch (error) {
          console.error("Failed to fetch promo images:", error);
        }
      }
    };
    fetchPromoImages();
  }, [user]);


  // Image slider auto-scroll
  useEffect(() => {
    if (imageBanners.length > 0) {
      const interval = setInterval(() => {
        if (imageSliderRef.current) {
          const nextIndex = Math.floor(Math.random() * imageBanners.length);
          imageSliderRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [imageBanners]);


  // Load cached parcels
  useEffect(() => {
    const loadCachedParcels = async () => {
      try {
        const cachedParcels = await AsyncStorage.getItem("all_parcels");
        if (cachedParcels) {
          setAllParcels(JSON.parse(cachedParcels));
        }
      } catch (error) {
        console.error("Failed to load cached parcels:", error);
      }
    };
    loadCachedParcels();
  }, []);



  // Fetch all parcels
  const fetchAllParcels = useCallback(async () => {
    if (!user?.userId) {
      console.log("⚠️ No user ID found, skipping parcel fetch");
      return;
    }

    try {
      const entityCode = user.userId;
      const url = `http://tanmia-group.com:90/courierApi/parcels/EntityParcels/${entityCode}`;

      const response = await axios.get(url);

      if (response.data && response.data.Parcels && Array.isArray(response.data.Parcels)) {
        console.log("✅ Fetched", response.data.Parcels.length, "parcels");
        setAllParcels(response.data.Parcels);
        await AsyncStorage.setItem(
          "all_parcels",
          JSON.stringify(response.data.Parcels)
        );
      } else {
        console.log("⚠️ No parcels data received");
        setAllParcels([]);
      }
    } catch (error) {
      console.error("❌ Error fetching parcels:", error.message);
    }
  }, [user]);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.userId) return;

    const userId = user.userId;

    try {
      const dashboardResponse = await axios.get(
        `http://tanmia-group.com:90/courierApi/entityparcels/DashboardData/${userId}`
      );

      const entitiesResponse = await axios.get(
        `http://tanmia-group.com:90/courierApi/Entity/GetEntities/${userId}`
      );

      if (dashboardResponse.data) {
        setDashboardData(dashboardResponse.data);
        setDcBalance(
          String(dashboardResponse.data?.DCBalance?.toFixed(2) ?? "0.00")
        );
        await AsyncStorage.setItem(
          "dashboard_data",
          JSON.stringify(dashboardResponse.data)
        );
      }

      if (entitiesResponse.data) {
        await AsyncStorage.setItem(
          "user_entities",
          JSON.stringify(entitiesResponse.data)
        );
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, setDashboardData, setDcBalance]);

  // Focus effect for data fetching
  useFocusEffect(
    useCallback(() => {
      if (!dashboardData && user) {
        fetchDashboardData();
      }
    }, [dashboardData, user, fetchDashboardData])
  );

  // Refresh control
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllParcels();
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Background parcel fetching
  useEffect(() => {
    if (user?.userId) {
      fetchAllParcels();
    }
  }, [user, fetchAllParcels]);


  useEffect(() => {
    const checkPendingNotification = async () => {
      // We only proceed if the parcel list is loaded.
      if (allParcels.length === 0) {
        return;
      }

      try {
        const parcelCode = await AsyncStorage.getItem('pending_notification_parcel_code');

        if (parcelCode) {
          console.log('Pending notification found for parcel code:', parcelCode);
          // IMPORTANT: Remove the item immediately to prevent re-triggering
          await AsyncStorage.removeItem('pending_notification_parcel_code');

          const targetParcel = allParcels.find(
            (p) => p.intParcelCode.toString() === parcelCode.toString()
          );

          if (targetParcel) {
            console.log('Found parcel in dashboard state. Navigating...');
            // navigation.navigate('ParcelDetailsScreen', { parcel: targetParcel });
            navigate('ParcelDetailsScreen', { parcel: targetParcel });
          } else {
            console.warn('Parcel from notification not found in the loaded list.');
          }
        }
      } catch (error) {
        console.error('Failed to handle pending notification:', error);
      }
    };

    checkPendingNotification();

  }, [allParcels, navigation]); // Dependency array ensures this runs when parcels are loaded

  // Stats data calculation
  const statsData = useMemo(() => {
    if (!dashboardData) return [];
    const countKeys = Object.keys(dashboardData)
      .filter((key) => key.startsWith("Count"))
      .sort(
        (a, b) => parseInt(a.substring(5), 10) - parseInt(b.substring(5), 10)
      );

    const totalCount = countKeys.reduce(
      (sum, key) => sum + (Number(dashboardData[key]) || 0),
      0
    );

    return countKeys.map((key, index) => {
      const count = Number(dashboardData[key]) || 0;
      const definition = CARD_DEFINITIONS[index] || {
        label: `Unknown State ${index + 1}`,
        icon: require("../../assets/pending.png"),
        color: "#95A5A6",
        navigateTo: "",
      };
      return {
        number: String(count),
        label: definition.label,
        icon: definition.icon,
        color: definition.color,
        navigateTo: definition.navigateTo,
        progress: totalCount > 0 ? count / totalCount : 0,
      };
    });
  }, [dashboardData]);

  // Handle parcel selection from search
  const handleParcelSelect = (parcel) => {
    console.log('Selected parcel:', parcel);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar allParcels={allParcels} />
        <DashboardSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar allParcels={allParcels} />
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
            colors={["#E67E22"]}
            tintColor={"#E67E22"}
          />
        }
      >
        {/* Promo Slider */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => navigation.navigate('TrackShipment' as never)}>
          <View style={styles.promoSliderContainer}>
            <FlatList
              data={PROMO_SLIDER_DATA}
              renderItem={({ item }) => <PromoSliderItem item={item} />}
              keyExtractor={(item) => item.title}
              horizontal
              decelerationRate="fast"
              snapToInterval={SLIDER_WIDTH + 15}
              snapToAlignment="start"
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: 15 }} />}
              getItemLayout={(data, index) => ({
                length: SLIDER_WIDTH + 15,
                offset: (SLIDER_WIDTH + 15) * index,
                index,
              })}
            />
          </View>
        </TouchableOpacity>
        <>
          {/* Balance Card */}
          <TouchableOpacity
            style={styles.balanceCard}
            activeOpacity={0.95}
            onPress={() => navigationstack.navigate('ReportsTab')}
          >
            <AnimatedBalanceBackground />
            <View style={styles.balanceContent}>
              <View style={styles.balanceHeader}>
                <View style={styles.iconWrapper}>
                  <Wallet2 color="#FFFFFF" size={34} strokeWidth={2} />
                </View>
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceTitle}>المبلغ المستحق</Text>
                  <Text style={styles.balanceValue}>
                    {dcBalance ?? "0.00"}{" "}
                    <Text style={styles.currencyText}>د.ل</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.balanceFooter}>
                <Text style={styles.tapHint}>اضغط للمزيد من التفاصيل</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Image Slider */}
          <View style={styles.imageSliderContainer}>
            <FlatList
              ref={imageSliderRef}
              data={imageBanners}
              renderItem={({ item }) => <ImageBanner item={item} />}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              decelerationRate="fast"
              snapToInterval={SLIDER_WIDTH + 15}
              snapToAlignment="start"
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: 15 }} />}
              getItemLayout={(data, index) => ({
                length: SLIDER_WIDTH + 15,
                offset: (SLIDER_WIDTH + 15) * index,
                index,
              })}
            />
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>ملخص الطرود</Text>
            <FlatList
              data={statsData}
              renderItem={({ item }) => (
                <StatCounterCard
                  item={item}
                  onPress={() =>
                    item.navigateTo &&
                    navigation.navigate(item.navigateTo as never)
                  }
                />
              )}
              keyExtractor={(item) => item.label}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>


        </>
      </Animated.ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        isVisible={isAlertVisible}
        title={alertTitle}
        message={alertMessage}
        confirmText="حسنًا"
        cancelText=""
        onConfirm={() => setAlertVisible(false)}
        onCancel={() => setAlertVisible(false)}
      />
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA"
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: HEADER_EXPANDED_HEIGHT,
    paddingBottom: 80,
  },
  imageSliderContainer: {
    height: 150,
    marginBottom: 20,
  },
  imageBannerContainer: {
    width: SLIDER_WIDTH,
    height: 150,
    borderRadius: 8,
    overflow: "hidden",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  promoSliderContainer: {
    height: 60,
    marginBottom: 10,
  },
  promoSliderItem: {
    width: SLIDER_WIDTH,
    height: "100%",
    borderRadius: 8,
    padding: 15,
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  promoSliderIcon: {
    marginLeft: 15,
  },
  promoSliderInfo: {
    flex: 1
  },
  promoSliderTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
    textAlign: "right",
    alignItems: 'center'
  },
  promoSliderDescription: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "right",
  },
  statsSection: {
    marginBottom: 50
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#343A40",
    marginBottom: 15,
    textAlign: "right",
  },
  statCounterCard: {
    width: 110,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 10,
  },
  statImageContainer: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statImage: {
    width: 65,
    height: 65,
    resizeMode: "contain",
  },
  badgeContainer: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  statCounterLabel: {
    fontSize: 13,
    color: "#495057",
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 10,
  },
  progressBarContainer: {
    width: "100%",
    height: 6,
    borderRadius: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 8,
  },
  balanceCard: {
    padding: 8,
    backgroundColor: "#FF6B35",
    borderRadius: 8,
    marginBottom: 28,
    marginTop: 10,
    overflow: "hidden",
  },
  balanceContent: {
    padding: 7,
    zIndex: 2,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
    marginTop: 15,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceTitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "right",
    marginBottom: 6,
  },
  balanceValue: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "right",
    letterSpacing: 0.5,
  },
  currencyText: {
    fontSize: 18,
    fontWeight: "600",
  },
  balanceFooter: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  tapHint: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontStyle: "italic",
  },
});