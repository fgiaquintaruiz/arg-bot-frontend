export const BACKENDS = {
  node:   { key: 'node',   label: 'Node',   url: import.meta.env.VITE_API_URL        || 'http://localhost:10007' },
  kotlin: { key: 'kotlin', label: 'Kotlin', url: import.meta.env.VITE_KOTLIN_API_URL || '' },
} as const;

export type BackendKey = keyof typeof BACKENDS;

const STORAGE_KEY = 'active_backend';

export const getActiveBackend = (): BackendKey => {
  const stored = localStorage.getItem(STORAGE_KEY) as BackendKey | null;
  return stored && stored in BACKENDS ? stored : 'node';
};

export const setActiveBackend = (key: BackendKey) => {
  localStorage.setItem(STORAGE_KEY, key);
  window.dispatchEvent(new CustomEvent('backend-changed', { detail: key }));
};

export const getApiUrl = (): string => BACKENDS[getActiveBackend()].url;

// Backward compat — componentes que ya importan API_URL siguen funcionando
export const API_URL = BACKENDS.node.url;
