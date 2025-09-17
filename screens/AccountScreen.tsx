import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import TopBar from '../components/Entity/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User as UserIcon, Phone, MapPin } from 'lucide-react-native';

interface UserProfile {
  strEntityName: string;
  roleName: string;
  strEntityPhone: string;
  strEntityAddress: string;
  vbrPicture: string | null;
}

const InfoRow = ({ icon: Icon, label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoValue}>{value || 'غير محدد'}</Text>
    <View style={styles.infoLabelContainer}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Icon color="#7F8C8D" size={20} style={styles.infoIcon} />
    </View>
  </View>
);

export default function AccountScreen() {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('user');
        if (userDataString) {
          setUser(JSON.parse(userDataString));
        }
      } catch (error) {
        console.error("Failed to load user data for profile screen:", error);
      }
    };
    loadUserData();
  }, []);

  const getRoleInArabic = (role: string | undefined) => {
    if (role === 'Entity') return 'تاجر';
    if (role === 'Driver') return 'سائق';
    return role || '...';
  };

  return (
    <View style={styles.container}>
      <TopBar title="حسابي" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.vbrPicture ? (
              <Image source={{ uri: user.vbrPicture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <UserIcon color="#FFF" size={60} />
              </View>
            )}
          </View>
          <Text style={styles.name}>{user?.strEntityName || '...'}</Text>

          {/* --- THIS IS THE NEW BADGE --- */}
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{getRoleInArabic(user?.roleName)}</Text>
          </View>
          {/* --------------------------- */}
        </View>

        <View style={styles.detailsCard}>
          <InfoRow icon={UserIcon} label="الاسم الكامل" value={user?.strEntityName} />
          {/* --- ROLE ROW REMOVED --- */}
          <InfoRow icon={Phone} label="رقم الجوال" value={user?.strEntityPhone} />
          <InfoRow icon={MapPin} label="العنوان" value={user?.strEntityAddress} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 8, marginBottom: 15 },
  avatar: { width: '100%', height: '100%', borderRadius: 60 },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 60, backgroundColor: '#BDC3C7', justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 8 }, // Added margin bottom

  // --- NEW BADGE STYLES ---
  roleBadge: {
    backgroundColor: '#ECF0F1',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 15,
  },
  roleText: {
    color: '#7F8C8D',
    fontSize: 14,
    fontWeight: '600',
  },
  // -------------------------

  detailsCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 4 },
  infoRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F2F2F2' },
  infoLabelContainer: { flexDirection: 'row-reverse', alignItems: 'center' },
  infoIcon: { marginRight: 15 },
  infoLabel: { fontSize: 16, color: '#7F8C8D' },
  infoValue: { fontSize: 16, color: '#2C3E50', fontWeight: '500', flexShrink: 1, textAlign: 'left' },
});