import React from "react";
import { View, Text, Image, Platform, StyleSheet } from "react-native";

const MapInfoWindow = ({ item, type, visible }) => {
  if (!visible || Platform.OS === "ios") return null;

  if (type === "post") {
    return (
      <View style={styles.container}>
        <View style={styles.postContainer}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.postImage}
            resizeMode="cover"
          />
          <View style={styles.postInfo}>
            <Text style={styles.username}>{item.username}</Text>
            {item.caption && <Text style={styles.caption}>{item.caption}</Text>}
            <Text style={styles.timestamp}>
              {item.createdAt?.toDate().toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (type === "friend") {
    return (
      <View style={styles.container}>
        <View style={styles.friendContainer}>
          <View style={styles.friendInfo}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.timestamp}>
              Last updated:{" "}
              {item.location.timestamp?.toDate().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
    elevation: 5,
  },
  postContainer: {
    backgroundColor: "rgba(0,0,0,0.9)",
    borderRadius: 8,
    padding: 12,
  },
  friendContainer: {
    backgroundColor: "#1f2937",
    borderRadius: 8,
    padding: 12,
  },
  postImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 4,
  },
  postInfo: {
    marginTop: 8,
  },
  friendInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  username: {
    color: "white",
    fontWeight: "500",
    fontSize: 16,
  },
  caption: {
    color: "#d1d5db",
    marginTop: 4,
  },
  timestamp: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
  },
});

export default MapInfoWindow;
