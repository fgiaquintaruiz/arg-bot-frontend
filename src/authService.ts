import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, getRedirectResult, User } from "firebase/auth";
import { auth } from './firebaseConfig';

const provider = new GoogleAuthProvider();

export function isStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

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

export async function handleRedirectResult(): Promise<User | null> {
  const result = await getRedirectResult(auth);
  if (!result) return null;
  return await enforceWhitelist(result.user);
}

export const loginWithGoogle = async (): Promise<User | void> => {
  if (isStandaloneMode()) {
    await signInWithRedirect(auth, provider);
    return; // browser navigates away — code after this never runs in standalone
  }
  try {
    const result = await signInWithPopup(auth, provider);
    return await enforceWhitelist(result.user);
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