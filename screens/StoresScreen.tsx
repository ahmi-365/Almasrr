import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import TopBar from '../components/Entity/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Edit, Trash2, X, Search, Plus } from 'lucide-react-native';
import axios from 'axios';

// Interface for the store/entity object
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

// Reusable Modal for both Adding and Editing
const StoreModal = ({ mode, store, visible, onClose, onSave, user }) => {
  // if (!visible) return null;

  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (visible) {
      setStoreName(mode === 'edit' ? store.strEntityName : '');
      setDescription(mode === 'edit' ? store.strEntityDescription : '');
      setPhoneNumber(mode === 'edit' ? store.strPhone : '');
      setAddress(mode === 'edit' ? store.strAddress : '');
      setErrors({});
    }
  }, [visible, store, mode]);

  const validate = () => {
    const newErrors: any = {};
    if (!storeName) newErrors.storeName = 'اسم المتجر مطلوب';
    if (!description) newErrors.description = 'الوصف مطلوب';
    if (!phoneNumber) newErrors.phoneNumber = 'رقم الهاتف مطلوب';
    if (!address) newErrors.address = 'العنوان مطلوب';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      let response;
      const payload = {
        EntityName: storeName,
        EntityDescription: description,
        MobileNumber: phoneNumber,
        Address: address,
        intParentEntityCode: user.userId,
        OwnerName: user.strEntityName,
        intCityCode: user.intCityCode,
      };

      if (mode === 'edit') {
        response = await axios.post('https://tanmia-group.com:84/courierApi/Entity/UpdateEntity', {
          ...payload,
          intEntityCode: store.intEntityCode,
        });
      } else {
        response = await axios.post('https://tanmia-group.com:84/courierApi/Entity/AddEntity', payload);
      }

      // The API response for AddEntity has a lowercase `success`
      // The API response for UpdateEntity seems to have an uppercase `Success`, let's check for both
      if (response.data && (response.data.success || response.data.Success)) {
        Alert.alert('نجاح', mode === 'edit' ? 'تم تحديث المتجر بنجاح.' : 'تمت إضافة المتجر بنجاح.');
        onSave(); // This will trigger the modal close and data refresh
      } else {
        Alert.alert('خطأ', response.data.message || response.data.Message || (mode === 'edit' ? 'فشل تحديث المتجر.' : 'فشلت إضافة المتجر.'));
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
        <View style={styles.modalContent}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{mode === 'edit' ? 'تحديث المتجر' : 'إضافة متجر جديد'}</Text>
              <TouchableOpacity onPress={onClose}><X color="#9CA3AF" size={24} /></TouchableOpacity>
            </View>
            <Text style={styles.modalSubTitle}>أدخل تفاصيل المتجر المطلوبة.</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>اسم المتجر</Text>
              <TextInput style={styles.input} value={storeName} onChangeText={setStoreName} />
              {errors.storeName && <Text style={styles.errorText}>{errors.storeName}</Text>}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>الوصف</Text>
              <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>رقم الهاتف</Text>
              <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>العنوان</Text>
              <TextInput style={[styles.input, styles.textArea]} value={address} onChangeText={setAddress} multiline />
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>
            <TouchableOpacity style={styles.button} onPress={handleSave} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{mode === 'edit' ? 'تحديث' : 'إضافة'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const StoreCard = ({ item, onDelete, onEdit }: { item: Entity, onDelete: (id: number, name: string) => void, onEdit: (store: Entity) => void }) => {
  const handleDeletePress = () => {
    Alert.alert("تأكيد الحذف", `هل أنت متأكد من أنك تريد حذف "${item.strEntityName}"؟`, [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => onDelete(item.intEntityCode, item.strEntityName) }
    ]);
  };
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}><Text style={styles.storeName}>{item.strEntityName}</Text><View style={styles.codeBadge}><Text style={styles.codeText}>{item.strEntityCode}</Text></View></View>
      <View style={styles.cardBody}><Text style={styles.detailRow}><Text style={styles.detailLabel}>اسم المالك: </Text>{item.strOwnerName}</Text><Text style={styles.detailRow}><Text style={styles.detailLabel}>رقم هاتف: </Text>{item.strPhone}</Text><Text style={styles.detailRow}><Text style={styles.detailLabel}>العنوان: </Text>{item.strAddress}</Text><Text style={styles.detailRow}><Text style={styles.detailLabel}>الوصف: </Text>{item.strEntityDescription}</Text></View>
      <View style={styles.cardActions}><TouchableOpacity style={styles.actionButton} onPress={handleDeletePress}><Trash2 color="#E74C3C" size={20} /></TouchableOpacity><TouchableOpacity style={styles.actionButton} onPress={() => onEdit(item)}><Edit color="#3498DB" size={20} /></TouchableOpacity></View>
    </View>
  );
};

export default function StoresScreen() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null); // State to hold the main user object
  const [allStores, setAllStores] = useState<Entity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedStore, setSelectedStore] = useState<Entity | null>(null);

  // The useCallback dependency array was empty, which means loadData was created only once
  // with the initial state values. It needs to be updated when dependencies change.
  // However, for this function, we don't have external dependencies that change,
  // so an empty array is fine, but it's good practice to be mindful of this.
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setIsRefreshing(true); // Show refresh indicator only on explicit refresh
    }
    try {
      // Ensure user is loaded first.
      let parsedUser = user;
      if (!parsedUser) {
        const userDataString = await AsyncStorage.getItem('user');
        if (!userDataString) { throw new Error("User not found"); }
        parsedUser = JSON.parse(userDataString);
        setUser(parsedUser);
      }

      const response = await axios.get(`https://tanmia-group.com:84/courierApi/Entity/GetEntities/${parsedUser.userId}`);
      const entities = response.data || [];
      setAllStores(entities);
      await AsyncStorage.setItem('user_entities', JSON.stringify(entities));
    } catch (error) {
      console.error("Failed to load stores:", error);
      Alert.alert('خطأ', 'فشل في تحديث قائمة المتاجر.');
    } finally {
      if (!isSilent) {
        setInitialLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [user]); // Add user as a dependency

  useEffect(() => {
    // We load the user and initial data once when the component mounts.
    const bootstrap = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('user');
        if (!userDataString) { throw new Error("User not found"); }
        const parsedUser = JSON.parse(userDataString);
        setUser(parsedUser); // Save the main user object to state

        const response = await axios.get(`https://tanmia-group.com:84/courierApi/Entity/GetEntities/${parsedUser.userId}`);
        const entities = response.data || [];
        setAllStores(entities);
        await AsyncStorage.setItem('user_entities', JSON.stringify(entities));
      } catch (error) {
        console.error("Failed to load initial data:", error);
        // Handle error appropriately, maybe show a retry screen
      } finally {
        setInitialLoading(false);
      }
    };

    bootstrap();
  }, []); // Empty dependency array means this runs only once on mount

  const onRefresh = useCallback(() => { loadData(); }, [loadData]);

  const filteredStores = useMemo(() => {
    if (!searchQuery) return allStores;
    return allStores.filter(store =>
      store.strEntityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.strEntityCode.includes(searchQuery)
    );
  }, [allStores, searchQuery]);

  const handleDeleteStore = useCallback(async (entityCode: number, name: string) => {
    try {
      const response = await axios.post(`https://tanmia-group.com:84/courierApi/Entity/DeleteEntity/${entityCode}`);
      // The API response for delete has a capital 'S' in Success and 'M' in Message
      if (response.data && response.data.Success) {
        Alert.alert('نجاح', `تم حذف "${name}" بنجاح.`);
        // To update the list in real-time, we can filter out the deleted item from the current state
        // This provides a faster UI update than re-fetching everything.
        setAllStores(prevStores => prevStores.filter(store => store.intEntityCode !== entityCode));
      } else {
        Alert.alert('خطأ', response.data.Message || 'فشل حذف المتجر.');
      }
    } catch (error) {
      console.error("Delete store error:", error);
      Alert.alert('خطأ في الاتصال', 'يرجى التحقق من اتصالك بالإنترنت.');
    }
  }, []); // No need to depend on loadData here

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

  // This is the key function that was missing the logic.
  // It should close the modal and then trigger a data refresh.
  const handleSaveSuccess = () => {
    setModalVisible(false); // <-- This will close the modal
    loadData(true); // <-- This will re-fetch the data silently in the background
  };


  if (initialLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <TopBar title="المتاجر" />
        <ActivityIndicator size="large" color="#F97316" style={{ flex: 1 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar title="المتاجر" />
      <View style={styles.headerContainer}>
        <View style={styles.searchContainer}>
          <TextInput style={styles.searchInput} placeholder="ابحث بالاسم أو بالكود..." placeholderTextColor="#9CA3AF" value={searchQuery} onChangeText={setSearchQuery} />
          <Search color="#9CA3AF" size={20} style={styles.searchIcon} />
        </View>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
        <Plus color="#FFF" size={20} />
        <Text style={styles.addButtonText}>إضافة متجر جديد</Text>
      </TouchableOpacity>

      {/* The FlatList was being hidden when the modal was visible, which is not necessary and can cause flashes */}
      <FlatList
        data={filteredStores}
        renderItem={({ item }) => <StoreCard item={item} onDelete={handleDeleteStore} onEdit={handleEditPress} />}
        keyExtractor={item => item.intEntityCode.toString()}
        contentContainerStyle={styles.listContent}
        onRefresh={onRefresh}
        refreshing={isRefreshing}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {allStores.length === 0 ? "لا توجد متاجر لعرضها." : "لم يتم العثور على نتائج."}
            </Text>
          </View>
        }
      />

      {/* The modal is rendered on top of the list, so we don't need to conditionally render the list */}
      <StoreModal
        visible={modalVisible}
        mode={modalMode}
        onClose={() => setModalVisible(false)}
        store={selectedStore}
        onSave={handleSaveSuccess} // This is the prop that will be called on successful save
        user={user}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  searchContainer: { position: 'relative' },
  searchInput: { backgroundColor: '#F8F9FA', color: '#000', borderRadius: 12, paddingHorizontal: 15, paddingRight: 45, paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: '#4B5563', textAlign: 'right' },
  searchIcon: { position: 'absolute', left: 15, top: 15 },
  addButton: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F97316', paddingVertical: 14, borderRadius: 12, gap: 8, marginHorizontal: 16, marginTop: 12, marginBottom: 12 },
  addButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  listContent: { padding: 16, paddingTop: 10, paddingBottom: 100 },
  card: { backgroundColor: '#374151', borderRadius: 12, marginBottom: 12, marginTop: 12, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#4B5563', padding: 12 },
  storeName: { color: '#F3F4F6', fontSize: 18, fontWeight: 'bold' },
  codeBadge: { backgroundColor: '#F97316', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  codeText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  cardBody: { padding: 16 },
  detailRow: { color: '#D1D5DB', fontSize: 15, textAlign: 'right', marginBottom: 10 },
  detailLabel: { color: '#9CA3AF' },
  cardActions: { flexDirection: 'row-reverse', borderTopWidth: 1, borderTopColor: '#4B5563' },
  actionButton: { flex: 1, padding: 12, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: '30%' },
  emptyText: { color: '#9CA3AF', fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxHeight: '80%', backgroundColor: '#1F2937', borderRadius: 12, padding: 20 },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  modalSubTitle: { color: '#E5E7EB', fontSize: 16, textAlign: 'right', marginBottom: 25 },
  inputContainer: { marginBottom: 15 },
  label: { color: '#9CA3AF', fontSize: 14, textAlign: 'right', marginBottom: 8 },
  input: { backgroundColor: '#374151', color: '#FFF', textAlign: 'right', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: '#4B5563' },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: { backgroundColor: '#F97316', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  errorText: { color: '#EF4444', fontSize: 12, textAlign: 'right', marginTop: 4 },
});