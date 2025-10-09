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
} from "lucide-react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import CustomAlert from "./CustomAlert";

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




const ParcelDetailsScreen = () => {
  const navigation = useNavigation();
const route = useRoute<RouteProp<Record<string, ParcelDetailsRouteParams>, 'ParcelDetails'>>();
const { parcel } = route.params;  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [isNotifyAlertVisible, setNotifyAlertVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSuccess, setAlertSuccess] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const headerHeight = useRef(new Animated.Value(140)).current;
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

  // Parallax and header animation
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.9],
    extrapolate: "clamp",
  });

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  const handleDownloadPdf = async () => {
    try {
      setIsPdfDownloading(true);
      console.log(`Downloading PDF for parcel: ${parcel.ReferenceNo}`);

      // Here you would implement your actual PDF download logic
      // For example, making an API call to get PDF URL

      // Simulating API call
      setTimeout(() => {
        setIsPdfDownloading(false);
        setAlertTitle("نجاح");
        setAlertMessage("تم تحميل ملف PDF بنجاح.");
        setAlertSuccess(true);
        setAlertVisible(true);
      }, 1000);

      // Real implementation would look like:
      /*
    const response = await fetch(`YOUR_API_URL/parcel/${parcel.intParcelCode}/pdf`);
    const pdfBlob = await response.blob();
    // Use react-native-fs or similar library to save the file
    */
    } catch (error) {
      setIsPdfDownloading(false);
      setAlertTitle("خطأ");
      setAlertMessage("فشل تحميل ملف PDF. يرجى المحاولة مرة أخرى.");
      setAlertSuccess(false);
      setAlertVisible(true);
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

  const statusConfig =
    STATUS_CONFIG[parcel.StatusName] || STATUS_CONFIG["غير مؤكد"];
  const StatusIcon = statusConfig.icon;

  const handleNotifyPress = () => {
    setNotifyAlertVisible(true);
  };

  const confirmSendNotification = () => {
    console.log(`Sending notification for parcel: ${parcel.ReferenceNo}`);
    setNotifyAlertVisible(false);

    // Here you would typically make an API call to send the notification
    // For now, we'll simulate success
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

  // Determine which button to show based on status
  // Show notify button for "في الطريق" status (status code 4)
  const showNotifyButton =
    parcel.intStatusCode === 4 || parcel.StatusName === "في الطريق";
  const showConfirmButton = false; // We'll show different buttons for status 10
  const showDeliveredButtons = parcel.intStatusCode === 10;
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
         
        ]}
      >
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

      {/* Content */}
      <Animated.ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Status Card with Animation */}
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
                {/* Title on right */}
                <Text style={styles.statusTitle}>حالة الطرد</Text>

                {/* Icons (Invoice + Tick) on left */}
                {showDeliveredButtons && (
                  <View style={styles.inlineIcons}>
                    {/* Invoice Button */}
                    <TouchableOpacity
                      style={[
                        styles.invoiceButton,
                        isPdfDownloading && styles.invoiceButtonDisabled,
                      ]}
                      onPressIn={handleDownloadPdf}
                      activeOpacity={0.8}
                      disabled={isPdfDownloading}
                    >
                      <FileText size={16} color="#fff" />
                      <Text style={styles.invoiceButtonText}>
                        {isPdfDownloading ? "جاري التحميل..." : "فاتورة"}
                      </Text>
                    </TouchableOpacity>

                    {/* Green Tick Icon */}
                    <View style={styles.greenTickContainer}>
                      <CheckCircle size={22} color="#7bc89bff" />
                    </View>
                  </View>
                )}
                   {(showNotifyButton || showConfirmButton || showDeliveredButtons) && (
            <View style={styles.actionButtonContainer}>
              {/* Notify Button for status 4 */}
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


              {/* Confirm Button for other statuses */}
              {showConfirmButton && (
                <TouchableOpacity
                  style={styles.confirmActionButton}
                  onPressIn={handleConfirmDelivery}
                  activeOpacity={0.7}
                >
                  <CheckCircle size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>تأكيد التسليم</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
              </View>

              {/* Status Badge */}
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

          {/* Status Progress Bar */}
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

        {/* Basic Information */}
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

        {/* Location Information */}
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

        {/* Recipient Information */}
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

        {/* Financial Information */}
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

        {/* Dates */}
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

        {/* Remarks */}
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

        {/* Driver Remarks */}
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

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {/* Custom Alerts */}
                 <CustomAlert isVisible={isNotifyAlertVisible} title="تأكيد الإرسال" message="هل تريد إرسال إشعار إلى المندوب؟" confirmText="نعم" cancelText="لا" onConfirm={confirmSendNotification} onCancel={cancelSendNotification} confirmButtonColor="#27AE60" />


      <CustomAlert
        isVisible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        confirmText="حسنًا"
        onConfirm={() => setAlertVisible(false)}
        success={alertSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inlineHeader: {
    flexDirection: "row-reverse", // RTL layout
    alignItems: "center",
    justifyContent: "space-between",
  },
// DELETE THIS:
actionButtonContainer: {
  marginTop: 20,
  gap: 12,
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
    backgroundColor: "#27AE60", // beautiful blue
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3, // for Android shadow
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
  deliveredTickButton: {
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
    opacity: 0.9,
  },
  deliveredButtonsContainer: {
    marginTop: 20,
  },
  inlineButtonsContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  downloadPdfButtonText: {
    color: "#FFFFFF",
    fontSize: 14, // Smaller font size
    fontWeight: "bold",
  },
  downloadPdfButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E74C3C",
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
    zIndex: 1000,
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

notifyActionButton: {  flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27AE60", // beautiful blue
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3, // for Android shadow
    marginBottom: 10,
},
notifyButtonText: {
  color: '#FFF',
  fontSize: 14,
  fontWeight: '600',
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
});

export default ParcelDetailsScreen;
