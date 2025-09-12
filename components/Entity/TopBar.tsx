// components/Entity/TopBar.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Menu } from 'lucide-react-native';
import Sidebar from './Sidebar';

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const handleSidebarToggle = useCallback(
    () => setSidebarVisible((prev) => !prev),
    []
  );

  const handleSidebarClose = useCallback(() => setSidebarVisible(false), []);

  return (
    <>
      <Sidebar visible={sidebarVisible} onClose={handleSidebarClose} />

      <View style={styles.header}>
        <Image
          source={require('../../assets/images/NavLogo2.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>{title}</Text>

        <TouchableOpacity
          onPress={handleSidebarToggle}
          style={styles.menuButton}
          activeOpacity={0.7}
        >
          <Menu color="#2C3E50" size={24} />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logo: { width: 45, height: 35, marginRight: 10 },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
  },
  menuButton: { padding: 6, borderRadius: 6, marginLeft: 10 },
});
