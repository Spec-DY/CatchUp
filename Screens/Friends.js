import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useUser } from "../Context/UserContext";
import { friendService } from "../firebase/services/friendService";
import { userService } from "../firebase/services/userService";
import { Input } from "@rneui/themed";
import { debounce } from "lodash";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { FIREBASE_DB } from "../firebase/firebaseConfig";

const Friends = () => {
  const { user } = useUser();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // Subscribe to friends collection changes
    const friendsUnsubscribe = query(
      collection(FIREBASE_DB, "friends"),
      where("users", "array-contains", user.uid)
    );

    // Subscribe to pending requests
    const requestsUnsubscribe = query(
      collection(FIREBASE_DB, "friends"),
      where("receiver", "==", user.uid),
      where("status", "==", "pending")
    );

    // Set up realtime listeners
    const unsubscribeFriends = onSnapshot(
      friendsUnsubscribe,
      async (snapshot) => {
        const friendsData = snapshot.docs
          .filter((doc) => doc.data().status === "accepted")
          .map((doc) => ({ id: doc.id, ...doc.data() }));

        // Load friend profiles
        const friendProfiles = await Promise.all(
          friendsData.map(async (friend) => {
            const friendId = friend.users.find((id) => id !== user.uid);
            const profile = await userService.getUserProfile(friendId);
            return { ...friend, profile };
          })
        );

        setFriends(friendProfiles);
        setLoading(false);
      }
    );

    const unsubscribeRequests = onSnapshot(
      requestsUnsubscribe,
      async (snapshot) => {
        const requestsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Load request sender profiles
        const requestProfiles = await Promise.all(
          requestsData.map(async (request) => {
            const profile = await userService.getUserProfile(request.sender);
            return { ...request, profile };
          })
        );

        setPendingRequests(requestProfiles);
      }
    );

    // Clean up subscriptions on unmount
    return () => {
      unsubscribeFriends();
      unsubscribeRequests();
    };
  }, [user.uid]);

  const searchUser = debounce(async (email) => {
    if (!email) {
      setSearchResult(null);
      return;
    }

    setSearching(true);
    try {
      // store user in result
      const result = await userService.findUserByEmail(email);
      if (result?.uid === user.uid) {
        setSearchResult({ error: "You can't add yourself!" });
      } else if (user.friends?.includes(result?.uid)) {
        setSearchResult({
          user: result,
          alreadyFriend: true,
        });
      } else {
        // Check pending requests only if not already friends
        const pending = pendingRequests.find((r) =>
          r.users.includes(result?.uid)
        );

        setSearchResult({
          user: result,
          alreadyFriend: false,
          // force convert to boolean
          pendingRequest: !!pending,
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResult({ error: "Failed to search user" });
    } finally {
      setSearching(false);
    }
  }, 1000);

  const handleSendRequest = async (receiverId) => {
    try {
      await friendService.sendFriendRequest(user.uid, receiverId);
      setSearchEmail("");
      setSearchResult(null);
      Alert.alert("Success", "Friend request sent!");
    } catch (error) {
      console.error("Error sending request:", error);
      Alert.alert("Error", "Failed to send friend request");
    }
  };

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await friendService.acceptFriendRequest(friendshipId);
      Alert.alert("Success", "Friend request accepted!");
    } catch (error) {
      console.error("Error accepting request:", error);
      Alert.alert("Error", "Failed to accept friend request");
    }
  };

  const handleRejectRequest = async (friendshipId) => {
    try {
      await friendService.rejectFriendRequest(friendshipId);
      Alert.alert("Success", "Friend request rejected");
    } catch (error) {
      console.error("Error rejecting request:", error);
      Alert.alert("Error", "Failed to reject friend request");
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await friendService.removeFriendship(user.uid, friendId);
      Alert.alert("Success", "Friend removed successfully");
    } catch (error) {
      console.error("Error removing friend:", error);
      Alert.alert("Error", "Failed to remove friend");
    }
  };

  const renderFriend = ({ item }) => (
    <View className="bg-gray-800 rounded-lg mb-2">
      <TouchableOpacity
        className="flex-row items-center justify-between p-4"
        onPress={() => {
          /* Navigate to friend profile */
        }}
      >
        <View className="flex-row items-center">
          <Image
            source={{ uri: item.profile.avatarUrl }}
            className="w-12 h-12 rounded-full mr-4"
          />
          <View>
            <Text className="text-white font-medium">
              {item.profile.username}
            </Text>
            <Text className="text-gray-400">Online status</Text>
          </View>
        </View>

        {/* Circular Remove Friend Button */}
        <TouchableOpacity
          className="h-10 w-10 bg-red-500 rounded-full items-center justify-center"
          onPress={() => {
            Alert.alert(
              "Remove Friend",
              `Are you sure you want to remove ${item.profile.username} from your friends?`,
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Remove",
                  onPress: () => handleRemoveFriend(item.profile.uid),
                  style: "destructive",
                },
              ]
            );
          }}
        >
          <Text className="text-white text-xl">×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black p-4">
      {/* Search Section */}
      <View className="mb-4">
        <Input
          placeholder="Search by email"
          value={searchEmail}
          onChangeText={(text) => {
            setSearchEmail(text);
            searchUser(text);
          }}
          leftIcon={{ type: "font-awesome", name: "search", color: "gray" }}
          inputStyle={{ color: "white" }}
          placeholderTextColor="gray"
          containerStyle={{ paddingHorizontal: 0 }}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {searching && (
          <Text className="text-gray-400 text-center">Searching...</Text>
        )}

        {searchResult && (
          <View className="bg-gray-800 rounded-lg p-4 mb-4">
            {searchResult.error ? (
              <Text className="text-red-500">{searchResult.error}</Text>
            ) : searchResult.user ? (
              <View>
                <View className="flex-row items-center">
                  {/*!!! need to be modified set to default avatar if avatar undefined */}
                  <Image
                    source={{ uri: searchResult.user.avatarUrl }}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <View>
                    <Text className="text-white font-medium">
                      {searchResult.user.username}
                    </Text>
                    <Text className="text-gray-400">
                      {searchResult.user.email}
                    </Text>
                  </View>
                </View>

                {searchResult.alreadyFriend ? (
                  <Text className="text-gray-400 mt-2">Already friends</Text>
                ) : searchResult.pendingRequest ? (
                  <Text className="text-gray-400 mt-2">Request pending</Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleSendRequest(searchResult.user.uid)}
                    className="bg-blue-500 p-2 rounded mt-2"
                  >
                    <Text className="text-white text-center">
                      Send Friend Request
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <Text className="text-gray-400">No user found</Text>
            )}
          </View>
        )}
      </View>

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <View className="mb-4">
          <Text className="text-white font-bold mb-2">Friend Requests</Text>
          {pendingRequests.map((request) => (
            <View key={request.id} className="bg-gray-800 p-4 rounded-lg mb-2">
              <View className="flex-row items-center mb-3">
                <Image
                  source={{ uri: request.profile.avatarUrl }}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <View>
                  <Text className="text-white font-medium">
                    {request.profile.username}
                  </Text>
                  <Text className="text-gray-400">{request.profile.email}</Text>
                </View>
              </View>

              <View className="flex-row justify-end space-x-2">
                <TouchableOpacity
                  onPress={() => handleRejectRequest(request.id)}
                  className="bg-red-500 px-4 py-2 rounded"
                >
                  <Text className="text-white text-center">Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAcceptRequest(request.id)}
                  className="bg-blue-500 px-4 py-2 rounded"
                >
                  <Text className="text-white text-center">Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Friends List */}
      <Text className="text-white font-bold mb-2">Friends</Text>
      <FlatList
        data={friends}
        renderItem={renderFriend}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text className="text-gray-400 text-center">No friends yet</Text>
        }
      />
    </View>
  );
};

export default Friends;
