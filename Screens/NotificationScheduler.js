import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const NotificationScheduler = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const verifyPermission = async () => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert("Permission needed", "Notification permission is required.");
      return false;
    }
    return true;
  };

  useEffect(() => {
    checkExistingReminders();
  }, []);

  const checkExistingReminders = async () => {
    try {
      const notifications =
        await Notifications.getAllScheduledNotificationsAsync();
      const reminder = notifications.find(
        (n) => n.content.title === "Location Update Reminder"
      );

      if (reminder) {
        setCurrentReminder(reminder.identifier);
        if (reminder.trigger.hour !== undefined) {
          const date = new Date();
          date.setHours(reminder.trigger.hour);
          date.setMinutes(reminder.trigger.minute || 0);
          setSelectedDate(date);
        }
      }
      console.log("Current scheduled notifications:", notifications);
    } catch (error) {
      console.error("Error checking reminders:", error);
    }
  };

  const scheduleLocalNotification = async (date) => {
    try {
      const hasPermission = await verifyPermission();
      if (!hasPermission) return;

      // 如果已有提醒，先取消
      if (currentReminder) {
        await Notifications.cancelScheduledNotificationAsync(currentReminder);
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Location Update Reminder",
          body: "Don't forget to check your friends' location updates or the weather!",
          sound: true,
        },
        trigger: {
          hour: date.getHours(),
          minute: date.getMinutes(),
          repeats: true,
        },
      });

      setCurrentReminder(identifier);
      Alert.alert("Success", "Daily reminder has been set successfully.");
    } catch (error) {
      console.error("Error scheduling notification:", error);
      Alert.alert("Error", "Failed to schedule notification.");
    }
  };

  const deleteReminder = async () => {
    if (currentReminder) {
      try {
        await Notifications.cancelScheduledNotificationAsync(currentReminder);
        setCurrentReminder(null);
        Alert.alert("Success", "Reminder has been deleted.");
      } catch (error) {
        console.error("Error deleting reminder:", error);
        Alert.alert("Error", "Failed to delete reminder.");
      }
    }
  };

  return (
    <View className="flex-1 bg-black pt-14">
      {/* Custom Header */}
      <View className="px-4 pb-4 border-b border-gray-800">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">
            Set Daily Reminder
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 px-4 py-6">
        <View className="bg-gray-900 rounded-xl p-4 mb-4">
          <Text className="text-white text-base mb-2">
            Choose when you'd like to receive daily reminders
          </Text>
          <Text className="text-gray-400 text-sm">
            We'll notify you to check location updates and weather at your
            selected time each day
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          className="bg-gray-900 rounded-xl p-4 flex-row justify-between items-center"
        >
          <View>
            <Text className="text-white text-base font-medium">
              Reminder Time
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              {selectedDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </Text>
            {currentReminder && (
              <Text className="text-fuchsia-400 text-xs mt-1">
                ✓ Reminder active
              </Text>
            )}
          </View>
          <MaterialIcons name="access-time" size={24} color="#e879f9" />
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="time"
            is24Hour={false}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              setShowPicker(Platform.OS === "ios");
              if (date) {
                setSelectedDate(date);
                if (Platform.OS === "android") {
                  scheduleLocalNotification(date);
                }
              }
            }}
            themeVariant="dark"
            textColor="white"
            accentColor="#e879f9"
          />
        )}

        {/* Action Buttons */}
        <View className="absolute bottom-8 left-4 right-4">
          {currentReminder ? (
            <TouchableOpacity
              onPress={deleteReminder}
              className="bg-red-500 rounded-full py-4 px-6"
            >
              <Text className="text-white text-center text-base font-medium">
                Delete Reminder
              </Text>
            </TouchableOpacity>
          ) : (
            Platform.OS === "ios" &&
            showPicker && (
              <TouchableOpacity
                onPress={() => {
                  scheduleLocalNotification(selectedDate);
                  setShowPicker(false);
                }}
                className="bg-fuchsia-500 rounded-full py-4 px-6"
              >
                <Text className="text-white text-center text-base font-medium">
                  Save Reminder
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    </View>
  );
};

export default NotificationScheduler;
