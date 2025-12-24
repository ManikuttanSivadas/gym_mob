// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAxrftbuCxx7txbHhdiRplN84jgtXy9b2w",
  authDomain: "strive-26194.firebaseapp.com",
  projectId: "strive-26194",
  storageBucket: "strive-26194.firebasestorage.app",
  messagingSenderId: "943027005776",
  appId: "1:943027005776:web:4e126a348c07251728e455",
  measurementId: "G-WW1K7F6CKW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;