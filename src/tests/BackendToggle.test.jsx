import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../config', () => ({
  getApiUrl: () => 'http://localhost:8080',
  API_URL: 'http://localhost:8080',
}));

import BackendToggle from '../components/BackendToggle';

describe('BackendToggle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ version: '1.0.0' }),
    });
  });

  it('renderiza la etiqueta Kotlin', () => {
    render(<BackendToggle />);
    expect(screen.getByText('Kotlin')).toBeInTheDocument();
  });

  it('muestra versión cargada tras el health check', async () => {
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });
  });

  it('muestra "—" si el health check falla', async () => {
    vi.spyOn(window, 'fetch').mockRejectedValue(new Error('network'));
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  it('muestra indicador online (verde) cuando el backend responde', async () => {
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });
    const dot = screen.getByText('Kotlin').parentElement.querySelector('span:first-child');
    expect(dot).toHaveStyle({ backgroundColor: '#0ECB81' });
  });

  it('primera carga no dispara navegación aunque la versión sea nueva', async () => {
    const locationStub = { pathname: '/app', href: '/app' };
    Object.defineProperty(window, 'location', {
      value: locationStub,
      configurable: true,
      writable: true,
    });
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });
    expect(locationStub.href).toBe('/app');
  });

  // --- Branches de fetchVersion ---

  it('muestra "—" y offline cuando getApiUrl devuelve string vacío', async () => {
    // Branch: if (!url) → { version: '—', online: false }
    // Override the config mock to return empty string for this test only
    vi.doMock('../config', () => ({ getApiUrl: () => '', API_URL: '' }));
    const { default: BackendToggleEmpty } = await import('../components/BackendToggle?empty-url');
    render(<BackendToggleEmpty />);
    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument();
    });
    const dot = screen.getByText('Kotlin').parentElement.querySelector('span:first-child');
    expect(dot).toHaveStyle({ backgroundColor: '#F6465D' });
    vi.doUnmock('../config');
  });

  it('muestra "—" y offline cuando el servidor responde con status no-ok (4xx/5xx)', async () => {
    // Branch: if (!res.ok) → { version: '—', online: false }
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument();
    });
    const dot = screen.getByText('Kotlin').parentElement.querySelector('span:first-child');
    expect(dot).toHaveStyle({ backgroundColor: '#F6465D' });
  });

  it('extrae versión desde data.info.build.version como fallback', async () => {
    // Branch: data.version falsy → data.info?.build?.version
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ info: { build: { version: '2.0.0-info' } } }),
    });
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('2.0.0-info')).toBeInTheDocument();
    });
  });

  it('extrae versión desde data.build.version como fallback', async () => {
    // Branch: data.version falsy, data.info?.build?.version falsy → data.build?.version
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ build: { version: '3.0.0-build' } } ),
    });
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('3.0.0-build')).toBeInTheDocument();
    });
  });

  it('extrae versión desde data.app.version como fallback', async () => {
    // Branch: data.version, data.info?.build?.version, data.build?.version falsy → data.app?.version
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ app: { version: '4.0.0-app' } }),
    });
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('4.0.0-app')).toBeInTheDocument();
    });
  });

  it('extrae versión desde data.application.version como fallback', async () => {
    // Branch: todos los anteriores falsy → data.application?.version
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ application: { version: '5.0.0-application' } }),
    });
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('5.0.0-application')).toBeInTheDocument();
    });
  });

  it('muestra "—" cuando la respuesta no contiene ningún campo de versión conocido', async () => {
    // Branch: todos los campos de versión son falsy → '—'
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' }),
    });
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  it('muestra indicador offline (rojo) en el estado inicial antes de recibir respuesta', () => {
    // Branch: info.online = false → backgroundColor '#F6465D' (estado inicial '…')
    vi.spyOn(window, 'fetch').mockImplementation(() => new Promise(() => {})); // never resolves
    render(<BackendToggle />);
    const dot = screen.getByText('Kotlin').parentElement.querySelector('span:first-child');
    expect(dot).toHaveStyle({ backgroundColor: '#F6465D' });
  });
});
