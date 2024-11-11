// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "./Screens/LoginScreen";
import ProfileSetup from "./Screens/ProfileSetup";
import { UserProvider } from "./Context/UserContext";
import BottomTabNavigator from "./Navigation/BottomTabNavigator";

const Stack = createStackNavigator();

const App = () => {
  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="LoginScreen">
          <Stack.Screen
            name="LoginScreen"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProfileSetup"
            component={ProfileSetup}
            options={{
              title: "Setup Profile",
              headerLeft: () => null,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="Tabs"
            component={BottomTabNavigator}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
};

export default App;
