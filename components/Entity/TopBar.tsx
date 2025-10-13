import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Bell, Menu, Search } from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDashboard } from '../../Context/DashboardContext';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../../Context/NotificationContext';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 210;

interface ModernTopBarProps {
  allParcels?: any[];
}

const ModernTopBar: React.FC<ModernTopBarProps> = ({
  allParcels = [],
}) => {
  const insets = useSafeAreaInsets();
  const { toggleSidebar, user } = useDashboard();
  const navigation = useNavigation();
const { unreadCount } = useNotifications();

  const navigateToSearch = () => {
    navigation.navigate('SearchScreen' as never, { allParcels } as never);
  };

 const navigateToNotifications = () => {
  // Just navigate - marking as read will happen in NotificationsScreen
  navigation.navigate('NotificationsScreen' as never);
};

  const getRoleInArabic = (role: string | undefined): string => {
    if (role === 'Entity') return 'المتجر';
    if (role === 'Driver') return 'المندوب';
    return role || 'مستخدم';
  };

  const backgroundPath = `
    M 0 0
    L ${width} 0
    L ${width} ${HEADER_HEIGHT - 50}
    Q ${width / 2} ${HEADER_HEIGHT + 20} 0 ${HEADER_HEIGHT - 50}
    Z
  `;

  return (
    <View style={[styles.container, { height: HEADER_HEIGHT + insets.top }]}>
      <View style={StyleSheet.absoluteFillObject}>
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#ffe0e0ff" stopOpacity="1" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Path d={backgroundPath} fill="url(#grad)" />
        </Svg>
      </View>

      <View style={[styles.contentContainer, { paddingTop: insets.top }]}>
        <View style={styles.topRow}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={navigateToNotifications}
          >
            <Bell color="#4A5568" size={24} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={toggleSidebar}>
            <Menu color="#4A5568" size={28} />
          </TouchableOpacity>
        </View>

        <View style={styles.mainInfoRow}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../assets/images/NavLogo2.png')}
              style={styles.avatar}
            />
          </View>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>{user?.strEntityName || 'أهلاً بك'}</Text>
            {user && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{getRoleInArabic(user.roleName)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.searchContainerWrapper}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={navigateToSearch}
            activeOpacity={0.8}
          >
            <Search size={20} color="#FF6B35" />
            <Text style={styles.searchButtonText}>ابحث برقم الطرد، اسم المستلم...</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mainInfoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 15,
  },
  greetingContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  greetingText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'right',
  },
  roleBadge: {
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  roleBadgeText: {
    color: '#E67E22',
    fontSize: 13,
    fontWeight: 'bold',
  },
  avatarContainer: {
    marginLeft: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: 'white',
    borderRadius: 30,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  searchContainerWrapper: {
    marginTop: 15,
    marginBottom: 10,
  },
  searchButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchButtonText: {
    flex: 1,
    textAlign: 'right',
    fontSize: 16,
    color: '#6C757D',
    marginHorizontal: 10,
  },
});

export default ModernTopBar;