import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useNotifications } from "../../Context/NotificationContext";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  Package,
  AlertCircle,
  Truck,
  CheckCircle,
  Clock,
  MessageSquare,
} from "lucide-react-native";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);
const { width } = Dimensions.get("window");

// Shimmer Skeleton Component
const NotificationSkeleton = () => {
  const shimmerColors = ["#F8F9FA", "#E9ECEF", "#F8F9FA"];

  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonRow}>
        <ShimmerPlaceholder
          style={styles.skeletonIcon}
          shimmerColors={shimmerColors}
        />
        <View style={styles.skeletonContent}>
          <ShimmerPlaceholder
            style={styles.skeletonTitle}
            shimmerColors={shimmerColors}
          />
          <ShimmerPlaceholder
            style={styles.skeletonBody}
            shimmerColors={shimmerColors}
          />
          <ShimmerPlaceholder
            style={styles.skeletonTime}
            shimmerColors={shimmerColors}
          />
        </View>
      </View>
    </View>
  );
};

const NotificationSkeletonList = () => (
  <View style={styles.skeletonContainer}>
    {[1, 2, 3, 4, 5, 6].map((item) => (
      <NotificationSkeleton key={item} />
    ))}
  </View>
);

const NotificationsScreen = () => {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAllAsRead,
  } = useNotifications();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

 useEffect(() => {
    // console.log('🔔 NotificationsScreen mounted - fetching notifications');
    
    fetchNotifications().finally(() => {
      setInitialLoad(false);
    });
  }, [fetchNotifications]);
// Mark as read AFTER page is fully loaded
  useEffect(() => {
    if (!initialLoad && !loading && unreadCount > 0) {
      // console.log('✅ Page fully loaded - marking notifications as read');
      
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 500); // 500ms delay for smooth UX
      
      return () => clearTimeout(timer);
    }
  }, [initialLoad, loading, unreadCount, markAllAsRead]);

  const onRefresh = async () => {
    setRefreshing(true);
    // console.log("🔄 Refreshing notifications...");
    await fetchNotifications();
    setRefreshing(false);
  };
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "DriverRemark":
        return <MessageSquare color="#F39C12" size={22} fill="#F39C12" />;
      case "ReturnOnTheWay":
        return <Truck color="#E74C3C" size={22} />;
      case "Delivered":
        return <CheckCircle color="#27AE60" size={22} />;
      default:
        return <Package color="#3498DB" size={22} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "DriverRemark":
        return "#F39C12";
      case "ReturnOnTheWay":
        return "#E74C3C";
      case "Delivered":
        return "#27AE60";
      default:
        return "#3498DB";
    }
  };

  const handleNotificationPress = async (notification: any) => {
    console.log("📦 Opening notification for parcel:", notification.ParcelCode);

    // Navigate to parcel details
    // You'll need to fetch the parcel data or navigate to appropriate screen
    navigation.goBack();
    // Add your navigation logic here based on ParcelCode
  };

  const renderNotification = ({ item }: { item: any }) => {
    const color = getNotificationColor(item.Type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.IsRead && styles.unreadNotification,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.notificationIconContainer,
            { backgroundColor: `${color}15` },
          ]}
        >
          {getNotificationIcon(item.Type)}
        </View>

        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle} numberOfLines={2}>
            {item.Title}
          </Text>
          <Text style={styles.notificationBody} numberOfLines={3}>
            {item.Body}
          </Text>
          <View style={styles.notificationFooter}>
            <Clock color="#ADB5BD" size={12} />
            <Text style={styles.notificationTime}>{item.CreatedAt}</Text>
          </View>
        </View>

        {!item.IsRead && (
          <View style={styles.unreadIndicator}>
            <View style={styles.unreadDot} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Package color="#CCC" size={80} strokeWidth={1.5} />
      </View>
      <Text style={styles.emptyText}>لا توجد إشعارات</Text>
      <Text style={styles.emptySubtext}>سيتم عرض الإشعارات الجديدة هنا</Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {notifications.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{notifications.length}</Text>
            <Text style={styles.statLabel}>الإجمالي</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#E74C3C" }]}>
              {notifications.filter((n) => !n.IsRead).length}
            </Text>
            <Text style={styles.statLabel}>غير مقروءة</Text>
          </View>
        </View>
      )}
    </View>
  );

  if (initialLoad && loading) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft color="#2D3748" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الإشعارات</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Shimmer Loading */}
        <NotificationSkeletonList />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft color="#2D3748" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإشعارات</Text>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.NotificationId.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF6B35"]}
            tintColor="#FF6B35"
          />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D3748",
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
  },
  headerBadge: {
    backgroundColor: "#E74C3C",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  listHeader: {
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    justifyContent: "space-around",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#6C757D",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E9ECEF",
    marginHorizontal: 20,
  },
  listContent: {
    padding: 15,
    flexGrow: 1,
  },
  separator: {
    height: 10,
  },
  notificationCard: {
    backgroundColor: "#fef7f7ff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  unreadNotification: {
    backgroundColor: "#FFF8F5",
    borderColor: "#FF6B35",
    borderWidth: 1.5,
  },
  notificationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 6,
    textAlign: "right",
    lineHeight: 22,
  },
  notificationBody: {
    fontSize: 14,
    color: "#6C757D",
    lineHeight: 20,
    marginBottom: 8,
    textAlign: "right",
  },
  notificationFooter: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#ADB5BD",
    textAlign: "right",
    marginRight: 4,
  },
  unreadIndicator: {
    justifyContent: "flex-start",
    paddingTop: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF6B35",
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6C757D",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: "#ADB5BD",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  // Shimmer Skeleton Styles
  skeletonContainer: {
    padding: 15,
  },
  skeletonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  skeletonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    width: "80%",
    height: 18,
    borderRadius: 4,
    marginBottom: 10,
    alignSelf: "flex-end",
  },
  skeletonBody: {
    width: "100%",
    height: 14,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTime: {
    width: "30%",
    height: 12,
    borderRadius: 4,
    alignSelf: "flex-end",
  },
});

export default NotificationsScreen;
