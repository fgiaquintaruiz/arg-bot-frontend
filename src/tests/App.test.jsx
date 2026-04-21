import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onAuthStateChanged } from 'firebase/auth';
import { loginWithGoogle } from '../authService';

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: class MockGoogleAuthProvider {},
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('../firebaseConfig', () => ({ auth: {} }));

vi.mock('../authService', () => ({
  loginWithGoogle: vi.fn(),
  checkWhitelist: vi.fn(() => true),
  WHITELIST: new Set(),
}));

vi.mock('../components/Login', () => ({
  default: ({ onLogin, rejected }) => (
    <div>
      <button onClick={onLogin} data-testid="login-btn">Login</button>
      {rejected && <span data-testid="rejected-msg">Acceso denegado</span>}
    </div>
  ),
}));

vi.mock('../Dashboard', () => ({
  default: ({ user }) => <div data-testid="dashboard">{user?.email}</div>,
}));

vi.mock('../components/ErrorBoundary', () => ({
  default: ({ children }) => <>{children}</>,
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(null);
      return () => {};
    });
  });

  it('handleLogin: error genérico → console.error, no setRejected', async () => {
    const genericError = new Error('Generic auth error');
    loginWithGoogle.mockRejectedValue(genericError);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { default: App } = await import('../App');
    render(<App />);

    await waitFor(() => expect(screen.getByTestId('login-btn')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error during Google Login:', genericError);
    });
    expect(screen.queryByTestId('rejected-msg')).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('handleLogin: ACCESS_DENIED → setRejected true, sin console.error', async () => {
    const accessDenied = new Error('ACCESS_DENIED');
    loginWithGoogle.mockRejectedValue(accessDenied);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { default: App } = await import('../App');
    render(<App />);

    await waitFor(() => expect(screen.getByTestId('login-btn')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('rejected-msg')).toBeInTheDocument();
    });
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
