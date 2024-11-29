import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Map from "../Screens/Map";
import Friends from "../Screens/Friends";
import Me from "../Screens/Me";
import { FontAwesome5 } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Map"
      screenOptions={{
        headerShown: false, // 隐藏所有页面的 header
        tabBarStyle: {
          backgroundColor: "black",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "gray",
      }}
    >
      <Tab.Screen
        name="Friends"
        component={Friends}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user-friends" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={Map}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="map-marker-alt" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Me"
        component={Me}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user-cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
