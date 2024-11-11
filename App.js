import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, ActivityIndicator } from "react-native";
import LoginScreen from "./Screens/LoginScreen";
import ProfileSetup from "./Screens/ProfileSetup";
import { UserProvider, useUser } from "./Context/UserContext";
import BottomTabNavigator from "./Navigation/BottomTabNavigator";

const Stack = createStackNavigator();

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
            title: "Setup Profile",
            headerLeft: () => null,
            gestureEnabled: false,
          }}
        />
      ) : (
        // logged in route
        <Stack.Screen
          name="Tabs"
          component={BottomTabNavigator}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <UserProvider>
      <NavigationContainer>
        <NavigationContent />
      </NavigationContainer>
    </UserProvider>
  );
};

export default App;
