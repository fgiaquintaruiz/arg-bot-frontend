import { GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { auth } from './firebaseConfig';

const provider = new GoogleAuthProvider();

export const loginWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Login error", error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error", error);
    throw error;
  }
};