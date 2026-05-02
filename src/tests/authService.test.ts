import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class MockGoogleAuthProvider {
    addScope = vi.fn();
    static credentialFromResult = vi.fn();
  },
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('../firebaseConfig', () => ({ auth: {} }));

vi.mock('../googleDrive', () => ({
  storeTokenFromFirebase: vi.fn(),
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkWhitelist', () => {
    it('retorna false para email null', async () => {
      const { checkWhitelist } = await import('../authService');
      expect(checkWhitelist(null)).toBe(false);
    });

    it('retorna false para email undefined', async () => {
      const { checkWhitelist } = await import('../authService');
      expect(checkWhitelist(undefined)).toBe(false);
    });

    it('retorna false para email no incluido en WHITELIST', async () => {
      const { checkWhitelist } = await import('../authService');
      expect(checkWhitelist('nobody@nowhere.com')).toBe(false);
    });

    it('retorna true para email incluido en WHITELIST', async () => {
      const { checkWhitelist, WHITELIST } = await import('../authService');
      WHITELIST.add('test@known.com');
      expect(checkWhitelist('test@known.com')).toBe(true);
      WHITELIST.delete('test@known.com');
    });

    it('comparación es case-insensitive', async () => {
      const { checkWhitelist, WHITELIST } = await import('../authService');
      WHITELIST.add('test@known.com');
      expect(checkWhitelist('TEST@KNOWN.COM')).toBe(true);
      WHITELIST.delete('test@known.com');
    });
  });

  describe('enforceWhitelist', () => {
    it('email en whitelist: resuelve con el user', async () => {
      const { enforceWhitelist, WHITELIST } = await import('../authService');
      WHITELIST.add('test@known.com');
      const mockUser = { email: 'test@known.com' } as any;
      const result = await enforceWhitelist(mockUser);
      expect(result).toBe(mockUser);
      WHITELIST.delete('test@known.com');
    });

    it('email NO en whitelist: llama signOut y rechaza con ACCESS_DENIED', async () => {
      const { enforceWhitelist } = await import('../authService');
      const mockUser = { email: 'unknown@test.com' } as any;
      await expect(enforceWhitelist(mockUser)).rejects.toThrow('ACCESS_DENIED');
      expect(signOut).toHaveBeenCalled();
    });
  });

  describe('loginWithGoogle', () => {
    it('llama signInWithPopup y retorna el user si está en whitelist', async () => {
      const { loginWithGoogle, WHITELIST } = await import('../authService');
      const mockUser = { email: 'test@known.com' } as any;
      (signInWithPopup as ReturnType<typeof vi.fn>).mockResolvedValue({ user: mockUser });
      (GoogleAuthProvider.credentialFromResult as ReturnType<typeof vi.fn>).mockReturnValue(null);
      WHITELIST.add('test@known.com');
      const result = await loginWithGoogle();
      expect(signInWithPopup).toHaveBeenCalled();
      expect(result).toBe(mockUser);
      WHITELIST.delete('test@known.com');
    });

    it('llama storeTokenFromFirebase cuando el credential tiene accessToken', async () => {
      const { loginWithGoogle, WHITELIST } = await import('../authService');
      const { storeTokenFromFirebase } = await import('../googleDrive');
      const mockUser = { email: 'test@known.com' } as any;
      (signInWithPopup as ReturnType<typeof vi.fn>).mockResolvedValue({ user: mockUser });
      (GoogleAuthProvider.credentialFromResult as ReturnType<typeof vi.fn>).mockReturnValue({
        accessToken: 'test-token',
      });
      WHITELIST.add('test@known.com');
      await loginWithGoogle();
      expect(storeTokenFromFirebase).toHaveBeenCalledWith('test-token');
      WHITELIST.delete('test@known.com');
    });

    it('no llama storeTokenFromFirebase si credential es null', async () => {
      const { loginWithGoogle, WHITELIST } = await import('../authService');
      const { storeTokenFromFirebase } = await import('../googleDrive');
      const mockUser = { email: 'test@known.com' } as any;
      (signInWithPopup as ReturnType<typeof vi.fn>).mockResolvedValue({ user: mockUser });
      (GoogleAuthProvider.credentialFromResult as ReturnType<typeof vi.fn>).mockReturnValue(null);
      WHITELIST.add('test@known.com');
      await loginWithGoogle();
      expect(storeTokenFromFirebase).not.toHaveBeenCalled();
      WHITELIST.delete('test@known.com');
    });

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
