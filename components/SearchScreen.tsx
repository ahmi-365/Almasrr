// src/screens/SearchScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Dimensions,
    SafeAreaView,
    Keyboard,
    Platform,
    Animated,
    Easing,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
    Search,
    X,
    Package,
    MapPin,
    User,
    DollarSign,
} from 'lucide-react-native';

const { height: screenHeight } = Dimensions.get('window');

// Constants and Types
const COLORS = {
    primary: '#FF6B35',
    secondary: '#E67E22',
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#343A40',
    textSecondary: '#6C757D',
    border: '#E9ECEF',
    success: '#27AE60',
    warning: '#F39C12',
    danger: '#E74C3C',
    info: '#3498DB'
};

const STATUS_CONFIG = {
    'غير مؤكد': { color: COLORS.warning },
    'في الفرع': { color: COLORS.info },
    'في الطريق إلى الفرع الوجهة': { color: COLORS.secondary },
    'في الطريق': { color: COLORS.secondary },
    'تم التسليم للمستلم': { color: COLORS.success },
    'مرتجع': { color: COLORS.danger },
    'في الطريق للرجوع': { color: COLORS.danger },
    'تم إعادة تسليم الطرد إلى المتجر': { color: COLORS.danger },
    'راجع في المخزن': { color: COLORS.danger },
    'جارٍ تسليم الطرد إلى عميل جديد': { color: COLORS.info },
    'مؤكد': { color: '#2ECC71' },
};

interface Parcel {
    intParcelCode: number;
    dcFee: number;
    ReferenceNo: string;
    CityName: string;
    StatusName: string;
    TypeName: string;
    RecipientName: string;
    RecipientPhone: string;
    Quantity: number;
    CreatedAt: string;
    Remarks: string;
    Total: number;
    intStatusCode: number;
    strDriverRemarks: string;
}

const SearchScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { allParcels } = (route.params as { allParcels: Parcel[] }) || { allParcels: [] };

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredResults, setFilteredResults] = useState<Parcel[]>([]);
    const searchInputRef = useRef<TextInput>(null);
    const slideAnim = useRef(new Animated.Value(screenHeight)).current; // Start off-screen

    useEffect(() => {
        // Animate content sliding IN from the bottom
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.poly(4)),
            useNativeDriver: true,
        }).start();

        setTimeout(() => searchInputRef.current?.focus(), 400); // Focus after animation
    }, []);

    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase().trim();
            const results = allParcels.filter(parcel =>
                Object.values(parcel).some(value =>
                    value?.toString().toLowerCase().includes(query)
                )
            );
            setFilteredResults(results);
        } else {
            setFilteredResults([]);
        }
    }, [searchQuery, allParcels]);

    const handleParcelSelect = (parcel: Parcel) => {
        console.log(parcel)
        handleClose(() => {
            navigation.navigate('ParcelDetailsScreen' as never, { parcel } as never);
        });
    };

    // Animate content sliding OUT then navigate back
    const handleClose = (callback?: () => void) => {
        Keyboard.dismiss();
        Animated.timing(slideAnim, {
            toValue: screenHeight,
            duration: 300,
            easing: Easing.in(Easing.poly(4)),
            useNativeDriver: true,
        }).start(() => {
            navigation.goBack();
            if (callback) callback();
        });
    };

    const formatCurrency = (amount: number) => {
        return `${parseFloat(amount?.toString() || '0').toFixed(2)} د.ل`;
    };

    const SearchResultItem = ({ item }: { item: Parcel }) => {
        const statusConfig = STATUS_CONFIG[item.StatusName] || STATUS_CONFIG['غير مؤكد'];
        return (
            <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => handleParcelSelect(item)}
                activeOpacity={0.7}
            >
                <View style={styles.resultItemHeader}>
                    <View style={styles.parcelIdContainer}>
                        <Package size={16} color={COLORS.primary} />
                        <Text style={styles.parcelId}>#{item.intParcelCode}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                        <Text style={styles.statusText}>{item.StatusName}</Text>
                    </View>
                </View>
                <View style={styles.resultItemBody}>
                    <View style={styles.infoRow}>
                        <MapPin size={14} color={COLORS.textSecondary} />
                        <Text style={styles.cityText}>{item.CityName}</Text>
                    </View>
                    {item.RecipientName && (
                        <View style={styles.infoRow}>
                            <User size={14} color={COLORS.textSecondary} />
                            <Text style={styles.recipientText}>{item.RecipientName}</Text>
                        </View>
                    )}
                    <View style={styles.financialRow}>
                        <Text style={styles.amountText}>{formatCurrency(item.Total)}</Text>
                        <Text style={styles.referenceText}>{item.ReferenceNo}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.fullScreenContainer}>
            <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.header}>
                    <Text style={styles.title}>ابحث عن شحنتك</Text>
                    <TouchableOpacity onPress={() => handleClose()} style={styles.closeButton}>
                        <X size={28} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchInputWrapper}>
                    <Search size={20} color={COLORS.primary} />
                    <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder="ابحث برقم الطرد، اسم المستلم..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={COLORS.textSecondary}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                <FlatList
                    data={filteredResults}
                    renderItem={SearchResultItem}
                    keyExtractor={item => item.intParcelCode.toString()}
                    style={styles.resultsList}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    onScrollBeginDrag={Keyboard.dismiss}
                    showsVerticalScrollIndicator={false}
                />
            </Animated.View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    modalContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 40
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    closeButton: {
        padding: 4,
    },
    searchInputWrapper: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 14 : 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        textAlign: 'right',
        padding: 0,
        marginHorizontal: 10,
    },
    resultsList: {
        flex: 1,
    },
    searchResultItem: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    resultItemHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    parcelIdContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
    },
    parcelId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    resultItemBody: {
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
    },
    cityText: {
        fontSize: 14,
        color: COLORS.text,
    },
    recipientText: {
        fontSize: 14,
        color: COLORS.text,
    },
    financialRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    amountText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    referenceText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
});

export default SearchScreen;