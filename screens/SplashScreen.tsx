// SplashScreen.tsx
import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import React from 'react';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export default function SplashScreen() {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // animations
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    const checkLogin = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');

        if (!userData) {
          return navigation.replace('Login');
        }

        const parsed = JSON.parse(userData);

        if (parsed?.success === true && parsed?.roleName) {
          if (parsed?.success === true && parsed?.roleName) {
            navigation.replace('MainTabs');
          } else {
            navigation.replace('Login');
          }
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error reading user data:', error);
        navigation.replace('Login');
      }
    };

    const timer = setTimeout(() => {
      checkLogin();
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.logoPlaceholder}>
          <Image
            source={require('../assets/images/Almasr2.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </Animated.View>
      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        <ActivityIndicator size="large" color="#E67E22" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C3E50',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 80,
  },
  logoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoPlaceholder: {
    width: 180,
    height: 180,
    backgroundColor: '#34495E',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  logo: { width: 150, height: 150, borderRadius: 20 },
  loadingContainer: { alignItems: 'center' },
});
