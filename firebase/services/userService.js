// firebase/services/userService.js
import { FIREBASE_DB, FIREBASE_STORAGE } from "../firebaseConfig";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, query, where, getDocs } from "firebase/firestore";

export const userService = {
  // Upload profile image to Firebase Storage
  async uploadProfileImage(userId, imageUri) {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const storageRef = ref(FIREBASE_STORAGE, `profile_images/${userId}`);

      // upload and get upload result
      const uploadResult = await uploadBytes(storageRef, blob);
      console.log("Upload result:", uploadResult);

      // return the full path instead of download URL
      return uploadResult.metadata.fullPath;
    } catch (error) {
      console.error("Error uploading profile image:", error);
      throw new Error("Failed to upload profile image");
    }
  },

  // Helper function to get download URL from storage path
  async getImageUrl(imagePath) {
    try {
      const storageRef = ref(FIREBASE_STORAGE, imagePath);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error getting image URL:", error);
      return null;
    }
  },

  // CREATE user profile in user collection
  async createUserProfile(userId, { email, username, avatarUrl, gender }) {
    try {
      const userRef = doc(FIREBASE_DB, "users", userId);
      const profileData = {
        uid: userId,
        email,
        username,
        avatarUrl,
        gender,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        friends: [],
        settings: {
          locationSharing: true,
          notifications: true,
        },
      };

      await setDoc(userRef, profileData);
      return profileData;
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw new Error("Failed to create user profile");
    }
  },

  // READ user profile
  async getUserProfile(userId) {
    try {
      const userRef = doc(FIREBASE_DB, "users", userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw new Error("Failed to get user profile");
    }
  },

  // UPDATE user profile
  async updateUserProfile(userId, updates) {
    try {
      const userRef = doc(FIREBASE_DB, "users", userId);
      await updateDoc(userRef, {
        ...updates,
        lastActive: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw new Error("Failed to update user profile");
    }
  },

  // UPDATE user settings
  async updateUserSettings(userId, settings) {
    try {
      const userRef = doc(FIREBASE_DB, "users", userId);
      await updateDoc(userRef, {
        settings,
        lastActive: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating user settings:", error);
      throw new Error("Failed to update user settings");
    }
  },

  async findUserByEmail(email) {
    if (!email) return null;

    try {
      const q = query(
        collection(FIREBASE_DB, "users"),
        where("email", "==", email.toLowerCase())
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const userDoc = snapshot.docs[0];
      // Return consistent shape with getUserProfile
      return {
        uid: userDoc.id, // Use uid to be consistent
        id: userDoc.id,
        ...userDoc.data(),
      };
    } catch (error) {
      console.error("Error finding user:", error);
      throw new Error("Failed to find user by email");
    }
  },

  // Add to userService.js
  async updateUserLocation(userId, location) {
    try {
      const userRef = doc(FIREBASE_DB, "users", userId);
      await updateDoc(userRef, {
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: serverTimestamp(),
        },
        lastActive: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating location:", error);
      throw error;
    }
  },
};
