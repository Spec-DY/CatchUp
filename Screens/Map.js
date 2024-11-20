import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import Mapbox, { MapView } from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useUser } from "../Context/UserContext";
import { userService } from "../firebase/services/userService";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { FIREBASE_DB } from "../firebase/firebaseConfig";
import { Image } from "react-native";

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

        {/* Show friend markers */}
        {friends.map((friend) =>
          friend.location && friend.settings?.locationSharing ? (
            <Mapbox.PointAnnotation
              key={friend.uid}
              id={friend.uid}
              coordinate={[friend.location.longitude, friend.location.latitude]}
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
    </View>
  );
};

export default Map;
