import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DriverDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>مرحباً بالسائق 👋</Text>
      <Text style={styles.subtitle}>هذا هو لوحة القيادة الخاصة بك</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#7F8C8D' },
});
