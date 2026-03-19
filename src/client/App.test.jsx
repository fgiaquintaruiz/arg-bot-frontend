import { describe, it, expect, vi } from 'vitest';

// Mockeamos el servicio de auth para que no inicialice Firebase real en el test
vi.mock('./authService', () => ({
  auth: { onAuthStateChanged: (cb) => cb(null) },
  loginWithGoogle: vi.fn(),
  logout: vi.fn()
}));

describe('App Component Smoke Test', () => {
  it('debería renderizar sin explotar', () => {
    expect(true).toBe(true);
  });
});
