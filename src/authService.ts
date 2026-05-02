import { GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { auth } from './firebaseConfig';
import { storeTokenFromFirebase } from './googleDrive';

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

// Module-level constant — parsed once at load time (Vite: import.meta.env, NOT process.env)
export const WHITELIST = new Set(
  (import.meta.env.VITE_WHITELIST_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean)
);

// Pure function — no I/O, no env access, just checks the cached Set
export function checkWhitelist(email: string | null | undefined): boolean {
  if (!email) return false;
  return WHITELIST.has(email.trim().toLowerCase());
}

export async function enforceWhitelist(user: User): Promise<User> {
  if (!checkWhitelist(user.email)) {
    await signOut(auth);
    throw new Error('ACCESS_DENIED');
  }
  return user;
}

export const loginWithGoogle = async (): Promise<User | void> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = await enforceWhitelist(result.user);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      storeTokenFromFirebase(credential.accessToken);
    }
    return user;
  } catch (error) {
    if (error instanceof Error && error.message === 'ACCESS_DENIED') {
      throw error;
    }
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