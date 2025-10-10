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
} from "lucide-react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import CustomAlert from "./CustomAlert";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";


const { width, height } = Dimensions.get("window");
type ParcelDetailsRouteParams = {
  parcel: any; // Ideally, replace 'any' with your actual Parcel type
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

  // MODIFICATION: Add state for the full user object
  const [user, setUser] = useState<any | null>(null);
  const [roleName, setRoleName] = useState<string | null>(null);

  const [isFetchingInvoices, setIsFetchingInvoices] = useState(false);
  const [isNotifyAlertVisible, setNotifyAlertVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSuccess, setAlertSuccess] = useState(false);

  const [isInvoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [invoiceData, setInvoiceData] = useState([]);

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [showCustomRemarkInput, setShowCustomRemarkInput] = useState(false);
  const [customRemark, setCustomRemark] = useState("");
  const [selectedRemarkOption, setSelectedRemarkOption] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    location: true,
    recipient: true,
    financial: true,
    dates: true,
    remarks: true,
    driverRemarks: true,
  });

  // MODIFICATION: Update useEffect to get the full user object
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUser(userData); // Set the full user object
          setRoleName(userData.roleName);
        }
      } catch (e) {
        console.error("Failed to fetch user data from storage", e);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
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

  // MODIFICATION: Replace refreshParcelData to use the fetchAllParcels logic
  const refreshParcelData = async () => {
    if (!user?.userId) {
      console.error("User ID not found, cannot refresh parcel data.");
      // Do not show an alert here, as the user will be notified by the calling function on failure
      return;
    }

    console.log("Refreshing parcel data by fetching all driver parcels...");
    try {
      const response = await axios.get(
        `https://tanmia-group.com:84/courierApi/parcels/DriverParcels/${user.userId}`
      );

      if (response.data && response.data.Parcels && Array.isArray(response.data.Parcels)) {
        const allParcels = response.data.Parcels;
        const updatedParcel = allParcels.find(p => p.intParcelCode === parcel.intParcelCode);

        if (updatedParcel) {
          setParcel(updatedParcel); // Update the local state with the new data
          console.log("Parcel data refreshed successfully from the list.");
        } else {
          console.warn(`Parcel with code ${parcel.intParcelCode} not found in the refreshed list. This may be expected if its status changed.`);
          // If the parcel is not found, it means it's no longer in the driver's active lists.
          // The success message from the action handler (e.g., handleCompleteParcel) will suffice.
          // The component will continue to show the last available data until the user navigates away.
        }
      } else {
        console.error("Invalid data structure received from server while refreshing parcels.");
      }
    } catch (error) {
      console.error("Failed to refresh parcel data by fetching all parcels:", error);
      // Let the handler's error alert take precedence if it's an API action failure.
    }
  };


  const handleCompleteParcel = async () => {
    if (!parcel) return;

    setIsProcessing(true);
    try {
      await axios.post(
        `https://tanmia-group.com:84/courierApi/Parcel/Driver/UpdateStatus/${parcel.intParcelCode}/${parcel.intStatusCode}`
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

  const handleReturnParcel = async () => {
    if (!parcel) return;

    setIsProcessing(true);
    try {
      await axios.post(
        `https://tanmia-group.com:84/courierApi/Parcel/Driver/ReturnOnTheWay/${parcel.intParcelCode}`
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
        `https://tanmia-group.com:84/courierApi/Parcel/Driver/AddRemarks/${parcel.intParcelCode}/${encodeURIComponent(remark)}`
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


  const handleFetchInvoices = async () => {
    if (isFetchingInvoices) return;

    setIsFetchingInvoices(true);
    try {
      const response = await fetch(
        `https://tanmia-group.com:84/courierApi/parcels/GetAssignedInvoicesByParcel/${parcel.intParcelCode}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data && data.length > 0) {
        setInvoiceData(data);
        setInvoiceModalVisible(true);
      } else {
        setAlertTitle("لا توجد فواتير");
        setAlertMessage("لا توجد فواتير مرتبطة بهذا الطرد.");
        setAlertSuccess(true);
        setAlertVisible(true);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      setAlertTitle("خطأ");
      setAlertMessage("فشل في جلب الفواتير. يرجى المحاولة مرة أخرى.");
      setAlertSuccess(false);
      setAlertVisible(true);
    } finally {
      setIsFetchingInvoices(false);
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

  const formatInvoiceDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString.split(' ')[0] || dateString;
    }
  };


  const statusConfig =
    STATUS_CONFIG[parcel.StatusName] || STATUS_CONFIG["غير مؤكد"];
  const StatusIcon = statusConfig.icon;

  const handleNotifyPress = () => {
    setNotifyAlertVisible(true);
  };

  const confirmSendNotification = () => {
    console.log(`Sending notification for parcel: ${parcel.ReferenceNo}`);
    setNotifyAlertVisible(false);
    setAlertTitle("نجاح");
    setAlertMessage("تم إرسال الإشعار بنجاح.");
    setAlertSuccess(true);
    setAlertVisible(true);
  };

  const cancelSendNotification = () => {
    setNotifyAlertVisible(false);
  };

  const handleConfirmDelivery = () => {
    console.log(`Confirming delivery for parcel: ${parcel.ReferenceNo}`);
    setAlertTitle("نجاح");
    setAlertMessage("تم تأكيد التسليم بنجاح.");
    setAlertSuccess(true);
    setAlertVisible(true);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const AnimatedTouchableOpacity =
    Animated.createAnimatedComponent(TouchableOpacity);

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

  const showNotifyButton =
    (parcel.intStatusCode === 4 && roleName === "Entity") || parcel.StatusName === "في الطريق";
  const showConfirmButton = false;
  const showDeliveredButtons = (parcel.intStatusCode === 10 && roleName === "Entity");
  const showDriverActionButtons = parcel.intStatusCode === 4 && roleName === "Driver";


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
                {showDeliveredButtons && (
                  <View style={styles.inlineIcons}>
                    <TouchableOpacity
                      style={[
                        styles.invoiceButton,
                        isFetchingInvoices && styles.invoiceButtonDisabled,
                      ]}
                      onPressIn={handleFetchInvoices}
                      activeOpacity={0.8}
                      disabled={isFetchingInvoices}
                    >
                      <FileText size={16} color="#fff" />
                      <Text style={styles.invoiceButtonText}>
                        {isFetchingInvoices
                          ? "جاري التحميل..."
                          : "عرض الفواتير"}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.greenTickContainer}>
                      <CheckCircle size={22} color="#7bc89bff" />
                    </View>
                  </View>
                )}
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
                        onPressIn={handleConfirmDelivery}
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
            <View style={styles.progressBackground}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: statusConfig.color,
                    width: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "75%"],
                    }),
                  },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>تم الإنشاء</Text>
              <Text style={styles.progressLabel}>في الطريق</Text>
              <Text style={styles.progressLabel}>تم التسليم</Text>
            </View>
          </View>
        </Animated.View>

        {showDriverActionButtons && (
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
            <TouchableOpacity
              style={styles.actionButtonComplete}
              onPress={() => setShowCompleteModal(true)}
            >
              <CheckCircle2 color="#27AE60" size={16} />
              <Text style={styles.actionButtonTextComplete}>اكتمل</Text>
            </TouchableOpacity>
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
              {renderDetailRow(null, "رقم الطرد:", `#${parcel.intParcelCode}`)}
              {renderDetailRow(null, "المرجع:", parcel.ReferenceNo)}
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
            "معلومات المستلم",
            "recipient",
            parcel.RecipientName || parcel.RecipientPhone
          )}
          {expandedSections.recipient &&
            (parcel.RecipientName || parcel.RecipientPhone) && (
              <View style={styles.sectionContent}>
                {renderDetailRow(
                  <User size={20} color={COLORS.primary} />,
                  "اسم المستلم:",
                  parcel.RecipientName,
                  parcel.RecipientName
                )}
                {renderDetailRow(
                  <Phone size={20} color={COLORS.success} />,
                  "هاتف المستلم:",
                  parcel.RecipientPhone,
                  parcel.RecipientPhone
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
          {renderSectionHeader("المعلومات المالية", "financial")}
          {expandedSections.financial && (
            <View style={styles.sectionContent}>
              {renderDetailRow(
                <DollarSign size={20} color={COLORS.success} />,
                "الرسوم:",
                formatCurrency(parcel.dcFee)
              )}
              {renderDetailRow(
                <DollarSign size={20} color={COLORS.primary} />,
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

      {/* Invoice Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isInvoiceModalVisible}
        onRequestClose={() => {
          setInvoiceModalVisible(!isInvoiceModalVisible);
        }}
      >
        <TouchableWithoutFeedback onPress={() => setInvoiceModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>الفواتير المرتبطة</Text>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>#</Text>
                  <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                    رقم الفاتورة
                  </Text>
                  <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                    اسم المتجر
                  </Text>
                  <Text
                    style={[
                      styles.tableHeaderText,
                      { flex: 1.5, textAlign: "left" },
                    ]}
                  >
                    التاريخ
                  </Text>
                </View>
                <ScrollView>
                  {invoiceData.length > 0 ? (
                    invoiceData.map((invoice, index) => (
                      <View key={index} style={styles.tableRow}>
                        <Text style={[styles.tableCellText, { flex: 0.5 }]}>
                          {index + 1}
                        </Text>
                        <Text style={[styles.tableCellText, { flex: 2 }]}>
                          {invoice.InvoiceNumber}
                        </Text>
                        <Text style={[styles.tableCellText, { flex: 2 }]}>
                          {invoice.strEntityName}
                        </Text>
                        <Text
                          style={[
                            styles.tableCellText,
                            { flex: 1.5, textAlign: "left" },
                          ]}
                        >
                          {formatInvoiceDate(invoice.CreatedAt)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noInvoicesText}>
                      لا توجد فواتير متاحة.
                    </Text>
                  )}
                </ScrollView>
                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setInvoiceModalVisible(false)}
                >
                  <Text style={styles.closeModalButtonText}>إغلاق</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Complete Confirmation Modal */}
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

      {/* Remarks Modal */}
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


      {/* Custom Alerts */}
      <CustomAlert
        isVisible={isNotifyAlertVisible}
        title="تأكيد الإرسال"
        message="هل تريد إرسال إشعار إلى المندوب؟"
        confirmText="نعم"
        cancelText="لا"
        onConfirm={confirmSendNotification}
        onCancel={cancelSendNotification}
        confirmButtonColor="#27AE60"
      />

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
    backgroundColor: "#27AE60",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 10,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "right",
    marginBottom: 20,
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
});


export default ParcelDetailsScreen;