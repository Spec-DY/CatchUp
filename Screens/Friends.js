import React, { useState, useEffect, useMemo } from "react";
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
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { FIREBASE_DB } from "../firebase/firebaseConfig";
import defaultAvatar from "../assets/default-avatar.png";
import { MaterialIcons } from "@expo/vector-icons";
import debounce from "lodash/debounce";
import SafeAreaContainer from "../Components/SafeAreaContainer";

const Friends = () => {
  const { user } = useUser();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchResultAvatar, setSearchResultAvatar] = useState(null);
  const [avatarCache, setAvatarCache] = useState({});

  const loadSearchResultAvatar = async (avatarPath) => {
    try {
      if (!avatarPath) {
        setSearchResultAvatar(null);
        return;
      }
      const url = await userService.getImageUrl(avatarPath);
      setSearchResultAvatar(url);
    } catch (error) {
      console.log("Error loading avatar:", error);
      setSearchResultAvatar(null);
    }
  };

  useEffect(() => {
    const loadFriendProfiles = async (friendsData) => {
      try {
        const friendProfiles = await Promise.all(
          friendsData.map(async (friend) => {
            try {
              const friendId = friend.users.find((id) => id !== user.uid);

              // Check avatar cache first
              if (avatarCache[friendId]) {
                return {
                  ...friend,
                  profile: {
                    ...friend.profile,
                    avatarUrl: avatarCache[friendId],
                  },
                };
              }

              const profile = await userService.getUserProfile(friendId);

              if (profile.avatarUrl) {
                try {
                  const avatarUrl = await userService.getImageUrl(
                    profile.avatarUrl
                  );
                  // Update cache
                  setAvatarCache((prev) => ({
                    ...prev,
                    [friendId]: avatarUrl,
                  }));
                  profile.avatarUrl = avatarUrl;
                } catch (error) {
                  console.log(
                    "Error loading avatar for friend:",
                    friendId,
                    error
                  );
                  profile.avatarUrl = null;
                }
              } else {
                console.log("No avatarURl found for friend:", friendId);
              }

              return { ...friend, profile };
            } catch (error) {
              console.log("Error loading friend profile:", error);
              return {
                ...friend,
                profile: { username: "Unknown", avatarUrl: null },
              };
            }
          })
        );

        setFriends(friendProfiles);
      } catch (error) {
        console.log("Error processing friends data:", error);
      } finally {
        setLoading(false);
      }
    };

    const friendsUnsubscribe = query(
      collection(FIREBASE_DB, "friends"),
      where("users", "array-contains", user.uid)
    );

    const requestsUnsubscribe = query(
      collection(FIREBASE_DB, "friends"),
      where("receiver", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsubscribeFriends = onSnapshot(
      friendsUnsubscribe,
      async (snapshot) => {
        const friendsData = snapshot.docs
          .filter((doc) => doc.data().status === "accepted")
          .map((doc) => ({ id: doc.id, ...doc.data() }));

        await loadFriendProfiles(friendsData);
      }
    );

    const unsubscribeRequests = onSnapshot(
      requestsUnsubscribe,
      async (snapshot) => {
        const requestsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const requestProfiles = await Promise.all(
          requestsData.map(async (request) => {
            try {
              const profile = await userService.getUserProfile(request.sender);
              if (profile.avatarUrl) {
                try {
                  // Check cache first for pending requests
                  if (avatarCache[request.sender]) {
                    profile.avatarUrl = avatarCache[request.sender];
                  } else {
                    const avatarUrl = await userService.getImageUrl(
                      profile.avatarUrl
                    );
                    setAvatarCache((prev) => ({
                      ...prev,
                      [request.sender]: avatarUrl,
                    }));
                    profile.avatarUrl = avatarUrl;
                  }
                } catch (error) {
                  console.log(
                    "Error loading avatar for request:",
                    request.sender,
                    error
                  );
                  profile.avatarUrl = null;
                }
              }
              return { ...request, profile };
            } catch (error) {
              console.log("Error loading request profile:", error);
              return {
                ...request,
                profile: { username: "Unknown", avatarUrl: null },
              };
            }
          })
        );

        setPendingRequests(requestProfiles);
      }
    );

    return () => {
      unsubscribeFriends();
      unsubscribeRequests();
    };
  }, [user.uid]);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (email) => {
        if (!email) {
          setSearchResult(null);
          return;
        }

        setSearching(true);
        try {
          const result = await userService.findUserByEmail(email);
          if (!result) {
            setSearchResult({ error: "User not found" });
            return;
          }
          if (result?.uid === user.uid) {
            setSearchResult({ error: "You can't add yourself!" });
            return;
          }

          if (result.avatarUrl) {
            try {
              // Check cache first for search results
              if (avatarCache[result.uid]) {
                result.avatarUrl = avatarCache[result.uid];
                setSearchResultAvatar(avatarCache[result.uid]);
              } else {
                const avatarUrl = await userService.getImageUrl(
                  result.avatarUrl
                );
                setAvatarCache((prev) => ({
                  ...prev,
                  [result.uid]: avatarUrl,
                }));
                result.avatarUrl = avatarUrl;
                await loadSearchResultAvatar(result.avatarUrl);
              }
            } catch (error) {
              console.log("Error loading search result avatar:", error);
              result.avatarUrl = null;
            }
          }

          if (user.friends?.includes(result?.uid)) {
            setSearchResult({
              user: result,
              alreadyFriend: true,
            });
          } else {
            const pending = pendingRequests.find((r) =>
              r.users.includes(result?.uid)
            );
            setSearchResult({
              user: result,
              alreadyFriend: false,
              pendingRequest: !!pending,
            });
          }
        } catch (error) {
          console.error("Search error:", error);
          setSearchResult({ error: "Failed to search user" });
        } finally {
          setSearching(false);
        }
      }, 500),
    [user.uid, pendingRequests, avatarCache]
  );

  const handleSearchChange = (text) => {
    setSearchEmail(text);
    if (!text) {
      setSearchResult(null);
      return;
    }
    debouncedSearch(text);
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

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

  const FriendItem = ({ item }) => {
    const [hasError, setHasError] = useState(false);
    const friendId = item.users.find((id) => id !== user.uid);
    const avatarUrl =
      !hasError && (avatarCache[friendId] || item.profile?.avatarUrl);

    return (
      <View className="bg-gray-800 rounded-lg mb-2">
        <TouchableOpacity
          className="flex-row items-center justify-between p-4"
          onPress={() => {
            /* Navigate to friend profile */
          }}
        >
          <View className="flex-row items-center">
            <Image
              source={avatarUrl ? { uri: avatarUrl } : defaultAvatar}
              defaultSource={defaultAvatar}
              onError={() => {
                setHasError(true);
                console.log(
                  `Failed to load avatar for ${item.profile?.username}`
                );
              }}
              className="w-12 h-12 rounded-full mr-4"
              resizeMode="cover"
            />
            <View>
              <Text className="text-white font-medium">
                {item.profile?.username || "Unknown"}
              </Text>
              <Text className="text-gray-400">Online status</Text>
            </View>
          </View>

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
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaContainer>
      <View className="mb-2 px-6 pt-4">
        <View className="flex-row items-center">
          <Input
            placeholder="Search by email"
            value={searchEmail}
            onChangeText={handleSearchChange}
            inputStyle={{ color: "white" }}
            placeholderTextColor="gray"
            containerStyle={{ flex: 1, paddingHorizontal: 0, marginRight: 8 }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity
            onPress={() => searchEmail && debouncedSearch(searchEmail)}
            className="bg-gray-800 p-3 rounded-full"
          >
            <MaterialIcons name="search" size={24} color="white" />
          </TouchableOpacity>
        </View>

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
                  <Image
                    source={
                      searchResultAvatar
                        ? { uri: searchResultAvatar }
                        : defaultAvatar
                    }
                    defaultSource={defaultAvatar}
                    onError={() => {
                      console.log(
                        `Failed to load avatar for ${searchResult.user?.username}`
                      );
                      setSearchResultAvatar(null);
                    }}
                    className="w-12 h-12 rounded-full mr-4"
                    resizeMode="cover"
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
            ) : null}
          </View>
        )}
      </View>

      {pendingRequests.length > 0 && (
        <View className="mb-4">
          <Text className="text-white font-bold mb-2">Friend Requests</Text>
          {pendingRequests.map((request) => (
            <View key={request.id} className="bg-gray-800 p-4 rounded-lg mb-2">
              <View className="flex-row items-center mb-3">
                <Image
                  source={
                    avatarCache[request.sender] || request.profile?.avatarUrl
                      ? {
                          uri:
                            avatarCache[request.sender] ||
                            request.profile.avatarUrl,
                        }
                      : defaultAvatar
                  }
                  defaultSource={defaultAvatar}
                  onError={() => {
                    console.log(
                      `Failed to load avatar for ${request.profile?.username}`
                    );
                  }}
                  className="w-12 h-12 rounded-full mr-4"
                  resizeMode="cover"
                />
                <View>
                  <Text className="text-white font-medium">
                    {request.profile?.username || "Unknown"}
                  </Text>
                  <Text className="text-gray-400">
                    {request.profile?.email}
                  </Text>
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

      <View className="flex-1 px-6">
        <Text className="text-white font-bold mb-2">Friends</Text>
        <FlatList
          data={friends}
          renderItem={({ item }) => <FriendItem item={item} />}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text className="text-gray-400 text-center">No friends yet</Text>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </SafeAreaContainer>
  );
};

export default Friends;
