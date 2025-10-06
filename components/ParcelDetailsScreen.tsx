import React, { useRef, useEffect } from 'react';
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
} from 'react-native';
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
  ChevronUp
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#FF6B35',
  primaryLight: '#FF8A65',
  secondary: '#E67E22',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#343A40',
  textSecondary: '#6C757D',
  border: '#E9ECEF',
  success: '#27AE60',
  successLight: '#58D68D',
  warning: '#F39C12',
  warningLight: '#F8C471',
  danger: '#E74C3C',
  dangerLight: '#EC7063',
  info: '#3498DB',
  infoLight: '#5DADE2',
  gradientStart: '#FF6B35',
  gradientEnd: '#E67E22',
};

const STATUS_CONFIG = {
  'غير مؤكد': { color: COLORS.warning, lightColor: COLORS.warningLight, icon: Package },
  'في الفرع': { color: COLORS.info, lightColor: COLORS.infoLight, icon: Package },
  'في الطريق إلى الفرع الوجهة': { color: COLORS.secondary, lightColor: '#F0B27A', icon: Truck },
  'في الطريق': { color: COLORS.secondary, lightColor: '#F0B27A', icon: Truck },
  'تم التسليم للمستلم': { color: COLORS.success, lightColor: COLORS.successLight, icon: CheckCircle },
  'مرتجع': { color: COLORS.danger, lightColor: COLORS.dangerLight, icon: RefreshCw },
  'في الطريق للرجوع': { color: COLORS.danger, lightColor: COLORS.dangerLight, icon: RefreshCw },
  'تم إعادة تسليم الطرد إلى المتجر': { color: COLORS.danger, lightColor: COLORS.dangerLight, icon: RefreshCw },
  'راجع في المخزن': { color: COLORS.danger, lightColor: COLORS.dangerLight, icon: Archive },
  'جارٍ تسليم الطرد إلى عميل جديد': { color: COLORS.info, lightColor: COLORS.infoLight, icon: User },
  'مؤكد': { color: '#2ECC71', lightColor: '#82E0AA', icon: CheckCircle },
};

const ParcelDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { parcel } = route.params;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const headerHeight = useRef(new Animated.Value(140)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [expandedSections, setExpandedSections] = React.useState({
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
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
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

  const formatCurrency = (amount) => {
    return `${parseFloat(amount || 0).toFixed(2)} د.ل`;
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('ar-LY');
    } catch {
      return dateString;
    }
  };

  const statusConfig = STATUS_CONFIG[parcel.StatusName] || STATUS_CONFIG['غير مؤكد'];
  const StatusIcon = statusConfig.icon;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

  const renderSectionHeader = (title, sectionKey, hasContent = true) => {
    if (!hasContent) return null;
    
    return (
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => toggleSection(sectionKey)}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionToggle}>
          {expandedSections[sectionKey] ? 
            <ChevronUp size={20} color={COLORS.textSecondary} /> : 
            <ChevronDown size={20} color={COLORS.textSecondary} />
          }
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailRow = (icon, label, value, show = true) => {
    if (!show || !value) return null;
    
    return (
      <Animated.View 
        style={[
          styles.detailRow,
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.detailIcon}>
          {icon}
        </View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
          {value}
        </Text>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            transform: [{ translateY: headerTranslateY }],
            opacity: headerOpacity,
            height: headerHeight,
          }
        ]}
      >
        <View style={styles.headerBackground} />
        <View style={styles.headerContent}>
          <AnimatedTouchableOpacity 
            style={[
              styles.backButton,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </AnimatedTouchableOpacity>
          
          <Animated.View 
            style={[
              styles.headerTitleContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
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
                transform: [{ scale: scaleAnim }]
              }
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
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <View style={styles.statusHeader}>
            <Animated.View 
              style={[
                styles.statusIconContainer,
                {
                  backgroundColor: statusConfig.lightColor + '20',
                }
              ]}
            >
              <StatusIcon size={28} color={statusConfig.color} />
            </Animated.View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>حالة الطرد</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
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
                      outputRange: ['0%', '75%']
                    })
                  }
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
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {renderSectionHeader('المعلومات الأساسية', 'basic')}
          {expandedSections.basic && (
            <View style={styles.sectionContent}>
              {renderDetailRow(null, 'رقم الطرد:', `#${parcel.intParcelCode}`)}
              {renderDetailRow(null, 'المرجع:', parcel.ReferenceNo)}
              {renderDetailRow(null, 'نوع الطرد:', parcel.TypeName)}
              {renderDetailRow(null, 'الكمية:', parcel.Quantity, parcel.Quantity)}
            </View>
          )}
        </Animated.View>

        {/* Location Information */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {renderSectionHeader('معلومات الموقع', 'location')}
          {expandedSections.location && (
            <View style={styles.sectionContent}>
              {renderDetailRow(
                <MapPin size={20} color={COLORS.info} />, 
                'المدينة:', 
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
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {renderSectionHeader('معلومات المستلم', 'recipient', parcel.RecipientName || parcel.RecipientPhone)}
          {expandedSections.recipient && (parcel.RecipientName || parcel.RecipientPhone) && (
            <View style={styles.sectionContent}>
              {renderDetailRow(
                <User size={20} color={COLORS.primary} />, 
                'اسم المستلم:', 
                parcel.RecipientName, 
                parcel.RecipientName
              )}
              {renderDetailRow(
                <Phone size={20} color={COLORS.success} />, 
                'هاتف المستلم:', 
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
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {renderSectionHeader('المعلومات المالية', 'financial')}
          {expandedSections.financial && (
            <View style={styles.sectionContent}>
              {renderDetailRow(
                <DollarSign size={20} color={COLORS.success} />, 
                'الرسوم:', 
                formatCurrency(parcel.dcFee)
              )}
              {renderDetailRow(
                <DollarSign size={20} color={COLORS.primary} />, 
                'المجموع:', 
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
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {renderSectionHeader('التواريخ', 'dates', parcel.CreatedAt)}
          {expandedSections.dates && parcel.CreatedAt && (
            <View style={styles.sectionContent}>
              {renderDetailRow(
                <Calendar size={20} color={COLORS.warning} />, 
                'تاريخ الإنشاء:', 
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
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {renderSectionHeader('ملاحظات', 'remarks', parcel.Remarks)}
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
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {renderSectionHeader('ملاحظات السائق', 'driverRemarks', parcel.strDriverRemarks)}
          {expandedSections.driverRemarks && parcel.strDriverRemarks && (
            <View style={styles.sectionContent}>
              <Text style={styles.remarksText}>{parcel.strDriverRemarks}</Text>
            </View>
          )}
        </Animated.View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 15,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
  },
  headerContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  parcelNumber: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  headerIcon: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  statusHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textAlign: 'right',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBackground: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sectionToggle: {
    padding: 4,
  },
  sectionContent: {
    padding: 18,
  },
  detailRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  detailIcon: {
    width: 32,
    alignItems: 'center',
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    width: 100,
    textAlign: 'right',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  remarksText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    textAlign: 'right',
  },
  bottomSpacer: {
    height: 30,
  },
});

export default ParcelDetailsScreen;