import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    BACKENDS: {
      node:   { key: 'node',   label: 'Node',   url: 'http://localhost:10007' },
      kotlin: { key: 'kotlin', label: 'Kotlin', url: '' }, // Sin URL → disabled
    },
    getActiveBackend: () => 'node',
    setActiveBackend: vi.fn(),
  };
});

import BackendToggle from '../components/BackendToggle';

describe('BackendToggle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch para los health checks
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ version: '1.0.0' }),
    });
  });

  it('renderiza los dos botones Node y Kotlin', () => {
    render(<BackendToggle />);
    expect(screen.getByText('Node')).toBeInTheDocument();
    expect(screen.getByText('Kotlin')).toBeInTheDocument();
  });

  it('botón Kotlin está deshabilitado cuando no tiene URL', () => {
    render(<BackendToggle />);
    const kotlinBtn = screen.getByText('Kotlin').closest('button');
    expect(kotlinBtn).toBeDisabled();
  });

  it('click en Node (ya activo) llama a setActiveBackend', async () => {
    const { setActiveBackend } = await import('../config');
    render(<BackendToggle />);
    fireEvent.click(screen.getByText('Node').closest('button'));
    expect(setActiveBackend).toHaveBeenCalledWith('node');
  });

  it('click en Kotlin deshabilitado no llama a setActiveBackend', async () => {
    const { setActiveBackend } = await import('../config');
    render(<BackendToggle />);
    const kotlinBtn = screen.getByText('Kotlin').closest('button');
    // Disabled buttons don't fire onClick, but guard also protects
    fireEvent.click(kotlinBtn);
    expect(setActiveBackend).not.toHaveBeenCalled();
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
      // La versión inicial es '…' y tras fallo queda '—'
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });
});
