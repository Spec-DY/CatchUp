import { FIREBASE_DB } from "../firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export const friendService = {
  // Send friend request
  async sendFriendRequest(senderId, receiverId) {
    const friendshipId = [senderId, receiverId].sort().join("_");

    try {
      await setDoc(doc(FIREBASE_DB, "friends", friendshipId), {
        users: [senderId, receiverId],
        status: "pending",
        sender: senderId,
        receiver: receiverId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
      throw error;
    }
  },

  // Accept friend request
  async acceptFriendRequest(friendshipId) {
    try {
      await updateDoc(doc(FIREBASE_DB, "friends", friendshipId), {
        status: "accepted",
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      throw error;
    }
  },

  // Get user's friends
  async getFriends(userId) {
    try {
      const q = query(
        collection(FIREBASE_DB, "friends"),
        where("users", "array-contains", userId),
        where("status", "==", "accepted")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting friends:", error);
      throw error;
    }
  },

  // Get pending friend requests
  async getPendingRequests(userId) {
    try {
      const q = query(
        collection(FIREBASE_DB, "friends"),
        where("receiver", "==", userId),
        where("status", "==", "pending")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting pending requests:", error);
      throw error;
    }
  },

  async rejectFriendRequest(friendshipId) {
    try {
      await updateDoc(doc(FIREBASE_DB, "friends", friendshipId), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      throw error;
    }
  },
};
