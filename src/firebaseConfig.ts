import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC6yjKejZltMuWieN7aAPaMau3mLMftPJY",
  authDomain: "argbot-6deb4.firebaseapp.com",
  projectId: "argbot-6deb4",
  storageBucket: "argbot-6deb4.firebasestorage.app",
  messagingSenderId: "207884217858",
  appId: "1:207884217858:web:752727fe37f61122f9411b"
};

// Singleton pattern: si ya hay una app, la usa. Si no, la inicializa.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
