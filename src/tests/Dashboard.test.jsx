import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logout } from '../authService';
import Dashboard from '../Dashboard';

vi.mock('../authService', () => ({ logout: vi.fn() }));

vi.mock('../components/Calculator', () => ({
  default: ({ onBack }) => (
    <div data-testid="calculator-mock">
      <button onClick={onBack}>Back from Calculator</button>
    </div>
  ),
}));
vi.mock('../components/Trade', () => ({
  default: ({ onClose, onSuccess }) => (
    <div data-testid="trade-mock">
      <button onClick={onClose}>Close Trade</button>
      <button onClick={onSuccess}>Trade Success</button>
    </div>
  ),
}));
vi.mock('../components/Withdraw', () => ({
  default: ({ onClose, onSuccess }) => (
    <div data-testid="withdraw-mock">
      <button onClick={onClose}>Close Withdraw</button>
      <button onClick={onSuccess}>Withdraw Success</button>
    </div>
  ),
}));
vi.mock('../components/History', () => ({
  default: ({ onClose }) => (
    <div data-testid="history-mock">
      <button onClick={onClose}>Close History</button>
    </div>
  ),
}));
vi.mock('../components/Updates', () => ({
  default: ({ onClose }) => (
    <div data-testid="updates-mock">
      <button onClick={onClose}>Close Updates</button>
    </div>
  ),
}));
vi.mock('../components/Settings', () => ({
  default: ({ onClose }) => (
    <div data-testid="settings-mock">
      <button onClick={onClose}>Close Settings</button>
    </div>
  ),
}));

const mockUser = { email: 'test@example.com', displayName: 'Juan Pérez' };

const mockApiResponse = {
  balances: { eur: '150.00', usdc: '1000.00' },
  rate: '1.08',
  usdcArsRate: '1150.50',
  ripioUsdcArsRate: '1200.00',
  nexoUsdcArsRate: '1100.00',
  fees: { withdrawalUSDC_BEP20: 0.8, tradingRate: 0.001 },
};

global.fetch = vi.fn();

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch.mockResolvedValue({ ok: true, json: async () => mockApiResponse });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Render básico ──────────────────────────────────────────────────────────

  it('muestra el logo ARGBOT en el header', () => {
    render(<Dashboard user={mockUser} />);
    // El logo es "ARG" + "BOT" en dos spans — buscamos en el textContent del body
    expect(document.body).toHaveTextContent('ARGBOT');
  });

  it('muestra banner de acceso restringido', () => {
    render(<Dashboard user={mockUser} />);
    expect(screen.getByText(/Acceso restringido/)).toBeInTheDocument();
  });

  it('muestra el rate strip con EUR/USDC y USDC/ARS', async () => {
    render(<Dashboard user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText(/EUR\/USDC/)).toBeInTheDocument();
      expect(screen.getByText(/USDC\/ARS/)).toBeInTheDocument();
    });
  });

  // ─── Fetch inicial ──────────────────────────────────────────────────────────

  it('llama a /api/data en el mount con email del usuario', async () => {
    render(<Dashboard user={mockUser} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/data'),
      expect.objectContaining({ method: 'POST' })
    ));
    const apiCall = global.fetch.mock.calls.find(([url]) => url.includes('/api/data'));
    const body = JSON.parse(apiCall[1].body);
    expect(body.userEmail).toBe('test@example.com');
  });

  it('muestra las tasas EUR/USDC y USDC/ARS al recibir los datos', async () => {
    render(<Dashboard user={mockUser} />);
    await waitFor(() => {
      expect(screen.getByText('1.0800')).toBeInTheDocument();
    });
  });

  it('muestra "—" mientras los datos no cargaron', () => {
    let resolveFetch;
    global.fetch.mockReturnValueOnce(new Promise(r => { resolveFetch = r; }));
    render(<Dashboard user={mockUser} />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBe(2); // EUR/USDC y USDC/ARS
    // cleanup
    resolveFetch({ ok: true, json: async () => mockApiResponse });
  });

  it('fetch falla: usa datos de fallback (rate 1.08)', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    render(<Dashboard user={mockUser} />);
    await waitFor(() => expect(screen.getByText('1.0800')).toBeInTheDocument());
  });

  it('fetch retorna !ok: usa datos de fallback', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    render(<Dashboard user={mockUser} />);
    await waitFor(() => expect(screen.getByText('1.0800')).toBeInTheDocument());
  });

  // ─── Navegación via header ────────────────────────────────────────────────────

  it('click RotateCcw (historial) → muestra History', () => {
    render(<Dashboard user={mockUser} />);
    fireEvent.click(screen.getByLabelText('Ver historial'));
    expect(screen.getByTestId('history-mock')).toBeInTheDocument();
  });

  it('History onClose → vuelve al wizard', () => {
    render(<Dashboard user={mockUser} />);
    fireEvent.click(screen.getByLabelText('Ver historial'));
    fireEvent.click(screen.getByText('Close History'));
    expect(screen.queryByTestId('history-mock')).not.toBeInTheDocument();
  });

  // ─── Modales ─────────────────────────────────────────────────────────────────

  it('click ⚙️ → abre Settings', () => {
    render(<Dashboard user={mockUser} />);
    fireEvent.click(screen.getByLabelText('Abrir configuración'));
    expect(screen.getByTestId('settings-mock')).toBeInTheDocument();
  });

  it('Settings onClose → cierra el modal', () => {
    render(<Dashboard user={mockUser} />);
    fireEvent.click(screen.getByLabelText('Abrir configuración'));
    fireEvent.click(screen.getByText('Close Settings'));
    expect(screen.queryByTestId('settings-mock')).not.toBeInTheDocument();
  });


  it('click Salir → llama a logout()', () => {
    render(<Dashboard user={mockUser} />);
    fireEvent.click(screen.getByText('Salir'));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  // ─── open-settings custom event ──────────────────────────────────────────────

  it('evento "open-settings" con tab → abre Settings', () => {
    render(<Dashboard user={mockUser} />);
    act(() => {
      window.dispatchEvent(new CustomEvent('open-settings', { detail: { tab: 'binance' } }));
    });
    expect(screen.getByTestId('settings-mock')).toBeInTheDocument();
  });

  it('evento "open-settings" sin detail.tab → no abre Settings', () => {
    render(<Dashboard user={mockUser} />);
    act(() => {
      window.dispatchEvent(new CustomEvent('open-settings', { detail: {} }));
    });
    expect(screen.queryByTestId('settings-mock')).not.toBeInTheDocument();
  });

  it('limpia el event listener "open-settings" al desmontar', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<Dashboard user={mockUser} />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('open-settings', expect.any(Function));
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  // ─── Update banner ────────────────────────────────────────────────────────────
  // Usamos spy en setInterval para capturar el callback y dispararlo directamente,
  // evitando la complejidad de fake timers + Promises encadenadas.

  it('pingBackend: dispara fetch al backend cuando el setInterval de 9 min se ejecuta', async () => {
    let pingCallback;
    vi.spyOn(global, 'setInterval').mockImplementation((fn, ms) => {
      if (ms === 9 * 60 * 1000) pingCallback = fn;
      return 0;
    });
    vi.spyOn(global, 'clearInterval').mockImplementation(() => {});

    render(<Dashboard user={mockUser} />);
    await waitFor(() => {});

    global.fetch.mockClear();
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    await act(async () => { pingCallback(); });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/data'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  const setupVersionCheck = () => {
    let checkCallback;
    vi.spyOn(global, 'setInterval').mockImplementation((fn, ms) => {
      if (ms === 60 * 1000) checkCallback = fn;
      return 0;
    });
    vi.spyOn(global, 'clearInterval').mockImplementation(() => {});
    return () => checkCallback;
  };

  it('version.json con versión diferente → muestra banner de actualización', async () => {
    const getCallback = setupVersionCheck();
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockApiResponse })
      .mockResolvedValue({ ok: true, json: async () => ({ version: '999.0.0' }) });

    render(<Dashboard user={mockUser} />);
    await waitFor(() => {}); // let initial fetch settle

    await act(async () => { await getCallback()(); });
    expect(screen.getByText('Nueva versión disponible')).toBeInTheDocument();
  });

  it('version.json con misma versión → no muestra banner', async () => {
    const getCallback = setupVersionCheck();
    const { default: pkg } = await import('../../package.json', { assert: { type: 'json' } });
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockApiResponse })
      .mockResolvedValue({ ok: true, json: async () => ({ version: pkg.version }) });

    render(<Dashboard user={mockUser} />);
    await waitFor(() => {});

    await act(async () => { await getCallback()(); });
    expect(screen.queryByText('Nueva versión disponible')).not.toBeInTheDocument();
  });

  it('version.json fetch falla → no muestra banner (silent fail)', async () => {
    const getCallback = setupVersionCheck();
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockApiResponse })
      .mockRejectedValue(new Error('network error'));

    render(<Dashboard user={mockUser} />);
    await waitFor(() => {});

    await act(async () => { await getCallback()().catch(() => {}); });
    expect(screen.queryByText('Nueva versión disponible')).not.toBeInTheDocument();
  });

  it('version.json !ok → no muestra banner', async () => {
    const getCallback = setupVersionCheck();
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockApiResponse })
      .mockResolvedValue({ ok: false, json: async () => ({}) });

    render(<Dashboard user={mockUser} />);
    await waitFor(() => {});

    await act(async () => { await getCallback()(); });
    expect(screen.queryByText('Nueva versión disponible')).not.toBeInTheDocument();
  });

  it('click Actualizar en el banner → llama a window.location.reload', async () => {
    const getCallback = setupVersionCheck();
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      configurable: true,
      writable: true,
    });
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockApiResponse })
      .mockResolvedValue({ ok: true, json: async () => ({ version: '999.0.0' }) });

    render(<Dashboard user={mockUser} />);
    await waitFor(() => {});

    await act(async () => { await getCallback()(); });
    fireEvent.click(screen.getByText('Actualizar'));
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});
