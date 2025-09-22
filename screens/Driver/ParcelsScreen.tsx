import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Animated,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ClipboardList,
  CircleCheck as CheckCircle,
  Truck,
  Package,
  Clock,
  AlertCircle,
  RotateCcw,
} from 'lucide-react-native';
import ModernTopBar from '../../components/Entity/TopBar';
import ParcelDetailsModal from '../../components/Entity/ParcelDetailsModal';
const { width, height } = Dimensions.get('window');

const hexToRgba = (hex, opacity) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const StatCounterCard = ({ item }) => {
  const mainColor = "#FF6B35"; // fixed color
  return (
    <View
      style={[
        styles.statCounterCard,
        { backgroundColor: hexToRgba(mainColor, 0.08) },
      ]}
    >
      <View
        style={[styles.statIconBackground, { backgroundColor: mainColor }]}
      >
        <item.icon color="#fff" size={16} />
      </View>
      <Text style={styles.statCounterNumber}>{item.number}</Text>
      <Text style={styles.statCounterLabel} numberOfLines={2}>
        {item.label}
      </Text>
    </View>
  );
};


// Skeleton Loading Component for Stats
const SkeletonPulse = ({ children, style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[style, { opacity }]}>
      {children}
    </Animated.View>
  );
};

const SkeletonStatCard = () => (
  <View style={[styles.statCounterCard, { backgroundColor: '#F0F0F0' }]}>
    <SkeletonPulse style={[styles.statIconBackground, { backgroundColor: '#D0D0D0' }]}>
      <View />
    </SkeletonPulse>
    <SkeletonPulse style={[styles.skeletonText, { width: '60%', height: 14, marginBottom: 3 }]}>
      <View />
    </SkeletonPulse>
    <SkeletonPulse style={[styles.skeletonText, { width: '80%', height: 10, marginBottom: 6 }]}>
      <View />
    </SkeletonPulse>
    <SkeletonPulse style={[styles.progressBarContainer, { backgroundColor: '#E0E0E0' }]}>
      <View />
    </SkeletonPulse>
  </View>
);

// Skeleton Loading Component for Parcel Cards
const SkeletonParcelCard = () => (
  <View style={[styles.twoColumnCard, { borderLeftColor: '#E0E0E0' }]}>
    <View style={styles.cardTouchable}>
      {/* Header Skeleton */}
      <View style={styles.cardHeader}>
        <View style={styles.parcelIdContainer}>
          <SkeletonPulse style={[styles.skeletonText, { width: 80, height: 15, backgroundColor: '#E0E0E0' }]}>
            <View />
          </SkeletonPulse>
        </View>
        <SkeletonPulse style={[styles.statusBadge, { backgroundColor: '#E0E0E0', width: 70, height: 20 }]}>
          <View />
        </SkeletonPulse>
      </View>

      {/* Content Skeleton */}
      <View style={styles.twoColumnContent}>
        {/* Right Column Skeleton */}
        <View style={styles.rightColumn}>
          <SkeletonPulse style={[styles.skeletonText, { width: '90%', height: 15, marginBottom: 8, backgroundColor: '#E0E0E0' }]}>
            <View />
          </SkeletonPulse>
          <SkeletonPulse style={[styles.skeletonText, { width: '70%', height: 12, marginBottom: 6, backgroundColor: '#E0E0E0' }]}>
            <View />
          </SkeletonPulse>
          <SkeletonPulse style={[styles.skeletonText, { width: '80%', height: 12, marginBottom: 6, backgroundColor: '#E0E0E0' }]}>
            <View />
          </SkeletonPulse>
          <SkeletonPulse style={[styles.amountContainer, { backgroundColor: '#F0F0F0', width: 80, height: 25 }]}>
            <View />
          </SkeletonPulse>
        </View>

        {/* Left Column Skeleton */}
        <View style={styles.leftColumn}>
          <View style={styles.dateContainer}>
            <SkeletonPulse style={[styles.skeletonText, { width: 60, height: 10, marginBottom: 2, backgroundColor: '#E0E0E0' }]}>
              <View />
            </SkeletonPulse>
            <SkeletonPulse style={[styles.skeletonText, { width: 40, height: 11, backgroundColor: '#E0E0E0' }]}>
              <View />
            </SkeletonPulse>
          </View>
          <View style={styles.additionalInfo}>
            <SkeletonPulse style={[styles.skeletonText, { width: 35, height: 10, marginBottom: 2, backgroundColor: '#E0E0E0' }]}>
              <View />
            </SkeletonPulse>
            <SkeletonPulse style={[styles.skeletonText, { width: 50, height: 11, backgroundColor: '#E0E0E0' }]}>
              <View />
            </SkeletonPulse>
          </View>
          <SkeletonPulse style={[{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#E0E0E0', marginTop: 6 }]}>
            <View />
          </SkeletonPulse>
        </View>
      </View>
    </View>
  </View>
);

// Compact Two-Column Parcel Card Component
const ParcelCard = ({ item, onPress, index }) => {
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getStatusColor = (status) => {
    const colorMap = {
      1: '#3182CE',
      2: '#F6AD55',
      3: '#38B2AC',
      4: '#9F7AEA',
      5: '#48BB78',
      6: '#E53E3E',
      7: '#ED8936',
    };
    return colorMap[status] || '#718096';
  };

  const getStatusText = (status) => {
    const statusMap = {
      1: 'جديد',
      2: 'قيد التحضير',
      3: 'جاهز للشحن',
      4: 'قيد التوصيل',
      5: 'تم التسليم',
      6: 'مرفوض',
      7: 'مرتجع',
    };
    return statusMap[status] || 'غير محدد';
  };

  const statusColor = getStatusColor(item.status);
  const displayStatus = item.StatusName || getStatusText(item.status);

  return (
    <Animated.View
      style={[
        styles.twoColumnCard,
        { transform: [{ scale: scaleValue }] },
        { borderLeftColor: statusColor },
      ]}
    >
      <TouchableOpacity
        onPress={() => onPress && onPress(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardTouchable}
        activeOpacity={0.9}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.parcelId}>
            #{item.intParcelCode || item.id || item.parcel_id}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{displayStatus}</Text>
          </View>
        </View>

        {/* Two Column Layout */}
        <View style={styles.twoColumnContent}>
          {/* Right Column */}
          <View style={styles.rightColumn}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.ReferenceNo || item.title || 'طرد'}
            </Text>

            {item.Total && (
              <Text style={styles.amountText}>{item.Total} د.ل</Text>
            )}

            {item.CityName && (
              <Text style={styles.infoValue}>{item.CityName}</Text>
            )}
          </View>

          {/* Left Column */}
          <View style={styles.leftColumn}>
            {item.CreatedAt && (
              <Text style={styles.dateValue}>
                {new Date(item.CreatedAt).toLocaleDateString('ar-SA', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            )}          
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};


// Stats Header Component
const StatsHeader = ({ statsData }) => (
  <View style={styles.statsHeaderSection}>
    <Text style={styles.sectionTitle}>ملخص الطرود</Text>
    <ScrollView 
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalStatsContainer}
    >
      {statsData.map(stat => (
        <StatCounterCard 
          key={stat.label}
          item={{
            number: String(stat.value),
            label: stat.label,
            icon: stat.icon,
            iconColor: stat.iconColor,
            progress: stat.progress,
          }} 
        />
      ))}
    </ScrollView>
  </View>
);

// List Header Component
const ListHeader = ({ userRole, parcelsLength }) => (
  <View style={styles.listHeaderContainer}>
    <Text style={styles.header}>
      {userRole === 'Entity' ? 'الطرود الخاصة بالمؤسسة' : 'الطرود الخاصة بك'}
    </Text>
    {parcelsLength > 0 && (
      <Text style={styles.subHeader}>
        {parcelsLength} طرد متاح
      </Text>
    )}
  </View>
);

const ParcelsScreen = ({ route }) => {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [entityId, setEntityId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
const [selectedParcel, setSelectedParcel] = useState(null);
  const statusCode = route?.params?.statusCode || 4;
  const routeUserRole = route?.params?.userRole;
  const routeUserId = route?.params?.userId;

  useEffect(() => {
    initializeUserData();
  }, []);

  const initializeUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('user');
      console.log('Raw user data:', userDataString);
      
      let role = null;
      let storedUserId = null;
      
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          console.log('Parsed user data:', userData);
          
          role = userData.roleName;
          storedUserId = userData.userId?.toString();
          
          console.log('Retrieved role:', role);
          console.log('Retrieved userId:', storedUserId);
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
        }
      }
      
      if ((!role || !storedUserId) && routeUserRole && routeUserId) {
        console.log('Using route params as fallback');
        role = routeUserRole;
        storedUserId = routeUserId.toString();
      }
      
      if (!role) {
        throw new Error('User role not found. Please login again.');
      }
      
      if (!storedUserId) {
        throw new Error('User ID not found. Please login again.');
      }
      
      setUserRole(role);
      setUserId(storedUserId);
      
      if (role === 'Entity') {
        setEntityId(storedUserId);
      }
      
      await fetchParcels(role, storedUserId, storedUserId);
    } catch (error) {
      console.error('Error initializing user data:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ في تحميل بيانات المستخدم');
      setLoading(false);
    }
  };

  const fetchParcels = async (role, entId, usrId) => {
    try {
      setLoading(true);
      
      let apiUrl = '';
      
      if (role === 'Entity') {
        apiUrl = `https://tanmia-group.com:84/courierApi/parcels/details/${usrId}/${statusCode}`;
        console.log('Entity API URL:', apiUrl);
      } else if (role === 'Driver') {
        apiUrl = `https://tanmia-group.com:84/courierApi/Driverparcels/details/${usrId}/${statusCode}`;
        console.log('Driver API URL:', apiUrl);
      } else {
        throw new Error(`Invalid user role: ${role}`);
      }

      console.log('Fetching parcels from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.Parcels && Array.isArray(data.Parcels)) {
        setParcels(data.Parcels);
        console.log('Set parcels from data.Parcels:', data.Parcels.length);
      } else if (data.success && data.data) {
        setParcels(data.data);
        console.log('Set parcels from data.data:', data.data.length);
      } else if (Array.isArray(data)) {
        setParcels(data);
        console.log('Set parcels from array:', data.length);
      } else if (data.parcels) {
        setParcels(data.parcels);
        console.log('Set parcels from data.parcels:', data.parcels.length);
      } else {
        console.log('No parcels found in response structure');
        setParcels([]);
      }
      
    } catch (error) {
      console.error('Error fetching parcels:', error);
      Alert.alert('خطأ', 'حدث خطأ في تحميل البيانات');
      setParcels([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchParcels(userRole, entityId, userId);
  }, [userRole, entityId, userId]);

const handleParcelPress = (parcel) => {
  setSelectedParcel(parcel);
  setModalVisible(true);
};
const handleCloseModal = () => {
  setModalVisible(false);
  setSelectedParcel(null);
};
  const getScreenTitle = () => {
    if (userRole === 'Entity') {
      return 'تفاصيل الطرود';
    } else if (userRole === 'Driver') {
      return 'طرودي';
    }
    return 'الطرود';
  };

  const getStatsData = () => {
    const totalParcels = parcels.length;
    const newParcels = parcels.filter(p => p.status === 1).length;
    const preparingParcels = parcels.filter(p => p.status === 2).length;
    const readyParcels = parcels.filter(p => p.status === 3).length;
    const inTransitParcels = parcels.filter(p => p.status === 4).length;
    const deliveredParcels = parcels.filter(p => p.status === 5).length;
    const rejectedParcels = parcels.filter(p => p.status === 6).length;
    const returnedParcels = parcels.filter(p => p.status === 7).length;

    const statsArray = [
      { label: 'إجمالي الطرود', value: totalParcels, icon: Package, iconColor: '#3182CE', progress: 1 },
      { label: 'جديد', value: newParcels, icon: ClipboardList, iconColor: '#6366F1', progress: totalParcels > 0 ? newParcels / totalParcels : 0 },
      { label: 'قيد التحضير', value: preparingParcels, icon: Clock, iconColor: '#F59E0B', progress: totalParcels > 0 ? preparingParcels / totalParcels : 0 },
      { label: 'جاهز للشحن', value: readyParcels, icon: Package, iconColor: '#06B6D4', progress: totalParcels > 0 ? readyParcels / totalParcels : 0 },
      { label: 'قيد التوصيل', value: inTransitParcels, icon: Truck, iconColor: '#8B5CF6', progress: totalParcels > 0 ? inTransitParcels / totalParcels : 0 },
      { label: 'تم التسليم', value: deliveredParcels, icon: CheckCircle, iconColor: '#10B981', progress: totalParcels > 0 ? deliveredParcels / totalParcels : 0 },
      { label: 'مرفوض', value: rejectedParcels, icon: AlertCircle, iconColor: '#EF4444', progress: totalParcels > 0 ? rejectedParcels / totalParcels : 0 },
      { label: 'مرتجع', value: returnedParcels, icon: RotateCcw, iconColor: '#F97316', progress: totalParcels > 0 ? returnedParcels / totalParcels : 0 },
    ];

    return statsArray.filter(stat => stat.value > 0);
  };

  const renderSkeletonLoader = () => (
    <View style={styles.container}>
      <ModernTopBar title={getScreenTitle()} />
      <View style={styles.content}>
        <View style={styles.statsHeaderSection}>
          <Text style={styles.sectionTitle}>ملخص الطرود</Text>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalStatsContainer}
          >
            {[1, 2, 3, 4, 5, 6].map((item, index) => (
              <SkeletonStatCard key={index} />
            ))}
          </ScrollView>
        </View>
        
        {/* List Header Skeleton */}
        <View style={styles.listHeaderContainer}>
          <SkeletonPulse style={[styles.skeletonText, { width: '70%', height: 18, marginBottom: 2, backgroundColor: '#E0E0E0' }]}>
            <View />
          </SkeletonPulse>
          <SkeletonPulse style={[styles.skeletonText, { width: '40%', height: 13, backgroundColor: '#E0E0E0' }]}>
            <View />
          </SkeletonPulse>
        </View>

        {/* Parcel Cards Skeleton */}
        <ScrollView style={styles.parcelsList} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4, 5].map((item, index) => (
            <View key={index}>
              <SkeletonParcelCard />
              {index < 4 && <View style={styles.separator} />}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  if (loading) {
    return renderSkeletonLoader();
  }

  const statsData = getStatsData();

  const renderListHeaderComponent = () => (
    <View>
      <StatsHeader statsData={statsData} />
      <ListHeader userRole={userRole} parcelsLength={parcels.length} />
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyTitle}>لا توجد طرود متاحة</Text>
      <Text style={styles.emptySubtitle}>ستظهر الطرود هنا عند توفرها</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ModernTopBar title={getScreenTitle()} />
      
      <View style={styles.content}>
        <FlatList
          data={parcels}
          renderItem={({ item, index }) => (
            <ParcelCard
              item={item}
              onPress={handleParcelPress}
              index={index}
            />
          )}
          keyExtractor={(item, index) => 
            item.intParcelCode?.toString() || 
            item.id?.toString() || 
            index.toString()
          }
          ListHeaderComponent={renderListHeaderComponent}
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3182CE']}
              tintColor="#3182CE"
              progressBackgroundColor="#F7FAFC"
            />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          style={styles.parcelsList}
        />
      </View>
       <ParcelDetailsModal
      isVisible={modalVisible}
      onClose={handleCloseModal}
      parcel={selectedParcel}
    />
    </View>
  );
};

export default ParcelsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  
  // Stats Header Section (now part of FlatList header)
  statsHeaderSection: { 
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343A40',
    marginBottom: 12,
    textAlign: 'right',
    paddingHorizontal: 16,
  },
  horizontalStatsContainer: {
    paddingHorizontal: 12,
    paddingRight: 16,
  },
  statCounterCard: {
    width: 100,
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
    marginRight: 8,
  },
  statIconBackground: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statCounterNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 2,
  },
  statCounterLabel: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    marginBottom: 6,
  },
  progressBarContainer: {
    width: "100%",
    height: 3,
    borderRadius: 1.5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 1.5,
  },
  skeletonText: {
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  
  // List Header
  listHeaderContainer: {
    marginBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    textAlign: 'right',
    marginBottom: 2,
  },
  subHeader: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'right',
  },
  
  // Parcels List
  parcelsList: {
    flex: 1,
  },
  
  // Compact Two-Column Cards - FIXED SPACING
  twoColumnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginHorizontal: 16, // Increased from 12 to 16 for better side margins
    marginVertical: 3,
    overflow: 'hidden',
    borderLeftWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardTouchable: {
    padding: 16, // Increased from 12 to 16 for better internal spacing
  },
  
  // Compact Card Header
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  parcelIdContainer: {
    alignItems: 'flex-end',
  },
  parcelId: {
    fontSize: 15, // Increased from 14
    fontWeight: '700',
    color: '#FF6B35',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11, // Increased from 10
    fontWeight: '600',
  },
  
  // Compact Two Column Content - IMPROVED LAYOUT
  twoColumnContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Added to align columns properly
  },
  
  // Right Column (Main Info) - REDUCED WIDTH
  rightColumn: {
    flex: 1.8, // Reduced from 2 to give more space to left column
    paddingRight: 8, // Reduced from 12
  },
  cardTitle: {
    fontSize: 15, // Increased from 14
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 19, // Increased from 18
  },
  infoRow: {
    marginBottom: 6,
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: 12, // Increased from 11
    color: '#718096',
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 13, // Increased from 12
    color: '#4A5568',
    fontWeight: '500',
  },
  amountContainer: {
    backgroundColor: '#F0FFF4',
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15, // Increased from 14
    fontWeight: '700',
    color: '#38A169',
  },
  
  // Left Column (Additional Info) - BETTER SPACING
  leftColumn: {
    flex: 1.2, // Increased from 1 to get more space
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: 4, // Added left padding
  },
  dateContainer: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 10, // Increased from 9
    color: '#A0AEC0',
    marginBottom: 1,
  },
  dateValue: {
    fontSize: 11, // Increased from 10
    color: '#718096',
    fontWeight: '500',
  },
  additionalInfo: {
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  additionalInfoLabel: {
    fontSize: 10, // Increased from 9
    color: '#A0AEC0',
    marginBottom: 1,
  },
  additionalInfoValue: {
    fontSize: 11, // Increased from 10
    color: '#4A5568',
    fontWeight: '500',
  },
  statusIconContainer: {
    marginTop: 6,
    alignSelf: 'center', // Center the icon
  },
  
  // Remarks Section
  remarksContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'flex-end',
  },
  remarksLabel: {
    fontSize: 11, // Increased from 10
    color: '#718096',
    marginBottom: 2,
  },
  remarksText: {
    fontSize: 12, // Increased from 11
    color: '#4A5568',
    textAlign: 'right',
    lineHeight: 17, // Increased from 16
  },
  
  // List Container
  listContainer: {
    paddingBottom: 112, // Increased from 16 to 32 for more bottom space
  },
  separator: {
    height: 2,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 