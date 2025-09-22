import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    SafeAreaView,
    TouchableWithoutFeedback,
    Alert,
    TextInput,
} from 'react-native';
import TopBar from '../../components/Entity/TopBar';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ChevronDown, Check, Search } from 'lucide-react-native';

interface CityPrice {
    strCityName: string;
    DcOfficePrice: number;
    DcInsideCityPrice: number;
    DcOutSkirtPrice: number;
}

export default function CityRatesScreen() {
    const [loading, setLoading] = useState(true);
    const [allPrices, setAllPrices] = useState<CityPrice[]>([]);
    const [filteredPrices, setFilteredPrices] = useState<CityPrice[]>([]);
    const [filterCities, setFilterCities] = useState<string[]>(['الكل']);
    const [selectedCity, setSelectedCity] = useState<string>('الكل');
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = useCallback(async () => {
        // ... (This logic is correct and unchanged)
        setLoading(true);
        try {
            const userData = await AsyncStorage.getItem('user');
            if (!userData) { setLoading(false); return; }
            const parsedUser = JSON.parse(userData);
            const userCityCode = parsedUser?.intCityCode;
            if (!userCityCode) { setLoading(false); return; }
            const response = await axios.get(`https://tanmia-group.com:84/courierApi/City/GetCityPrices/${userCityCode}`);
            const priceData: CityPrice[] = response.data || [];
            setAllPrices(priceData);
            setFilteredPrices(priceData);
            const cityNames = ['الكل', ...new Set(priceData.map(p => p.strCityName).filter(name => name))].sort();
            setFilterCities(cityNames);
        } catch (error) {
            console.error("Failed to fetch city prices:", error);
            Alert.alert('خطأ', 'فشل في جلب بيانات الأسعار.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const displayedCities = useMemo(() => {
        if (!searchQuery) { return filterCities; }
        return filterCities.filter(city => city.toLowerCase().includes(searchQuery.toLowerCase()) || city === 'الكل');
    }, [searchQuery, filterCities]);

    const handleFilterChange = (city: string) => {
        setSelectedCity(city);
        setModalVisible(false);
        setSearchQuery('');
        if (city === 'الكل') {
            setFilteredPrices(allPrices);
        } else {
            setFilteredPrices(allPrices.filter(p => p.strCityName === city));
        }
    };

    const renderPriceItem = ({ item }: { item: CityPrice }) => (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <Text style={[styles.cell, styles.cityCell]}>{item.strCityName}</Text>
                <Text style={styles.cell}>{item.DcOfficePrice?.toFixed(2) ?? 'N/A'}</Text>
                <Text style={styles.cell}>{item.DcInsideCityPrice?.toFixed(2) ?? 'N/A'}</Text>
                <Text style={styles.cell}>{item.DcOutSkirtPrice?.toFixed(2) ?? 'N/A'}</Text>
            </View>
        </View>
    );

    const ListHeader = () => (
        <View style={styles.headerRow}>
            <Text style={[styles.headerText, styles.cityCell]}>اسم المدينة</Text>
            <Text style={styles.headerText}>سعر المكتب</Text>
            <Text style={styles.headerText}>سعر داخل المدينة</Text>
            <Text style={styles.headerText}>سعر الضواحي</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#F97316" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TopBar />
            <View style={styles.filterContainer}>
                <TouchableOpacity style={styles.dropdown} onPress={() => { setSearchQuery(''); setModalVisible(true); }}>
                    <Text style={styles.dropdownLabel}>مدينة</Text>
                    <View style={styles.dropdownValueContainer}>
                        <Text style={styles.dropdownValue}>{selectedCity}</Text>
                        <ChevronDown color="#D1D5DB" size={20} />
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.listContainer}>
                <FlatList
                    data={filteredPrices}
                    renderItem={renderPriceItem}
                    keyExtractor={(item, index) => `${item.strCityName}-${index}`}
                    ListHeaderComponent={ListHeader}
                    ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>لا توجد بيانات أسعار لعرضها.</Text></View>}
                    contentContainerStyle={styles.listContent}
                />
            </View>

            <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <SafeAreaView style={styles.modalContent}>
                            <View style={styles.modalSearchContainer}>
                                <TextInput style={styles.modalSearchInput} placeholder="ابحث عن مدينة..." placeholderTextColor="#9CA3AF" value={searchQuery} onChangeText={setSearchQuery} />
                                <Search color="#9CA3AF" size={20} style={styles.modalSearchIcon} />
                            </View>
                            <FlatList
                                data={displayedCities}
                                keyExtractor={item => item}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.modalItem} onPress={() => handleFilterChange(item)}>
                                        <Text style={[styles.modalItemText, selectedCity === item && styles.modalItemSelected]}>{item}</Text>
                                        {selectedCity === item && <Check color="#F97316" size={20} />}
                                    </TouchableOpacity>
                                )}
                            />
                        </SafeAreaView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    filterContainer: { padding: 16, paddingBottom: 8 },
    dropdown: {
        backgroundColor: '#1F2937', // Dark dropdown background
        borderColor: '#4B5563',   // Dark border
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    // --- THIS IS THE FIX for filter text color ---
    dropdownLabel: { color: '#9CA3AF', fontSize: 14, marginRight: 10 },
    dropdownValueContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
    dropdownValue: { color: '#F3F4F6', fontSize: 16, fontWeight: '600' },
    // ---------------------------------------------
    listContainer: {
        marginHorizontal: 8,
        backgroundColor: '#1F2937',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#4B5563',
        marginBottom: 16, // <-- THIS IS THE FIX for table margin
    },
    headerRow: {
        flexDirection: 'row-reverse',
        backgroundColor: '#F97316',
        paddingVertical: 14,
        paddingHorizontal: 10,
    },
    headerText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
        flex: 1.5,
        textAlign: 'center',
    },
    card: {
        borderBottomWidth: 1,
        borderBottomColor: '#4B5563',
    },
    cardRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 10,
    },
    cell: {
        color: '#E5E7EB',
        fontSize: 14,
        flex: 1.5,
        textAlign: 'center',
    },
    cityCell: {
        flex: 2,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    listContent: { paddingBottom: 0 },
    emptyContainer: {
        paddingVertical: 50,
        alignItems: 'center',
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 16,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#374151', borderRadius: 12, width: '85%', maxHeight: '70%' },
    modalSearchContainer: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#4B5563', borderRadius: 8, margin: 10, paddingHorizontal: 10 },
    modalSearchInput: { flex: 1, color: '#E5E7EB', fontSize: 16, paddingVertical: 10, textAlign: 'right' },
    modalSearchIcon: { marginLeft: 8 },
    modalItem: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#4B5563', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
    modalItemText: { color: '#E5E7EB', fontSize: 16 },
    modalItemSelected: { color: '#F97316', fontWeight: 'bold' },
});