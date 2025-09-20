import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';

const CustomPlusButton: React.FC = () => {
  return (
    <View style={styles.container}>
      <Plus size={28} color="#FFFFFF" strokeWidth={3} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E67E22',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderWidth: 4,
    shadowColor: '#E67E22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});

export default CustomPlusButton;