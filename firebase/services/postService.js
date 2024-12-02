import { FIREBASE_DB, FIREBASE_STORAGE } from "../firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  serverTimestamp,
  getDocs,
  GeoPoint,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

export const postService = {
  async createPost(userId, { imageUri, location, caption }) {
    try {
      // Create unique filename with timestamp
      const timestamp = Date.now();
      const imageRef = ref(
        FIREBASE_STORAGE,
        `posts/${userId}_${timestamp}.jpg`
      );

      // read file info
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error("Image file does not exist");
      }

      let response;
      if (Platform.OS === "ios") {
        response = await fetch(
          `data:image/jpeg;base64,${await FileSystem.readAsStringAsync(
            imageUri,
            {
              encoding: FileSystem.EncodingType.Base64,
            }
          )}`
        );
      } else {
        response = await fetch(imageUri);
      }

      const blob = await response.blob();

      // Upload image to Firebase Storage
      await uploadBytes(imageRef, blob);
      const imageUrl = await getDownloadURL(imageRef);

      const postData = {
        userId,
        imageUrl,
        location: new GeoPoint(location.latitude, location.longitude),
        caption,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(FIREBASE_DB, "posts"), postData);
      console.log("Post created successfully:", docRef.id);
      return { id: docRef.id, ...postData };
    } catch (error) {
      console.error("Error details:", error);
      throw error;
    }
  },

  async getFriendsPosts(userIds) {
    try {
      const q = query(
        collection(FIREBASE_DB, "posts"),
        where("userId", "in", userIds)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Convert GeoPoint back to {latitude, longitude} format
        location: {
          latitude: doc.data().location.latitude,
          longitude: doc.data().location.longitude,
        },
      }));
    } catch (error) {
      console.error("Error getting posts:", error);
      throw error;
    }
  },

  async deletePost(postId, imageUrl) {
    try {
      await deleteDoc(doc(FIREBASE_DB, "posts", postId));
      const storageRef = ref(FIREBASE_STORAGE, imageUrl);
      await deleteObject(storageRef);

      return true;
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  },
};
