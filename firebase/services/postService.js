import { FIREBASE_DB, FIREBASE_STORAGE } from "../firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  serverTimestamp,
  getDocs,
  GeoPoint,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const postService = {
  async createPost(userId, { imageUri, location, caption }) {
    try {
      // Create unique filename with timestamp
      const timestamp = Date.now();
      const imageRef = ref(FIREBASE_STORAGE, `posts/${userId}_${timestamp}`);

      const response = await fetch(imageUri);
      const blob = await response.blob();
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
      return { id: docRef.id, ...postData };
    } catch (error) {
      console.error("Error creating post:", error);
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
};
