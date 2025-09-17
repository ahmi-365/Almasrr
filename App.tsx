// App.tsx

import { StatusBar, View, ActivityIndicator } from "react-native";
import { NavigationContainer, useNavigationContainerRef, NavigationState } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import AppNavigator from "./navigation/AppNavigator";
import { DashboardProvider, useDashboard } from "./Context/DashboardContext";

// --- 1. THIS IS THE ROBUST HELPER FUNCTION ---
// It recursively drills down into the navigation state to find the name of the deepest active screen.
const getActiveRouteName = (state: NavigationState | undefined): string => {
  if (!state) {
    return '';
  }
  const route = state.routes[state.index];

  if (route.state) {
    // Dive into nested navigators
    return getActiveRouteName(route.state as NavigationState);
  }

  return route.name;
};
// ---------------------------------------------

// A component that can safely use the context hook
const AppContent = () => {
  const navigationRef = useNavigationContainerRef();
  const { setCurrentRoute } = useDashboard();

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        // --- 2. USE THE NEW FUNCTION ON READY ---
        const routeName = getActiveRouteName(navigationRef.getRootState());
        if (routeName) {
          setCurrentRoute(routeName);
        }
      }}
      onStateChange={async (state) => {
        // --- 3. USE THE NEW FUNCTION ON STATE CHANGE ---
        const currentRouteName = getActiveRouteName(state);
        if (currentRouteName) {
          setCurrentRoute(currentRouteName);
        }
      }}
    >
      <View style={{ flex: 1 }}>
        <AppNavigator />
      </View>
    </NavigationContainer>
  );
};

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.error("Error initializing app:", e);
      } finally {
        setIsAppReady(true);
      }
    };
    init();
  }, []);

  if (!isAppReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#2C3E50" }}>
        <ActivityIndicator size="large" color="#E67E22" />
      </View>
    );
  }

  return (
    <DashboardProvider>
      <StatusBar translucent backgroundColor="#2C3E50" barStyle="light-content" />
      <AppContent />
    </DashboardProvider>
  );
}