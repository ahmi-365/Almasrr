// screens/SplashScreen.tsx

import React, { useEffect, useRef } from 'react';
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
import messaging from '@react-native-firebase/messaging'; // ✅ 1. IMPORT FIREBASE MESSAGING

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
            strokeDasharray="282.7"
            strokeDashoffset="141.35"
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
    Animated.timing(bannerFadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // ✅ 2. THIS NEW FUNCTION HANDLES THE ENTIRE LAUNCH SEQUENCE
    const handleInitialLaunch = async () => {
      // ✅ 1. CHECK FOR AN INITIAL NOTIFICATION
      const remoteMessage = await messaging().getInitialNotification();

      if (remoteMessage && remoteMessage.data?.intParcelCode) {
        // ✅ 2. IF FOUND, JUST SAVE THE PARCEL CODE AS A "PENDING TASK"
        const parcelCodeToString = String(remoteMessage.data.intParcelCode);
        console.log('Notification opened app. Saving pending task for parcel code:', parcelCodeToString);
        await AsyncStorage.setItem(
          'pending_notification_parcel_code',
          parcelCodeToString
        );
      }
      // This is your existing login check logic. It will run AFTER the notification check.
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

      // We still use your 3-second timer for a smooth user experience.
      const navigationTimer = setTimeout(() => {
        checkLogin();
      }, 3000);

      return () => clearTimeout(navigationTimer);
    };

    handleInitialLaunch();

  }, [bannerFadeAnim, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkOrange} />
      <Animated.View style={[styles.bannerContainer, { opacity: bannerFadeAnim }]}>
        <Image
          source={require('../assets/images/Banner.png')}
          style={styles.bannerImage}
          resizeMode="cover"
        />
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  bannerImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
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
    color: Colors.white,
    fontFamily: 'System',
    fontWeight: '500',
  },
});