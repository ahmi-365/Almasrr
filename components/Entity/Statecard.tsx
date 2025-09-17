import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatCardProps {
  number: string | number;
  label: string;
  iconColor?: string;
  progressColor?: string;
  icon: React.ComponentType<any>;
  maxValue?: number;
  isBanner?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  number,
  label,
  icon: Icon,
  iconColor = '#F39C12',
  progressColor = '#F39C12',
  isBanner = false,
  maxValue = 100,
}) => {
  const cardStyle = isBanner ? styles.bannerCard : styles.card;
  const topRowStyle = isBanner ? styles.bannerTopRow : styles.topRow;
  const numberStyle = isBanner ? styles.bannerNumber : styles.number;
  const labelStyle = isBanner ? styles.bannerLabel : styles.label;

  const progressPercent = Math.min(100, (Number(number) / maxValue) * 100);

  return (
    <View style={cardStyle}>
      <View style={topRowStyle}>
        <Text style={numberStyle}>{number}</Text>
        <Icon color={iconColor} size={isBanner ? 28 : 20} />
      </View>
      <Text style={labelStyle}>{label}</Text>
      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progressBar,
            { width: `${progressPercent}%`, backgroundColor: progressColor },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    flex: 1,
    maxWidth: '48%',
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
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    minHeight: 110,
  },
  bannerTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'right',
  },
  bannerLabel: {
    marginTop: 10,
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'right',
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});

export default StatCard;
