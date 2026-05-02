/**
 * AccessWhitelist.test.jsx
 * TDD Red-first tests — ALL 31 spec scenarios (SPEC-AW-001 through SPEC-AW-031).
 * Layer 1: checkWhitelist pure function
 * Layer 2: loginWithGoogle integration (firebase mocked)
 * Layer 3: App.tsx rejection state
 * Layer 4: Login.tsx banners/rejection message
 * Layer 5: Dashboard.tsx persistent banner
 * Layer 6: Env var parsing (WHITELIST module-level constant)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Firebase auth mock (top-level, applies to all tests) ────────────────────
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: class MockGoogleAuthProvider {},
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('../firebaseConfig', () => ({ auth: {} }));

// ─── Helper mocks for child components used in Dashboard / Login ──────────────
vi.mock('../components/LandingDocs', () => ({
  default: function MockLandingDocs() {
    return <div data-testid="landing-docs" />;
  },
}));
vi.mock('../components/Updates', () => ({
  default: function MockUpdates({ onClose }) {
    return <div data-testid="updates"><button onClick={onClose}>Close</button></div>;
  },
}));
vi.mock('../components/LegalModal', () => ({
  default: function MockLegalModal({ onClose }) {
    return <div data-testid="legal-modal"><button onClick={onClose}>Close</button></div>;
  },
}));
vi.mock('../components/Calculator', () => ({ default: () => <div data-testid="calculator" /> }));
vi.mock('../components/Trade', () => ({ default: () => <div data-testid="trade" /> }));
vi.mock('../components/Withdraw', () => ({ default: () => <div data-testid="withdraw" /> }));
vi.mock('../components/History', () => ({ default: () => <div data-testid="history" /> }));
vi.mock('../components/Settings', () => ({ default: () => <div data-testid="settings" /> }));
vi.mock('../components/BackendToggle', () => ({ default: () => <div data-testid="backend-toggle" /> }));
vi.mock('../components/TradingWizard', () => ({ default: () => <div data-testid="trading-wizard" /> }));
vi.mock('../config', () => ({
  API_URL: 'http://localhost:10001',
  getApiUrl: () => 'http://localhost:10001',
}));

// ─── Imports that DON'T need module reset ────────────────────────────────────
// (For env-var-sensitive imports we use vi.resetModules() + dynamic import per test)

import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// =============================================================================
// LAYER 1 — Pure function: checkWhitelist(email)
// SPEC-AW-001 through SPEC-AW-011
// =============================================================================

describe('checkWhitelist(email) — pure function', () => {
  // SPEC-AW-001: Exact match returns true
  it('SPEC-AW-001: returns true when email exactly matches whitelisted entry', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', 'fabio@example.com,alice@example.com');
    vi.resetModules();
    const { checkWhitelist } = await import('../authService');
    expect(checkWhitelist('fabio@example.com')).toBe(true);
  });

  // SPEC-AW-002: Case-insensitive — env has uppercase, input lowercase
  it('SPEC-AW-002: returns true when env is uppercase and input is lowercase (case-insensitive)', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', 'Fabio@Example.COM,alice@example.com');
    vi.resetModules();
    const { checkWhitelist } = await import('../authService');
    expect(checkWhitelist('fabio@example.com')).toBe(true);
  });

  // SPEC-AW-003: Whitespace tolerance — env has spaces around emails
  it('SPEC-AW-003: returns true when env entries have surrounding whitespace', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', ' fabio@example.com , alice@example.com ');
    vi.resetModules();
    const { checkWhitelist } = await import('../authService');
    expect(checkWhitelist('fabio@example.com')).toBe(true);
  });

  // SPEC-AW-004: Non-whitelisted email returns false
  it('SPEC-AW-004: returns false when email is not in whitelist', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', 'fabio@example.com,alice@example.com');
    vi.resetModules();
    const { checkWhitelist } = await import('../authService');
    expect(checkWhitelist('bob@example.com')).toBe(false);
  });

  // SPEC-AW-005: null email returns false
  it('SPEC-AW-005: returns false for null email', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', 'fabio@example.com');
    vi.resetModules();
    const { checkWhitelist } = await import('../authService');
    expect(checkWhitelist(null)).toBe(false);
  });

  // SPEC-AW-006: undefined email returns false
  it('SPEC-AW-006: returns false for undefined email', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', 'fabio@example.com');
    vi.resetModules();
    const { checkWhitelist } = await import('../authService');
    expect(checkWhitelist(undefined)).toBe(false);
  });

  // SPEC-AW-007: Empty string email returns false
  it('SPEC-AW-007: returns false for empty string email', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', 'fabio@example.com');
    vi.resetModules();
    const { checkWhitelist } = await import('../authService');
    expect(checkWhitelist('')).toBe(false);
  });

  // SPEC-AW-008: Missing env var → fail-closed
  it('SPEC-AW-008: returns false for any email when env var is not set', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', undefined);
    vi.resetModules();
    const { checkWhitelist } = await import('../authService');
    expect(checkWhitelist('fabio@example.com')).toBe(false);
  });

  // SPEC-AW-009: Empty string env var → fail-closed
  it('SPEC-AW-009: returns false when VITE_WHITELIST_EMAILS is empty string', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', '');
    vi.resetModules();
    const { checkWhitelist } = await import('../authService');
    expect(checkWhitelist('fabio@example.com')).toBe(false);
  });

  // SPEC-AW-010: Whitespace-only env var → fail-closed
  it('SPEC-AW-010: returns false when VITE_WHITELIST_EMAILS is whitespace only', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', '   ');
    vi.resetModules();
    const { checkWhitelist } = await import('../authService');
    expect(checkWhitelist('fabio@example.com')).toBe(false);
  });

  // SPEC-AW-011: Comma-only env var → fail-closed
  it('SPEC-AW-011: returns false when VITE_WHITELIST_EMAILS is only commas', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', ',,,');
    vi.resetModules();
    const { checkWhitelist } = await import('../authService');
    expect(checkWhitelist('fabio@example.com')).toBe(false);
  });
});

// =============================================================================
// LAYER 2 — Integration: loginWithGoogle() with whitelist
// SPEC-AW-012 through SPEC-AW-014
// =============================================================================

describe('loginWithGoogle() with whitelist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // SPEC-AW-012: Happy path — whitelisted email returns user, signOut NOT called
  it('SPEC-AW-012: returns user when email is whitelisted, signOut NOT called', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', 'fabio@example.com');
    vi.resetModules();

    const mockUser = { email: 'fabio@example.com', uid: 'uid-123' };
    const { signInWithPopup: mockSignIn, signOut: mockSignOut } = await import('firebase/auth');
    vi.mocked(mockSignIn).mockResolvedValueOnce({ user: mockUser });
    vi.mocked(mockSignOut).mockResolvedValueOnce(undefined);

    const { loginWithGoogle } = await import('../authService');
    const result = await loginWithGoogle();

    expect(result).toEqual(mockUser);
    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  // SPEC-AW-013: Rejection path — signOut called, throws ACCESS_DENIED
  it('SPEC-AW-013: calls signOut and throws ACCESS_DENIED when email not whitelisted', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', 'fabio@example.com');
    vi.resetModules();

    const mockUser = { email: 'bob@example.com', uid: 'uid-456' };
    const { signInWithPopup: mockSignIn, signOut: mockSignOut } = await import('firebase/auth');
    vi.mocked(mockSignIn).mockResolvedValueOnce({ user: mockUser });
    vi.mocked(mockSignOut).mockResolvedValueOnce(undefined);

    const { loginWithGoogle } = await import('../authService');

    await expect(loginWithGoogle()).rejects.toThrow('ACCESS_DENIED');
    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  // SPEC-AW-014: signOut MUST be awaited BEFORE throw (flash prevention)
  it('SPEC-AW-014: signOut resolves before ACCESS_DENIED is thrown (flash prevention)', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', 'fabio@example.com');
    vi.resetModules();

    let signOutCompleted = false;
    const mockUser = { email: 'intruder@example.com', uid: 'uid-789' };

    const firebaseAuth = await import('firebase/auth');
    // Reset impls to clear any Once-queue leftovers from previous tests
    vi.mocked(firebaseAuth.signInWithPopup).mockReset();
    vi.mocked(firebaseAuth.signOut).mockReset();
    vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValue({ user: mockUser });
    vi.mocked(firebaseAuth.signOut).mockImplementation(
      () => new Promise((resolve) => {
        setTimeout(() => { signOutCompleted = true; resolve(undefined); }, 10);
      })
    );

    const { loginWithGoogle } = await import('../authService');

    await expect(loginWithGoogle()).rejects.toThrow('ACCESS_DENIED');

    expect(signOutCompleted).toBe(true);
  });
});

// =============================================================================
// LAYER 3 — App.tsx: rejection state and render gate
// SPEC-AW-015 through SPEC-AW-019
// =============================================================================

describe('App.tsx rejection state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any vi.doMock on authService so subsequent describe blocks
    // can use the real authService via dynamic import.
    vi.doUnmock('../authService');
    vi.resetModules();
  });

  // SPEC-AW-015: Whitelisted login → Dashboard renders
  it('SPEC-AW-015: renders Dashboard when user is authenticated and not rejected', async () => {
    vi.resetModules();
    const mockUser = { email: 'fabio@example.com', uid: 'uid-123' };

    vi.doMock('../authService', () => ({
      loginWithGoogle: vi.fn().mockResolvedValue(mockUser),
      handleRedirectResult: vi.fn().mockResolvedValue(null),
      logout: vi.fn(),
    }));

    const { onAuthStateChanged: mockOAC } = await import('firebase/auth');
    vi.mocked(mockOAC).mockImplementationOnce((auth, callback) => {
      callback(mockUser);
      return () => {};
    });

    const { default: App } = await import('../App');
    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText(/Continuar con Google/)).not.toBeInTheDocument();
    });
  });

  // SPEC-AW-016: Rejected login keeps Login mounted, Dashboard absent
  it('SPEC-AW-016: keeps Login mounted when loginWithGoogle throws ACCESS_DENIED', async () => {
    vi.resetModules();

    vi.doMock('../authService', () => ({
      loginWithGoogle: vi.fn().mockRejectedValue(new Error('ACCESS_DENIED')),
      handleRedirectResult: vi.fn().mockResolvedValue(null),
      logout: vi.fn(),
    }));

    const { onAuthStateChanged: mockOAC } = await import('firebase/auth');
    vi.mocked(mockOAC).mockImplementationOnce((auth, callback) => {
      callback(null);
      return () => {};
    });

    const { default: App } = await import('../App');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Continuar con Google/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Continuar con Google/));

    await waitFor(() => {
      expect(screen.getByText(/Cuenta no autorizada/i)).toBeInTheDocument();
    });
  });

  // SPEC-AW-017: Rejected state persists — Login still mounted after rejection
  it('SPEC-AW-017: rejection state persists — Login still visible after rejection', async () => {
    vi.resetModules();

    vi.doMock('../authService', () => ({
      loginWithGoogle: vi.fn().mockRejectedValue(new Error('ACCESS_DENIED')),
      handleRedirectResult: vi.fn().mockResolvedValue(null),
      logout: vi.fn(),
    }));

    const { onAuthStateChanged: mockOAC } = await import('firebase/auth');
    vi.mocked(mockOAC).mockImplementationOnce((auth, callback) => {
      callback(null);
      return () => {};
    });

    const { default: App } = await import('../App');
    render(<App />);

    await waitFor(() => expect(screen.getByText(/Continuar con Google/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Continuar con Google/));

    await waitFor(() => {
      expect(screen.getByText(/Cuenta no autorizada/i)).toBeInTheDocument();
    });

    // Still visible (no state change)
    expect(screen.getByText(/Cuenta no autorizada/i)).toBeInTheDocument();
  });

  // SPEC-AW-018: Re-clicking Google button clears rejected state (setRejected(false) before signInWithPopup)
  it('SPEC-AW-018: clicking Google button again clears rejection message', async () => {
    vi.resetModules();

    const loginMock = vi.fn()
      .mockRejectedValueOnce(new Error('ACCESS_DENIED'))  // first click → rejected
      .mockRejectedValueOnce(new Error('ACCESS_DENIED')); // second click → rejected again (but clears first)

    vi.doMock('../authService', () => ({
      loginWithGoogle: loginMock,
      handleRedirectResult: vi.fn().mockResolvedValue(null),
      logout: vi.fn(),
    }));

    const { onAuthStateChanged: mockOAC } = await import('firebase/auth');
    vi.mocked(mockOAC).mockImplementationOnce((auth, callback) => {
      callback(null);
      return () => {};
    });

    const { default: App } = await import('../App');
    render(<App />);

    await waitFor(() => expect(screen.getByText(/Continuar con Google/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Continuar con Google/));

    await waitFor(() => expect(screen.getByText(/Cuenta no autorizada/i)).toBeInTheDocument());

    // Second click — rejection should be cleared then re-set
    fireEvent.click(screen.getByText(/Continuar con Google/));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledTimes(2);
    });
  });

  // SPEC-AW-019: Dashboard renders ONLY when user !== null AND rejected === false
  it('SPEC-AW-019: Dashboard does not render when rejected=true even if user is set', async () => {
    vi.resetModules();

    vi.doMock('../authService', () => ({
      loginWithGoogle: vi.fn().mockRejectedValue(new Error('ACCESS_DENIED')),
      handleRedirectResult: vi.fn().mockResolvedValue(null),
      logout: vi.fn(),
    }));

    const { onAuthStateChanged: mockOAC } = await import('firebase/auth');
    vi.mocked(mockOAC).mockImplementationOnce((auth, callback) => {
      callback(null);
      return () => {};
    });

    const { default: App } = await import('../App');
    render(<App />);

    await waitFor(() => expect(screen.getByText(/Continuar con Google/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Continuar con Google/));

    await waitFor(() => expect(screen.getByText(/Cuenta no autorizada/i)).toBeInTheDocument());

    // Dashboard should not be present
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });
});

// =============================================================================
// LAYER 4 — Login.tsx: banners and rejection message
// SPEC-AW-020 through SPEC-AW-024
// =============================================================================

describe('Login.tsx banners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // SPEC-AW-020: Login banner renders — "Acceso restringido"
  it('SPEC-AW-020: renders access restriction banner with "Acceso restringido"', async () => {
    const { default: Login } = await import('../components/Login');
    render(<Login onLogin={vi.fn()} rejected={false} />);
    expect(screen.getByText(/Acceso restringido/i)).toBeInTheDocument();
  });

  // SPEC-AW-021: Login banner displays complete Spanish text
  it('SPEC-AW-021: login banner contains full Spanish description text', async () => {
    const { default: Login } = await import('../components/Login');
    render(<Login onLogin={vi.fn()} rejected={false} />);
    expect(screen.getByText(/Solo cuentas de Google previamente autorizadas/i)).toBeInTheDocument();
  });

  // SPEC-AW-022: Rejection message visible when rejected=true
  it('SPEC-AW-022: rejection message appears when rejected=true', async () => {
    const { default: Login } = await import('../components/Login');
    render(<Login onLogin={vi.fn()} rejected={true} />);
    expect(screen.getByText(/Cuenta no autorizada/i)).toBeInTheDocument();
  });

  // SPEC-AW-023: Rejection message displays full Spanish text
  it('SPEC-AW-023: rejection message contains "Esta aplicación es privada"', async () => {
    const { default: Login } = await import('../components/Login');
    render(<Login onLogin={vi.fn()} rejected={true} />);
    expect(screen.getByText(/Esta aplicación es privada/i)).toBeInTheDocument();
  });

  // SPEC-AW-024: Rejection message NOT visible when rejected=false
  it('SPEC-AW-024: rejection message is NOT in DOM when rejected=false', async () => {
    const { default: Login } = await import('../components/Login');
    render(<Login onLogin={vi.fn()} rejected={false} />);
    expect(screen.queryByText(/Cuenta no autorizada/i)).not.toBeInTheDocument();
  });
});

// =============================================================================
// LAYER 5 — Dashboard.tsx: persistent access restriction banner
// SPEC-AW-025 through SPEC-AW-026
// =============================================================================

describe('Dashboard.tsx banners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ eur: '100', usdc: '50', rate: '1.08', usdcArsRate: '1150', fees: {} }),
    });
  });

  const mockUser = { email: 'fabio@example.com', displayName: 'Fabio', uid: 'uid-123' };

  // SPEC-AW-025: Dashboard renders persistent banner with "Acceso restringido"
  it('SPEC-AW-025: Dashboard renders persistent banner with "Acceso restringido"', async () => {
    const { default: Dashboard } = await import('../Dashboard');
    render(<Dashboard user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText(/Acceso restringido/i)).toBeInTheDocument();
    });
  });

  // SPEC-AW-026: Dashboard banner contains "solo usuarios autorizados"
  it('SPEC-AW-026: Dashboard banner contains "solo usuarios autorizados"', async () => {
    const { default: Dashboard } = await import('../Dashboard');
    render(<Dashboard user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText(/solo usuarios autorizados/i)).toBeInTheDocument();
    });
  });
});

// =============================================================================
// LAYER 6 — Env var parsing: WHITELIST module-level constant
// SPEC-AW-027 through SPEC-AW-031
// =============================================================================

describe('WHITELIST constant initialization', () => {
  // SPEC-AW-027: WHITELIST is parsed once at module load
  it('SPEC-AW-027: WHITELIST is a module-level constant (not undefined on import)', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', 'alice@example.com');
    vi.resetModules();
    const mod = await import('../authService');
    // WHITELIST must be exported and must be a Set
    expect(mod.WHITELIST).toBeDefined();
    expect(mod.WHITELIST instanceof Set).toBe(true);
  });

  // SPEC-AW-028: Comma-separated values split correctly
  it('SPEC-AW-028: comma-separated env value → Set with 3 entries', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', 'alice@example.com,bob@example.com,charlie@example.com');
    vi.resetModules();
    const { WHITELIST } = await import('../authService');
    expect(WHITELIST.size).toBe(3);
    expect(WHITELIST.has('alice@example.com')).toBe(true);
    expect(WHITELIST.has('bob@example.com')).toBe(true);
    expect(WHITELIST.has('charlie@example.com')).toBe(true);
  });

  // SPEC-AW-029: Trailing/leading whitespace per entry is trimmed
  it('SPEC-AW-029: whitespace around entries is trimmed during parse', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', ' alice@example.com , bob@example.com , charlie@example.com ');
    vi.resetModules();
    const { WHITELIST } = await import('../authService');
    expect(WHITELIST.has('alice@example.com')).toBe(true);
    expect(WHITELIST.has('bob@example.com')).toBe(true);
    expect(WHITELIST.has('charlie@example.com')).toBe(true);
  });

  // SPEC-AW-030: All emails lowercased after parse
  it('SPEC-AW-030: env values are lowercased during parse (case-insensitive storage)', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', 'ALICE@EXAMPLE.COM,Bob@Example.com');
    vi.resetModules();
    const { WHITELIST, checkWhitelist } = await import('../authService');
    // Stored as lowercase
    expect(WHITELIST.has('alice@example.com')).toBe(true);
    expect(WHITELIST.has('bob@example.com')).toBe(true);
    // checkWhitelist also case-insensitive on input side
    expect(checkWhitelist('ALICE@EXAMPLE.COM')).toBe(true);
    expect(checkWhitelist('alice@example.com')).toBe(true);
  });

  // SPEC-AW-031: Missing/empty env var → fail-closed (empty Set)
  it('SPEC-AW-031: missing env var → WHITELIST is empty Set, any email returns false', async () => {
    vi.stubEnv('VITE_WHITELIST_EMAILS', undefined);
    vi.resetModules();
    const { WHITELIST, checkWhitelist } = await import('../authService');
    expect(WHITELIST.size).toBe(0);
    expect(checkWhitelist('fabio@example.com')).toBe(false);
    // Must not throw
    expect(() => checkWhitelist('anyone@example.com')).not.toThrow();
  });
});
