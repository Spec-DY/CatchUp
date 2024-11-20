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
  runTransaction,
  getDoc,
} from "firebase/firestore";
import { userService } from "./userService";

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
      // Get friendship doc
      const friendshipRef = doc(FIREBASE_DB, "friends", friendshipId);
      const friendshipDoc = await getDoc(friendshipRef);
      const { sender, receiver } = friendshipDoc.data();

      // Start transaction to update both users and friendship status
      await runTransaction(FIREBASE_DB, async (transaction) => {
        // Add each user to other's friends array
        await userService.addFriend(sender, receiver);
        await userService.addFriend(receiver, sender);

        // Update friendship status
        await transaction.update(friendshipRef, {
          status: "accepted",
          acceptedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
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

  async removeFriendship(userId, friendId) {
    try {
      await runTransaction(FIREBASE_DB, async (transaction) => {
        // Remove from both users' friends arrays
        await userService.removeFriend(userId, friendId);
        await userService.removeFriend(friendId, userId);

        // Update friendship doc
        const friendshipId = [userId, friendId].sort().join("_");
        const friendshipRef = doc(FIREBASE_DB, "friends", friendshipId);
        await transaction.update(friendshipRef, {
          status: "removed",
          removedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      console.error("Error removing friendship:", error);
      throw error;
    }
  },
};
