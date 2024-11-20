import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import Mapbox, { MapView } from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useUser } from "../Context/UserContext";
import { userService } from "../firebase/services/userService";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { FIREBASE_DB } from "../firebase/firebaseConfig";
import { Image } from "react-native";
import { postService } from "../firebase/services/postService";
import { TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

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

  // Add camera button handler
  const handleNewPost = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera permission is required");
        return;
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled) {
        // Create post with current location
        await postService.createPost(user.uid, {
          imageUri: result.assets[0].uri,
          location: location,
          caption: "", // Could add caption input
        });
      }
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Failed to create post");
    }
  };

  const fetchWeatherAndCity = async (latitude, longitude) => {
    try {
      // Get city name from reverse geocoding
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${OPENWEATHER_API_KEY}`
      );
      const data = await response.json();
      console.log("Location data:", data);
      setCityName(data[0]?.name || "Unknown Location");

      // Get weather data
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`
      );
      const weatherData = await weatherResponse.json();
      console.log("Weather data:", weatherData);
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
            return {
              id: doc.id,
              ...data,
              username: userProfile.username,
              isOwnPost: data.userId === user.uid, // Add flag to identify own posts
            };
          })
        );
        setPosts(postsData);
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

    const unsubscribeFriends = onSnapshot(friendsQuery, async (snapshot) => {
      const friendsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get friend profiles and locations
      const friendProfiles = await Promise.all(
        friendsData.map(async (friend) => {
          const friendId = friend.users.find((id) => id !== user.uid);
          const profile = await userService.getUserProfile(friendId);
          return {
            ...friend,
            ...profile,
          };
        })
      );

      setFriends(friendProfiles);
    });

    return () => {
      if (locationSubscriber) {
        locationSubscriber.remove();
      }
      unsubscribeFriends();
    };
  }, []);

  if (errorMsg) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Fetching location...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Weather and City Info Overlay */}
      <View className="absolute top-12 left-4 z-10 bg-black/50 rounded-lg p-3">
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
              : [location.longitude, location.latitude]
          }
          followUserLocation={false}
          followZoomLevel={14}
          animationDuration={200}
        />

        <Mapbox.UserLocation visible={true} />

        {/* Post Markers - only show if viewMode is 'all' or 'posts' */}
        {viewMode === "posts" &&
          posts.map((post) => (
            <Mapbox.PointAnnotation
              key={post.id}
              id={post.id}
              coordinate={[post.location.longitude, post.location.latitude]}
              anchor={{ x: 0.5, y: 0.5 }}
              // Show callout if selectedAnnotation matches post id
              selected={selectedAnnotation === post.id}
              // Set selectedAnnotation to post id on press
              onSelected={() => setSelectedAnnotation(post.id)}
              // Clear selectedAnnotation on callout close
              onDeselected={() => setSelectedAnnotation(null)}
            >
              {/* Post Thumbnail */}
              <View className="w-10 h-10 rounded-lg overflow-hidden border-2 border-fuchsia-400">
                <Image
                  source={{ uri: post.imageUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>

              <Mapbox.Callout>
                <View
                  className="bg-black/90 rounded-lg p-3"
                  style={{ width: 300 }}
                >
                  <Image
                    source={{ uri: post.imageUrl }}
                    style={{ width: "100%", aspectRatio: 1 }}
                    resizeMode="cover"
                    className="rounded-lg"
                  />
                  <View className="mt-2">
                    <Text className="text-white font-medium text-base">
                      {post.username}
                    </Text>
                    {post.caption && (
                      <Text className="text-gray-300 mt-1">{post.caption}</Text>
                    )}
                    <Text className="text-gray-400 text-xs mt-1">
                      {post.createdAt?.toDate().toLocaleString()}
                    </Text>
                  </View>
                </View>
              </Mapbox.Callout>
            </Mapbox.PointAnnotation>
          ))}

        {/* Friend Markers - only show if viewMode is 'all' or 'friends' */}
        {viewMode === "friends" &&
          friends.map((friend) =>
            friend.location && friend.settings?.locationSharing ? (
              <Mapbox.PointAnnotation
                key={friend.uid}
                id={friend.uid}
                coordinate={[
                  friend.location.longitude,
                  friend.location.latitude,
                ]}
                selected={selectedAnnotation === friend.uid}
                onSelected={() => setSelectedAnnotation(friend.uid)}
                onDeselected={() => setSelectedAnnotation(null)}
              >
                {/* Square Avatar Container */}
                <View className="w-12 h-12 rounded-lg overflow-hidden border-4 border-white">
                  <Image
                    source={
                      friend.profile?.avatarUrl !== undefined
                        ? { uri: friend.profile.avatarUrl }
                        : require("../assets/default-avatar.png")
                    }
                    defaultSource={require("../assets/default-avatar.png")}
                    onError={() =>
                      console.log(
                        `Failed to load avatar for ${friend.profile?.username}`
                      )
                    }
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>

                {/* Info Callout */}
                <Mapbox.Callout title={friend.username}>
                  <View className="p-3 bg-gray-800 rounded-lg min-w-[120px]">
                    {/* Username row */}
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-white font-medium">
                        {friend.username}
                      </Text>
                    </View>

                    {/* Last updated row */}
                    <Text className="text-gray-400 text-xs">
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
                </Mapbox.Callout>
              </Mapbox.PointAnnotation>
            ) : null
          )}
      </MapView>
      {/* Control Buttons */}
      <View className="absolute top-12 right-4 flex-row space-x-2">
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
    </View>
  );
};

export default Map;
