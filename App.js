import "react-native-gesture-handler";
// import LocationPermissionManager from "./Components/LocationPermissionManager";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, ActivityIndicator } from "react-native";
import LoginScreen from "./Screens/LoginScreen";
import ProfileSetup from "./Screens/ProfileSetup";
import { UserProvider, useUser } from "./Context/UserContext";
import BottomTabNavigator from "./Navigation/BottomTabNavigator";
import { StatusBar } from "expo-status-bar";
import NotificationScheduler from "./Screens/NotificationScheduler";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

const Stack = createStackNavigator();

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Navigation content based on user authentication state
const NavigationContent = () => {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Initial route based on user authentication state
  const initialRoute = user
    ? user.username
      ? "Tabs"
      : "ProfileSetup"
    : "LoginScreen";

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      {!user ? (
        // unauthenticated route
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : !user.username ? (
        // incomplete user information route
        <Stack.Screen
          name="ProfileSetup"
          component={ProfileSetup}
          options={{
            headerShown: false,
          }}
        />
      ) : (
        // logged in route
        <>
          <Stack.Screen
            name="Tabs"
            component={BottomTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NotificationScheduler"
            component={NotificationScheduler}
            options={{
              headerTitle: "Set Reminder",
              headerStyle: {
                backgroundColor: "black",
              },
              headerTintColor: "white",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <UserProvider>
      {/* this is not avalible yet need some debugging */}
      {/* <LocationPermissionManager /> */}
      <NavigationContainer>
        <StatusBar style="light" />
        <NavigationContent />
      </NavigationContainer>
    </UserProvider>
  );
};

export default App;
