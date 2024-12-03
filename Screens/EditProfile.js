import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useUser } from "../Context/UserContext";
import { userService } from "../firebase/services/userService";
import * as ImagePicker from "expo-image-picker";
import GenderOption from "../Components/GenderOption";

const EditProfile = ({ isVisible, onClose, onUpdate }) => {
  const { user, setUser } = useUser();
  const [username, setUsername] = useState(user?.username || "");
  const [image, setImage] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState(user?.gender);

  useEffect(() => {
    const loadAvatarUrl = async () => {
      if (user?.avatarUrl) {
        try {
          const url = await userService.getImageUrl(user.avatarUrl);
          setAvatarUrl(url);
        } catch (error) {
          console.error("Error loading avatar:", error);
        }
      }
    };

    loadAvatarUrl();
  }, [user?.avatarUrl]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Username cannot be empty");
      return;
    }

    setLoading(true);

    try {
      let profileImageUrl = user.avatarUrl;

      if (image) {
        profileImageUrl = await userService.uploadProfileImage(user.uid, image);
      }

      const updateData = {
        username,
        avatarUrl: profileImageUrl,
        gender,
      };

      await userService.updateUserProfile(user.uid, updateData);
      setUser({ ...user, ...updateData });

      onUpdate && onUpdate();
      Alert.alert("Success", "Profile updated successfully!");
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        {/* Profile Picture Section */}
        <View className="items-center mt-8 mb-8">
          <TouchableOpacity onPress={pickImage}>
            <View className="relative">
              <Image
                source={
                  image
                    ? { uri: image }
                    : avatarUrl
                    ? { uri: avatarUrl }
                    : require("../assets/default-avatar.png")
                }
                className="w-24 h-24 rounded-full"
              />
              <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full w-8 h-8 items-center justify-center">
                <Text className="text-white">Edit</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View className="px-4">
          <Text className="text-gray-400 text-base mb-2">Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor="#666"
            className="bg-gray-800 text-white p-4 rounded-lg text-lg mb-6"
          />

          <Text className="text-gray-400 text-base mb-2">Email</Text>
          <View className="bg-gray-800 p-4 rounded-lg">
            <Text className="text-gray-500 text-lg">{user?.email}</Text>
          </View>
        </View>

        {/* Gender Section */}
        <View className="px-4 mt-auto mb-8">
          <Text className="text-gray-400 text-base mb-2">Gender</Text>
          <View className="flex-row justify-around mb-6">
            <GenderOption
              type="male"
              icon="👨🏻"
              selected={gender === "male"}
              onSelect={setGender}
            />
            <GenderOption
              type="female"
              icon="👩🏻"
              selected={gender === "female"}
              onSelect={setGender}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-4 mt-auto mb-8">
          <TouchableOpacity
            onPress={handleUpdateProfile}
            disabled={loading}
            className="bg-blue-500 p-4 rounded-lg mb-4"
          >
            <Text className="text-white text-center text-lg font-semibold">
              Save
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            className="bg-gray-800 p-4 rounded-lg"
          >
            <Text className="text-white text-center text-lg">Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Loading Overlay */}
        {loading && (
          <View className="absolute inset-0 bg-black bg-opacity-50 items-center justify-center">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default EditProfile;
