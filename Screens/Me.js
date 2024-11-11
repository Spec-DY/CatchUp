import { View, Text } from "react-native";
import React from "react";
import { useUser } from "../Context/UserContext";

const Me = () => {
  const { user } = useUser();
  console.log(user);
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold">Me</Text>
    </View>
  );
};

export default Me;
