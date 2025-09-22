import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  // REMOVED: LayoutAnimation, Animated, Easing
  Dimensions,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Edit, Trash2, X, Search, Plus, Store as StoreIcon, Phone, MapPin, FileText, User as UserIcon } from 'lucide-react-native';
import CustomAlert from '../components/CustomAlert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// REMOVED: Svg, Path

import { useDashboard } from '../Context/DashboardContext';

import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);
const { width } = Dimensions.get('window');

const MaterialTopBar = ({ title }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { paddingTop: insets.top + 30 }]}>
      <Text style={styles.topBarTitle}>{title}</Text>
    </View>
  );
};

// --- REMOVED: AnimatedMultiWaveBackground component ---

const StoresSkeleton = () => {
  const shimmerColors = ['#FDF1EC', '#FEF8F5', '#FDF1EC'];

  return (
    <View style={{ paddingHorizontal: 15, paddingTop: 10 }}>
      <ShimmerPlaceHolder style={styles.searchSkeleton} shimmerColors={shimmerColors} />
      <ShimmerPlaceHolder style={styles.cardSkeleton} shimmerColors={shimmerColors} />
      <ShimmerPlaceHolder style={styles.cardSkeleton} shimmerColors={shimmerColors} />
      <ShimmerPlaceHolder style={styles.cardSkeleton} shimmerColors={shimmerColors} />
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
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (visible) {
      setStoreName(mode === 'edit' && store ? store.strEntityName : '');
      setDescription(mode === 'edit' && store ? store.strEntityDescription : '');
      setPhoneNumber(mode === 'edit' && store ? store.strPhone : '');
      setAddress(mode === 'edit' && store ? store.strAddress : '');
      setErrors({});
    }
  }, [visible, store, mode]);

  const validate = () => {
    const newErrors: any = {};
    if (!storeName) newErrors.storeName = 'اسم المتجر مطلوب';
    if (!phoneNumber) newErrors.phoneNumber = 'رقم الهاتف مطلوب';
    if (!address) newErrors.address = 'العنوان مطلوب';
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

      const response = mode === 'edit' && store
        ? await axios.post('https://tanmia-group.com:84/courierApi/Entity/UpdateEntity', { ...payload, intEntityCode: store.intEntityCode })
        : await axios.post('https://tanmia-group.com:84/courierApi/Entity/AddEntity', payload);

      if (response.data && (response.data.success || response.data.Success)) {
        onSave();
      } else {
        Alert.alert('خطأ', response.data.message || response.data.Message || 'فشلت العملية.');
      }
    } catch (error) {
      console.error('Save store error:', error);
      Alert.alert('خطأ في الاتصال', 'يرجى التحقق من اتصالك بالإنترنت.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}><View style={StyleSheet.absoluteFillObject} /></TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{mode === 'edit' ? 'تحديث المتجر' : 'إضافة متجر جديد'}</Text>
              <TouchableOpacity onPress={onClose}><X color="#9CA3AF" size={24} /></TouchableOpacity>
            </View>
            <View style={styles.inputContainer}><Text style={styles.label}>اسم المتجر</Text><TextInput style={[styles.input, errors.storeName && styles.errorInput]} value={storeName} onChangeText={setStoreName} />{errors.storeName && <Text style={styles.errorText}>{errors.storeName}</Text>}</View>
            <View style={styles.inputContainer}><Text style={styles.label}>الوصف (اختياري)</Text><TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline /></View>
            <View style={styles.inputContainer}><Text style={styles.label}>رقم الهاتف</Text><TextInput style={[styles.input, errors.phoneNumber && styles.errorInput]} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />{errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}</View>
            <View style={styles.inputContainer}><Text style={styles.label}>العنوان</Text><TextInput style={[styles.input, styles.textArea, errors.address && styles.errorInput]} value={address} onChangeText={setAddress} multiline />{errors.address && <Text style={styles.errorText}>{errors.address}</Text>}</View>
            <TouchableOpacity style={styles.button} onPress={handleSave} disabled={isLoading}>{isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{mode === 'edit' ? 'تحديث' : 'إضافة'}</Text>}</TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// --- SIMPLIFIED: No background animation needed ---
const StoreCard = ({ item, onDelete, onEdit }) => (
  <View style={styles.card}>
    <TouchableOpacity activeOpacity={0.8} onPress={() => onEdit(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}><View style={styles.cardIconContainer}><StoreIcon color="#FF6B35" size={22} /></View><Text style={styles.storeName} numberOfLines={1}>{item.strEntityName}</Text></View>
        <View style={styles.codeBadge}><Text style={styles.codeText}>{item.strEntityCode}</Text></View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.detailRow}><UserIcon size={14} color="#718096" /><Text style={styles.detailText}>{item.strOwnerName}</Text></View>
        <View style={styles.detailRow}><Phone size={14} color="#718096" /><Text style={styles.detailText}>{item.strPhone}</Text></View>
        <View style={styles.detailRow}><MapPin size={14} color="#718096" /><Text style={styles.detailText} numberOfLines={1}>{item.strAddress}</Text></View>
        {item.strEntityDescription && item.strEntityDescription !== item.strEntityName && (<View style={styles.detailRow}><FileText size={14} color="#718096" /><Text style={styles.detailText} numberOfLines={1}>{item.strEntityDescription}</Text></View>)}
      </View>
    </TouchableOpacity>
    <View style={styles.cardActions}>
      <TouchableOpacity style={styles.actionButtonEdit} onPress={() => onEdit(item)}><Edit color="#3498DB" size={16} /><Text style={[styles.actionButtonText, { color: '#3498DB' }]}>تعديل</Text></TouchableOpacity>
      <TouchableOpacity style={styles.actionButtonDelete} onPress={() => onDelete(item.intEntityCode, item.strEntityName)}><Trash2 color="#E74C3C" size={16} /><Text style={[styles.actionButtonText, { color: '#E74C3C' }]}>حذف</Text></TouchableOpacity>
    </View>
  </View>
);

export default function StoresScreen() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allStores, setAllStores] = useState<Entity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedStore, setSelectedStore] = useState<Entity | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<{ id: number, name: string } | null>(null);

  // --- REMOVED: fabAnim ref is no longer needed ---

  const { user, setUser } = useDashboard();

  const loadData = useCallback(async () => {
    try {
      let parsedUser = user;
      if (!parsedUser) {
        const userDataString = await AsyncStorage.getItem('user');
        if (!userDataString) throw new Error("User not found");
        parsedUser = JSON.parse(userDataString);
        setUser(parsedUser);
      }
      const response = await axios.get(`https://tanmia-group.com:84/courierApi/Entity/GetEntities/${parsedUser.userId}`);
      setAllStores(response.data || []);
      await AsyncStorage.setItem('user_entities', JSON.stringify(response.data || []));
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
    return allStores.filter(store =>
      store.strEntityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.strEntityCode.includes(searchQuery)
    );
  }, [allStores, searchQuery]);

  const confirmDelete = async () => {
    if (!storeToDelete) return;
    setAlertVisible(false);
    try {
      const response = await axios.post(`https://tanmia-group.com:84/courierApi/Entity/DeleteEntity/${storeToDelete.id}`);
      if (response.data && response.data.Success) {
        setAllStores(prev => prev.filter(store => store.intEntityCode !== storeToDelete.id));
      } else {
        Alert.alert('خطأ', response.data.Message || 'فشل حذف المتجر.');
      }
    } catch (error) {
      Alert.alert('خطأ في الاتصال', 'يرجى التحقق من اتصالك بالإنترنت.');
    }
    setStoreToDelete(null);
  };

  const handleCancelDelete = () => {
    setAlertVisible(false);
    setStoreToDelete(null);
  };

  const handleDeletePress = (id: number, name: string) => {
    setStoreToDelete({ id, name });
    setAlertVisible(true);
  };

  const handleEditPress = (store: Entity) => {
    setModalMode('edit');
    setSelectedStore(store);
    setModalVisible(true);
  };

  const handleAddPress = () => {
    setModalMode('add');
    setSelectedStore(null);
    setModalVisible(true);
  };

  const handleSaveSuccess = () => {
    setModalVisible(false);
    setIsLoading(true);
    loadData();
  };

  return (
    <View style={styles.container}>
      <MaterialTopBar title="المتاجر" />

      {isLoading && !isRefreshing ? (
        <StoresSkeleton />
      ) : (
        <FlatList
          data={filteredStores}
          renderItem={({ item }) => <StoreCard item={item} onDelete={handleDeletePress} onEdit={handleEditPress} />}
          keyExtractor={item => item.intEntityCode.toString()}
          contentContainerStyle={styles.listContent}
          onRefresh={onRefresh}
          refreshing={isRefreshing}
          ListHeaderComponent={
            <View style={styles.searchContainer}>
              <TextInput style={styles.searchInput} placeholder="ابحث بالاسم أو بالكود..." placeholderTextColor="#9CA3AF" value={searchQuery} onChangeText={setSearchQuery} />
              <Search color="#9CA3AF" size={20} style={styles.searchIcon} />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Image source={require('../assets/images/empty-reports.png')} style={styles.emptyImage} />
              <Text style={styles.emptyText}>{allStores.length === 0 ? "لم تقم بإضافة متاجر بعد" : "لم يتم العثور على نتائج"}</Text>
              {allStores.length === 0 && <Text style={styles.emptySubText}>انقر على زر + لإضافة متجرك الأول</Text>}
            </View>
          }
        />
      )}

      {/* --- SIMPLIFIED: FAB is no longer animated --- */}
      {!isLoading && (
        <View style={[styles.fabContainer, { bottom: insets.bottom > 20 ? insets.bottom + 10 : 80 }]}>
          <TouchableOpacity style={styles.fab} onPress={handleAddPress}>
            <Plus color="#FFF" size={28} />
          </TouchableOpacity>
        </View>
      )}

      <StoreModal visible={modalVisible} mode={modalMode} onClose={() => setModalVisible(false)} store={selectedStore} onSave={handleSaveSuccess} user={user} />

      <CustomAlert
        isVisible={alertVisible}
        title="تأكيد الحذف"
        message={`هل أنت متأكد أنك تريد حذف متجر "${storeToDelete?.name}"؟`}
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={confirmDelete}
        onCancel={handleCancelDelete}
        confirmButtonColor="#E74C3C"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  topBar: { paddingHorizontal: 20, paddingBottom: 12, backgroundColor: '#F8F9FA' },
  topBarTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' },
  searchContainer: { paddingHorizontal: 15, paddingVertical: 10 },
  searchInput: { backgroundColor: '#FFFFFF', color: '#1F2937', borderRadius: 8, paddingHorizontal: 15, paddingRight: 45, paddingVertical: Platform.OS === 'ios' ? 14 : 10, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB', textAlign: 'right' },
  searchIcon: { position: 'absolute', left: 30, top: 24 },
  listContent: { paddingBottom: 100, paddingTop: 5 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden', shadowColor: '#D3B4A3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, marginHorizontal: 15, marginBottom: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#FDEFE7' },
  cardTitleContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, flexShrink: 1 },
  cardIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF6B351A', justifyContent: 'center', alignItems: 'center' },
  storeName: { color: '#1F2937', fontSize: 18, fontWeight: 'bold', flexShrink: 1, textAlign: 'right' },
  codeBadge: { backgroundColor: '#F3F4F6', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
  codeText: { color: '#4B5563', fontSize: 12, fontWeight: '600' },
  cardBody: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 12 },
  detailRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  detailText: { color: '#4B5563', fontSize: 14, flex: 1, textAlign: 'right' },
  cardActions: { flexDirection: 'row-reverse', marginTop: 12, borderTopWidth: 1, borderTopColor: '#FDEFE7' },
  actionButtonEdit: { flex: 1, padding: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 8, borderRightWidth: 1, borderRightColor: '#FDEFE7' },
  actionButtonDelete: { flex: 1, padding: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 8 },
  actionButtonText: { fontWeight: '600', fontSize: 14 },
  fabContainer: { position: 'absolute', right: 20, zIndex: 10 },
  fab: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: '20%' },
  emptyImage: { width: 120, height: 120, marginBottom: 16, opacity: 0.7 },
  emptyText: { color: '#374151', fontSize: 18, fontWeight: '600', textAlign: 'center' },
  emptySubText: { color: '#6B7280', fontSize: 14, marginTop: 8, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxHeight: '80%', backgroundColor: '#FFFFFF', borderRadius: 8, padding: 20 },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { color: '#1F2937', fontSize: 20, fontWeight: 'bold' },
  inputContainer: { marginBottom: 15 },
  label: { color: '#6B7280', fontSize: 14, textAlign: 'right', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', color: '#1F2937', textAlign: 'right', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  textArea: { height: 100, textAlignVertical: 'top' },
  errorInput: { borderColor: '#EF4444' },
  button: { backgroundColor: '#FF6B35', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  errorText: { color: '#EF4444', fontSize: 12, textAlign: 'right', marginTop: 4 },
  searchSkeleton: { height: 50, borderRadius: 8, marginVertical: 10, marginHorizontal: 15 },
  cardSkeleton: { height: 250, width: 'auto', borderRadius: 8, marginBottom: 16, marginHorizontal: 15 },
});