//DO NOT change firebase to @react-native-firebase, it won't work if we want to use expo
import { initializeApp } from "firebase/app";
import {getAuth} from 'firebase/auth';


// This is copied from firebase settings
// 项目设置->常规，下拉后有个web应用
const firebaseConfig = {
  apiKey: "AIzaSyAB6gIGRhUu2jxAEAKfMkEv7kSb5kmafWM",
  authDomain: "locationsharing-f84da.firebaseapp.com",
  projectId: "locationsharing-f84da",
  storageBucket: "locationsharing-f84da.appspot.com",
  messagingSenderId: "821103618230",
  appId: "1:821103618230:web:683bbe90368f655c449e17"
};


export const FIREBASE_APP = initializeApp(firebaseConfig)
export const FIREBASE_AUTH = getAuth(FIREBASE_APP)
