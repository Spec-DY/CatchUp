import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import Mapbox, { MapView } from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useUser } from "../Context/UserContext";
import { userService } from "../firebase/services/userService";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { FIREBASE_DB } from "../firebase/firebaseConfig";
import { Image } from "react-native";
import { postService } from "../firebase/services/postService";
import { TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Device from "expo-device";

const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPEN_WEATHER_API;

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
// Initialize Mapbox with access token
Mapbox.setAccessToken(mapboxToken);

const Map = () => {
  const { user } = useUser();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [friends, setFriends] = useState([]);

  const [cityName, setCityName] = useState("");
  const [weather, setWeather] = useState(null);

  const [posts, setPosts] = useState([]);

  // to cancel the callout on map press
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);

  // state for view mode
  const [viewMode, setViewMode] = useState("friends"); // 'posts', or 'friends'

  const [isCreatingPost, setIsCreatingPost] = useState(false);

  const isSimulator = () => {
    console.log("Device.isDevice:", Device.isDevice);
    return !Device.isDevice;
  };

  // Add camera button handler
  const handleNewPost = async () => {
    try {
      setIsCreatingPost(true);

      if (isSimulator()) {
        Alert.alert(
          "Simulator Detected",
          "Camera is not available on iOS Simulator. Please use a real device."
        );
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera permission is required");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: false,
        exif: false,
        allowsEditing: true,
        presentationStyle: "fullScreen",
      });

      console.log("Camera result:", result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];

        if (!asset.uri) {
          throw new Error("No image URI available");
        }

        const uriLower = asset.uri.toLowerCase();
        if (
          !uriLower.endsWith(".jpg") &&
          !uriLower.endsWith(".jpeg") &&
          !uriLower.endsWith(".png")
        ) {
          throw new Error("Invalid image format");
        }

        if (!location) {
          throw new Error("Location not available");
        }

        const locationData = {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString(),
        };

        console.log("Submitting post with data:", {
          imageUri: asset.uri,
          location: locationData,
        });

        await postService.createPost(user.uid, {
          imageUri: asset.uri,
          location: locationData,
          caption: "",
          createdAt: new Date().toISOString(),
        });

        Alert.alert("Success", "Post created successfully!");
      } else {
        console.log("Camera cancelled or no image selected");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert(
        "Error",
        `Failed to create post: ${error.message || "Unknown error"}`
      );
    } finally {
      setIsCreatingPost(false);
    }
  };

  const fetchWeatherAndCity = async (latitude, longitude) => {
    try {
      // Get city name from reverse geocoding
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${OPENWEATHER_API_KEY}`
      );
      const data = await response.json();
      setCityName(data[0]?.name || "Unknown Location");

      // Get weather data
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`
      );
      const weatherData = await weatherResponse.json();
      setWeather(weatherData);
    } catch (error) {
      console.error("Error fetching location info:", error);
    }
  };

  useEffect(() => {
    if (location) {
      fetchWeatherAndCity(location.latitude, location.longitude);
    }
  }, [location]);

  useEffect(() => {
    // Subscribe to posts from friends and self
    const unsubscribePosts = onSnapshot(
      query(
        collection(FIREBASE_DB, "posts"),
        where("userId", "in", [user.uid, ...friends.map((f) => f.uid)])
      ),
      async (snapshot) => {
        const postsData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const userProfile = await userService.getUserProfile(data.userId);

            const location = data.location
              ? {
                  latitude: data.location.latitude,
                  longitude: data.location.longitude,
                }
              : null;

            return {
              id: doc.id,
              ...data,
              location,
              username: userProfile.username,
              isOwnPost: data.userId === user.uid, // Add flag to identify own posts
            };
          })
        );
        const validPosts = postsData.filter((post) => post.location);
        setPosts(validPosts);
      }
    );

    return () => {
      unsubscribePosts();
    };
  }, [friends]); // Add friends as dependency since we use it in the query

  useEffect(() => {
    let locationSubscriber;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location is required");
        return;
      }

      // Watch user location
      locationSubscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000000,
          distanceInterval: 20,
        },
        async (newLocation) => {
          const loc = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };
          setLocation(loc);

          // Update user's location in Firestore
          if (user.settings.locationSharing) {
            await userService.updateUserLocation(user.uid, loc);
          }
        }
      );
    })();

    // Subscribe to friends collection
    const friendsQuery = query(
      collection(FIREBASE_DB, "friends"),
      where("users", "array-contains", user.uid),
      where("status", "==", "accepted")
    );

    // create an array to store all the unsubscribe functions
    const unsubscribers = [];

    const unsubscribeFriends = onSnapshot(friendsQuery, async (snapshot) => {
      const friendsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      try {
        // Clear all previous user settings subscriptions
        unsubscribers.forEach((unsub) => unsub());
        unsubscribers.length = 0;

        // Fetch profiles for each friend
        const friendProfiles = await Promise.all(
          friendsData.map(async (friend) => {
            const friendId = friend.users.find((id) => id !== user.uid);

            console.log("Processing friend ID:", friendId);

            const profile = await userService.getUserProfile(friendId);

            console.log(
              "Retrieved profile:",
              profile ? "exists" : "null",
              "for ID:",
              friendId
            );

            // Subscribe to user settings
            const settingsUnsub = onSnapshot(
              doc(FIREBASE_DB, "users", friendId),
              async (userDoc) => {
                const updatedSettings = userDoc.data()?.settings;
                if (updatedSettings) {
                  // Update the friend's settings in the friends list
                  setFriends((currentFriends) =>
                    currentFriends.map((f) =>
                      f.uid === friendId
                        ? { ...f, settings: updatedSettings }
                        : f
                    )
                  );
                }
              }
            );

            console.log("Profile data:", {
              id: friendId,
              username: profile.username,
              hasAvatar: !!profile.avatarUrl,
            });

            unsubscribers.push(settingsUnsub);

            let avatarUrl = null;
            if (profile.avatarUrl) {
              try {
                avatarUrl = await userService.getImageUrl(profile.avatarUrl);
              } catch (error) {
                console.log("Error loading avatar:", error);
              }
            } else {
              console.log("No avatar URL found for", profile.username);
              profile.avatarUrl = require("../assets/default-avatar.png");
              avatarUrl = require("../assets/default-avatar.png");
              console.log("Default avatar URL:", profile.avatarUrl);
              if (profile.avatarUrl) {
                console.log("Default avatar URL found for", profile.username);
              }
            }

            return {
              ...friend,
              ...profile,
              profile: {
                username: profile.username,
                avatarUrl: avatarUrl,
              },
            };
          })
        );

        //如果用户被删除了，这里会报错type error avatarURL为null，实则是找不到整个friendprofile，所以加上一个判断
        if (friendProfiles.length === 0) {
          setErrorMsg("No friends found");
        }

        setFriends(friendProfiles);
      } catch (error) {
        console.error("Error fetching friend profiles:", error);
      }
    });

    // Cleanup
    return () => {
      if (locationSubscriber) {
        locationSubscriber.remove();
      }
      unsubscribeFriends();
      // Unsubscribe from all user settings subscriptions
      unsubscribers.forEach((unsub) => unsub());
    };

    return () => {
      if (locationSubscriber) {
        locationSubscriber.remove();
      }
      unsubscribeFriends();
    };
  }, []);

  if (errorMsg) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text>{errorMsg}</Text>
      </SafeAreaView>
    );
  }

  if (!location) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text>Fetching location...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      {/* Weather and City Info Overlay */}
      <View
        className="absolute left-4 z-10 bg-black/50 rounded-lg p-2"
        style={{ top: 90 }}
      >
        <Text className="text-white text-lg font-semibold">
          {cityName || "Loading location..."}
        </Text>
        {weather?.main ? (
          <Text className="text-white text-sm">
            {Math.round(weather.main.temp)}°C{" "}
            {weather.weather?.[0]?.description}
          </Text>
        ) : (
          <Text className="text-white text-sm">Loading weather...</Text>
        )}
      </View>
      <MapView
        style={{ flex: 1 }}
        styleURL={Mapbox.StyleURL.Dark}
        terrain={true}
        pitchEnabled={true}
        pitch={60}
        logoEnabled={false}
        attributionEnabled={false}
        // Dismiss callout on map press
        onPress={() => setSelectedAnnotation(null)}
        deselectAnnotationOnTap={true}
      >
        <Mapbox.Camera
          zoomLevel={14}
          centerCoordinate={
            // If friends exist, center on first friend, otherwise center on user
            friends[0]?.location
              ? [friends[0].location.longitude, friends[0].location.latitude]
              : location
              ? [location.longitude, location.latitude]
              : [0, 0]
          }
          followUserLocation={false}
          followZoomLevel={14}
          animationDuration={200}
        />

        <Mapbox.UserLocation visible={true} />

        {/* Post Markers - only show if viewMode is 'all' or 'posts' */}
        {viewMode === "posts" &&
          posts.map((post) => (
            <Mapbox.MarkerView
              key={post.id}
              id={post.id}
              coordinate={[post.location.longitude, post.location.latitude]}
              allowOverlap={true}
            >
              <TouchableOpacity
                onPress={() => setSelectedAnnotation(post.id)}
                onLongPress={() => {
                  // can only delete own posts
                  if (post.isOwnPost) {
                    Alert.alert(
                      "Delete Post",
                      "Are you sure you want to delete this post?",
                      [
                        {
                          text: "Cancel",
                          style: "cancel",
                        },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: async () => {
                            try {
                              await postService.deletePost(
                                post.id,
                                post.imageUrl
                              );
                              setSelectedAnnotation(null);
                              Alert.alert(
                                "Success",
                                "Post deleted successfully"
                              );
                            } catch (error) {
                              console.error("Error deleting post:", error);
                              Alert.alert("Error", "Failed to delete post");
                            }
                          },
                        },
                      ]
                    );
                  }
                }}
                delayLongPress={2000} // long press of 2 seconds
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 8,
                  overflow: "hidden",
                  borderWidth: 2,
                  borderColor: "#e879f9", // fuchsia-400
                }}
              >
                <Image
                  source={
                    post.imageUrl
                      ? {
                          uri: post.imageUrl,
                          cache: "force-cache",
                          headers: { Pragma: "no-cache" },
                        }
                      : require("../assets/default-avatar.png")
                  }
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  resizeMode="cover"
                  onError={(e) =>
                    console.log("Error loading image:", e.nativeEvent.error)
                  }
                />
              </TouchableOpacity>

              {selectedAnnotation === post.id && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 70,
                    backgroundColor: "rgba(0,0,0,0.9)",
                    padding: 12,
                    borderRadius: 8,
                    width: 300,
                  }}
                >
                  <Image
                    source={{ uri: post.imageUrl }}
                    style={{ width: "100%", aspectRatio: 1 }}
                    resizeMode="cover"
                  />
                  <View style={{ marginTop: 8 }}>
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "500",
                        fontSize: 16,
                      }}
                    >
                      {post.username}
                    </Text>
                    {post.caption && (
                      <Text style={{ color: "#d1d5db", marginTop: 4 }}>
                        {post.caption}
                      </Text>
                    )}
                    <Text
                      style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}
                    >
                      {post.createdAt?.toDate().toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}
            </Mapbox.MarkerView>
          ))}

        {/* Friend Markers - only show if viewMode is 'all' or 'friends' */}
        {viewMode === "friends" &&
          friends.map((friend) =>
            friend.location && friend.settings?.locationSharing ? (
              <Mapbox.MarkerView
                key={friend.uid}
                id={friend.uid}
                coordinate={[
                  friend.location.longitude,
                  friend.location.latitude,
                ]}
                allowOverlap={true}
              >
                <TouchableOpacity
                  onPress={() => setSelectedAnnotation(friend.uid)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    overflow: "hidden",
                    borderWidth: 4,
                    borderColor: "white",
                    backgroundColor: "#374151",
                  }}
                >
                  <Image
                    // 这里改为检查string，否则null avatarurl会报错
                    source={
                      typeof friend.profile?.avatarUrl === "string"
                        ? { uri: friend.profile.avatarUrl }
                        : require("../assets/default-avatar.png")
                    }
                    defaultSource={require("../assets/default-avatar.png")}
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                    resizeMode="cover"
                    onError={(e) =>
                      console.log(
                        `Failed to load avatar for ${friend.username}:`,
                        e.nativeEvent.error
                      )
                    }
                  />
                </TouchableOpacity>

                {selectedAnnotation === friend.uid && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 55,
                      backgroundColor: "#1f2937",
                      padding: 12,
                      borderRadius: 8,
                      minWidth: 120,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Text style={{ color: "white", fontWeight: "500" }}>
                        {friend.username}
                      </Text>
                    </View>

                    <Text style={{ color: "#9ca3af", fontSize: 12 }}>
                      Last updated:{" "}
                      {friend.location.timestamp
                        ?.toDate()
                        .toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                    </Text>
                  </View>
                )}
              </Mapbox.MarkerView>
            ) : null
          )}
      </MapView>
      {/* Control Buttons */}
      <View className="absolute top-20 right-4 flex-row space-x-2">
        {/* View Toggle Button */}
        <TouchableOpacity
          onPress={() =>
            setViewMode(viewMode === "posts" ? "friends" : "posts")
          }
          className="w-12 h-12 bg-gray-800 rounded-full items-center justify-center"
        >
          <MaterialIcons
            name={viewMode === "friends" ? "photo-library" : "people"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
        {/* Camera Button - only show in posts mode */}
        {viewMode === "posts" && (
          <TouchableOpacity
            onPress={handleNewPost}
            className="w-12 h-12 bg-fuchsia-500 rounded-full items-center justify-center"
          >
            <MaterialIcons name="camera-alt" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {isCreatingPost && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <ActivityIndicator size="large" color="#e879f9" />
        </View>
      )}
    </SafeAreaView>
  );
};

export default Map;
