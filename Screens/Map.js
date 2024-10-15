import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useUser } from '../Context/UserContext';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const MainScreen = () => {
  const { user } = useUser();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let subscriber;

    (async () => {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location is required');
        return;
      }

      // Subscribe to location updates
      subscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // Update every 30 second
          distanceInterval: 50, // Update every 50 meter
        },
        (loc) => {
          setLocation(loc.coords);
        }
      );
    })();

    // Clean up the subscription on unmount
    return () => {
      if (subscriber) {
        subscriber.remove();
      }
    }; 
  }, []);

  if (errorMsg) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Fetching location...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ width: '100%', height: '100%' }}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005, // zoom level adjustment
          longitudeDelta: 0.005,
        }}
        showsUserLocation={true} // display user's blue dot on the map
        followsUserLocation={true} // follow user's location
      >
        <Marker
          coordinate={location}
          title="Your Location"
          description="You are here"
        />
      </MapView>
    </View>
  );
};

export default MainScreen;
