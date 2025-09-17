// components/Entity/CustomPlusButton.tsx

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';

// No props needed now as the wrapper will handle onPress
const CustomPlusButton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.outerCircle}>
        <View style={styles.plusCircle}>
          <Plus size={28} color="#FFF" strokeWidth={3} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // REMOVED: position, alignSelf, bottom, zIndex
    // ADDED shadow for depth
    shadowColor: '#FF6347',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  outerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF', // Changed to white to stand out
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusCircle: {
    backgroundColor: '#FF6347',
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomPlusButton;