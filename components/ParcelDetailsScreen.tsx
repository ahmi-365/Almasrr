import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
  Modal,
  SafeAreaView,
  TouchableWithoutFeedback,
  ActivityIndicator,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Linking,
  Image,
  AppState,
} from "react-native";
import {
  ArrowLeft,
  Package,
  MapPin,
  User,
  Phone,
  Calendar,
  DollarSign,
  Truck,
  CheckCircle,
  RefreshCw,
  Archive,
  ChevronDown,
  ChevronUp,
  Bell,
  Download,
  FileText,
  XCircle,
  MessageSquare,
  CheckCircle2,
  X,
  CreditCard,
  PiggyBank,
  Wallet,
  QrCode,
  Banknote,
  Hash,
  Check,
} from "lucide-react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import CustomAlert from "./CustomAlert";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";


const { width, height } = Dimensions.get("window");
type ParcelDetailsRouteParams = {
  parcel: any;
};
const COLORS = {
  primary: "#FF6B35",
  primaryLight: "#FF8A65",
  secondary: "#E67E22",
  background: "#F8F9FA",
  card: "#FFFFFF",
  text: "#343A40",
  textSecondary: "#6C757D",
  border: "#E9ECEF",
  success: "#27AE60",
  successLight: "#58D68D",
  warning: "#F39C12",
  warningLight: "#F8C471",
  danger: "#E74C3C",
  dangerLight: "#EC7063",
  info: "#3498DB",
  infoLight: "#5DADE2",
  gradientStart: "#FF6B35",
  gradientEnd: "#E67E22",
};

const STATUS_CONFIG = {
  "غير مؤكد": {
    color: COLORS.warning,
    lightColor: COLORS.warningLight,
    icon: Package,
  },
  "في الفرع": {
    color: COLORS.info,
    lightColor: COLORS.infoLight,
    icon: Package,
  },
  "في الطريق إلى الفرع الوجهة": {
    color: COLORS.secondary,
    lightColor: "#F0B27A",
    icon: Truck,
  },
  "في الطريق": { color: COLORS.secondary, lightColor: "#F0B27A", icon: Truck },
  "تم التسليم للمستلم": {
    color: COLORS.success,
    lightColor: COLORS.successLight,
    icon: CheckCircle,
  },
  مرتجع: {
    color: COLORS.danger,
    lightColor: COLORS.dangerLight,
    icon: RefreshCw,
  },
  "في الطريق للرجوع": {
    color: COLORS.danger,
    lightColor: COLORS.dangerLight,
    icon: RefreshCw,
  },
  "تم إعادة تسليم الطرد إلى المتجر": {
    color: COLORS.danger,
    lightColor: COLORS.dangerLight,
    icon: RefreshCw,
  },
  "راجع في المخزن": {
    color: COLORS.danger,
    lightColor: COLORS.dangerLight,
    icon: Archive,
  },
  "جارٍ تسليم الطرد إلى عميل جديد": {
    color: COLORS.info,
    lightColor: COLORS.infoLight,
    icon: User,
  },
  مؤكد: { color: "#2ECC71", lightColor: "#82E0AA", icon: CheckCircle },
};

const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};


const ParcelDetailsScreen = () => {
  const navigation = useNavigation();
  const route =
    useRoute<RouteProp<Record<string, ParcelDetailsRouteParams>, "ParcelDetails">>();

  const { parcel: initialParcel } = route.params;
  const [parcel, setParcel] = useState(initialParcel);

  const [user, setUser] = useState<any | null>(null);
  const [roleName, setRoleName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // ✅ Added Loading State

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSuccess, setAlertSuccess] = useState(false);

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [showCustomRemarkInput, setShowCustomRemarkInput] = useState(false);
  const [customRemark, setCustomRemark] = useState("");
  const [selectedRemarkOption, setSelectedRemarkOption] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // --- State for the Notification Remarks Modal ---
  const [isNotificationModalVisible, setNotificationModalVisible] = useState(false);
  const [notificationRemarks, setNotificationRemarks] = useState("");
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  // --- NEW STATES FOR DRIVER QR & MULTIPLE ---
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRImage, setSelectedQRImage] = useState<string | null>(null);
  const [showMultipleCompleteModal, setShowMultipleCompleteModal] = useState(false);
  const [deliveryQty, setDeliveryQty] = useState("");
  const [deliveryAmount, setDeliveryAmount] = useState("");


  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const appState = useRef(AppState.currentState);

  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    location: true,
    recipient: true,
    financial: true,
    dates: true,
    remarks: true,
    driverRemarks: true,
    driverContact: true,
    onlinePayment: true,
    storeContact: true,
  });

  // ✅ Updated Initialization Logic: Get User -> Then Refresh Data
  useEffect(() => {
    const initializeScreen = async () => {
      setIsLoading(true); // Start Loader
      try {
        const userDataString = await AsyncStorage.getItem('user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUser(userData);
          setRoleName(userData.roleName);

          // Fetch latest data immediately using the ID we just found
          await refreshParcelData(userData.userId);
        }
      } catch (e) {
        console.error("Failed to fetch user data from storage", e);
      } finally {
        setIsLoading(false); // Stop Loader
      }
    };

    initializeScreen();

    // Start Animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  // ✅ Updated Refresh Function: Accepts optional ID to handle first load scenarios
  const refreshParcelData = async (userIdOverride?: any) => {
    const targetUserId = userIdOverride || user?.userId;

    if (!targetUserId) return;

    try {
      const response = await axios.get(
        `https://tanmia-group.com:86/courierApi/parcels/DriverParcels/${targetUserId}`
      );

      if (response.data && response.data.Parcels && Array.isArray(response.data.Parcels)) {
        const allParcels = response.data.Parcels;
        const updatedParcel = allParcels.find(p => p.intParcelCode === parcel.intParcelCode);

        if (updatedParcel) {
          setParcel(updatedParcel);
          console.log("Parcel Data Refreshed");
        }
      }
    } catch (error) {
      console.error("Failed to refresh parcel data:", error);
    }
  };

  // ✅ APP STATE LISTENER: Refresh on Resume
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("App resumed. Refreshing data...");
        refreshParcelData(); // Uses state 'user' which is set by now
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user]);

  // --- QR Logic ---
  const handleOpenQR = (qrCode: string) => {
    if (qrCode) {
      setSelectedQRImage(qrCode);
      setShowQRModal(true);
    }
  };

  // --- Complete Logic (Wrapper to decide which modal) ---
  const handleCompletePress = () => {
    // Check if parcel is multiple (truthy check handles 'true' or true)
    if (parcel.bolIsMultiple) {
      setDeliveryQty("");
      setDeliveryAmount("");
      setShowMultipleCompleteModal(true);
    } else {
      setShowCompleteModal(true);
    }
  };

  const handleCompleteParcel = async () => {
    if (!parcel) return;

    setIsProcessing(true);
    try {
      await axios.post(
        `https://tanmia-group.com:86/courierApi/Parcel/Driver/UpdateStatus/${parcel.intParcelCode}/${parcel.intStatusCode}`
      );

      setAlertTitle("نجاح");
      setAlertMessage("تم تحديث حالة الطرد بنجاح");
      setAlertSuccess(true);
      setAlertVisible(true);
      setShowCompleteModal(false);
      await refreshParcelData();
    } catch (error) {
      setAlertTitle("خطأ");
      setAlertMessage("فشل في تحديث حالة الطرد");
      setAlertSuccess(false);
      setAlertVisible(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteParcelMultiple = async () => {
    if (!parcel) return;

    if (!deliveryQty || !deliveryAmount) {
      setAlertTitle("حقول مطلوبة");
      setAlertMessage("يرجى إدخال الكمية والمبلغ");
      setAlertSuccess(false);
      setAlertVisible(true);
      return;
    }

    // --- VALIDATION: Check Qty Logic ---
    const qty = parseFloat(deliveryQty);
    const amount = parseFloat(deliveryAmount);

    if (isNaN(qty) || qty < 0) {
      setAlertTitle("خطأ في الإدخال");
      setAlertMessage("لا يمكن أن تكون الكمية أقل من صفر");
      setAlertSuccess(false);
      setAlertVisible(true);
      return;
    }

    if (qty > parcel.Quantity) {
      setAlertTitle("خطأ في الإدخال");
      setAlertMessage(`الكمية المدخلة (${qty}) أكبر من الكمية الأصلية (${parcel.Quantity})`);
      setAlertSuccess(false);
      setAlertVisible(true);
      return;
    }

    if (isNaN(amount) || amount < 0) {
      setAlertTitle("خطأ في الإدخال");
      setAlertMessage("لا يمكن أن يكون المبلغ أقل من صفر");
      setAlertSuccess(false);
      setAlertVisible(true);
      return;
    }
    // -----------------------------------

    setIsProcessing(true);
    try {
      await axios.post(
        `https://tanmia-group.com:86/courierApi/Parcel/Driver/UpdateStatusMultiple/${parcel.intParcelCode}/${deliveryQty}/${deliveryAmount}`
      );

      setAlertTitle("نجاح");
      setAlertMessage("تم تأكيد التسليم الجزئي بنجاح");
      setAlertSuccess(true);
      setAlertVisible(true);
      setShowMultipleCompleteModal(false);
      await refreshParcelData();
    } catch (error) {
      console.error(error);
      setAlertTitle("خطأ");
      setAlertMessage("فشل في تحديث حالة الطرد");
      setAlertSuccess(false);
      setAlertVisible(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturnParcel = async () => {
    if (!parcel) return;

    setIsProcessing(true);
    try {
      await axios.post(
        `https://tanmia-group.com:86/courierApi/Parcel/Driver/ReturnOnTheWay/${parcel.intParcelCode}`
      );

      setAlertTitle("نجاح");
      setAlertMessage("تم إرجاع الطرد بنجاح");
      setAlertSuccess(true);
      setAlertVisible(true);
      setShowReturnModal(false);
      await refreshParcelData();
    } catch (error) {
      setAlertTitle("خطأ");
      setAlertMessage("فشل في إرجاع الطرد");
      setAlertSuccess(false);
      setAlertVisible(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddRemarks = async (remark: string) => {
    if (!parcel || !remark.trim()) return;

    setIsProcessing(true);
    try {
      await axios.post(
        `https://tanmia-group.com:86/courierApi/Parcel/Driver/AddRemarks`,
        {
          parcelID: parcel.intParcelCode,
          strRemarks: remark.trim()
        }
      );

      setAlertTitle("نجاح");
      setAlertMessage("تم إضافة الملاحظات بنجاح");
      setAlertSuccess(true);
      setAlertVisible(true);
      setShowRemarksModal(false);
      setShowCustomRemarkInput(false);
      setCustomRemark("");
      setSelectedRemarkOption("");
      await refreshParcelData();
    } catch (error) {
      setAlertTitle("خطأ");
      setAlertMessage("فشل في إضافة الملاحظات");
      setAlertSuccess(false);
      setAlertVisible(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemarkOptionSelect = (option: string) => {
    setSelectedRemarkOption(option);
    if (option === "العميل لا يرد على الهاتف") {
      handleAddRemarks(option);
    } else if (option === "الاخرون") {
      setShowCustomRemarkInput(true);
    }
  };

  const handleSaveCustomRemark = () => {
    if (customRemark.trim()) {
      handleAddRemarks(customRemark);
    }
  };

  const formatCurrency = (amount) => {
    return `${parseFloat(amount || 0).toFixed(2)} د.ل`;
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("ar-LY");
    } catch {
      return dateString;
    }
  };

  const statusConfig = STATUS_CONFIG[parcel.StatusName] || STATUS_CONFIG["غير مؤكد"];
  const StatusIcon = statusConfig.icon;

  const handleNotifyPress = () => {
    setNotificationRemarks("");
    setNotificationModalVisible(true);
  };

  const handleSendNotification = async () => {
    if (!notificationRemarks.trim()) {
      setAlertTitle("تنبيه");
      setAlertMessage("الرجاء إدخال الملاحظات للإرسال.");
      setAlertSuccess(false);
      setAlertVisible(true);
      return;
    }

    setIsSendingNotification(true);
    setNotificationModalVisible(false);

    try {
      const params = new URLSearchParams();
      params.append('parcelCode', parcel.intParcelCode.toString());
      params.append('entityRemarks', notificationRemarks);

      const response = await axios.post(
        'https://tanmia-group.com:86/courierApi/notifications/entity-to-driver',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (response.data && response.data.Success) {
        setAlertTitle("نجاح");
        setAlertMessage(response.data.Message || "تم إرسال الإشعار بنجاح.");
        setAlertSuccess(true);
        setAlertVisible(true);
      } else {
        throw new Error(response.data.Message || "حدث خطأ أثناء إرسال الإشعار.");
      }

    } catch (error) {
      console.error("Failed to send notification:", error);
      setAlertTitle("خطأ");
      setAlertMessage(error.message || "فشل إرسال الإشعار.");
      setAlertSuccess(false);
      setAlertVisible(true);
    } finally {
      setIsSendingNotification(false);
      setNotificationRemarks("");
    }
  };


  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

  const renderSectionHeader = (title, sectionKey, hasContent = true) => {
    if (!hasContent) return null;

    return (
      <TouchableOpacity
        style={styles.sectionHeader}
        onPressIn={() => toggleSection(sectionKey)}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionToggle}>
          {expandedSections[sectionKey] ? (
            <ChevronUp size={20} color={COLORS.textSecondary} />
          ) : (
            <ChevronDown size={20} color={COLORS.textSecondary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handlePhonePress = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const renderDetailRow = (icon, label, value, show = true) => {
    if (!show || !value) return null;

    return (
      <Animated.View style={[styles.detailRow, { opacity: fadeAnim }]}>
        <View style={styles.detailIcon}>{icon}</View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
          {value}
        </Text>
      </Animated.View>
    );
  };

  const showNotifyButton = (parcel.intStatusCode === 4 && roleName === "Entity") || parcel.StatusName === "في الطريق";
  const showConfirmButton = false;
  // const showDeliveredButtons = (parcel.intStatusCode === 10 && roleName === "Entity");

  // DRIVER LOGIC VARIABLES
  const isDriverInTransit = parcel.intStatusCode === 4 && roleName === "Driver";
  const isPaid = parcel.strOnlinePaymentStatus === "Success";
  const showQRButton = roleName === "Driver" && parcel.bolIsOnlinePayment && !isPaid && parcel.strOnlinePaymentQR;
  const showCompleteButton = isDriverInTransit && !parcel.bolIsOnlinePayment; // Only show Complete button if NOT online payment

  const getProgressPercent = () => {
    if (roleName === "Entity") {
      if (parcel.intStatusCode === 1) return "30%";
      if (parcel.intStatusCode === 4) return "70%";
      if (parcel.intStatusCode === 7) return "100%";

      return "0%";
    }

    if (roleName === "Driver") {
      if (parcel.intStatusCode === 4) return "30%";
      if (parcel.intStatusCode === 7) return "100%";
      return "0%";
    }

    return "0%";
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>جارٍ تحميل البيانات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      <Animated.View style={[styles.header]}>
        <View style={styles.headerBackground} />
        <View style={styles.headerContent}>
          <AnimatedTouchableOpacity
            style={[
              styles.backButton,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
            onPressIn={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </AnimatedTouchableOpacity>

          <Animated.View
            style={[
              styles.headerTitleContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.headerTitle}>تفاصيل الطرد</Text>
            <Text style={styles.parcelNumber}>#{parcel.intParcelCode}</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.headerIcon,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Package size={24} color="#FFFFFF" />
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View
          style={[
            styles.statusCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.statusHeader}>
            <Animated.View
              style={[
                styles.statusIconContainer,
                {
                  backgroundColor: statusConfig.lightColor + "20",
                },
              ]}
            >
              <StatusIcon size={28} color={statusConfig.color} />
            </Animated.View>
            <View style={styles.statusTextContainer}>
              <View style={styles.inlineHeader}>
                <Text style={styles.statusTitle}>حالة الطرد</Text>

                {(showNotifyButton || showConfirmButton) && (
                  <View>
                    {showNotifyButton && (
                      <TouchableOpacity
                        style={styles.notifyActionButton}
                        onPressIn={handleNotifyPress}
                        activeOpacity={0.7}
                      >
                        <Bell size={20} color="#FFF" />
                        <Text style={styles.notifyButtonText}>إشعار</Text>
                      </TouchableOpacity>
                    )}
                    {showConfirmButton && (
                      <TouchableOpacity
                        style={styles.confirmActionButton}
                        onPressIn={() => { }}
                        activeOpacity={0.7}
                      >
                        <CheckCircle size={20} color="#FFF" />
                        <Text style={styles.actionButtonText}>
                          تأكيد التسليم
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusConfig.color },
                ]}
              >
                <Text style={styles.statusText}>{parcel.StatusName}</Text>
              </View>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: statusConfig.color,
                      width: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", getProgressPercent()],
                      }),
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>تم الإنشاء</Text>
              <Text style={styles.progressLabel}>في الطريق</Text>
              <Text style={styles.progressLabel}>تم التسليم</Text>
            </View>
          </View>
        </Animated.View>

        {/* --- DRIVER QR BUTTON (If applicable) --- */}
        {showQRButton && (
          <View style={styles.transactionFooter}>
            {/* <View style={styles.qrSectionContainer}> */}
            <TouchableOpacity
              style={styles.qrButton}
              onPress={() => handleOpenQR(parcel.strOnlinePaymentQR || "")}
            >
              <QrCode size={18} color="#FFF" />
              <Text style={styles.qrButtonText}>عرض رمز QR</Text>
            </TouchableOpacity>
            {/* </View> */}
          </View>
        )}

        {/* --- DRIVER ACTION BUTTONS --- */}
        {isDriverInTransit && (
          <View style={styles.transactionFooter}>
            <TouchableOpacity
              style={styles.actionButtonReturn}
              onPress={() => setShowReturnModal(true)}
            >
              <XCircle color="#E74C3C" size={16} />
              <Text style={styles.actionButtonTextReturn}>إرجاع</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButtonRemarks}
              onPress={() => setShowRemarksModal(true)}
            >
              <MessageSquare color="#3498DB" size={16} />
              <Text style={styles.actionButtonTextRemarks}>ملاحظات</Text>
            </TouchableOpacity>

            {showCompleteButton && (
              <TouchableOpacity
                style={styles.actionButtonComplete}
                onPress={handleCompletePress} // UPDATED HERE
              >
                <CheckCircle2 color="#27AE60" size={16} />
                <Text style={styles.actionButtonTextComplete}>اكتمل</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Sections */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {renderSectionHeader("المعلومات الأساسية", "basic")}
          {expandedSections.basic && (
            <View style={styles.sectionContent}>
              {/* {renderDetailRow(null, "رقم الطرد:", `#${parcel.intParcelCode}`)} */}
              {renderDetailRow(null, "رقم الباركود:", parcel.ReferenceNo)}
              {renderDetailRow(null, "نوع الطرد:", parcel.TypeName)}
              {renderDetailRow(
                null,
                "الكمية:",
                parcel.Quantity,
                parcel.Quantity
              )}
            </View>
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {renderSectionHeader("معلومات الموقع", "location")}
          {expandedSections.location && (
            <View style={styles.sectionContent}>
              {renderDetailRow(
                <MapPin size={20} color={COLORS.info} />,
                "المدينة:",
                parcel.CityName
              )}
            </View>
          )}
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {renderSectionHeader("معلومات المستلم", "recipient", parcel.RecipientName || parcel.RecipientPhone)}
          {expandedSections.recipient && (
            <View style={styles.sectionContent}>
              {renderDetailRow(<User size={20} color={COLORS.primary} />, "اسم المستلم:", parcel.RecipientName, parcel.RecipientName)}

              {/* Clickable Phone Number */}
              <TouchableOpacity onPress={() => handlePhonePress(parcel.RecipientPhone)}>
                {renderDetailRow(<Phone size={20} color={COLORS.success} />, "هاتف المستلم:", parcel.RecipientPhone, parcel.RecipientPhone)}
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* --- Store Information for Driver Role --- */}
        {roleName === "Driver" && parcel.strEntityPhone ? (
          <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {renderSectionHeader("معلومات المتجر", "storeContact")}
            {expandedSections.storeContact && (
              <View style={styles.sectionContent}>
                {/* Render Store Name if available */}
                {parcel.strEntityName && renderDetailRow(null, "اسم المتجر:", parcel.strEntityName)}

                {/* Clickable Store Phone Number */}
                <TouchableOpacity onPress={() => handlePhonePress(parcel.strEntityPhone)}>
                  {renderDetailRow(
                    <Phone size={20} color={COLORS.info} />,
                    "رقم المتجر:",
                    parcel.strEntityPhone
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        ) : null}

        {roleName === "Entity" && parcel.intStatusCode !== 0 && parcel.intStatusCode !== 1 && parcel.strDriverPhone ? (
          <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {renderSectionHeader("رقم المندوب", "driverContact")}
            {expandedSections.driverContact !== false && (
              <View style={styles.sectionContent}>
                <TouchableOpacity onPress={() => handlePhonePress(parcel.strDriverPhone)}>
                  {renderDetailRow(<User size={20} color={COLORS.info} />, "المندوب:", parcel.strDriverPhone)}
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        ) : null}

        {parcel.bolIsOnlinePayment === true ? (
          <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {renderSectionHeader("الدفع الإلكتروني", "onlinePayment")}
            {expandedSections.onlinePayment !== false && (
              <View style={styles.sectionContent}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}><CreditCard size={20} color={COLORS.primary} /></View>
                  <Text style={styles.detailLabel}>حالة الدفع:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: parcel.strOnlinePaymentStatus === "Success" ? COLORS.success : COLORS.danger }
                  ]}>
                    <Text style={styles.statusText}>
                      {parcel.strOnlinePaymentStatus === "Success" ? "مدفوع" : "غير مدفوع"}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </Animated.View>
        ) : null}

        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {renderSectionHeader("المعلومات المالية", "financial")}
          {expandedSections.financial && (
            <View style={styles.sectionContent}>
              {renderDetailRow(
                <Wallet size={20} color={COLORS.success} />,
                "الرسوم:",
                formatCurrency(parcel.dcFee)
              )}
              {renderDetailRow(
                <Wallet size={20} color={COLORS.primary} />,
                "المجموع:",
                formatCurrency(parcel.Total)
              )}
            </View>
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {renderSectionHeader("التواريخ", "dates", parcel.CreatedAt)}
          {expandedSections.dates && parcel.CreatedAt && (
            <View style={styles.sectionContent}>
              {renderDetailRow(
                <Calendar size={20} color={COLORS.warning} />,
                "تاريخ الإنشاء:",
                formatDate(parcel.CreatedAt)
              )}
            </View>
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {renderSectionHeader("ملاحظات", "remarks", parcel.Remarks)}
          {expandedSections.remarks && parcel.Remarks && (
            <View style={styles.sectionContent}>
              <Text style={styles.remarksText}>{parcel.Remarks}</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {renderSectionHeader(
            "ملاحظات السائق",
            "driverRemarks",
            parcel.strDriverRemarks
          )}
          {expandedSections.driverRemarks && parcel.strDriverRemarks && (
            <View style={styles.sectionContent}>
              <Text style={styles.remarksText}>{parcel.strDriverRemarks}</Text>
            </View>
          )}
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {/* Complete Confirmation Modal (Standard) */}
      <Modal
        visible={showCompleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>تأكيد الإكتمال</Text>
            <Text style={styles.confirmationMessage}>
              متأكد/ة إنك بدك تأكد الطرد؟
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonYes]}
                onPress={handleCompleteParcel}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>نعم</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonNo]}
                onPress={() => setShowCompleteModal(false)}
                disabled={isProcessing}
              >
                <Text style={styles.confirmButtonTextNo}>لا</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Multiple Complete Modal (New for Driver) */}
      <Modal
        visible={showMultipleCompleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isProcessing && setShowMultipleCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.multipleModalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMultipleCompleteModal(false)}
              disabled={isProcessing}
            >
              <X color="#fff" size={24} />
            </TouchableOpacity>

            <Text style={styles.multipleModalTitle}>إدخال تفاصيل التسليم</Text>

            {/* Mini Parcel Details */}
            <View style={styles.miniParcelDetails}>
              <Text style={styles.miniParcelRef}>{parcel.ReferenceNo}</Text>
              <Text style={styles.miniParcelCity}>{parcel.CityName}</Text>
              <Text style={styles.miniParcelTotal}>الإجمالي: {parcel.Total.toFixed(2)} د.ل</Text>
            </View>

            <View style={styles.multipleInputsRow}>
              {/* Amount Input */}
              <View style={styles.multipleInputContainer}>
                <View style={styles.multipleLabelContainer}>
                  <Banknote size={16} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={styles.multipleLabel}>المبلغ (Amount)</Text>
                </View>
                <TextInput
                  style={[styles.multipleInput, isProcessing && styles.disabledInput]}
                  placeholder="أدخل المبلغ"
                  placeholderTextColor="#A1A1AA"
                  value={deliveryAmount}
                  onChangeText={setDeliveryAmount}
                  keyboardType="numeric"
                  editable={!isProcessing}
                />
              </View>

              <View style={{ width: 12 }} />

              {/* Quantity Input */}
              <View style={styles.multipleInputContainer}>
                <View style={styles.multipleLabelContainer}>
                  <Hash size={16} color="#3B82F6" style={{ marginRight: 4 }} />
                  <Text style={styles.multipleLabel}>الكمية (Qty)</Text>
                </View>
                <TextInput
                  style={[styles.multipleInput, isProcessing && styles.disabledInput]}
                  placeholder="كم قطعة؟"
                  placeholderTextColor="#A1A1AA"
                  value={deliveryQty}
                  onChangeText={setDeliveryQty}
                  keyboardType="numeric"
                  editable={!isProcessing}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.multipleSubmitButton, isProcessing && styles.disabledButton]}
              onPress={handleCompleteParcelMultiple}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.multipleSubmitButtonText}>تأكيد التسليم مع الإدخالات</Text>
                  <Check color="#fff" size={20} style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Return Confirmation Modal */}
      <Modal
        visible={showReturnModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReturnModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>تأكيد الحذف</Text>
            <Text style={styles.confirmationMessage}>
              متأكد/ة إنك بدك ترجع الطرد؟
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonYes]}
                onPress={handleReturnParcel}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>نعم</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonNo]}
                onPress={() => setShowReturnModal(false)}
                disabled={isProcessing}
              >
                <Text style={styles.confirmButtonTextNo}>لا</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Driver Remarks Modal */}
      <Modal
        visible={showRemarksModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowRemarksModal(false);
          setShowCustomRemarkInput(false);
          setCustomRemark("");
          setSelectedRemarkOption("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.remarksModal}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowRemarksModal(false);
                setShowCustomRemarkInput(false);
                setCustomRemark("");
                setSelectedRemarkOption("");
              }}
            >
              <X color="#fff" size={24} />
            </TouchableOpacity>

            <Text style={styles.remarksTitle}>اضف ملاحظات المندوب</Text>

            {!showCustomRemarkInput ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.remarkOption,
                    selectedRemarkOption === "العميل لا يرد على الهاتف" && styles.remarkOptionSelected
                  ]}
                  onPress={() => handleRemarkOptionSelect("العميل لا يرد على الهاتف")}
                  disabled={isProcessing}
                >
                  <Text style={styles.remarkOptionText}>العميل لا يرد على الهاتف</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.remarkOption,
                    selectedRemarkOption === "الاخرون" && styles.remarkOptionSelected
                  ]}
                  onPress={() => handleRemarkOptionSelect("الاخرون")}
                  disabled={isProcessing}
                >
                  <Text style={styles.remarkOptionText}>الاخرون</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.customRemarkInput}
                  placeholder="ملاحظات المندوب"
                  placeholderTextColor="#9CA3AF"
                  value={customRemark}
                  onChangeText={setCustomRemark}
                  multiline
                  textAlign="right"
                />
                <TouchableOpacity
                  style={styles.saveRemarkButton}
                  onPress={handleSaveCustomRemark}
                  disabled={isProcessing || !customRemark.trim()}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveRemarkButtonText}>احفظ</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowQRModal(false)}
            >
              <X color="#fff" size={24} />
            </TouchableOpacity>
            <Text style={styles.qrModalTitle}>مسح رمز الاستجابة السريعة</Text>
            <View style={styles.qrImageContainer}>
              {selectedQRImage && (
                <Image
                  source={{ uri: selectedQRImage }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              )}
            </View>
            <Text style={styles.qrModalSubtitle}>امسح الرمز للدفع</Text>
          </View>
        </View>
      </Modal>

      {/* Notification Remarks Modal */}
      <Modal visible={isNotificationModalVisible} animationType="fade" transparent={true} onRequestClose={() => setNotificationModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.remarksModalOverlay}>
          <TouchableWithoutFeedback onPress={() => setNotificationModalVisible(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback>
            <View style={styles.remarksModalContent}>
              <Text style={styles.notificationModalTitle}>إرسال إشعار للمندوب</Text>
              <Text style={styles.modalSubTitle}>أدخل ملاحظاتك ليتم إرسالها للمندوب بخصوص الشحنة: <Text style={{ fontWeight: 'bold' }}>{parcel?.ReferenceNo}</Text></Text>
              <TextInput
                style={styles.remarksModalInput}
                placeholder="مثال: الرجاء تسليم الشحنة اليوم قبل الساعة 5 مساءً"
                placeholderTextColor="#9CA3AF"
                multiline
                value={notificationRemarks}
                onChangeText={setNotificationRemarks}
              />
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setNotificationModalVisible(false)}>
                  <Text style={[styles.modalButtonText, styles.cancelButtonText]}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.sendButton]} onPress={handleSendNotification} disabled={isSendingNotification}>
                  {isSendingNotification ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalButtonText}>إرسال</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>


      {/* Custom Alert for general feedback */}
      <CustomAlert
        isVisible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        confirmText="حسنًا"
        onConfirm={() => setAlertVisible(false)}
        success={alertSuccess} cancelText={undefined} onCancel={undefined} />
    </View>
  );
};


const styles = StyleSheet.create({
  // ... existing styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600'
  },
  inlineHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inlineIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  invoiceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498DB",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  invoiceButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 5,
  },
  invoiceButtonDisabled: {
    opacity: 0.6,
  },
  greenTickContainer: {
    backgroundColor: "#E8F5E9",
    borderRadius: 50,
    padding: 5,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 15,
    overflow: "hidden",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
  },
  headerContent: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  parcelNumber: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
  },
  headerIcon: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
  },
  content: {
    flex: 1,
    padding: 15,
    marginTop: 140,
  },
  statusCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  statusHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 20,
  },
  statusIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 15,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
    textAlign: "right",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBackground: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
    flexDirection: "row-reverse",

  },
  progressFill: {
    height: "100%",
    borderRadius: 3,

  },
  progressLabels: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  notifyActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF8A65",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 10,
    gap: 5
  },
  notifyButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  confirmActionButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#27AE60",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    backgroundColor: "rgba(248, 249, 250, 0.8)",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  sectionToggle: {
    padding: 4,
  },
  sectionContent: {
    padding: 18,
  },
  detailRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  detailIcon: {
    width: 32,
    alignItems: "center",
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
    width: 100,
    textAlign: "right",
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  remarksText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    textAlign: "right",
  },
  bottomSpacer: {
    height: 30,
  },
  transactionFooter: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginTop: -10,
    marginBottom: 16,
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionButtonReturn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: hexToRgba("#E74C3C", 0.1),
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  actionButtonTextReturn: {
    color: "#E74C3C",
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtonRemarks: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: hexToRgba("#3498DB", 0.1),
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  actionButtonTextRemarks: {
    color: "#3498DB",
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtonComplete: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: hexToRgba("#27AE60", 0.1),
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  actionButtonTextComplete: {
    color: "#27AE60",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  confirmationModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
  },
  confirmationMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  confirmationButtons: {
    flexDirection: "row-reverse",
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonYes: {
    backgroundColor: "#27AE60",
  },
  confirmButtonNo: {
    backgroundColor: "#F3F4F6",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButtonTextNo: {
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "600",
  },
  remarksModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#FF6B35",
    borderRadius: 20,
    padding: 6,
    zIndex: 1,
  },
  remarksTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 24,
  },
  remarkOption: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  remarkOptionSelected: {
    backgroundColor: hexToRgba("#FF6B35", 0.1),
    borderColor: "#FF6B35",
  },
  remarkOptionText: {
    fontSize: 16,
    color: "#1F2937",
    textAlign: "center",
  },
  customRemarkInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 16,
    color: "#1F2937",
    minHeight: 100,
    textAlignVertical: "top",
  },
  saveRemarkButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveRemarkButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.7,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  // Use a different name to avoid conflicts with invoice modal title
  notificationModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "right",
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row-reverse",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    marginBottom: 10,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row-reverse",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: "center",
  },
  tableCellText: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: "right",
  },
  noInvoicesText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  closeModalButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  closeModalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  // --- Styles for NEW Notification Modal ---
  remarksModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  remarksModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    width: "100%",
    padding: 20,
  },
  modalSubTitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 16,
    lineHeight: 20
  },
  remarksModalInput: {
    width: '100%',
    height: 100,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    textAlign: 'right',
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row-reverse',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  sendButton: {
    backgroundColor: '#FF6B35',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cancelButtonText: {
    color: '#374151',
  },
  // --- NEW STYLES FOR DRIVER MODALS ---
  qrSectionContainer: {
    marginTop: 8,
    marginBottom: 16, // Added spacing
    alignItems: 'center',
  },
  qrButton: {
    backgroundColor: "#3498DB",
    borderRadius: 8,
    padding: 10,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: '100%', // Reduced width for better look
  },
  qrButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  qrModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 350,
    alignItems: "center",
    position: "relative",
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 20,
    marginTop: 10,
  },
  qrImageContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrModalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  multipleModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    position: "relative",
  },
  multipleModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 24,
    marginTop: 10,
  },
  multipleInputsRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  multipleInputContainer: {
    flex: 1,
  },
  multipleLabelContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 8,
  },
  multipleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  multipleInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1F2937",
    textAlign: "right",
  },
  multipleSubmitButton: {
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  multipleSubmitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledInput: {
    backgroundColor: "#E5E7EB",
    color: "#9CA3AF"
  },
  disabledButton: {
    opacity: 0.7
  },
  miniParcelDetails: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  miniParcelRef: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4
  },
  miniParcelCity: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4
  },
  miniParcelTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981'
  },
  paymentStatusBadge: { alignSelf: "flex-end", flexDirection: "row-reverse", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, },
  paidBadge: { backgroundColor: "#D1FAE5" },
  unpaidBadge: { backgroundColor: "#FEE2E2" },
  paidBadgeText: { color: "#065F46", fontSize: 12, fontWeight: "bold" },
  unpaidBadgeText: { color: "#991B1B", fontSize: 12, fontWeight: "bold" },
});


export default ParcelDetailsScreen;