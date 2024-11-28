import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
} from "react-native";
import { useUser } from "../Context/UserContext";
import { Button } from "@rneui/base";
import GenderOption from "../Components/GenderOption";
import { useNavigation } from "@react-navigation/native";
import { userService } from "../firebase/services/userService";
import EditProfile from "./EditProfile";

const SettingItem = ({ title, subtitle, onPress, toggleValue, onToggle }) => {
  return (
    <TouchableOpacity
      className={`mb-4 bg-gray-800 p-4 rounded-lg ${
        onPress ? "active:opacity-80" : ""
      }`}
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-white font-medium mb-1">{title}</Text>
          {subtitle && (
            <Text className="text-gray-400 text-sm">{subtitle}</Text>
          )}
        </View>
        {typeof toggleValue !== "undefined" && (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: "#767577", true: "#45cb59" }}
            thumbColor={toggleValue ? "#ffffff" : "#f4f3f4"}
            style={{ marginLeft: 10 }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const Me = () => {
  const { user, setUser, signOut } = useUser();
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

  const toggleLocationSharing = async (value) => {
    try {
      const updatedSettings = {
        ...user.settings,
        locationSharing: value,
      };
      await userService.updateUserSettings(user.uid, updatedSettings);
      setUser((prev) => ({
        ...prev,
        settings: updatedSettings,
      }));
    } catch (error) {
      console.error("Failed to update location sharing:", error);
      Alert.alert("Error", "Failed to update location sharing");
    }
  };

  const toggleNotifications = async (value) => {
    try {
      const updatedSettings = {
        ...user.settings,
        notifications: value,
      };
      await userService.updateUserSettings(user.uid, updatedSettings);
      setUser((prev) => ({
        ...prev,
        settings: updatedSettings,
      }));
    } catch (error) {
      console.error("Failed to update notifications:", error);
      Alert.alert("Error", "Failed to update notifications");
    }
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
        <Text className="text-2xl font-bold text-white mb-2">
          {user?.username || "User"}
        </Text>
        <Text className="text-gray-400 mb-4">{user?.email}</Text>
        <GenderOption
          type={user?.gender}
          icon={user?.gender === "male" ? "👨🏻" : "👩🏻"}
          selected={true}
          onSelect={() => {}}
          disabled={true}
        />
      </View>

      {/* Settings List */}
      <ScrollView className="flex-1">
        <View className="p-6">
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
            toggleValue={user?.settings?.locationSharing}
            onToggle={toggleLocationSharing}
          />

          {/* Notifications */}
          <SettingItem
            title="Notifications"
            subtitle={
              user?.settings?.notifications
                ? "Notifications are enabled"
                : "Notifications are disabled"
            }
            toggleValue={user?.settings?.notifications}
            onToggle={toggleNotifications}
          />

          {/* Notification Scheduler */}
          <SettingItem
            title="Set Reminder Notification"
            subtitle="Schedule a daily reminder to check your location updates"
            onPress={() => navigation.navigate("NotificationScheduler")}
          />
        </View>
      </ScrollView>

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
