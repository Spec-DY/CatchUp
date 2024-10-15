//DO NOT change firebase to @react-native-firebase if we want to use expo
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This is copied from firebase settings
const firebaseConfig = {

  apiKey: "AIzaSyDjppgF_Q8SgrySNKuJTSQITFn2uVL7LuQ",
  authDomain: "locationsharingapp-51ef6.firebaseapp.com",
  projectId: "locationsharingapp-51ef6",
  storageBucket: "locationsharingapp-51ef6.appspot.com",
  messagingSenderId: "365552357811",
  appId: "1:365552357811:web:b1e2701522190dea75bbc6"

};

export const FIREBASE_APP = initializeApp(firebaseConfig)
export const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
  persistence: getReactNativePersistence(AsyncStorage)
});
