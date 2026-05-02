import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class MockGoogleAuthProvider {},
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  getRedirectResult: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('../firebaseConfig', () => ({ auth: {} }));

// Helper para controlar window.matchMedia en tests de isStandaloneMode
function mockMatchMedia(isStandalone: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: isStandalone && query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigator.standalone entre tests
    Object.defineProperty(navigator, 'standalone', {
      writable: true,
      configurable: true,
      value: undefined,
    });
    // Reset matchMedia a default (no standalone)
    mockMatchMedia(false);
  });

  describe('isStandaloneMode', () => {
    it('retorna false en jsdom por defecto (matchMedia.matches = false)', async () => {
      const { isStandaloneMode } = await import('../authService');
      expect(isStandaloneMode()).toBe(false);
    });

    it('retorna true cuando matchMedia devuelve matches=true', async () => {
      const { isStandaloneMode } = await import('../authService');
      mockMatchMedia(true);
      expect(isStandaloneMode()).toBe(true);
    });

    it('retorna true cuando navigator.standalone = true (iOS legacy)', async () => {
      const { isStandaloneMode } = await import('../authService');
      Object.defineProperty(navigator, 'standalone', {
        writable: true,
        configurable: true,
        value: true,
      });
      expect(isStandaloneMode()).toBe(true);
    });
  });

  describe('enforceWhitelist', () => {
    it('email en whitelist: resuelve con el user', async () => {
      const { enforceWhitelist, WHITELIST } = await import('../authService');
      // Agregamos el email directamente al Set para que checkWhitelist retorne true
      WHITELIST.add('test@known.com');
      const mockUser = { email: 'test@known.com' } as any;
      const result = await enforceWhitelist(mockUser);
      expect(result).toBe(mockUser);
      WHITELIST.delete('test@known.com'); // limpiamos para no afectar otros tests
    });

    it('email NO en whitelist: llama signOut y rechaza con ACCESS_DENIED', async () => {
      const { enforceWhitelist } = await import('../authService');
      const mockUser = { email: 'unknown@test.com' } as any;
      // Con WHITELIST vacía en tests, checkWhitelist retorna false para cualquier email
      await expect(enforceWhitelist(mockUser)).rejects.toThrow('ACCESS_DENIED');
      expect(signOut).toHaveBeenCalled();
    });
  });

  describe('handleRedirectResult', () => {
    it('getRedirectResult retorna null → retorna null (sin redirect pendiente)', async () => {
      const { handleRedirectResult } = await import('../authService');
      (getRedirectResult as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const result = await handleRedirectResult();
      expect(result).toBeNull();
    });

    it('getRedirectResult retorna user whitelisted → retorna User', async () => {
      const { handleRedirectResult, WHITELIST } = await import('../authService');
      const mockUser = { email: 'test@known.com' } as any;
      (getRedirectResult as ReturnType<typeof vi.fn>).mockResolvedValue({ user: mockUser });
      WHITELIST.add('test@known.com');
      const result = await handleRedirectResult();
      expect(result).toBe(mockUser);
      WHITELIST.delete('test@known.com');
    });

    it('getRedirectResult retorna user NOT whitelisted → signOut + rechaza con ACCESS_DENIED', async () => {
      const { handleRedirectResult } = await import('../authService');
      const mockUser = { email: 'unknown@test.com' } as any;
      (getRedirectResult as ReturnType<typeof vi.fn>).mockResolvedValue({ user: mockUser });
      // WHITELIST vacía → checkWhitelist retorna false
      await expect(handleRedirectResult()).rejects.toThrow('ACCESS_DENIED');
      expect(signOut).toHaveBeenCalled();
    });

    it('getRedirectResult lanza error → propaga el error', async () => {
      const { handleRedirectResult } = await import('../authService');
      const testError = new Error('auth/web-storage-unsupported');
      (getRedirectResult as ReturnType<typeof vi.fn>).mockRejectedValue(testError);
      await expect(handleRedirectResult()).rejects.toThrow('auth/web-storage-unsupported');
    });
  });

  describe('loginWithGoogle', () => {
    it('browser mode (matchMedia.matches=false) → llama signInWithPopup, no signInWithRedirect', async () => {
      const { loginWithGoogle, WHITELIST } = await import('../authService');
      mockMatchMedia(false);
      const mockUser = { email: 'test@known.com' } as any;
      (signInWithPopup as ReturnType<typeof vi.fn>).mockResolvedValue({ user: mockUser });
      WHITELIST.add('test@known.com');
      await loginWithGoogle();
      expect(signInWithPopup).toHaveBeenCalled();
      expect(signInWithRedirect).not.toHaveBeenCalled();
      WHITELIST.delete('test@known.com');
    });

    it('standalone mode (matchMedia.matches=true) → llama signInWithRedirect, no signInWithPopup', async () => {
      const { loginWithGoogle } = await import('../authService');
      mockMatchMedia(true);
      (signInWithRedirect as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      await loginWithGoogle();
      expect(signInWithRedirect).toHaveBeenCalled();
      expect(signInWithPopup).not.toHaveBeenCalled();
    });

    it('error genérico: loguea y rethrows sin tratarlo como ACCESS_DENIED', async () => {
      const { loginWithGoogle } = await import('../authService');
      mockMatchMedia(false);
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
