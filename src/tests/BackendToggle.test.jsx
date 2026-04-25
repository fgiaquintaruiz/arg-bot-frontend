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

  it('primera carga no dispara reload aunque la versión sea nueva', async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      configurable: true,
      writable: true,
    });
    render(<BackendToggle />);
    await waitFor(() => {
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });
    expect(reloadMock).not.toHaveBeenCalled();
  });
});
