import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  SafeAreaView,
  FlatList,
  TouchableWithoutFeedback,
  Platform,
  LayoutAnimation,
  UIManager,
  ActivityIndicator,
  KeyboardTypeOptions,
} from "react-native";
import {
  User,
  Phone,
  MapPin,
  Store,
  Package,
  Map,
  ChevronDown,
  CreditCard,
  FileText,
  Hash,
  ShoppingBag,
  Search,
  Check,
  Tag,
  AlignLeft,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import TopBar from "../../components/Entity/TopBarNew";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomAlert from "../../components/CustomAlert";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

// --- Enable LayoutAnimation on Android ---
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// ... [Interfaces] ...
interface Entity {
  intEntityCode: number;
  strEntityName: string;
  strEntityCode: string;
}
interface CityPrice {
  intCityCode: number;
  strCityName: string;
  DcOfficePrice: number;
  DcInsideCityPrice: number;
  DcOutSkirtPrice: number;
}
interface ParcelType {
  Text: string;
  Value: string;
}
interface DeliveryType {
  Disabled: boolean;
  Group: any;
  Selected: boolean;
  Text: string;
  Value: string;
}
interface DiscountInfo {
  discount_type: string;
  discount_value: number;
  promotion_id: number;
}
interface DeliveryStats {
  success: boolean;
  total: number;
  delivered: number;
  percent: number;
}

// --- UPDATED PAYMENT METHODS ---
const PAYMENT_METHODS = ["المرسل", "المستلم", "الدفع الإلكتروني", "الدفع بالبطاقة"];
const COUNTRY_CODE = "+218";

// --- FormInput ---
const FormInput = ({
  label,
  icon: Icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  editable = true,
  required = false,
  rightComponent = null,
  onBlur = undefined,
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>
      {label}
      {required && <Text style={styles.requiredStar}> *</Text>}
    </Text>
    <View style={[styles.inputWrapper, !editable && styles.disabledInput]}>
      {rightComponent && <View style={styles.rightComponentWrapper}>{rightComponent}</View>}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#A1A1AA"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType as KeyboardTypeOptions}
        editable={editable}
        onBlur={onBlur}
      />
      {Icon && <Icon color="#A1A1AA" size={20} style={styles.leftIcon} />}
    </View>
  </View>
);

// ... [Other Components] ...
const FormPicker = ({
  label,
  icon: Icon,
  value,
  onPress,
  placeholder,
  disabled = false,
  required = false,
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>
      {label}
      {required && <Text style={styles.requiredStar}> *</Text>}
    </Text>
    <TouchableOpacity
      style={[styles.inputWrapper, disabled && styles.disabledInput]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.input, !value && styles.placeholderText]}>
        {value || placeholder}
      </Text>
      {Icon && <ChevronDown color="#A1A1AA" size={20} />}
    </TouchableOpacity>
  </View>
);
const DimensionInput = ({
  label,
  value,
  onChangeText,
  editable = true,
  required = false,
}) => (
  <View style={styles.dimensionInputContainer}>
    <Text style={styles.dimensionLabel}>
      {label}
      {required && <Text style={styles.requiredStar}> *</Text>}
    </Text>
    <TextInput
      style={[styles.dimensionInput, !editable && styles.disabledInput]}
      placeholder="0"
      placeholderTextColor="#A1A1AA"
      value={value}
      onChangeText={onChangeText}
      keyboardType="numeric"
      editable={editable}
    />
  </View>
);
const PriceOptionCard = ({
  label,
  price,
  isSelected,
  onPress,
  disabled = false,
}) => (
  <TouchableOpacity
    style={[
      styles.priceOptionCard,
      isSelected && styles.priceOptionCardSelected,
      disabled && styles.disabledInput,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={disabled}
  >
    <View
      style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}
    >
      {isSelected && <View style={styles.radioInnerCircle} />}
    </View>
    <Text style={styles.priceOptionLabel}>{label}</Text>
    <Text style={styles.priceOptionValue}>{price?.toFixed(2) ?? "0.00"}</Text>
  </TouchableOpacity>
);
const SelectionModal = ({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
}) => (
  <Modal
    visible={visible}
    animationType="fade"
    transparent={true}
    onRequestClose={() => { }}
  >
    <TouchableWithoutFeedback onPress={() => onSelect(selectedValue)}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback>
          <SafeAreaView
            style={[styles.modernModalContent, { maxHeight: "50%" }]}
          >
            <Text style={styles.modalTitle}>{title}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.Value || item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modernModalItem}
                  onPress={() => onSelect(item)}
                >
                  <Text
                    style={[
                      styles.modernModalItemText,
                      (selectedValue?.Value === item.Value || selectedValue === item) && styles.modalItemSelected,
                    ]}
                  >
                    {item.Text || item}
                  </Text>
                  {(selectedValue?.Value === item.Value || selectedValue === item) && (
                    <Check color="#FF6B35" size={20} />
                  )}
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

const shimmerColors = ["#FDF1EC", "#FEF8F5", "#FDF1EC"];
const FormSkeleton = () => (
  <View>
    {[...Array(6)].map((_, index) => (
      <View key={index} style={styles.inputContainer}>
        <ShimmerPlaceholder
          style={skeletonStyles.label}
          shimmerColors={shimmerColors}
        />

        <ShimmerPlaceholder
          style={skeletonStyles.input}
          shimmerColors={shimmerColors}
        />
      </View>
    ))}
    <ShimmerPlaceholder style={skeletonStyles.button} />
  </View>
);


export default function CreateParcelScreen() {
  const insets = useSafeAreaInsets();

  // --- Form State ---
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientStats, setRecipientStats] = useState<DeliveryStats | null>(null);

  const [recipientAddress, setRecipientAddress] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [productPrice, setProductPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);

  // --- Promo Code State ---
  const [promoCode, setPromoCode] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);

  const [parcelTypes, setParcelTypes] = useState<ParcelType[]>([]);
  const [selectedParcelType, setSelectedParcelType] =
    useState<ParcelType | null>(null);
  const [isParcelTypeModalVisible, setParcelTypeModalVisible] = useState(false);

  const [deliveryTypes, setDeliveryTypes] = useState<DeliveryType[]>([]);
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<DeliveryType | null>(null);
  const [isDeliveryTypeModalVisible, setDeliveryTypeModalVisible] = useState(false);

  const [stores, setStores] = useState<Entity[]>([]);
  const [selectedStore, setSelectedStore] = useState<Entity | null>(null);
  const [isStoreModalVisible, setStoreModalVisible] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState("");

  const [allCityPrices, setAllCityPrices] = useState<CityPrice[]>([]);
  const [selectedCityData, setSelectedCityData] = useState<CityPrice | null>(
    null
  );
  const [isCityModalVisible, setCityModalVisible] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");

  const [selectedShippingType, setSelectedShippingType] = useState<
    "office" | "inside" | "outskirts" | null
  >(null);
  const [shippingPrice, setShippingPrice] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // --- Alert State & Handlers ---
  const [alertConfig, setAlertConfig] = useState({
    isVisible: false,
    title: "",
    message: "",
    confirmText: "حسناً",
    success: false,
    onConfirmAction: () => { },
  });

  const showAlert = (config) => {
    setAlertConfig({
      isVisible: true,
      title: config.title,
      message: config.message,
      confirmText: config.confirmText || "حسناً",
      onConfirmAction: config.onConfirm || (() => { }),
      success: config.success || false,
    });
  };

  const handleAlertConfirm = () => {
    alertConfig.onConfirmAction();
    setAlertConfig((prev) => ({ ...prev, isVisible: false }));
  };

  // --- API LOGIC: Fetch Stats (POST) ---
  const fetchDeliveryStats = async () => {
    // Both Store and Phone must be present
    if (!selectedStore?.intEntityCode || !recipientPhone || recipientPhone.length < 7) {
      return;
    }

    try {
      // 1. Remove non-digits
      // 2. Remove leading '0' (if user types 091... it becomes 91...)
      // 3. Prepend 218 (country code without +)
      const phoneClean = recipientPhone.replace(/\D/g, '').replace(/^0+/, '');
      const countryCodeClean = COUNTRY_CODE.replace('+', '');
      const fullPhone = `${countryCodeClean}${phoneClean}`;

      const entityId = selectedStore.intEntityCode;

      const response = await axios.post(
        `http://tanmia-group.com:90/api/stats/recipient-delivery/${entityId}/${fullPhone}`,
        {} // Sending empty body
      );

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      if (response.data?.success) {
        setRecipientStats(response.data);
      } else {
        setRecipientStats(null);
      }
    } catch (error) {
      console.log("Error fetching stats:", error);
      setRecipientStats(null);
    }
  };

  // --- TRIGGER: When Store changes, retry fetch if phone is present ---
  useEffect(() => {
    if (recipientPhone) {
      fetchDeliveryStats();
    }
  }, [selectedStore]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem("user");
        if (!userDataString) throw new Error("User not found");
        const parsedUser = JSON.parse(userDataString);
        const userId = parsedUser?.userId;
        const userCityCode = parsedUser?.intCityCode;
        if (!userId) throw new Error("User ID not found");

        await Promise.all([
          axios.get(
            "http://tanmia-group.com:90/courierApi/parcels/GetParcelTypes"
          ),
          axios.get(
            `http://tanmia-group.com:90/courierApi/Entity/GetEntities/${userId}`
          ),
          userCityCode
            ? axios.get(
              `http://tanmia-group.com:90/courierApi/City/GetCityPrices/${userCityCode}`
            )
            : Promise.resolve({ data: [] }),
          axios.get(
            "http://tanmia-group.com:90/courierApi/parcels/GetDeliveryTypes"
          ),
        ]).then(([parcelTypesResponse, storesResponse, cityPricesResponse, deliveryTypesResponse]) => {
          if (parcelTypesResponse.data?.ParcelTypes)
            setParcelTypes(parcelTypesResponse.data.ParcelTypes);
          if (storesResponse.data) setStores(storesResponse.data);
          if (cityPricesResponse.data)
            setAllCityPrices(cityPricesResponse.data);
          if (deliveryTypesResponse.data?.DeliveryTypes) {
            setDeliveryTypes(deliveryTypesResponse.data.DeliveryTypes);
            const fastDelivery = deliveryTypes.find(dt => dt.Value === "سريع");
            if (fastDelivery) {
              setSelectedDeliveryType(fastDelivery);
            }
          }
        });
      } catch (error) {
        console.error("Failed to load initial data:", error);
        showAlert({
          title: "خطأ في التحميل",
          message:
            "لا يمكن تحميل البيانات المطلوبة. يرجى المحاولة مرة أخرى في وقت لاحق.",
        });
      } finally {
        setIsLoadingData(false);
      }
    };
    loadInitialData();
  }, []);

  const productTotal = useMemo(
    () => (parseFloat(productPrice) || 0),
    [productPrice]
  );

  const displayedShippingPrice = useMemo(() => {
    let finalPrice = shippingPrice;
    if (selectedParcelType?.Text === "طرد كبير") {
      const l = parseFloat(length) || 0,
        w = parseFloat(width) || 0,
        h = parseFloat(height) || 0;
      if (l > 0 && w > 0 && h > 0) finalPrice += (l * w * h) / 4000;
    }
    return finalPrice;
  }, [shippingPrice, selectedParcelType, length, width, height]);

  const discountAmount = useMemo(() => {
    if (!isPromoApplied || !discountInfo) {
      return 0;
    }
    if (discountInfo.discount_type === 'percent') {
      return (shippingPrice * discountInfo.discount_value) / 100;
    } else {
      return discountInfo.discount_value;
    }
  }, [isPromoApplied, discountInfo, shippingPrice]);

  // --- UPDATED SURCHARGE LOGIC ---
  const electronicPaymentSurcharge = useMemo(() => {
    const baseTotal = productTotal + displayedShippingPrice - discountAmount;

    if (paymentMethod === "الدفع الإلكتروني") {
      return baseTotal * 0.02; // 2%
    }

    if (paymentMethod === "الدفع بالبطاقة") {
      return baseTotal * 0.015; // 1.5%
    }

    return 0;
  }, [paymentMethod, productTotal, displayedShippingPrice, discountAmount]);

  const totalAmount = useMemo(
    () => productTotal + displayedShippingPrice - discountAmount + electronicPaymentSurcharge,
    [productTotal, displayedShippingPrice, discountAmount, electronicPaymentSurcharge]
  );

  const displayedStores = useMemo(
    () =>
      stores.filter((e) =>
        e.strEntityName.toLowerCase().includes(storeSearchQuery.toLowerCase())
      ),
    [storeSearchQuery, stores]
  );
  const displayedCities = useMemo(
    () =>
      allCityPrices.filter(
        (city) =>
          city.strCityName &&
          city.strCityName.toLowerCase().includes(citySearchQuery.toLowerCase())
      ),
    [citySearchQuery, allCityPrices]
  );

  const handleSetParcelType = (parcelTypeObject: ParcelType) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedParcelType(parcelTypeObject);
    setParcelTypeModalVisible(false);
  };
  const handleSetDeliveryType = (deliveryTypeObject: DeliveryType) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDeliveryType(deliveryTypeObject);
    setDeliveryTypeModalVisible(false);
  };

  const handleSelectCity = (cityObject: CityPrice) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCityData(cityObject);
    setSelectedShippingType(null);
    setShippingPrice(0);
    setCityModalVisible(false);
    setCitySearchQuery("");
  };
  const handleSelectShippingType = (
    type: "office" | "inside" | "outskirts"
  ) => {
    if (!selectedCityData) return;
    setSelectedShippingType(type);
    if (type === "office") setShippingPrice(selectedCityData.DcOfficePrice);
    if (type === "inside") setShippingPrice(selectedCityData.DcInsideCityPrice);
    if (type === "outskirts")
      setShippingPrice(selectedCityData.DcOutSkirtPrice);
  };

  const handleApplyPromoCode = async () => {
    const userDataString = await AsyncStorage.getItem("user");
    if (!userDataString) return;
    const parsedUser = JSON.parse(userDataString);
    const userCityCode = parsedUser?.intCityCode;

    setIsApplyingPromo(true);
    try {
      const response = await axios.post('http://tanmia-group.com:90/courierApi/promotion/validate', {
        promocode: promoCode,
        intCityCode: selectedCityData.intCityCode,
        intParentCityCode: userCityCode,
      });

      if (response.data?.success) {
        setDiscountInfo(response.data);
        setIsPromoApplied(true);
        showAlert({
          title: 'نجاح',
          message: response.data.message,
          success: true,
        });
      } else {
        throw new Error(response.data?.message || 'كود الخصم غير صالح.');
      }
    } catch (error) {
      showAlert({
        title: 'خطأ',
        message: error.message,
      });
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromoCode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPromoCode("");
    setDiscountInfo(null);
    setIsPromoApplied(false);
  };


  const resetForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRecipientName("");
    setRecipientPhone("");
    setRecipientAddress("");
    setQuantity("1");
    setProductPrice("");
    setNotes("");
    setProductDescription("");
    setLength("");
    setWidth("");
    setHeight("");
    setPaymentMethod("");
    setSelectedParcelType(null);
    setSelectedDeliveryType(null);
    setSelectedStore(null);
    setSelectedCityData(null);
    setSelectedShippingType(null);
    setShippingPrice(0);
    setStoreSearchQuery("");
    setCitySearchQuery("");
    setPromoCode("");
    setDiscountInfo(null);
    setIsPromoApplied(false);
    setRecipientStats(null); // Reset Stats

    const fastDelivery = deliveryTypes.find(dt => dt.Value === "سريع");
    if (fastDelivery) {
      setSelectedDeliveryType(fastDelivery);
    }
  };

  const handleSave = async () => {
    if (
      !recipientPhone.trim()
    )
      return showAlert({
        title: "حقول مطلوبة",
        message: "يرجى إدخال رقم هاتف المستلم."
      });

    if (!selectedStore)
      return showAlert({ title: "حقول مطلوبة", message: "يرجى اختيار متجر." });
    if (!selectedParcelType)
      return showAlert({
        title: "حقول مطلوبة",
        message: "يرجى اختيار نوع الطرد.",
      });
    if (selectedParcelType.Text === "طرد كبير") {
      if (
        !(parseFloat(length) > 0) ||
        !(parseFloat(width) > 0) ||
        !(parseFloat(height) > 0)
      ) {
        return showAlert({
          title: "أبعاد غير صالحة",
          message:
            "للطرد الكبير، يجب أن تكون الأبعاد (الطول، العرض، الارتفاع) أكبر من صفر.",
        });
      }
    }
    if (!selectedCityData)
      return showAlert({ title: "حقول مطلوبة", message: "يرجى اختيار مدينة." });
    if (!selectedShippingType)
      return showAlert({
        title: "حقول مطلوبة",
        message: "يرجى اختيار سعر الشحن.",
      });

    if ((parseFloat(productPrice) < 0) || !(parseInt(quantity, 10) >= 0)) {
      return showAlert({
        title: "قيم غير صالحة",
        message: "لا يمكن أن يكون السعر أو الكمية أقل من صفر.",
      });
    }

    if (!paymentMethod)
      return showAlert({
        title: "حقول مطلوبة",
        message: "يرجى اختيار طريقة الدفع.",
      });
    if (!selectedDeliveryType && parseInt(quantity, 10) > 1)
      return showAlert({
        title: "حقول مطلوبة",
        message: "يرجى اختيار نوع التسليم.",
      });

    const userDataString = await AsyncStorage.getItem("user");
    if (!userDataString) return;
    const parsedUser = JSON.parse(userDataString);
    const userId = parsedUser?.userId;
    const userCityCode = parsedUser?.intCityCode;

    setIsSaving(true);
    const strCityPriceNameMap = {
      office: "Office",
      inside: "InsideCity",
      outskirts: "OutSkirt",
    };

    const fullRecipientPhone = recipientPhone.trim() ? (COUNTRY_CODE + recipientPhone) : "";
    const senderEntityCode = selectedStore?.intEntityCode ?? userId;

    const payload = {
      intSenderEntityCode: senderEntityCode,
      strRecipientName: recipientName,
      strRecipientPhone: fullRecipientPhone,
      strRecipientAddress: recipientAddress,
      intParcelTypeCode: selectedParcelType.Value,
      dcFee: totalAmount,
      dcDriverFees: 0,
      dcEntityFees: productTotal,
      dcCompanyFees: displayedShippingPrice,
      strPaymentBy: paymentMethod,
      intToCityCode: selectedCityData.intCityCode ?? userCityCode,
      intQty: parseInt(quantity, 10),
      strRemarks: notes,
      dcShippingCharge: shippingPrice,
      dcLength: parseFloat(length) || 0,
      dcWidth: parseFloat(width) || 0,
      dcHeight: parseFloat(height) || 0,
      strCityPriceName: selectedShippingType
        ? strCityPriceNameMap[selectedShippingType]
        : "",
      strDeliveryType: selectedDeliveryType?.Value || "",
      intPromotionId: isPromoApplied ? discountInfo.promotion_id : null,
      StrParcelCategory: productDescription,
    };

    try {
      const response = await axios.post('http://tanmia-group.com:90/courierApi/parcels/saveparcel', payload);

      if (response.status === 200 && response.data?.Success !== false) {
        showAlert({
          title: 'نجاح',
          message: response.data?.Message || response.data?.message || 'تم حفظ الطرد بنجاح!',
          confirmText: 'إضافة طرد جديد',
          onConfirm: resetForm,
          success: true,
        });
      } else {
        const failMessage = response.data?.Message || response.data?.message || 'فشل حفظ الطرد';
        throw new Error(failMessage);
      }
    } catch (error) {
      console.error("Save parcel error:", error.response?.data || error.message);
      const apiData = error.response?.data;
      const apiErrorMessage =
        apiData?.Message ||
        apiData?.message ||
        error.message ||
        "فشل حفظ الطرد. يرجى المحاولة مرة أخرى.";

      showAlert({
        title: "خطأ في الحفظ",
        message: apiErrorMessage,
        success: false,
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (parseInt(quantity, 10) <= 1) {
      setSelectedDeliveryType(null);
    }
  }, [quantity]);
  const isLargeParcel = selectedParcelType?.Text === "طرد كبير";

  return (
    <View style={styles.container}>
      <TopBar title="إضافة طرد" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isLoadingData ? (
          <FormSkeleton />
        ) : (
          <>
            <FormPicker
              label="المتجر"
              icon={Store}
              value={selectedStore?.strEntityName}
              onPress={() => setStoreModalVisible(true)}
              placeholder="اختر المتجر"
              disabled={isSaving}
              required
            />

            <FormInput
              label="اسم المستلم"
              icon={User}
              placeholder="أدخل اسم المستلم"
              value={recipientName}
              onChangeText={setRecipientName}
              editable={!isSaving}
              required={false}
            />

            {/* TRIGGER: onBlur attached to Phone Input */}
            <FormInput
              label="هاتف المستلم"
              icon={Phone}
              placeholder="أدخل رقم الهاتف"
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              keyboardType="phone-pad"
              editable={!isSaving}
              required
              rightComponent={<Text style={styles.countryCodeText}>{COUNTRY_CODE}</Text>}
              onBlur={fetchDeliveryStats} // <--- API Call on focus out
            />

            {/* Delivery Stats Component */}
            {recipientStats && (
              <View style={styles.statsContainer}>
                <View style={styles.statsRow}>
                  <View style={styles.statsTextWrapper}>
                    <Text style={styles.statsTitle}>نسبة التسليم لهذا الرقم</Text>
                    <Text style={styles.statsSubtitle}>حسب سجل الشحنات السابقة</Text>
                  </View>
                  <View style={styles.percentBadge}>
                    <Text style={styles.percentText}>{recipientStats.percent}%</Text>
                  </View>
                </View>

                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${recipientStats.percent}%` }]} />
                </View>

                <Text style={styles.statsFooter}>كلما زادت النسبة، زادت موثوقية التسليم لهذا الرقم.</Text>
              </View>
            )}

            <FormInput
              label="عنوان المستلم"
              icon={MapPin}
              placeholder="أدخل العنوان بالتفصيل"
              value={recipientAddress}
              onChangeText={setRecipientAddress}
              editable={!isSaving}
              required={false}
            />

            <FormPicker
              label="نوع الطرد"
              icon={Package}
              value={selectedParcelType?.Text}
              onPress={() => setParcelTypeModalVisible(true)}
              placeholder="اختر نوع الطرد"
              disabled={isSaving}
              required
            />

            {isLargeParcel && (
              <View style={styles.dimensionsRow}>
                <DimensionInput
                  label="الارتفاع"
                  value={height}
                  onChangeText={setHeight}
                  editable={!isSaving}
                  required={isLargeParcel}
                />
                <DimensionInput
                  label="العرض"
                  value={width}
                  onChangeText={setWidth}
                  editable={!isSaving}
                  required={isLargeParcel}
                />
                <DimensionInput
                  label="الطول"
                  value={length}
                  onChangeText={setLength}
                  editable={!isSaving}
                  required={isLargeParcel}
                />
              </View>
            )}

            <FormInput
              label="وصف المنتج"
              icon={AlignLeft}
              placeholder="أدخل وصف المنتج (اختياري)"
              value={productDescription}
              onChangeText={setProductDescription}
              editable={!isSaving}
              required={false}
            />

            <FormPicker
              label="المدينة"
              icon={Map}
              value={selectedCityData?.strCityName}
              onPress={() => setCityModalVisible(true)}
              placeholder="اختر المدينة"
              disabled={isSaving}
              required
            />

            {selectedCityData && (
              <View>
                <Text style={styles.label}>
                  سعر الشحن<Text style={styles.requiredStar}> *</Text>
                </Text>
                <View style={styles.priceOptionsRow}>
                  <PriceOptionCard
                    label="سعر الضواحي"
                    price={selectedCityData.DcOutSkirtPrice}
                    isSelected={selectedShippingType === "outskirts"}
                    onPress={() => handleSelectShippingType("outskirts")}
                    disabled={isSaving}
                  />
                  <PriceOptionCard
                    label="سعر داخل المدينة"
                    price={selectedCityData.DcInsideCityPrice}
                    isSelected={selectedShippingType === "inside"}
                    onPress={() => handleSelectShippingType("inside")}
                    disabled={isSaving}
                  />
                  <PriceOptionCard
                    label="سعر المكتب"
                    price={selectedCityData.DcOfficePrice}
                    isSelected={selectedShippingType === "office"}
                    onPress={() => handleSelectShippingType("office")}
                    disabled={isSaving}
                  />
                </View>
              </View>
            )}

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <FormInput
                  label="سعر المنتج"
                  icon={ShoppingBag}
                  placeholder="0.00"
                  value={productPrice}
                  onChangeText={setProductPrice}
                  keyboardType="numeric"
                  editable={!isSaving}
                  required
                />
              </View>
              <View style={{ width: 16 }} />
              <View style={{ flex: 1 }}>
                <FormInput
                  label="الكمية"
                  icon={Hash}
                  placeholder="1"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="number-pad"
                  editable={!isSaving}
                  required
                />
              </View>
            </View>

            <FormPicker
              label="الدفع بواسطة"
              icon={CreditCard}
              value={paymentMethod}
              onPress={() => setPaymentModalVisible(true)}
              placeholder="اختر طريقة الدفع"
              disabled={isSaving}
              required
            />

            {parseInt(quantity, 10) > 1 && (
              <FormPicker
                label="نوع التسليم"
                icon={Package}
                value={selectedDeliveryType?.Text}
                onPress={() => setDeliveryTypeModalVisible(true)}
                placeholder="اختر نوع التسليم"
                disabled={isSaving}
                required={parseInt(quantity, 10) > 1}
              />
            )}

            <View style={styles.promoContainer}>
              <View style={{ flex: 1 }}>
                <FormInput
                  label="كود الخصم"
                  icon={Tag}
                  placeholder="أدخل كود الخصم"
                  value={promoCode}
                  onChangeText={setPromoCode}
                  editable={!isPromoApplied && !isSaving}
                />
              </View>
              <View style={{ width: 20 }} />
              {!isPromoApplied ? (
                <TouchableOpacity
                  style={[
                    styles.promoButton,
                    (!promoCode.trim() || !selectedCityData || !selectedShippingType || isApplyingPromo) && styles.disabledButton,
                  ]}
                  onPress={handleApplyPromoCode}
                  disabled={!promoCode.trim() || !selectedCityData || !selectedShippingType || isApplyingPromo}
                >
                  {isApplyingPromo ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.promoButtonText}>تطبيق</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.promoButton, styles.removePromoButton]}
                  onPress={handleRemovePromoCode}
                >
                  <Text style={[styles.promoButtonText, styles.removePromoButtonText]}>إزالة</Text>
                </TouchableOpacity>
              )}
            </View>


            <FormInput
              label="ملاحظات"
              icon={FileText}
              placeholder="اكتب ملاحظاتك هنا..."
              value={notes}
              onChangeText={setNotes}
              editable={!isSaving}
            />

            <TouchableOpacity
              style={[styles.submitButton, isSaving && styles.disabledButton]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>حفظ الطرد</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.footerContainer,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 },
        ]}
      >
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>تفاصيل المبلغ</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>سعر المنتج</Text>
            <Text style={styles.priceValue}>{productTotal.toFixed(2)} د.ل</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>سعر الشحن</Text>
            <Text style={styles.priceValue}>
              {displayedShippingPrice.toFixed(2)} د.ل
            </Text>
          </View>
          {isPromoApplied && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>قيمة الخصم</Text>
              <Text style={[styles.priceValue, styles.discountValue]}>- {discountAmount.toFixed(2)} د.ل</Text>
            </View>
          )}

          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>المبلغ الإجمالي</Text>
            <Text style={styles.totalValue}>{totalAmount.toFixed(2)} د.ل</Text>
          </View>
        </View>
      </View>

      <CustomAlert
        isVisible={alertConfig.isVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText={alertConfig.confirmText}
        onConfirm={handleAlertConfirm}
        cancelText={null}
        success={alertConfig.success}
        onCancel={undefined}
      />

      <Modal
        visible={isStoreModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setStoreModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setStoreModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <SafeAreaView style={styles.modernModalContent}>
                <Text style={styles.modalTitle}>اختيار المتجر</Text>
                <View style={styles.modernModalSearchContainer}>
                  <Search
                    color="#9CA3AF"
                    size={20}
                    style={styles.modalSearchIcon}
                  />
                  <TextInput
                    style={styles.modernModalSearchInput}
                    placeholder="ابحث عن متجر..."
                    placeholderTextColor="#9CA3AF"
                    value={storeSearchQuery}
                    onChangeText={setStoreSearchQuery}
                  />
                </View>
                <FlatList
                  data={displayedStores}
                  keyExtractor={(item) => item.intEntityCode.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modernModalItem}
                      onPress={() => {
                        setSelectedStore(item);
                        setStoreModalVisible(false);
                        setStoreSearchQuery("");
                      }}
                    >
                      <View style={styles.modalItemContent}>
                        <Text
                          style={[
                            styles.modernModalItemText,
                            selectedStore?.intEntityCode ===
                            item.intEntityCode && styles.modalItemSelected,
                          ]}
                        >
                          {item.strEntityName}
                        </Text>
                        <Text style={styles.modalItemCode}>
                          {item.strEntityCode}
                        </Text>
                      </View>
                      {selectedStore?.intEntityCode === item.intEntityCode && (
                        <Check color="#FF6B35" size={20} />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </SafeAreaView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <Modal
        visible={isCityModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCityModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setCityModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <SafeAreaView style={styles.modernModalContent}>
                <Text style={styles.modalTitle}>اختيار المدينة</Text>
                <View style={styles.modernModalSearchContainer}>
                  <Search
                    color="#9CA3AF"
                    size={20}
                    style={styles.modalSearchIcon}
                  />
                  <TextInput
                    style={styles.modernModalSearchInput}
                    placeholder="ابحث عن مدينة..."
                    placeholderTextColor="#9CA3AF"
                    value={citySearchQuery}
                    onChangeText={setCitySearchQuery}
                  />
                </View>
                <FlatList
                  data={displayedCities}
                  keyExtractor={(item, index) =>
                    item.intCityCode
                      ? item.intCityCode.toString()
                      : index.toString()
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modernModalItem}
                      onPress={() => handleSelectCity(item)}
                    >
                      <Text
                        style={[
                          styles.modernModalItemText,
                          selectedCityData?.intCityCode === item.intCityCode &&
                          styles.modalItemSelected,
                        ]}
                      >
                        {item.strCityName}
                      </Text>
                      {selectedCityData?.intCityCode === item.intCityCode && (
                        <Check color="#FF6B35" size={20} />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </SafeAreaView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <SelectionModal
        visible={isParcelTypeModalVisible}
        title="اختر نوع الطرد"
        options={parcelTypes}
        selectedValue={selectedParcelType}
        onSelect={handleSetParcelType}
      />
      <SelectionModal
        visible={isPaymentModalVisible}
        title="اختر طريقة الدفع"
        options={PAYMENT_METHODS}
        selectedValue={paymentMethod}
        onSelect={(method) => {
          setPaymentMethod(method);
          setPaymentModalVisible(false);
        }}
      />
      <SelectionModal
        visible={isDeliveryTypeModalVisible}
        title="اختر نوع التسليم"
        options={deliveryTypes}
        selectedValue={selectedDeliveryType}
        onSelect={handleSetDeliveryType}
      />
    </View>
  );
}

// ... [Styles] ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 220,
  },
  countryCodeText: {
    color: "#A1A1AA",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
  rightComponentWrapper: {
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  leftIcon: {
    marginRight: 8,
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E4E4E7",
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27272A",
    textAlign: "right",
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  priceLabel: { fontSize: 14, color: "#71717A" },
  priceValue: { fontSize: 14, color: "#3F3F46", fontWeight: "500" },
  discountValue: { color: "#EF4444" },
  divider: { height: 1, backgroundColor: "#E4E4E7", marginVertical: 8 },
  totalLabel: { fontSize: 16, color: "#18181B", fontWeight: "bold" },
  totalValue: { fontSize: 16, color: "#F97316", fontWeight: "bold" },
  inputContainer: { marginBottom: 20 },
  label: {
    fontSize: 14,
    color: "#3F3F46",
    marginBottom: 8,
    textAlign: "right",
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D4D4D8",
    paddingHorizontal: 12,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#18181B",
    textAlign: "right",
  },
  placeholderText: { color: "#A1A1AA" },
  row: { flexDirection: "row-reverse", justifyContent: "space-between" },
  submitButton: {
    backgroundColor: "#F97316",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  submitButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modernModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    width: "100%",
    maxHeight: "70%",
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "right",
    marginBottom: 16,
    marginHorizontal: 20,
  },
  modernModalSearchContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginHorizontal: 20,
  },
  modalSearchIcon: { marginLeft: 8 },
  modernModalSearchInput: {
    flex: 1,
    color: "#1F2937",
    fontSize: 16,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    textAlign: "right",
  },
  modernModalItem: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    marginHorizontal: 20,
  },
  modalItemContent: { flex: 1 },
  modernModalItemText: {
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "right",
    marginBottom: 2,
  },
  modalItemCode: { color: "#6B7280", fontSize: 12, textAlign: "right" },
  modalItemSelected: { color: "#FF6B35", fontWeight: "bold" },
  dimensionsRow: { flexDirection: "row-reverse", gap: 12, marginBottom: 20 },
  dimensionInputContainer: { flex: 1, position: "relative" },
  dimensionInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D4D4D8",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#18181B",
    textAlign: "center",
  },
  dimensionLabel: {
    position: "absolute",
    top: -10,
    alignSelf: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 4,
    fontSize: 12,
    color: "#3F3F46",
    zIndex: 1,
  },
  priceOptionsRow: { flexDirection: "row-reverse", gap: 12, marginBottom: 20 },
  priceOptionCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D4D4D8",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  priceOptionCardSelected: {
    borderColor: "#F97316",
    backgroundColor: "#FFF7ED",
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D4D4D8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  radioCircleSelected: { borderColor: "#F97316" },
  radioInnerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#F97316",
  },
  priceOptionLabel: {
    fontSize: 14,
    color: "#3F3F46",
    textAlign: "center",
    fontWeight: "500",
  },
  priceOptionValue: {
    fontSize: 16,
    color: "#10B981",
    fontWeight: "bold",
    marginTop: 4,
  },
  disabledInput: { backgroundColor: "#F3F4F6", opacity: 0.7 },
  disabledButton: { backgroundColor: "#FDBA74" },
  requiredStar: { color: "#EF4444", fontWeight: "bold" },
  promoContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 10,
  },
  promoButton: {
    marginTop: 4,
    backgroundColor: "#10B981",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  promoButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  removePromoButton: {
    backgroundColor: '#EF4444',
  },
  removePromoButtonText: {
    color: '#FFFFFF',
  },
  // --- New Stats Styles ---
  statsContainer: {
    backgroundColor: "#E0F2FE", // Light blue bg
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  statsRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statsTextWrapper: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0369A1", // Dark blue
    textAlign: "right",
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 13,
    color: "#0284C7",
    textAlign: "right",
  },
  percentBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 70,
  },
  percentText: {
    color: "#059669", // Green
    fontWeight: "bold",
    fontSize: 18,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#DBEAFE",
    borderRadius: 4,
    width: "100%",
    overflow: "hidden",
    flexDirection: "row-reverse",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#0EA5E9", // Blue fill
    borderRadius: 4,
  },
  statsFooter: {
    fontSize: 12,
    color: "#52525B",
    textAlign: "right",
  },
});

const skeletonStyles = StyleSheet.create({
  label: {
    width: "30%",
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
    alignSelf: "flex-end",
  },
  input: {
    width: "100%",
    height: 48,
    borderRadius: 8,
  },
  button: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    marginTop: 16,
  },
});