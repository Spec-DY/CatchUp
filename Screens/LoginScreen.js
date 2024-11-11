import React, { useState } from "react";
import { View, Text, Alert } from "react-native";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { FIREBASE_AUTH } from "../firebase/firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../Context/UserContext";
import { Button } from "@rneui/base";
import { Input } from "@rneui/themed";
import { userService } from "../firebase/services/userService";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useUser();
  const auth = FIREBASE_AUTH;
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userProfile = await userService.getUserProfile(
        userCredential.user.uid
      );

      if (userProfile) {
        setUser({ ...userCredential.user, ...userProfile });
        navigation.replace("Tabs");
      } else {
        setUser(userCredential.user);
        navigation.navigate("ProfileSetup");
      }
    } catch (error) {
      Alert.alert("Login Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      // Navigate to profile setup
      navigation.navigate("ProfileSetup");
    } catch (error) {
      Alert.alert("Registration Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-white p-4">
      <Text className="text-2xl font-bold mb-8 text-center">Welcome</Text>

      <View className="space-y-4">
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={{ type: "font-awesome", name: "envelope", size: 16 }}
        />

        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          // not font-awesome icon
          leftIcon={{ type: "ionicon", name: "lock-closed", size: 16 }}
        />
      </View>

      <View className="flex-row justify-center space-x-4 mt-6">
        <Button
          title="LOG IN"
          buttonStyle={{
            backgroundColor: "black",
            borderRadius: 30,
            paddingHorizontal: 30,
          }}
          containerStyle={{
            width: 140,
          }}
          titleStyle={{ fontWeight: "bold" }}
          onPress={handleLogin}
          loading={loading}
        />

        <Button
          title="SIGN UP"
          buttonStyle={{
            backgroundColor: "black",
            borderRadius: 30,
            paddingHorizontal: 30,
          }}
          containerStyle={{
            width: 140,
          }}
          titleStyle={{ fontWeight: "bold" }}
          onPress={handleRegister}
          disabled={loading}
        />
      </View>
    </View>
  );
};

export default LoginScreen;
