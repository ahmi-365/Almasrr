import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  StatusBar,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Svg, { Circle } from 'react-native-svg';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// --- Color Palette ---
const Colors = {
  primaryOrange: '#FF7043',
  darkOrange: '#E65100',
  lightOrange: '#FFA726',
  white: '#FFFFFF',
  darkText: '#303030',
  greyText: '#757575',
  lightGreyBackground: '#FAFAFA',
  borderGrey: '#E0E0E0',
  errorRed: '#EF5350',
  softOrange: '#FFD7C5',
};

// Custom Progress Loader Component
const ProgressLoader = ({ color }) => {
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, [rotationAnim]);

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.loaderContainer}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Svg width="60" height="60" viewBox="0 0 100 100">
          <Circle
            cx="50"
            cy="50"
            r="45"
            stroke={Colors.borderGrey}
            strokeWidth="5"
            fill="none"
          />
          <Circle
            cx="50"
            cy="50"
            r="45"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="282.7" // 2 * PI * r = 2 * 3.14 * 45 = 282.6
            strokeDashoffset="141.35" // half of the dasharray
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

export default function SplashScreen() {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const bannerFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate banner to fade in
    Animated.timing(bannerFadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const checkLogin = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (!userData) {
          return navigation.replace('Login');
        }
        const parsed = JSON.parse(userData);
        if (parsed?.success === true && parsed?.roleName) {
          navigation.replace('MainTabs');
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error reading user data:', error);
        navigation.replace('Login');
      }
    };

    const navigationTimer = setTimeout(() => {
      checkLogin();
    }, 3000); // 3 seconds delay to show the banner and loader

    return () => clearTimeout(navigationTimer);
  }, [bannerFadeAnim, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkOrange} />
      
      {/* Full-screen banner */}
      <Animated.View style={[styles.bannerContainer, { opacity: bannerFadeAnim }]}>
        <Image
          source={require('../assets/images/Banner.png')}
          style={styles.bannerImage}
          resizeMode="cover" // 'cover' to fill the entire screen
        />
        {/* Progress Loader at the bottom of the banner */}
        <View style={styles.loaderBottomContainer}>
          <ProgressLoader color={Colors.primaryOrange} />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  bannerContainer: {
    flex: 1,
    justifyContent: 'flex-end', // Align children to the bottom
    alignItems: 'center',
    backgroundColor: 'black', // A dark background for a full-screen image
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject, // Make the image take up the full parent view
    width: screenWidth,
    height: screenHeight,
  },
  loaderBottomContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: Colors.white, // Change text color to white for visibility on the banner
    fontFamily: 'System',
    fontWeight: '500',
  },
});