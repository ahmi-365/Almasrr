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
  Image,
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronDown,
} from 'lucide-react-native';

import ParcelDetailsModal from '../../components/Entity/ParcelDetailsModal';
const { width, height } = Dimensions.get('window');
import CustomAlert from '../../components/CustomAlert';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Create shimmer placeholder with LinearGradient
const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);

// Helper function from Reports Dashboard
const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const StatCounterCard = ({ item }) => {
  return (
    <View
      style={[
        styles.statCounterCard,
        { backgroundColor: hexToRgba(item.color, 0.08) },
      ]}
    >
      <View
        style={[styles.statIconBackground, { backgroundColor: item.color }]}
      >
        <item.icon color="#fff" size={20} />
      </View>
      <Text style={styles.statCounterNumber}>{item.number}</Text>
      <Text style={styles.statCounterLabel} numberOfLines={2}>
        {item.label}
      </Text>
    </View>
  );
};

// Dashboard-aligned shimmer colors from Reports Dashboard
const SHIMMER_COLORS = ['#FDF1EC', '#FEF8F5', '#FDF1EC'];

// Enhanced Skeleton Loading Component for Stats
const SkeletonPulse = ({ children, style, shimmerColors = SHIMMER_COLORS }) => {
  return (
    <ShimmerPlaceHolder
      style={style}
      shimmerColors={shimmerColors}
      visible={false}
    >
      {children}
    </ShimmerPlaceHolder>
  );
};

const SkeletonStatCard = () => (
  <View style={styles.statCounterCard}>
    <SkeletonPulse
      style={[styles.statIconBackground, { backgroundColor: '#FDF1EC' }]}
      shimmerColors={SHIMMER_COLORS}
    >
      <View />
    </SkeletonPulse>
    <SkeletonPulse
      style={[styles.skeletonText, { width: '60%', height: 18, marginBottom: 4, backgroundColor: '#FDF1EC' }]}
      shimmerColors={SHIMMER_COLORS}
    >
      <View />
    </SkeletonPulse>
    <SkeletonPulse
      style={[styles.skeletonText, { width: '80%', height: 12, backgroundColor: '#FEF8F5' }]}
      shimmerColors={SHIMMER_COLORS}
    >
      <View />
    </SkeletonPulse>
  </View>
);

// Enhanced Skeleton Loading Component for Parcel Cards
const SkeletonParcelCard = () => (
  <View style={styles.modernTransactionItem}>
    <View style={styles.transactionHeader}>
      <SkeletonPulse
        style={[styles.skeletonText, { width: 80, height: 14, backgroundColor: '#FDF1EC', borderRadius: 4 }]}
        shimmerColors={SHIMMER_COLORS}
      >
        <View />
      </SkeletonPulse>
      <SkeletonPulse
        style={[styles.statusBadge, { backgroundColor: '#FEF8F5', width: 70, height: 20, borderRadius: 12 }]}
        shimmerColors={SHIMMER_COLORS}
      >
        <View />
      </SkeletonPulse>
    </View>

    <SkeletonPulse
      style={[styles.skeletonText, { width: '90%', height: 16, marginBottom: 12, backgroundColor: '#FDF1EC', borderRadius: 4 }]}
      shimmerColors={SHIMMER_COLORS}
    >
      <View />
    </SkeletonPulse>

    <View style={styles.transactionAmounts}>
      <SkeletonPulse
        style={[styles.creditAmount, { backgroundColor: '#FEF8F5', width: 80, height: 28 }]}
        shimmerColors={SHIMMER_COLORS}
      >
        <View />
      </SkeletonPulse>
    </View>

    <View style={styles.transactionFooter}>
      <SkeletonPulse
        style={[styles.skeletonText, { width: 60, height: 12, backgroundColor: '#FDF1EC', borderRadius: 4 }]}
        shimmerColors={SHIMMER_COLORS}
      >
        <View />
      </SkeletonPulse>
      <SkeletonPulse
        style={[styles.skeletonText, { width: 40, height: 16, backgroundColor: '#FEF8F5', borderRadius: 4 }]}
        shimmerColors={SHIMMER_COLORS}
      >
        <View />
      </SkeletonPulse>
    </View>
  </View>
);

// Status color functions from Reports Dashboard context
const getStatusColor = (status, statusName) => {
  const numericColorMap = {
    1: '#FFF4E6', // Very light orange for new
    2: '#FFF8E1', // Very light amber for preparing
    3: '#FFF3E0', // Very light orange for ready to ship
    4: '#FFEDCC', // Very light peach for in transit
    5: '#E8F5E8', // Very light green for delivered
    6: '#FFE4E1', // Very light red for rejected
    7: '#FFE0B2', // Very light orange for returned
  };

  if (status && numericColorMap[status]) {
    return numericColorMap[status];
  }

  const statusNameColorMap = {
    'جديد': '#FFF4E6',
    'قيد التحضير': '#FFF8E1',
    'جاهز للشحن': '#FFF3E0',
    'قيد التوصيل': '#FFEDCC',
    'في الطريق إلى الفرع الوجهة': '#FFEDCC',
    'تم التسليم': '#E8F5E8',
    'مرفوض': '#FFE4E1',
    'مرتجع': '#FFE0B2',
    'تم الاستلام من العميل': '#FFF8E1',
    'في المخزن': '#FFF3E0',
  };

  if (statusName && statusNameColorMap[statusName]) {
    return statusNameColorMap[statusName];
  }

  return '#FFF4E6';
};

const getStatusTextColor = (status, statusName) => {
  const numericTextColorMap = {
    1: '#D97706', // Dark orange for new
    2: '#B45309', // Dark amber for preparing
    3: '#EA580C', // Dark orange for ready to ship
    4: '#C2410C', // Dark peach for in transit
    5: '#059669', // Dark green for delivered
    6: '#DC2626', // Dark red for rejected
    7: '#D97706', // Dark orange for returned
  };

  if (status && numericTextColorMap[status]) {
    return numericTextColorMap[status];
  }

  const statusNameTextColorMap = {
    'جديد': '#D97706',
    'قيد التحضير': '#B45309',
    'جاهز للشحن': '#EA580C',
    'قيد التوصيل': '#C2410C',
    'في الطريق إلى الفرع الوجهة': '#C2410C',
    'تم التسليم': '#059669',
    'مرفوض': '#DC2626',
    'مرتجع': '#D97706',
    'تم الاستلام من العميل': '#B45309',
    'في المخزن': '#EA580C',
  };

  if (statusName && statusNameTextColorMap[statusName]) {
    return statusNameTextColorMap[statusName];
  }

  return '#D97706';
};

// Compact Two-Column Parcel Card Component - Updated with Reports Dashboard styling
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

  const statusColor = getStatusColor(item.status, item.StatusName);
  const statusTextColor = getStatusTextColor(item.status, item.StatusName);
  const displayStatus = item.StatusName || getStatusText(item.status);

  return (
    <Animated.View
      style={[
        styles.modernTransactionItem,
        { transform: [{ scale: scaleValue }] },
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
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionDate}>
            #{item.intParcelCode || item.id || item.parcel_id}
          </Text>
          <View style={styles.transactionAmounts}>
            <View style={[styles.creditAmount, { backgroundColor: statusColor }]}>
              <Text style={[styles.creditText, { color: statusTextColor }]}>{displayStatus}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.transactionBranch}>
          {item.ReferenceNo || item.title || 'طرد'}
        </Text>

        {item.CityName && (
          <Text style={styles.transactionRemarks}>{item.CityName}</Text>
        )}

        <View style={styles.transactionFooter}>
          <Text style={styles.runningTotalLabel}>
            {item.CreatedAt &&
              new Date(item.CreatedAt).toLocaleDateString('ar', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            }
          </Text>
          {item.Total && (
            <Text style={styles.runningTotal}>
              {item.Total.toLocaleString()} د.ل
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Stats Header Component - Updated with Reports Dashboard styling
const StatsHeader = ({ statsData }) => (
  <View style={styles.summarySection}>
    <Text style={styles.sectionTitle}>ملخص الطرود</Text>
    <View style={styles.summaryCards}>
      {statsData.slice(0, 3).map(stat => (
        <StatCounterCard
          key={stat.label}
          item={{
            number: String(stat.value),
            label: stat.label,
            icon: stat.icon,
            color: stat.color,
          }}
        />
      ))}
    </View>
  </View>
);

// New Dropdown component for entities
const EntitiesDropdown = ({ entities, selectedEntity, onSelectEntity, onToggle, isOpen }) => {
  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity onPress={onToggle} style={styles.dropdownHeader}>
        <Text style={styles.dropdownText}>{selectedEntity ? selectedEntity.EntityName : 'اختر مؤسسة'}</Text>
        <ChevronDown size={18} color="#1F2937" />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.dropdownList}>
          {entities.map(entity => (
            <TouchableOpacity
              key={entity.intEntityCode}
              style={styles.dropdownItem}
              onPress={() => onSelectEntity(entity)}
            >
              <Text style={styles.dropdownItemText}>{entity.EntityName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// List Header Component - Updated with Reports Dashboard styling
const ListHeader = ({ userRole, parcelsLength, entities, selectedEntity, onSelectEntity, dropdownOpen, setDropdownOpen }) => (
  <View>
    {userRole === 'Entity' && (
      <View>
        <Text style={styles.sectionTitle}>اختر مؤسسة</Text>
        <EntitiesDropdown
          entities={entities}
          selectedEntity={selectedEntity}
          onSelectEntity={onSelectEntity}
          isOpen={dropdownOpen}
          onToggle={() => setDropdownOpen(!dropdownOpen)}
        />
      </View>
    )}
    <View style={styles.listHeaderContainer}>
      {parcelsLength > 0 && (
        <Text style={styles.sectionTitle}>
          {userRole === 'Entity' ? 'الطرود الخاصة بالمؤسسة' : 'الطرود الخاصة بك'} ({parcelsLength})
        </Text>
      )}
    </View>
  </View>
);

// --- Material 3 Style Top Bar ---
const MaterialTopBar = ({ title }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
      <Text style={styles.topBarTitle}>{title}</Text>
    </View>
  );
};


const ParcelsScreen = ({ route }) => {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [entities, setEntities] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const statusCode = route?.params?.statusCode || 4;
  const routeUserRole = route?.params?.userRole;
  const routeUserId = route?.params?.userId;

  // Custom Alert states
  const [isAlertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertConfirmColor, setAlertConfirmColor] = useState('#FF6B35');

  useEffect(() => {
    initializeUserData();
  }, []);

  useEffect(() => {
    if (userRole === 'Entity' && userId) {
      fetchEntities(userId);
    }
  }, [userRole, userId]);

  useEffect(() => {
    // This effect handles data fetching when entityId or userId changes
    if (userRole && (selectedEntityId || userId)) {
      fetchParcels(userRole, selectedEntityId, userId);
    }
  }, [selectedEntityId, userId, userRole, statusCode]);

  const initializeUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('user');
      let role = null;
      let storedUserId = null;

      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          role = userData.roleName;
          storedUserId = userData.userId?.toString();
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
        }
      }

      if ((!role || !storedUserId) && routeUserRole && routeUserId) {
        role = routeUserRole;
        storedUserId = routeUserId.toString();
      }

      if (!role || !storedUserId) {
        throw new Error('User data not found. Please log in again.');
      }

      setUserRole(role);
      setUserId(storedUserId);

      if (role === 'Entity') {
        setSelectedEntityId(storedUserId);
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
      setAlertTitle('خطأ');
      setAlertMessage(error.message || 'حدث خطأ في تحميل بيانات المستخدم');
      setAlertConfirmColor('#E74C3C');
      setAlertVisible(true);
      setLoading(false);
    }
  };

  const fetchEntities = async (usrId) => {
    try {
      const apiUrl = `https://tanmia-group.com:84/courierApi/Entity/GetHistoryEntities/${usrId}/${statusCode}`;
      console.log('Fetching entities from:', apiUrl);
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setEntities(data);
        // Set the default selected entity to the one corresponding to the user ID
        const defaultEntity = data.find(e => e.intEntityCode.toString() === usrId);
        if (defaultEntity) {
          setSelectedEntity(defaultEntity);
        } else {
          setSelectedEntity(data[0] || null);
          setSelectedEntityId(data[0]?.intEntityCode.toString() || null);
        }
      } else {
        setEntities([]);
      }
    } catch (error) {
      console.error('Error fetching entities:', error);
    }
  };

  const fetchParcels = async (role, entId, usrId) => {
    try {
      setLoading(true);

      let apiUrl = '';

      if (role === 'Entity') {
        // Use the selected entity ID for the API call
        apiUrl = `https://tanmia-group.com:84/courierApi/parcels/details/${entId}/${statusCode}`;
      } else if (role === 'Driver') {
        apiUrl = `https://tanmia-group.com:84/courierApi/Driverparcels/details/${usrId}/${statusCode}`;
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

      if (data.Parcels && Array.isArray(data.Parcels)) {
        setParcels(data.Parcels);
      } else if (data.success && data.data) {
        setParcels(data.data);
      } else if (Array.isArray(data)) {
        setParcels(data);
      } else if (data.parcels) {
        setParcels(data.parcels);
      } else {
        setParcels([]);
      }

    } catch (error) {
      console.error('Error fetching parcels:', error);
      setAlertTitle('خطأ');
      setAlertMessage('حدث خطأ في تحميل البيانات');
      setAlertConfirmColor('#E74C3C');
      setAlertVisible(true);
      setParcels([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (userRole === 'Entity') {
      await fetchEntities(userId);
    }
    await fetchParcels(userRole, selectedEntityId, userId);
  }, [userRole, userId, selectedEntityId]);

  const handleParcelPress = (parcel) => {
    setSelectedParcel(parcel);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedParcel(null);
  };

  const handleSelectEntity = (entity) => {
    setSelectedEntity(entity);
    setSelectedEntityId(entity.intEntityCode.toString());
    setDropdownOpen(false); // Close dropdown after selection
    // The useEffect hook will automatically trigger fetchParcels
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
    const inTransitParcels = parcels.filter(p => p.status === 4).length;
    const deliveredParcels = parcels.filter(p => p.status === 5).length;

    const statsArray = [
      { label: 'إجمالي الطرود', value: totalParcels, icon: Package, color: '#27AE60' },
      { label: 'قيد التوصيل', value: inTransitParcels, icon: Truck, color: '#E74C3C' },
      { label: 'تم التسليم', value: deliveredParcels, icon: CheckCircle, color: '#FF6B35' },
    ];
    return statsArray;
  };

  const renderSkeletonLoader = () => (
    <View style={styles.container}>
      <MaterialTopBar title="الطرود" />
      <View style={styles.content}>
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>ملخص الطرود</Text>
          <View style={styles.summaryCards}>
            {[1, 2, 3].map((item, index) => (
              <SkeletonStatCard key={index} />
            ))}
          </View>
        </View>

        <View style={styles.listHeaderContainer}>
          <SkeletonPulse
            style={[styles.skeletonText, { width: '70%', height: 18, marginBottom: 16, backgroundColor: '#FDF1EC', borderRadius: 4 }]}
            shimmerColors={SHIMMER_COLORS}
          >
            <View />
          </SkeletonPulse>
        </View>

        <ScrollView style={styles.parcelsList} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4, 5].map((item, index) => (
            <SkeletonParcelCard key={index} />
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
      <ListHeader
        userRole={userRole}
        parcelsLength={parcels.length}
        entities={entities}
        selectedEntity={selectedEntity}
        onSelectEntity={handleSelectEntity}
        dropdownOpen={dropdownOpen}
        setDropdownOpen={setDropdownOpen}
      />
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require("../../assets/images/empty-reports.png")}
        style={styles.emptyImage}
      />
      <Text style={styles.emptyText}>لا توجد طرود متاحة</Text>
      <Text style={styles.emptySubText}>ستظهر الطرود هنا عند توفرها</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <MaterialTopBar title="الطرود" />

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
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
            progressBackgroundColor="#F7FAFC"
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.parcelsList}
      />

      <ParcelDetailsModal
        isVisible={modalVisible}
        onClose={handleCloseModal}
        parcel={selectedParcel}
      />

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

  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#F8F9FA",
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
  },

  // Dropdown Styles
  dropdownContainer: {
    marginHorizontal: 12,
    marginBottom: 20,
    zIndex: 10, // Ensure dropdown is on top
  },
  dropdownHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  dropdownList: {
    position: 'absolute',
    top: 60,
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 100,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'right',
  },

  statusBadge: {
    backgroundColor: '#FEF8F5',
    width: 70,
    height: 20,
    borderRadius: 12,
  },


  // Summary Section
  summarySection: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    marginTop: 20,
    textAlign: 'right',
    paddingHorizontal: 12,
  },
  summaryCards: {
    flexDirection: 'row-reverse',
    gap: 12,
    paddingHorizontal: 12,
  },

  // Stat Counter Card
  statCounterCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  statIconBackground: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCounterNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statCounterLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center'
  },
  skeletonText: {
    borderRadius: 4,
    alignSelf: 'flex-end',
  },

  // Parcels List
  parcelsList: {
    flex: 1,
  },

  // Modern Transaction Item
  modernTransactionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardTouchable: {
    // No additional styling needed
  },

  // Transaction Header
  transactionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionDate: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600'
  },
  transactionAmounts: {
    flexDirection: 'row',
    gap: 12
  },
  creditAmount: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  creditText: {
    fontSize: 14,
    fontWeight: '600'
  },

  // Transaction Content
  transactionBranch: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'right',
  },
  transactionRemarks: {
    color: '#9CA3AF',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'right',
    marginBottom: 12,
  },
  transactionFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginTop: 8,
  },
  runningTotalLabel: {
    color: '#6B7280',
    fontSize: 12
  },
  runningTotal: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold'
  },

  // List Header
  listHeaderContainer: {
    marginBottom: 12,
    paddingHorizontal: 12,
  },

  // Empty State
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 12,
  },
  emptyImage: {
    width: 200,
    height: 120,
    marginBottom: 16,
    opacity: 0.7
  },
  emptyText: {
    color: '#374151',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});