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
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import TopBar from "../../components/Entity/TopBarNew";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomAlert from "../../components/CustomAlert";

// --- Shimmer Placeholder Imports ---
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);



// --- Type Definitions ---
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
// New interface for DeliveryType
interface DeliveryType {
  Disabled: boolean;
  Group: any; // Can be null or specific type if known
  Selected: boolean;
  Text: string;
  Value: string;
}

const PAYMENT_METHODS = ["المرسل", "المستلم"];
const COUNTRY_CODE = "+218"; // Define the static country code

// --- Reusable UI Components ---
const FormInput = ({
  label,
  icon: Icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  editable = true,
  required = false,
  rightComponent = null, // Make rightComponent optional with a default value
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
      />
      {Icon && <Icon color="#A1A1AA" size={20} style={styles.leftIcon} />}
    </View>
  </View>
);
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
    onRequestClose={() => { }} // Handle closing via the overlay touch
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
              keyExtractor={(item) => item.Value || item} // Handle both object and string options
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
// --- Skeleton Component for Initial Loading ---
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
  const [recipientAddress, setRecipientAddress] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [productPrice, setProductPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);

  const [parcelTypes, setParcelTypes] = useState<ParcelType[]>([]);
  const [selectedParcelType, setSelectedParcelType] =
    useState<ParcelType | null>(null);
  const [isParcelTypeModalVisible, setParcelTypeModalVisible] = useState(false);

  const [deliveryTypes, setDeliveryTypes] = useState<DeliveryType[]>([]); // New state for delivery types
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<DeliveryType | null>(null); // New state for selected delivery type
  const [isDeliveryTypeModalVisible, setDeliveryTypeModalVisible] = useState(false); // New state for delivery type modal visibility


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
      success: config.success || false, // Default to false (error state)
    });
  };

  const handleAlertConfirm = () => {
    alertConfig.onConfirmAction();
    setAlertConfig((prev) => ({ ...prev, isVisible: false }));
  };

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
            "https://tanmia-group.com:84/courierApi/parcels/GetParcelTypes"
          ),
          axios.get(
            `https://tanmia-group.com:84/courierApi/Entity/GetEntities/${userId}`
          ),
          userCityCode
            ? axios.get(
              `https://tanmia-group.com:84/courierApi/City/GetCityPrices/${userCityCode}`
            )
            : Promise.resolve({ data: [] }),
          axios.get( // New API call for delivery types
            "https://tanmia-group.com:84/courierApi/parcels/GetDeliveryTypes"
          ),
        ]).then(([parcelTypesResponse, storesResponse, cityPricesResponse, deliveryTypesResponse]) => {
          if (parcelTypesResponse.data?.ParcelTypes)
            setParcelTypes(parcelTypesResponse.data.ParcelTypes);
          if (storesResponse.data) setStores(storesResponse.data);
          if (cityPricesResponse.data)
            setAllCityPrices(cityPricesResponse.data);
          if (deliveryTypesResponse.data?.DeliveryTypes) { // Handle delivery types
            setDeliveryTypes(deliveryTypesResponse.data.DeliveryTypes);
            // Optionally pre-select 'سريع' if it exists and there's no other default logic
            // Re-select 'سريع' if it was the default behavior
            const fastDelivery = deliveryTypes.find(dt => dt.Value === "سريع");
            if (fastDelivery) {
              setSelectedDeliveryType(fastDelivery);
            } if (fastDelivery) {
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
    () => (parseFloat(productPrice) || 0) * (parseInt(quantity, 10) || 0),
    [productPrice, quantity]
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
  const totalAmount = useMemo(
    () => productTotal + displayedShippingPrice,
    [productTotal, displayedShippingPrice]
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

  const handleSetParcelType = (parcelTypeObject: ParcelType) => { // <-- Change parameter type
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedParcelType(parcelTypeObject); // <-- Set the object directly
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

  const resetForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRecipientName("");
    setRecipientPhone("");
    setRecipientAddress("");
    setQuantity("1");
    setProductPrice("");
    setNotes("");
    setLength("");
    setWidth("");
    setHeight("");
    setPaymentMethod("");
    setSelectedParcelType(null);
    setSelectedDeliveryType(null); // Reset delivery type
    setSelectedStore(null);
    setSelectedCityData(null);
    setSelectedShippingType(null);
    setShippingPrice(0);
    setStoreSearchQuery("");
    setCitySearchQuery("");
    // Re-select 'سريع' if it was the default behavior
    const fastDelivery = deliveryTypes.find(dt => dt.Value === "سريع");
    if (fastDelivery) {
      setSelectedDeliveryType(fastDelivery);
    }
  };

  const handleSave = async () => {
    if (
      !recipientName.trim() ||
      !recipientPhone.trim() ||
      !recipientAddress.trim()
    )
      return showAlert({
        title: "حقول مطلوبة",
        message: "يرجى ملء جميع معلومات المستلم.",
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
    if (!(parseFloat(productPrice) > 0) || !(parseInt(quantity, 10) >= 0)) {
      return showAlert({
        title: "قيم غير صالحة",
        message: "يجب أن يكون سعر المنتج والكمية أكبر من صفر.",
      });
    }
    if (!paymentMethod)
      return showAlert({
        title: "حقول مطلوبة",
        message: "يرجى اختيار طريقة الدفع.",
      });
    if (!selectedDeliveryType && parseInt(quantity, 10) > 1) // New validation for delivery type
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

    // Construct the phone number with the static country code
    const fullRecipientPhone = COUNTRY_CODE + recipientPhone;

    const payload = {
      intSenderEntityCode: userId,
      strRecipientName: recipientName,
      strRecipientPhone: fullRecipientPhone, // Use the full phone number here
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
    };

    try {
      const response = await axios.post('https://tanmia-group.com:84/courierApi/parcels/saveparcel', payload);
      if (response.data && response.status === 200) {
        showAlert({
          title: 'نجاح',
          message: response.data.message || 'تم حفظ الطرد بنجاح!',
          confirmText: 'إضافة طرد جديد',
          onConfirm: resetForm,
          success: true, // --- Set success to true ---
        });
        // console.log('Parcel saved successfully:', response.data);
      } else {
        throw new Error(response.data?.message || 'فشل حفظ الطرد');
      }
    } catch (error) {
      console.error(
        "Save parcel error:",
        error.response?.data || error.message
      );
      showAlert({
        title: "خطأ في الحفظ",
        message: "فشل حفظ الطرد. يرجى المحاولة مرة أخرى.",
        success: false, // Explicitly set to false, though it's the default
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
            <FormInput
              label="اسم المستلم"
              icon={User}
              placeholder="أدخل اسم المستلم"
              value={recipientName}
              onChangeText={setRecipientName}
              editable={!isSaving}
              required
            />
            <FormInput
              label="هاتف المستلم"
              icon={Phone}
              placeholder="أدخل رقم الهاتف"
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              keyboardType="phone-pad"
              editable={!isSaving}
              required
              rightComponent={<Text style={styles.countryCodeText}>{COUNTRY_CODE}</Text>} // Pass the country code component
            />
            <FormInput
              label="عنوان المستلم"
              icon={MapPin}
              placeholder="أدخل العنوان بالتفصيل"
              value={recipientAddress}
              onChangeText={setRecipientAddress}
              editable={!isSaving}
              required
            />
            <FormPicker
              label="المتجر"
              icon={Store}
              value={selectedStore?.strEntityName}
              onPress={() => setStoreModalVisible(true)}
              placeholder="اختر المتجر"
              disabled={isSaving}
              required
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
            {/* Delivery Type Picker - Only show when quantity > 1 */}
            {/* Delivery Type Picker - Show when quantity >= 1 */}
            {parseInt(quantity, 10) > 1 && (
              <FormPicker
                label="نوع التسليم"
                icon={Package}
                value={selectedDeliveryType?.Text}
                onPress={() => setDeliveryTypeModalVisible(true)}
                placeholder="اختر نوع التسليم"
                disabled={isSaving}
                required={parseInt(quantity, 10) > 1} // true if >=1 else false
              />
            )}

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
        success={alertConfig.success} // --- Pass the success prop ---
        onCancel={undefined}
      />

      {/* Modals */}
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
        options={parcelTypes} // Pass full objects
        selectedValue={selectedParcelType} // <-- Change to pass the object
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
        options={deliveryTypes} // Pass the array of DeliveryType objects
        selectedValue={selectedDeliveryType} // Pass the selected DeliveryType object
        onSelect={handleSetDeliveryType} // Pass the handler
      />
    </View>
  );
}
// --- Stylesheet ---
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
});

// --- Styles for the Skeleton Loader ---
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
