import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  TextInput,
  Platform,
  FlatList,
  RefreshControl,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
  Alert,
  TouchableWithoutFeedback,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {
  Edit,
  Trash2,
  X,
  Search,
  Store as StoreIcon,
  Phone,
  MapPin,
  FileText,
  User as UserIcon,
  Plus,
} from "lucide-react-native";
import CustomAlert from "../components/CustomAlert";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDashboard } from "../Context/DashboardContext";

import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";

const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);
const { width } = Dimensions.get("window");

// Helper function from Reports Dashboard
const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const MaterialTopBar = ({ title }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { paddingTop: insets.top + 30 }]}>
      <Text style={styles.topBarTitle}>{title}</Text>
    </View>
  );
};

const StoresSkeleton = () => {
  const shimmerColors = ["#FDF1EC", "#FEF8F5", "#FDF1EC"];

  return (
    <View style={{ paddingHorizontal: 12, paddingTop: 10 }}>
      <ShimmerPlaceHolder
        style={styles.searchSkeleton}
        shimmerColors={shimmerColors}
      />
      <ShimmerPlaceHolder
        style={styles.cardSkeleton}
        shimmerColors={shimmerColors}
      />
      <ShimmerPlaceHolder
        style={styles.cardSkeleton}
        shimmerColors={shimmerColors}
      />
      <ShimmerPlaceHolder
        style={styles.cardSkeleton}
        shimmerColors={shimmerColors}
      />
    </View>
  );
};

interface Entity {
  intEntityCode: number;
  strEntityName: string;
  strEntityCode: string;
  strEntityDescription: string;
  strPhone: string;
  strAddress: string;
  strOwnerName: string;
  intCityCode: number;
  intParentEntityCode: number | null;
}

const StoreModal = ({ mode, store, visible, onClose, onSave, user }) => {
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  // Custom Alert states
  const [isAlertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertConfirmColor, setAlertConfirmColor] = useState('#E74C3C');

  useEffect(() => {
    if (visible) {
      setStoreName(mode === "edit" && store ? store.strEntityName : "");
      setDescription(
        mode === "edit" && store ? store.strEntityDescription : ""
      );
      setPhoneNumber(mode === "edit" && store ? store.strPhone : "");
      setAddress(mode === "edit" && store ? store.strAddress : "");
      setErrors({});
    }
  }, [visible, store, mode]);

  const validate = () => {
    const newErrors: any = {};
    if (!storeName) newErrors.storeName = "اسم المتجر مطلوب";
    if (!phoneNumber) newErrors.phoneNumber = "رقم الهاتف مطلوب";
    if (!address) newErrors.address = "العنوان مطلوب";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !user) return;
    setIsLoading(true);
    try {
      const payload = {
        EntityName: storeName,
        EntityDescription: description || storeName,
        MobileNumber: phoneNumber,
        Address: address,
        intParentEntityCode: user.userId,
        OwnerName: user.strEntityName,
        intCityCode: user.intCityCode,
      };

      const response =
        mode === "edit" && store
          ? await axios.post(
            "https://tanmia-group.com:84/courierApi/Entity/UpdateEntity",
            { ...payload, intEntityCode: store.intEntityCode }
          )
          : await axios.post(
            "https://tanmia-group.com:84/courierApi/Entity/AddEntity",
            payload
          );

      if (response.data && (response.data.success || response.data.Success)) {
        onSave();
      } else {
        setAlertTitle('خطأ');
        setAlertMessage(response.data.message || response.data.Message || "فشلت العملية.");
        setAlertConfirmColor('#E74C3C');
        setAlertVisible(true);
      }
    } catch (error) {
      console.error("Save store error:", error);
      setAlertTitle('خطأ في الاتصال');
      setAlertMessage('يرجى التحقق من اتصالك بالإنترنت.');
      setAlertConfirmColor('#E74C3C');
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {mode === "edit" ? "تحديث المتجر" : "إضافة متجر جديد"}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <X color="#9CA3AF" size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>اسم المتجر</Text>
              <TextInput
                style={[styles.input, errors.storeName && styles.errorInput]}
                value={storeName}
                onChangeText={setStoreName}
              />
              {errors.storeName && (
                <Text style={styles.errorText}>{errors.storeName}</Text>
              )}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>الوصف (اختياري)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>رقم الهاتف</Text>
              <TextInput
                style={[styles.input, errors.phoneNumber && styles.errorInput]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
              {errors.phoneNumber && (
                <Text style={styles.errorText}>{errors.phoneNumber}</Text>
              )}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>العنوان</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  errors.address && styles.errorInput,
                ]}
                value={address}
                onChangeText={setAddress}
                multiline
              />
              {errors.address && (
                <Text style={styles.errorText}>{errors.address}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {mode === "edit" ? "تحديث" : "إضافة"}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>

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
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Store Card with 2-column layout
const StoreCard = ({ item, onDelete, onEdit }) => (
  <View style={styles.modernTransactionItem}>
    <TouchableOpacity activeOpacity={0.8} onPress={() => onEdit(item)}>
      {/* Header */}
      <View style={styles.transactionHeader}>
        <View style={styles.storeHeaderContent}>
          <View style={styles.storeIconBackground}>
            <StoreIcon color="#fff" size={20} />
          </View>
          <View style={styles.storeNameContainer}>
            <Text style={styles.transactionDate} numberOfLines={1}>
              {item.strEntityName}
            </Text>
            <Text style={styles.runningTotalLabel}>{item.strEntityCode}</Text>
          </View>
        </View>
      </View>

      {/* 2 Column Details Section */}
      <View style={styles.storeDetailsRow}>
        {/* Left Column */}
        <View style={styles.storeColumn}>
          {item.strOwnerName && (
            <Text style={styles.transactionBranch}>{item.strOwnerName}</Text>
          )}

          <View style={styles.storeInfoRow}>
            <Phone size={14} color="#6B7280" />
            <Text style={styles.storeInfoText}>{item.strPhone}</Text>
          </View>
        </View>

        {/* Right Column */}
        <View style={styles.storeColumn}>
          <View style={styles.storeInfoRow}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.storeInfoText} numberOfLines={2}>
              {item.strAddress}
            </Text>
          </View>

          {item.strEntityDescription &&
            item.strEntityDescription !== item.strEntityName && (
              <Text style={styles.transactionRemarks} numberOfLines={2}>
                {item.strEntityDescription}
              </Text>
            )}
        </View>
      </View>

      {/* Footer Buttons */}
      <View style={styles.transactionFooter}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => onEdit(item)}
        >
          <Edit color="#27AE60" size={16} />
          <Text style={styles.editButtonText}>تعديل</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(item.intEntityCode, item.strEntityName)}
        >
          <Trash2 color="#E74C3C" size={16} />
          <Text style={styles.deleteButtonText}>حذف</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </View>
);


export default function StoresScreen() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allStores, setAllStores] = useState<Entity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedStore, setSelectedStore] = useState<Entity | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  // Custom Alert states
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertConfirmColor, setAlertConfirmColor] = useState('#FF6B35');

  const { user, setUser, setCurrentRoute } = useDashboard(); // Get the setter function

  useFocusEffect(
    React.useCallback(() => {
      // Announce that this is now the current route
      setCurrentRoute('StoresTab');
    }, [setCurrentRoute])
  );

  const loadData = useCallback(async () => {
    try {
      let parsedUser = user;
      if (!parsedUser) {
        const userDataString = await AsyncStorage.getItem("user");
        if (!userDataString) throw new Error("User not found");
        parsedUser = JSON.parse(userDataString);
        setUser(parsedUser);
      }
      const response = await axios.get(
        `https://tanmia-group.com:84/courierApi/Entity/GetEntities/${parsedUser.userId}`
      );
      setAllStores(response.data || []);
      await AsyncStorage.setItem(
        "user_entities",
        JSON.stringify(response.data || [])
      );
    } catch (error) {
      console.error("Failed to load stores:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, setUser]);

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  const filteredStores = useMemo(() => {
    if (!searchQuery) return allStores;
    return allStores.filter(
      (store) =>
        store.strEntityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.strEntityCode.includes(searchQuery)
    );
  }, [allStores, searchQuery]);

  const confirmDelete = async () => {
    if (!storeToDelete) return;
    setAlertVisible(false);
    try {
      const response = await axios.post(
        `https://tanmia-group.com:84/courierApi/Entity/DeleteEntity/${storeToDelete.id}`
      );
      if (response.data && response.data.Success) {
        setAllStores((prev) =>
          prev.filter((store) => store.intEntityCode !== storeToDelete.id)
        );
      } else {
        setAlertTitle('خطأ');
        setAlertMessage(response.data.Message || "فشل حذف المتجر.");
        setAlertConfirmColor('#E74C3C');
        setAlertVisible(true);
      }
    } catch (error) {
      setAlertTitle('خطأ في الاتصال');
      setAlertMessage('يرجى التحقق من اتصالك بالإنترنت.');
      setAlertConfirmColor('#E74C3C');
      setAlertVisible(true);
    }
    setStoreToDelete(null);
  };

  const handleCancelDelete = () => {
    setAlertVisible(false);
    setStoreToDelete(null);
  };

  const handleDeletePress = (id: number, name: string) => {
    setStoreToDelete({ id, name });
    setAlertTitle('تأكيد الحذف');
    setAlertMessage(`هل أنت متأكد أنك تريد حذف متجر "${name}"؟`);
    setAlertConfirmColor('#E74C3C');
    setAlertVisible(true);
  };

  const handleEditPress = (store: Entity) => {
    setModalMode("edit");
    setSelectedStore(store);
    setModalVisible(true);
  };

  const handleAddPress = () => {
    setModalMode("add");
    setSelectedStore(null);
    setModalVisible(true);
  };

  const handleSaveSuccess = () => {
    setModalVisible(false);
    setIsLoading(true);
    loadData();
  };

  const renderListHeaderComponent = () => (
    <View style={styles.modernFilterSection}>
      <Text style={styles.filterSectionTitle}>البحث في المتاجر</Text>
      <View style={styles.modernModalSearchContainer}>
        <Search
          color="#9CA3AF"
          size={20}
          style={styles.modalSearchIcon}
        />
        <TextInput
          style={styles.modernModalSearchInput}
          placeholder="ابحث بالاسم أو بالكود..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      {filteredStores.length > 0 && (
        <Text style={styles.sectionTitle}>
          المتاجر ({filteredStores.length})
        </Text>
      )}

      {/* Add Store Button - Header Action */}
      <TouchableOpacity
        style={styles.addStoreButton}
        onPress={handleAddPress}
        activeOpacity={0.8}
      >
        <Plus size={20} color="#FFF" />
        <Text style={styles.addStoreButtonText}>إضافة متجر جديد</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require("../assets/images/empty-reports.png")}
        style={styles.emptyImage}
      />
      <Text style={styles.emptyText}>
        {allStores.length === 0
          ? "لم تقم بإضافة متاجر بعد"
          : "لم يتم العثور على نتائج"}
      </Text>
      {allStores.length === 0 && (
        <Text style={styles.emptySubText}>
          استخدم الزر أعلاه لإضافة متجرك الأول
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <MaterialTopBar title="المتاجر" />

      <FlatList
        data={filteredStores}
        renderItem={({ item }) => (
          <StoreCard
            item={item}
            onDelete={handleDeletePress}
            onEdit={handleEditPress}
          />
        )}
        keyExtractor={(item) => item.intEntityCode.toString()}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
        ListHeaderComponent={!isLoading ? renderListHeaderComponent : null}
        ListEmptyComponent={!isLoading ? renderEmptyComponent : null}
        showsVerticalScrollIndicator={false}
      />

      {isLoading && <StoresSkeleton />}

      <StoreModal
        visible={modalVisible}
        mode={modalMode}
        onClose={() => setModalVisible(false)}
        store={selectedStore}
        onSave={handleSaveSuccess}
        user={user}
      />

      <CustomAlert
        isVisible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        confirmText={alertTitle === 'تأكيد الحذف' ? "حذف" : "حسنًا"}
        cancelText={alertTitle === 'تأكيد الحذف' ? "إلغاء" : ""}
        onConfirm={alertTitle === 'تأكيد الحذف' ? confirmDelete : () => setAlertVisible(false)}
        onCancel={alertTitle === 'تأكيد الحذف' ? handleCancelDelete : () => setAlertVisible(false)}
        confirmButtonColor={alertConfirmColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA" // Same as Reports Dashboard
  },
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#ffe0e0ff", // Same as Reports Dashboard
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937", // Same as Reports Dashboard
    textAlign: "center",
  },

  // Filter Section - Matching Reports Dashboard
  modernFilterSection: {
    backgroundColor: "#FFFFFF", // Same as Reports Dashboard
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937", // Same as Reports Dashboard
    marginBottom: 16,
    textAlign: "right",
  },
  modernModalSearchContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#F9FAFB", // Same as Reports Dashboard
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB", // Same as Reports Dashboard
  },
  modalSearchIcon: { marginLeft: 8 },
  modernModalSearchInput: {
    flex: 1,
    color: "#1F2937", // Same as Reports Dashboard
    fontSize: 16,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937", // Same as Reports Dashboard
    marginBottom: 0,
    textAlign: "right",
  },
  storeDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  storeColumn: {
    flex: 1,
    paddingHorizontal: 6,
  },
  // storeInfoRow: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   marginVertical: 2,
  // },
  // storeInfoText: {
  //   marginLeft: 6,
  //   fontSize: 13,
  //   color: "#374151",
  //   flexShrink: 1,
  // },

  // Modern Transaction Item - Same as Reports Dashboard
  modernTransactionItem: {
    backgroundColor: "#FFFFFF", // Same as Reports Dashboard
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6", // Same as Reports Dashboard
  },

  addStoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B35",
    paddingVertical: 14,
    marginTop: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5, // Android shadow
  },
  addStoreButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  }, transactionHeader: {
    marginBottom: 12,
  },
  storeHeaderContent: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  storeIconBackground: {
    width: 40,
    height: 40,
    backgroundColor: "#FF6B35", // Same as Reports Dashboard
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  storeNameContainer: {
    flex: 1,
  },
  transactionDate: {
    color: "#1F2937", // Same as Reports Dashboard
    fontSize: 16,
    fontWeight: "600",
    textAlign: "right",
    marginBottom: 2,
  },
  runningTotalLabel: {
    color: "#6B7280", // Same as Reports Dashboard
    fontSize: 12,
    textAlign: "right",
  },

  // Store Details Section
  storeDetailsSection: {
    marginBottom: 12,
  },
  transactionBranch: {
    color: "#374151", // Same as Reports Dashboard
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    textAlign: "right",
  },
  storeInfoRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  storeInfoText: {
    color: "#4B5563",
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
  transactionRemarks: {
    color: "#9CA3AF", // Same as Reports Dashboard
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "right",
    marginTop: 4,
  },

  // Transaction Footer - Adapted for action buttons
  transactionFooter: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6", // Same as Reports Dashboard
    paddingTop: 12,
    marginTop: 8,
    gap: 12,
  },
  editButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: hexToRgba("#27AE60", 0.1),
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  editButtonText: {
    color: "#27AE60",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: hexToRgba("#E74C3C", 0.1),
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "#E74C3C",
    fontSize: 14,
    fontWeight: "600",
  },

  // FAB
  fabContainer: {
    position: "absolute",
    right: 20,
    zIndex: 10
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF6B35", // Same as Reports Dashboard
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },

  // Empty State - Same as Reports Dashboard
  emptyContainer: {
    backgroundColor: "#FFFFFF", // Same as Reports Dashboard
    borderRadius: 8,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 20,
  },
  emptyImage: {
    width: 200,
    height: 120,
    marginBottom: 16,
    opacity: 0.7
  },
  emptyText: {
    color: "#374151", // Same as Reports Dashboard
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  emptySubText: {
    color: "#6B7280", // Same as Reports Dashboard
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  // Modal Styles - Same as Reports Dashboard
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Same as Reports Dashboard
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF", // Same as Reports Dashboard
    borderRadius: 8, // Same as Reports Dashboard
    width: "100%",
    maxHeight: "80%",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, // Same as Reports Dashboard
    shadowRadius: 8, // Same as Reports Dashboard
    elevation: 3, // Same as Reports Dashboard
  },
  modalHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#1F2937", // Same as Reports Dashboard
    fontSize: 20,
    fontWeight: "bold"
  },
  inputContainer: {
    marginBottom: 16
  },
  label: {
    color: "#6B7280", // Same as Reports Dashboard
    fontSize: 12,
    textAlign: "right",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB", // Same as Reports Dashboard
    color: "#1F2937", // Same as Reports Dashboard
    textAlign: "right",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB", // Same as Reports Dashboard
  },
  textArea: {
    height: 100,
    textAlignVertical: "top"
  },
  errorInput: {
    borderColor: "#EF4444"
  },
  button: {
    backgroundColor: "#FF6B35", // Same as Reports Dashboard
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600"
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },

  // Skeleton Styles
  searchSkeleton: {
    height: 50,
    borderRadius: 8,
    marginVertical: 10,
    marginHorizontal: 15,
  },
  cardSkeleton: {
    height: 200,
    width: "auto",
    borderRadius: 8,
    marginBottom: 12,
    marginHorizontal: 15,
  },
});