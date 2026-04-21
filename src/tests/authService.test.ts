import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signInWithPopup, signOut } from 'firebase/auth';

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class MockGoogleAuthProvider {},
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('../firebaseConfig', () => ({ auth: {} }));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loginWithGoogle', () => {
    it('error genérico: loguea y rethrows sin tratarlo como ACCESS_DENIED', async () => {
      const { loginWithGoogle } = await import('../authService');
      const genericError = new Error('Network error');
      (signInWithPopup as ReturnType<typeof vi.fn>).mockRejectedValue(genericError);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(loginWithGoogle()).rejects.toThrow('Network error');
      expect(consoleSpy).toHaveBeenCalledWith('Login error', genericError);

      consoleSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('signOut falla: loguea el error y rethrows', async () => {
      const { logout } = await import('../authService');
      const logoutError = new Error('Signout failed');
      (signOut as ReturnType<typeof vi.fn>).mockRejectedValue(logoutError);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(logout()).rejects.toThrow('Signout failed');
      expect(consoleSpy).toHaveBeenCalledWith('Logout error', logoutError);

      consoleSpy.mockRestore();
    });
  });
});
