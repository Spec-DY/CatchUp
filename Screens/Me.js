import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { useUser } from "../Context/UserContext";
import { Button } from "@rneui/base";
import GenderOption from "../Components/GenderOption";
import { useNavigation } from "@react-navigation/native";
import { userService } from "../firebase/services/userService";
import EditProfile from "./EditProfile";

const SettingItem = ({ title, value, subtitle, onPress }) => (
  <TouchableOpacity
    className="mb-4 bg-gray-800 p-4 rounded-lg"
    onPress={onPress}
  >
    <Text className="text-white font-medium mb-1">{title}</Text>
    {value && <Text className="text-white text-lg mb-1">{value}</Text>}
    {subtitle && <Text className="text-gray-400 text-sm">{subtitle}</Text>}
  </TouchableOpacity>
);

const Me = () => {
  const { user, signOut } = useUser();
  const navigation = useNavigation();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadAvatarUrl();
  }, [user?.avatarUrl, refreshKey]);

  const loadAvatarUrl = async () => {
    if (user?.avatarUrl) {
      try {
        const url = await userService.getImageUrl(user.avatarUrl);
        setAvatarUrl(url);
      } catch (error) {
        console.error("Error loading avatar:", error);
      }
    } else {
      setAvatarUrl(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigation.replace("LoginScreen");
    } catch (error) {
      Alert.alert("Error", "Failed to log out");
    }
  };

  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  const handleEditComplete = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleLocationSharing = () => {
    Alert.alert("Coming soon", "Location sharing toggle");
  };

  return (
    <View className="flex-1 bg-black">
      <EditProfile
        isVisible={isEditModalVisible}
        onClose={() => setEditModalVisible(false)}
        onUpdate={handleEditComplete}
      />

      {/* Profile Header */}
      <View className="items-center p-6 border-b border-gray-800">
        {/* Avatar */}
        <TouchableOpacity className="mb-4" onPress={() => {}} disabled={true}>
          <Image
            source={
              avatarUrl
                ? { uri: avatarUrl }
                : require("../assets/default-avatar.png")
            }
            className="w-24 h-24 rounded-full"
          />
        </TouchableOpacity>

        {/* User Info */}
        <Text className="text-2xl font-bold text-white mb-2">
          {user?.username || "User"}
        </Text>
        <Text className="text-gray-400 mb-4">{user?.email}</Text>

        {/* Gender */}
        <GenderOption
          type={user?.gender}
          icon={user?.gender === "male" ? "👨🏻" : "👩🏻"}
          selected={true}
          onSelect={() => {}}
          disabled={true}
        />
      </View>

      {/* Settings List */}
      <View className="p-6">
        {/* Edit Profile */}
        <SettingItem
          title="Edit Profile"
          subtitle="Change your username or photo"
          onPress={handleEditProfile}
        />

        {/* Location Sharing */}
        <SettingItem
          title="Location Sharing"
          subtitle={
            user?.settings?.locationSharing
              ? "Your location is visible to friends"
              : "Your location is hidden"
          }
          onPress={handleLocationSharing}
        />

        {/* Notifications */}
        <SettingItem
          title="Notifications"
          subtitle={
            user?.settings?.notifications
              ? "Notifications are enabled"
              : "Notifications are disabled"
          }
          onPress={() => Alert.alert("Coming soon", "Notification settings")}
        />

        {/* Friends */}
        <SettingItem
          title="Friends"
          subtitle={`${user?.friends?.length || 0} friends`}
          onPress={() => Alert.alert("Coming soon", "Friends list")}
        />
      </View>

      {/* Logout Button */}
      <View className="p-6 mt-auto">
        <Button
          title="Log Out"
          buttonStyle={{
            backgroundColor: "red",
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
          onPress={handleLogout}
        />
      </View>
    </View>
  );
};

export default Me;
