// import { StatusBar, View, ActivityIndicator } from "react-native";
// import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
// import React, { useEffect, useState } from "react";
// import AppNavigator from "./navigation/AppNavigator";

// export default function App() {
//   const navigationRef = useNavigationContainerRef();
//   const [currentRouteName, setCurrentRouteName] = useState();
//   const [isAppReady, setIsAppReady] = useState(false);

//   useEffect(() => {
//     const init = async () => {
//       try {
//         // Initialize any required data here
//         await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
//       } catch (e) {
//         console.error("Error initializing app:", e);
//       } finally {
//         setIsAppReady(true);
//       }
//     };
//     init();
//   }, []);

//   if (!isAppReady) {
//     return (
//       <View
//         style={{
//           flex: 1,
//           alignItems: "center",
//           justifyContent: "center",
//           backgroundColor: "#2C3E50",
//         }}
//       >
//         <ActivityIndicator size="large" color="#E67E22" />
//       </View>
//     );
//   }

//   return (
//     <>
//       <StatusBar translucent barStyle="dark-content" backgroundColor="#ffe0e0ff" />
//       {/* <StatusBar translucent backgroundColor="#2C3E50" barStyle="light-content" /> */}
//       <NavigationContainer
//         ref={navigationRef}
//         onReady={() => {
//           setCurrentRouteName(navigationRef.getCurrentRoute()?.name);
//         }}
//         onStateChange={() => {
//           setCurrentRouteName(navigationRef.getCurrentRoute()?.name);
//         }}
//       >
//         <View style={{ flex: 1 }}>
//           <AppNavigator />
//         </View>
//       </NavigationContainer>
//     </>
//   );
// }