import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('config — setActiveBackend + getActiveBackend + getApiUrl', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('getActiveBackend devuelve "node" cuando no hay nada en localStorage', async () => {
    const { getActiveBackend } = await import('../config');
    expect(getActiveBackend()).toBe('node');
  });

  it('setActiveBackend guarda la clave en localStorage y dispara backend-changed', async () => {
    const { setActiveBackend, getActiveBackend } = await import('../config');
    const listener = vi.fn();
    window.addEventListener('backend-changed', listener);

    setActiveBackend('node');

    expect(localStorage.getItem('active_backend')).toBe('node');
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener('backend-changed', listener);
  });

  it('getActiveBackend devuelve el valor guardado por setActiveBackend', async () => {
    const { setActiveBackend, getActiveBackend } = await import('../config');
    setActiveBackend('node');
    expect(getActiveBackend()).toBe('node');
  });

  it('getApiUrl retorna la URL del backend activo', async () => {
    const { getApiUrl, BACKENDS } = await import('../config');
    const url = getApiUrl();
    expect(url).toBe(BACKENDS.node.url);
  });

  it('getActiveBackend ignora claves inválidas en localStorage y devuelve "node"', async () => {
    localStorage.setItem('active_backend', 'invalid_key');
    const { getActiveBackend } = await import('../config');
    expect(getActiveBackend()).toBe('node');
  });
});
