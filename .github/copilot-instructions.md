
# Copilot Instructions for Almasrr

## Project Overview
- **Almasrr** is a React Native (TypeScript) app for parcel/courier management, supporting both Entity and Driver user roles.
- Uses Expo for development/build, with native code in `android/` and `ios/` for device features and push notifications.
- Navigation is managed via React Navigation (stack and tab navigators).
- State/context is managed using React Context (`Context/`), with `DashboardContext` and `NotificationContext` for global state.

## Folder-by-Folder Patterns

### components/
- Shared and role-specific UI components.
- `components/Entity/` contains navigation/layout (e.g., `TopBar`, `Sidebar`), modals, and notification UIs.
- Use `CustomAlert` for user feedback instead of `Alert`.

### Context/
- `DashboardContext.tsx`: Holds user/session/global dashboard state. Use `useDashboard()` for access.
- `NotificationContext.tsx`: Manages notifications, unread counts, and fetch/mark-as-read logic. Use `useNotification()`.

### navigation/
- Centralizes navigation logic.
- `AppNavigator.tsx` and `MainTabNavigator.tsx` define stack/tab structure and role-based navigation.
- Use navigation helpers from `NavigationService.tsx`.

### screens/
- Organized by user role: `Entity/`, `Driver/`, `Auths/`.
- Each screen typically fetches data via hardcoded API endpoints using `axios`.
- Role-based logic is common: check `roleName` before branching.
- File download/viewing: Use `react-native-fs` and `react-native-file-viewer` (see `Driver/driverinvoices.tsx`, `Entity/ReportsDashboard.tsx`).
- Use `TopBar`/`TopBarNew` and `Sidebar` for consistent layout/navigation.

### screens/Entity/
- Handles parcel management, reporting, and tracking for Entity users.
- Example: `EntityDashboard.tsx` for dashboard data flow and API usage.
- Example: `ReportsDashboard.tsx` for file download/viewing.

### screens/Driver/
- Handles parcel assignment, delivery, and invoicing for Driver users.
- Example: `driverinvoices.tsx` for invoice download/viewing.

### screens/Auths/
- Handles authentication (login, registration).

### screens/utils/
- Utility modules (e.g., `MediaStoreUtils.ts`).

### android/ and ios/
- Native code for device features, push notifications, and Expo integration.

## Developer Workflows
- **Start app (Expo dev client):** `npm start` or `npm run start`
- **Run on Android:** `npm run android`
- **Run on iOS:** `npm run ios`
- **Web preview:** `npm run web`
- **Production builds:** Use Expo EAS or native build tools in `android/` and `ios/`.
- **No formal test suite**; manual testing is standard.

## Project-Specific Conventions
- **Role-based logic:** Branch on `roleName` ("Entity" vs "Driver").
- **Context usage:** Use `useDashboard()` and `useNotification()` for global state.
- **API endpoints:** Hardcoded, often with role-based paths (e.g., `/courierApi/Entity/` vs `/courierApi/Driver/`).
- **Custom alerts:** Use `CustomAlert` for user feedback.
- **Consistent layout:** Use `TopBar`, `Sidebar`, and shared components.

## Integration Points
- **Firebase:** Push notifications and messaging.
- **Expo:** Device APIs, splash screen, icons, and build pipeline.
- **Native modules:** For file handling, notifications, and device info.

## Examples
- `screens/Entity/EntityDashboard.tsx`: Dashboard data flow and API usage.
- `screens/Driver/driverinvoices.tsx`: File download/viewing.
- `Context/DashboardContext.tsx`: Global user/session state.

## Tips for AI Agents
- Always check user role before branching logic.
- Use context providers for cross-screen state.
- Follow navigation structure in `navigation/` for new screens.
- Use existing components for UI consistency.
- Reference hardcoded API endpoints for backend integration.
