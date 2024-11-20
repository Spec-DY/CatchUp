import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useUser } from "../Context/UserContext";
import { userService } from "../firebase/services/userService";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { FIREBASE_DB } from "../firebase/firebaseConfig";

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
// Initialize Mapbox with access token
MapboxGL.setAccessToken(mapboxToken);

const Map = () => {
  const { user } = useUser();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [friends, setFriends] = useState([]);

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
          timeInterval: 30000,
          distanceInterval: 100,
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
      <MapboxGL.MapView style={{ flex: 1 }} styleURL={MapboxGL.StyleURL.Street}>
        <MapboxGL.Camera
          zoomLevel={14}
          centerCoordinate={[location.longitude, location.latitude]}
          followUserLocation={true}
        />

        <MapboxGL.UserLocation visible={true} />

        {/* Show friend markers */}
        {friends.map((friend) =>
          friend.location && friend.settings?.locationSharing ? (
            <MapboxGL.PointAnnotation
              key={friend.uid}
              id={friend.uid}
              coordinate={[friend.location.longitude, friend.location.latitude]}
            >
              <MapboxGL.Callout title={friend.username}>
                <View>
                  <Text>{friend.username}</Text>
                  <Text>
                    Last updated:{" "}
                    {new Date(friend.location.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              </MapboxGL.Callout>
            </MapboxGL.PointAnnotation>
          ) : null
        )}
      </MapboxGL.MapView>
    </View>
  );
};

export default Map;
