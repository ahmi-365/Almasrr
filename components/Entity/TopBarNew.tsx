// components/TopBar.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useDashboard } from "../../Context/DashboardContext";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TopBar = ({ title, showBackButton = true }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const { user } = useDashboard(); // ✅ HOOK should be used inside the component
  const isDriver = user?.roleName === "Driver";
  const dashboardRoute: keyof RootStackParamList = isDriver
    ? "DriverDashboard"
    : "EntityDashboard";

  const handleBackPress = () => {
    // navigation.navigate("MainTabs", {
    //   screen: dashboardRoute,
    // });
    navigation.pop();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      <View style={styles.content}>
        {/* Back Button */}
        {showBackButton ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleBackPress}
            activeOpacity={0.6}
          >
            <ArrowLeft size={22} color="#111827" strokeWidth={2.2} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}

        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {/* Logo */}
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.6}>
          <Image
            source={require("../../assets/images/NavLogo2.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffe0e0ff",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 50,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  iconPlaceholder: {
    width: 38,
    height: 38,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    flex: 1,
    marginHorizontal: 8,
    letterSpacing: 0.3,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
});

export default TopBar;
