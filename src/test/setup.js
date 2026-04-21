import '@testing-library/jest-dom';
import { vi } from 'vitest';

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
