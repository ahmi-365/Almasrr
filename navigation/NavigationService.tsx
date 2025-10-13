import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './AppNavigator'; // Make sure this path is correct

// Use createNavigationContainerRef with the correct type for your stack
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params: any) {
    // Ensure the navigator is ready before trying to navigate
    if (navigationRef.isReady()) {
        navigationRef.navigate(name as never, params as never);
    } else {
        // You can handle the case where the navigator is not ready,
        // maybe queue the navigation action. For now, we'll log it.
        console.log("Navigation not ready, skipping navigation action.");
    }
}