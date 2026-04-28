import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logout } from '../authService';
import Dashboard from '../Dashboard';
import bundledVersion from '../../public/version.json';

vi.mock('../authService', () => ({ logout: vi.fn() }));

vi.mock('../components/TradingWizard', () => ({
  default: () => <div data-testid="wizard-mock" />,
}));

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
vi.mock('../components/BackendToggle', () => ({
  default: () => <div data-testid="backend-toggle-mock" />,
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
    vi.restoreAllMocks();
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
    expect(dashes.length).toBe(4); // EUR/USDC y los tres slots que dependen de ripioUsdcArsRate
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

  it('click HistoryIcon (historial) → muestra History', () => {
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


  // ─── Swap TESTNET / REAL ──────────────────────────────────────────────────────

  it('muestra botón TESTNET por defecto', () => {
    render(<Dashboard user={mockUser} />);
    expect(screen.getByLabelText('Modo testnet activo')).toBeInTheDocument();
    expect(screen.getByLabelText('Modo testnet activo')).toHaveTextContent('TESTNET');
  });

  it('click TESTNET → abre modal de confirmación', () => {
    render(<Dashboard user={mockUser} />);
    fireEvent.click(screen.getByLabelText('Modo testnet activo'));
    expect(screen.getByText('Cambiar a modo REAL')).toBeInTheDocument();
    expect(screen.getByText(/Tus operaciones afectarán fondos reales/)).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
  });

  it('modal Confirmar → cambia a REAL y guarda en localStorage', async () => {
    render(<Dashboard user={mockUser} />);
    fireEvent.click(screen.getByLabelText('Modo testnet activo'));
    fireEvent.click(screen.getByText('Confirmar'));
    await waitFor(() => {
      expect(screen.getByLabelText('Modo real activo')).toHaveTextContent('REAL');
    });
    expect(localStorage.getItem('argbot_testnet')).toBe('false');
    expect(screen.queryByText('Cambiar a modo REAL')).not.toBeInTheDocument();
  });

  it('modal Cancelar → cierra modal y permanece en TESTNET', () => {
    render(<Dashboard user={mockUser} />);
    fireEvent.click(screen.getByLabelText('Modo testnet activo'));
    fireEvent.click(screen.getByText('Cancelar'));
    expect(screen.queryByText('Cambiar a modo REAL')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Modo testnet activo')).toHaveTextContent('TESTNET');
    expect(localStorage.getItem('argbot_testnet')).toBeNull();
  });

  it('click REAL → cambia a TESTNET sin abrir modal', async () => {
    localStorage.setItem('argbot_testnet', 'false');
    render(<Dashboard user={mockUser} />);
    fireEvent.click(screen.getByLabelText('Modo real activo'));
    await waitFor(() => {
      expect(screen.getByLabelText('Modo testnet activo')).toHaveTextContent('TESTNET');
    });
    expect(screen.queryByText('Cambiar a modo REAL')).not.toBeInTheDocument();
    expect(localStorage.getItem('argbot_testnet')).toBe('true');
  });

  it('click Salir → llama a logout()', () => {
    render(<Dashboard user={mockUser} />);
    fireEvent.click(screen.getByText('Salir'));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  // ─── Stale closure fix: fetchMarketData lee testnet de localStorage ──────────

  it('fetchMarketData envía testnet:true leyendo localStorage (no stale closure) al pasar REAL→TESTNET', async () => {
    // Empezamos en REAL (argbot_testnet = 'false')
    localStorage.setItem('argbot_testnet', 'false');
    render(<Dashboard user={mockUser} />);

    // Limpiamos el fetch del mount
    global.fetch.mockClear();
    global.fetch.mockResolvedValue({ ok: true, json: async () => mockApiResponse });

    // El usuario clickea el botón para cambiar a TESTNET:
    // setIsTestnet(true) + localStorage.setItem('argbot_testnet','true') + fetchMarketData()
    // Si fetchMarketData lee del closure, leerá isTestnet=false (valor viejo)
    // Si lee de localStorage, leerá 'true' → testnet:true (correcto)
    fireEvent.click(screen.getByLabelText('Modo real activo'));

    await waitFor(() => {
      const apiCalls = global.fetch.mock.calls.filter(([url]) => url.includes('/api/data'));
      expect(apiCalls.length).toBeGreaterThan(0);
      const body = JSON.parse(apiCalls[0][1].body);
      expect(body.testnet).toBe(true);
    });
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

  it('checkForUpdates se llama inmediatamente al montar (no espera 60s)', async () => {
    const fetchCalls = [];
    global.fetch.mockImplementation((url) => {
      fetchCalls.push(url);
      if (url.includes('version.json')) {
        return Promise.resolve({ ok: true, json: async () => ({ buildDate: bundledVersion.buildDate }) });
      }
      return Promise.resolve({ ok: true, json: async () => mockApiResponse });
    });

    render(<Dashboard user={mockUser} />);

    await waitFor(() => {
      expect(fetchCalls.some(url => url.includes('version.json'))).toBe(true);
    });
  });

  it('version.json con versión diferente → activa animación en pill y navega con cache-bust tras 1.5s', async () => {
    const locationStub = { pathname: '/app', href: '' };
    Object.defineProperty(window, 'location', {
      value: locationStub,
      configurable: true,
      writable: true,
    });

    const getCallback = setupVersionCheck();

    const originalSetTimeout = globalThis.setTimeout;
    let setTimeoutCallback;
    vi.spyOn(global, 'setTimeout').mockImplementation((fn, ms, ...args) => {
      if (ms === 1500) { setTimeoutCallback = fn; return 0; }
      return originalSetTimeout(fn, ms, ...args);
    });

    global.fetch.mockImplementation((url) => {
      if (url.includes('version.json')) {
        return Promise.resolve({ ok: true, json: async () => ({ buildDate: 'NEW_BUILD_DATE_999' }) });
      }
      return Promise.resolve({ ok: true, json: async () => mockApiResponse });
    });

    render(<Dashboard user={mockUser} />);
    await waitFor(() => expect(setTimeoutCallback).toBeDefined());

    expect(screen.queryByText('Nueva versión disponible')).not.toBeInTheDocument();

    act(() => { setTimeoutCallback(); });
    expect(locationStub.href).toMatch(/^\/app\?_t=\d+$/);
  });

  it('version.json con misma versión → no activa animación ni recarga', async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      configurable: true,
      writable: true,
    });
    global.fetch.mockImplementation((url) => {
      if (url.includes('version.json')) {
        return Promise.resolve({ ok: true, json: async () => ({ buildDate: bundledVersion.buildDate }) });
      }
      return Promise.resolve({ ok: true, json: async () => mockApiResponse });
    });

    render(<Dashboard user={mockUser} />);
    await waitFor(() => {});

    expect(screen.queryByText('Nueva versión disponible')).not.toBeInTheDocument();
    expect(reloadMock).not.toHaveBeenCalled();
  });

  it('version.json fetch falla → no activa animación (silent fail)', async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      configurable: true,
      writable: true,
    });
    global.fetch.mockImplementation((url) => {
      if (url.includes('version.json')) return Promise.reject(new Error('network error'));
      return Promise.resolve({ ok: true, json: async () => mockApiResponse });
    });

    render(<Dashboard user={mockUser} />);
    await waitFor(() => {});

    expect(reloadMock).not.toHaveBeenCalled();
  });

  it('version.json !ok → no activa animación', async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      configurable: true,
      writable: true,
    });
    global.fetch.mockImplementation((url) => {
      if (url.includes('version.json')) return Promise.resolve({ ok: false, json: async () => ({}) });
      return Promise.resolve({ ok: true, json: async () => mockApiResponse });
    });

    render(<Dashboard user={mockUser} />);
    await waitFor(() => {});

    expect(reloadMock).not.toHaveBeenCalled();
  });
});
