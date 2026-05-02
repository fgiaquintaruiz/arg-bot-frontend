import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock global window.matchMedia — jsdom no implementa matchMedia nativamente.
// Sin este mock, cualquier test que importe authService.ts lanza:
// TypeError: window.matchMedia is not a function
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false, // default: no standalone
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock de localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock de fetch
global.fetch = vi.fn((url) => {
  if (url.includes('/api/balance')) {
    return Promise.resolve({ json: () => Promise.resolve({ eur: '100', usdc: '50' }) });
  }
  return Promise.resolve({ json: () => Promise.resolve({ success: true }) });
});
