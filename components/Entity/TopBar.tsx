import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Bell, Menu } from 'lucide-react-native'; // Re-added Bell icon
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDashboard } from '../../Context/DashboardContext';

// Get screen width for SVG path calculations
const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 160; // The total height of the header area

const ModernTopBar: React.FC = () => {
  const insets = useSafeAreaInsets(); // For safe area padding
  const { dcBalance, toggleSidebar } = useDashboard();
  const [userName, setUserName] = useState('أهلاً بك');

  // Fetch user's name from AsyncStorage when the component mounts
  useEffect(() => {
    const loadUserData = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUserName(JSON.parse(userData).strEntityName || 'أهلاً بك');
      }
    };
    loadUserData();
  }, []);

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
          {/* Notification icon on the left */}
          <TouchableOpacity style={styles.iconButton}>
            <Bell color="#4A5568" size={24} />
          </TouchableOpacity>
          {/* Menu (drawer) icon on the right */}
          <TouchableOpacity style={styles.iconButton} onPress={toggleSidebar}>
            <Menu color="#4A5568" size={28} />
          </TouchableOpacity>
        </View>

        {/* Main info row: Greeting, Balance, Avatar */}
        <View style={styles.mainInfoRow}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../assets/images/NavLogo2.png')} // Using your logo as an avatar
              style={styles.avatar}
            />
          </View>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>{userName}</Text>
            <Text style={styles.balanceText}>
              المبلغ المستحق<Text style={styles.balanceAmount}>{dcBalance ?? '0.00'} د.ل</Text>
            </Text>
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
    flexDirection: 'row', // Changed to arrange items horizontally
    justifyContent: 'space-between', // Pushes icons to opposite ends
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
    alignItems: 'flex-end', // Align text to the right
  },
  greetingText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'right',
  },
  balanceText: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
    textAlign: 'right',
  },
  balanceAmount: {
    fontWeight: 'bold',
    color: '#4A5568',
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