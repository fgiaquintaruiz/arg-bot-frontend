import React, { StrictMode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onAuthStateChanged } from 'firebase/auth';
import { handleRedirectResult } from '../authService';

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: class MockGoogleAuthProvider {},
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  getRedirectResult: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('../firebaseConfig', () => ({ auth: {} }));

vi.mock('../authService', () => ({
  loginWithGoogle: vi.fn(),
  handleRedirectResult: vi.fn(),
  checkWhitelist: vi.fn(() => true),
  WHITELIST: new Set(),
}));

vi.mock('../components/Login', () => ({
  default: ({ onLogin, rejected }) => (
    <div data-testid="login-page">
      <button onClick={onLogin} data-testid="login-btn">Sign in</button>
      {rejected && <span data-testid="rejected-msg">Access Denied</span>}
    </div>
  ),
}));

vi.mock('../Dashboard', () => ({
  default: ({ user }) => <div data-testid="dashboard">{user?.email}</div>,
}));

vi.mock('../components/ErrorBoundary', () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock('../components/NotificationOptIn', () => ({
  default: () => <div data-testid="notification-opt-in" />,
}));

describe('App — redirect result handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: handleRedirectResult retorna null (sin redirect pendiente)
    handleRedirectResult.mockResolvedValue(null);
    // Default: onAuthStateChanged emite null (usuario no autenticado), cierra loading
    onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(null);
      return () => {};
    });
  });

  it('5.1 — handleRedirectResult llamado al montar (retorna null → no crash, muestra login)', async () => {
    const { default: App } = await import('../App');
    render(<App />);

    await waitFor(() => {
      expect(handleRedirectResult).toHaveBeenCalled();
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  it('5.2 — StrictMode guard: doble mount → handleRedirectResult llamado solo 1 vez', async () => {
    const { default: App } = await import('../App');
    const { rerender } = render(
      <StrictMode>
        <App />
      </StrictMode>
    );

    rerender(
      <StrictMode>
        <App />
      </StrictMode>
    );

    await waitFor(() => {
      expect(handleRedirectResult).toHaveBeenCalledTimes(1);
    });
  });

  it('5.3 — redirect result con user whitelisted → onAuthStateChanged completa login, muestra dashboard', async () => {
    const mockUser = { email: 'test@known.com' };
    handleRedirectResult.mockResolvedValue(mockUser);
    onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(mockUser);
      return () => {};
    });

    const { default: App } = await import('../App');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });

  it('5.4 — redirect con ACCESS_DENIED → setRejected(true) + setLoading(false), muestra login con rejection', async () => {
    handleRedirectResult.mockRejectedValue(new Error('ACCESS_DENIED'));

    const { default: App } = await import('../App');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('rejected-msg')).toBeInTheDocument();
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });
});
