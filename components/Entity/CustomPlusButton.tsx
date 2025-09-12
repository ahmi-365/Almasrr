import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';

type CustomPlusButtonProps = {
  onPress: () => void;
};

const CustomPlusButton: React.FC<CustomPlusButtonProps> = ({ onPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View style={styles.outerCircle}>

          <View style={styles.plusCircle}>
            <Plus size={24} color="#FFF" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 60, 
    zIndex: 10,
  },
  outerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e8e8e8ff', 
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  plusCircle: {
    backgroundColor: '#FF6347', 
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomPlusButton;
