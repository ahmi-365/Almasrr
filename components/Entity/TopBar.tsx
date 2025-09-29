import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Bell, Menu } from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDashboard } from '../../Context/DashboardContext';

// Get screen width for SVG path calculations
const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 160; // The total height of the header area

const ModernTopBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { toggleSidebar, user } = useDashboard();

  // --- NEW: Helper function to translate the user role to Arabic ---
  const getRoleInArabic = (role: string | undefined): string => {
    if (role === 'Entity') return 'المتجر';
    if (role === 'Driver') return 'المندوب';
    return role || 'مستخدم'; // Provides a fallback if role is null, undefined, or a different value
  };

  // The SVG path for the curved background
  const backgroundPath = `
    M 0 0
    L ${width} 0
    L ${width} ${HEADER_HEIGHT - 50}
    Q ${width / 2} ${HEADER_HEIGHT + 20} 0 ${HEADER_HEIGHT - 50}
    Z
  `;

  return (
    <View style={[styles.container, { height: HEADER_HEIGHT + insets.top }]}>
      {/* SVG Background with Gradient */}
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

      {/* Header Content */}
      <View style={[styles.contentContainer, { paddingTop: insets.top }]}>
        {/* Top row: Icons */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.iconButton}>
            <Bell color="#4A5568" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={toggleSidebar}>
            <Menu color="#4A5568" size={28} />
          </TouchableOpacity>
        </View>

        {/* Main info row: Greeting, Role Badge, Avatar */}
        <View style={styles.mainInfoRow}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../assets/images/NavLogo2.png')}
              style={styles.avatar}
            />
          </View>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>{user?.strEntityName || 'أهلاً بك'}</Text>

            {/* Role Badge - renders only if the user object exists */}
            {user && (
              <View style={styles.roleBadge}>
                {/* --- UPDATED: Use the getRoleInArabic function --- */}
                <Text style={styles.roleBadgeText}>{getRoleInArabic(user.roleName)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF', // Fallback color
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
});

export default ModernTopBar;