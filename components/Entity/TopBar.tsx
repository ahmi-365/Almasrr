// components/Entity/TopBar.tsx
import React from 'react'; // Removed useState and useCallback
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Menu } from 'lucide-react-native';
// REMOVED: import Sidebar from './Sidebar';
import { useDashboard } from '../../Context/DashboardContext'; // Import the hook

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  // REMOVED: const [sidebarVisible, setSidebarVisible] = useState(false);
  const { toggleSidebar } = useDashboard(); // Get the global toggle function

  // REMOVED: handleSidebarToggle and handleSidebarClose callbacks

  return (
    // REMOVED: The fragment and the <Sidebar /> component
    <View style={styles.header}>
      <Image
        source={require('../../assets/images/NavLogo2.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.headerTitle}>{title}</Text>

      <TouchableOpacity
        onPress={toggleSidebar} // Use the function from context
        style={styles.menuButton}
        activeOpacity={0.7}
      >
        <Menu color="#2C3E50" size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // ...styles are unchanged
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