import { View, Text, StyleSheet } from 'react-native';

export default function StoresScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>المتاجر</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
});