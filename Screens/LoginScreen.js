import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { FIREBASE_AUTH } from "../firebase/firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../Context/UserContext";
import { Button } from "@rneui/base";
import { Input } from "@rneui/themed";
import { userService } from "../firebase/services/userService";
import SafeAreaContainer from "../Components/SafeAreaContainer";

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
      navigation.navigate("ProfileSetup");
    } catch (error) {
      Alert.alert("Registration Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Password Reset",
        "Password reset email has been sent. Please check your inbox."
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <SafeAreaContainer className="justify-center p-4">
      <View className="mb-12">
        <Text className="text-3xl font-bold mb-2 text-white text-center">
          Welcome Back
        </Text>
        <Text className="text-gray-400 text-center">Sign in to continue</Text>
      </View>

      <View className="space-y-4">
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={{
            type: "font-awesome",
            name: "envelope",
            size: 16,
            color: "gray",
          }}
          inputStyle={{ color: "white" }}
          placeholderTextColor="gray"
          containerStyle={{ paddingHorizontal: 0 }}
          inputContainerStyle={styles.inputContainerStyle}
        />

        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          leftIcon={{
            type: "ionicon",
            name: "lock-closed",
            size: 16,
            color: "gray",
          }}
          inputStyle={{ color: "white" }}
          placeholderTextColor="gray"
          containerStyle={{ paddingHorizontal: 0 }}
          inputContainerStyle={styles.inputContainerStyle}
        />

        {/* Forgot Password Link */}
        <TouchableOpacity
          onPress={handleForgotPassword}
          className="items-end mb-4"
        >
          <Text className="text-blue-400">Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* Auth Buttons */}
      <View className="space-y-4 mt-6">
        <Button
          title={loading ? "Please wait..." : "LOG IN"}
          buttonStyle={{
            backgroundColor: "blue",
            borderRadius: 30,
            paddingVertical: 12,
          }}
          containerStyle={{
            width: "100%",
          }}
          titleStyle={{
            fontWeight: "bold",
            fontSize: 16,
          }}
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
        />
        <Button
          title="SIGN UP"
          buttonStyle={{
            backgroundColor: "transparent",
            borderRadius: 30,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: "white",
          }}
          containerStyle={{
            width: "100%",
            marginTop: 18,
          }}
          titleStyle={{
            fontWeight: "bold",
            fontSize: 16,
            color: "white",
          }}
          onPress={handleRegister}
          disabled={loading}
        />
      </View>

      {/* Terms and Privacy */}
      <Text className="text-gray-500 text-center mt-8 text-sm">
        By continuing, you agree to our{" "}
        <Text className="text-blue-400">Terms of Service</Text> and{" "}
        <Text className="text-blue-400">Privacy Policy</Text>
      </Text>
    </SafeAreaContainer>
  );
};

styles = {
  inputContainerStyle: {
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderBottomWidth: 0,
    paddingHorizontal: 10,
  },
};

export default LoginScreen;
