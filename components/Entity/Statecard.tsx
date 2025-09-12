import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Package } from 'lucide-react-native'; // replace with your icon

interface StatCardProps {
  number: string | number;
  label: string;
  iconColor?: string;
  progressColor?: string;
    icon: React.ComponentType<any>; // Pass the icon component

  progress?: number; // 0 to 1
}

const StatCard: React.FC<StatCardProps> = ({
  number,
  label,
    icon: Icon, // <-- use the passed icon here

  iconColor = '#F39C12',
  progressColor = '#F39C12',
  progress = 0.3,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.number}>{number}</Text>
<Icon color={iconColor} size={20} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.progressBackground}>
        <View style={[styles.progressBar, { width: `${progress * 100}%`, backgroundColor: progressColor }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
 card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    minWidth: 140,    
    minHeight: 140,   
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  number: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'right',
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});

export default StatCard;
