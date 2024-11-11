// Screens/ProfileSetup.js
import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { Button } from "@rneui/base";
import { Input } from "@rneui/themed";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../Context/UserContext";
import { userService } from "../firebase/services/userService";

const ProfileSetup = () => {
  const [username, setUsername] = useState("");
  const [image, setImage] = useState(null);
  const [gender, setGender] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { user, setUser } = useUser();

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // handle profile setup
  const handleComplete = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Please enter a username");
      return;
    }

    if (!gender) {
      Alert.alert("Error", "Please select your gender");
      return;
    }

    setLoading(true);

    try {
      let profileImageUrl = null;

      // if image is selected, upload to firebase storage
      if (image) {
        profileImageUrl = await userService.uploadProfileImage(user.uid, image);
      }

      // create user profile
      const userData = await userService.createUserProfile(user.uid, {
        email: user.email,
        username,
        avatarUrl: profileImageUrl, // firebase storage URL
        gender,
      });

      // update user context
      setUser({ ...user, ...userData });
      navigation.replace("Tabs");
    } catch (error) {
      Alert.alert("Error", "Failed to complete profile setup");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const GenderOption = ({ type, icon, selected }) => (
    <TouchableOpacity
      onPress={() => setGender(type)}
      className={`items-center p-1 rounded-full ${
        selected ? "bg-blue-500" : "bg-gray-800"
      }`}
    >
      <View className="w-16 h-16 rounded-full bg-gray-700 items-center justify-center">
        {icon}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-black p-4">
      <View className="items-center mb-8">
        <Text className="text-2xl font-bold mb-2 text-white">
          Set Up Your Profile
        </Text>
        <Text className="text-gray-400">
          Please choose a username, profile photo and gender
        </Text>
      </View>

      <TouchableOpacity onPress={pickImage} className="items-center mb-6">
        {image ? (
          <Image source={{ uri: image }} className="w-32 h-32 rounded-full" />
        ) : (
          <View className="w-32 h-32 rounded-full bg-gray-800 items-center justify-center">
            <Text className="text-gray-400">Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <Input
        placeholder="Choose a username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        containerStyle={{ paddingHorizontal: 0 }}
        inputContainerStyle={{
          borderRadius: 8,
          backgroundColor: "rgba(255,255,255,0.1)",
          borderBottomWidth: 0,
          paddingHorizontal: 10,
        }}
        inputStyle={{ color: "white" }}
        placeholderTextColor="gray"
        leftIcon={{
          type: "font-awesome",
          name: "user",
          color: "gray",
          size: 18,
        }}
      />

      {/* Gender */}
      <Text className="text-xl font-bold mb-4 text-white text-center mt-6">
        Choose your gender
      </Text>
      <View className="flex-row justify-around mb-8">
        <GenderOption
          type="male"
          icon={<Text className="text-5xl">👨🏻</Text>}
          selected={gender === "male"}
        />
        <GenderOption
          type="female"
          icon={<Text className="text-5xl">👩🏻</Text>}
          selected={gender === "female"}
        />
      </View>

      <Button
        title="Complete Setup"
        buttonStyle={{
          backgroundColor: "blue",
          borderRadius: 30,
          paddingVertical: 12,
        }}
        containerStyle={{
          width: 200,
          alignSelf: "center",
        }}
        titleStyle={{
          fontWeight: "bold",
          fontSize: 16,
        }}
        onPress={handleComplete}
        loading={loading}
        disabled={!username || !gender}
      />
    </View>
  );
};

export default ProfileSetup;
