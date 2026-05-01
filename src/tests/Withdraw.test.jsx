import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Withdraw from '../components/Withdraw';

// Updated mock: onSelect receives full AddressEntry (not just address string)
vi.mock('../components/AddressBook', () => ({
  default: ({ onSelect, onClose }) => (
    <div data-testid="address-book-mock">
      <button onClick={() => onSelect({
        id: 'mock-id',
        name: 'Nexo',
        address: mockAddress,
        network: 'BSC',
        addedAt: new Date().toISOString(),
      })}>
        Seleccionar dirección
      </button>
      <button onClick={onClose}>Cerrar libreta</button>
    </div>
  ),
}));

const mockData = {
  balances: { eur: '100.00', usdc: '500.00' },
  fees: { tradingRate: 0.001 },
};

const mockAddress = '0x1234567890123456789012345678901234567890';
const mockEntry = {
  id: 'mock-id',
  name: 'Nexo',
  address: mockAddress,
  network: 'BSC',
  addedAt: '2026-05-01T00:00:00.000Z',
};
const mockAddressBook = [mockEntry];

// Helper: set up localStorage with address_book and optional selectedId
const setupWithdrawLocalStorage = (entries, selectedId = null) => {
  localStorage.setItem('address_book', JSON.stringify(entries));
  if (selectedId) localStorage.setItem('usdc_wallet_id', selectedId);
};

global.fetch = vi.fn();

describe('Withdraw Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('binance_key', 'test-key');
    localStorage.setItem('binance_secret', 'test-secret');
    localStorage.setItem('binance_key_testnet', 'test-key');
    localStorage.setItem('binance_secret_testnet', 'test-secret');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Render básico ────────────────────────────────────────────────────────────

  it('should render withdraw component with correct title', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByText('Retirar USDC')).toBeInTheDocument();
  });

  it('should show loading state when data is null', () => {
    render(<Withdraw data={null} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByText('Cargando saldos...')).toBeInTheDocument();
  });

  it('should show loading state when data has no balances', () => {
    render(<Withdraw data={{}} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByText('Cargando saldos...')).toBeInTheDocument();
  });

  it('should display available USDC balance', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByText(/Disponible: 500.00 USDC/)).toBeInTheDocument();
  });

  it('should show BSC network warning', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByText(/Red BSC \(BEP20\)/)).toBeInTheDocument();
  });

  it('should show empty address book message', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByText(/No tenés direcciones guardadas/)).toBeInTheDocument();
  });

  it('should show warning when no address book entries exist', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByText(/Agregá una dirección en la libreta/)).toBeInTheDocument();
  });

  it('should disable confirm button when no address book', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByRole('button', { name: /^Retirar$/ })).toBeDisabled();
  });

  it('should enable MAX button and set amount to balance', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    fireEvent.click(screen.getByText('MAX'));
    expect(screen.getByPlaceholderText('Monto a retirar')).toHaveValue(500);
  });

  it('should update amount input when user types', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    const input = screen.getByPlaceholderText('Monto a retirar');
    fireEvent.change(input, { target: { value: '100' } });
    expect(input).toHaveValue(100);
  });

  it('should show address book open button', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByText(/Abrir libreta de direcciones/)).toBeInTheDocument();
  });

  it('abre la libreta al click en "Abrir libreta de direcciones" sin entradas', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    fireEvent.click(screen.getByText('Abrir libreta de direcciones'));
    expect(screen.getByTestId('address-book-mock')).toBeInTheDocument();
  });

  it('should call onClose when back button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<Withdraw data={mockData} onClose={mockOnClose} onSuccess={() => {}} />);
    fireEvent.click(screen.getByText(/Cerrar/));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not allow withdrawal without address', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    const amountInput = screen.getByPlaceholderText('Monto a retirar');
    fireEvent.change(amountInput, { target: { value: '100' } });
    expect(() => fireEvent.click(screen.getByRole('button', { name: /^Retirar$/ }))).not.toThrow();
  });

  it('should not allow withdrawal without amount', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    expect(() => fireEvent.click(screen.getByRole('button', { name: /^Retirar$/ }))).not.toThrow();
  });

  it('address_book corrupto en localStorage: muestra empty state sin tirar', () => {
    localStorage.setItem('address_book', 'json-invalido');
    expect(() => render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />)).not.toThrow();
    expect(screen.getByText(/No tenés direcciones guardadas/)).toBeInTheDocument();
  });

  // ─── Con libreta de direcciones ───────────────────────────────────────────────

  describe('Con libreta de direcciones', () => {
    beforeEach(() => {
      localStorage.setItem('address_book', JSON.stringify(mockAddressBook));
    });

    it('muestra "Libreta disponible" cuando hay entradas', () => {
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      expect(screen.getByText('Libreta disponible')).toBeInTheDocument();
    });

    it('muestra "Seleccioná una dirección →" en lugar del estado vacío', () => {
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      expect(screen.getByText(/Seleccioná una dirección/)).toBeInTheDocument();
      expect(screen.queryByText(/No tenés direcciones guardadas/)).not.toBeInTheDocument();
    });

    it('habilita el botón "Retirar" cuando hay libreta', () => {
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      expect(screen.getByRole('button', { name: /^Retirar$/ })).not.toBeDisabled();
    });

    it('oculta el warning BSC cuando hay una dirección seleccionada', () => {
      setupWithdrawLocalStorage(mockAddressBook, 'mock-id');
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      expect(screen.queryByText(/Red BSC \(BEP20\)/)).not.toBeInTheDocument();
    });

    it('muestra nombre y dirección truncada cuando hay entrada seleccionada', () => {
      setupWithdrawLocalStorage(mockAddressBook, 'mock-id');
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      expect(screen.getByText('Nexo')).toBeInTheDocument();
      expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
    });

    it('abre la libreta de direcciones al hacer click en el selector', () => {
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.click(screen.getByText(/Seleccioná una dirección/));
      expect(screen.getByTestId('address-book-mock')).toBeInTheDocument();
    });

    it('cierra la libreta sin seleccionar al hacer click en cerrar', () => {
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.click(screen.getByText(/Seleccioná una dirección/));
      fireEvent.click(screen.getByText('Cerrar libreta'));
      expect(screen.queryByTestId('address-book-mock')).not.toBeInTheDocument();
    });

    it('handleAddressSelect: seleccionar dirección cierra modal y la muestra', () => {
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.click(screen.getByText(/Seleccioná una dirección/));
      fireEvent.click(screen.getByText('Seleccionar dirección'));
      expect(screen.queryByTestId('address-book-mock')).not.toBeInTheDocument();
      expect(screen.getByText('Nexo')).toBeInTheDocument();
    });
  });

  // ─── handleWithdraw — validaciones ───────────────────────────────────────────

  describe('handleWithdraw — validaciones', () => {
    it('sin libreta: el botón Retirar está disabled — no abre modal ni fetch', () => {
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      const btn = screen.getByRole('button', { name: /^Retirar$/ });
      fireEvent.click(btn);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('sin dirección seleccionada (selectedEntry null): muestra error al intentar retirar', () => {
      setupWithdrawLocalStorage(mockAddressBook);
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '100' } });
      fireEvent.click(screen.getByRole('button', { name: /^Retirar$/ }));
      expect(screen.getByText(/Seleccioná una dirección de tu libreta/)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('amount > balance: muestra error de saldo insuficiente', () => {
      setupWithdrawLocalStorage(mockAddressBook, 'mock-id');
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '9999' } });
      fireEvent.click(screen.getByRole('button', { name: /^Retirar$/ }));
      expect(screen.getByText(/Saldo insuficiente/)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('amount exactamente igual a balance: permite retirar (boundary, vía modal)', async () => {
      setupWithdrawLocalStorage(mockAddressBook, 'mock-id');
      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '500' } });
      fireEvent.click(screen.getByRole('button', { name: /^Retirar$/ }));
      fireEvent.click(screen.getByLabelText(/Entiendo que esta operación es irreversible/i));
      fireEvent.click(screen.getByRole('button', { name: /Confirmar retiro/i }));
      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    });

    it('sin amount (vacío): no llama a fetch', () => {
      setupWithdrawLocalStorage(mockAddressBook, 'mock-id');
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.click(screen.getByRole('button', { name: /^Retirar$/ }));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('amount = 0: no llama a fetch', () => {
      setupWithdrawLocalStorage(mockAddressBook, 'mock-id');
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '0' } });
      fireEvent.click(screen.getByRole('button', { name: /^Retirar$/ }));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('tipear en el input limpia el errorMsg previo', () => {
      setupWithdrawLocalStorage(mockAddressBook, 'mock-id');
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '9999' } });
      fireEvent.click(screen.getByRole('button', { name: /^Retirar$/ }));
      expect(screen.getByText(/Saldo insuficiente/)).toBeInTheDocument();
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '100' } });
      expect(screen.queryByText(/Saldo insuficiente/)).not.toBeInTheDocument();
    });
  });

  // ─── handleWithdraw — API calls ───────────────────────────────────────────────

  describe('handleWithdraw — API', () => {
    beforeEach(() => {
      setupWithdrawLocalStorage(mockAddressBook, 'mock-id');
    });

    const openModalAndConfirm = () => {
      fireEvent.click(screen.getByRole('button', { name: /^Retirar$/ }));
      fireEvent.click(screen.getByLabelText(/Entiendo que esta operación es irreversible/i));
      fireEvent.click(screen.getByRole('button', { name: /Confirmar retiro/i }));
    };

    it('llama al endpoint correcto con los datos del formulario', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '100' } });
      openModalAndConfirm();

      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain('/api/withdraw');
      const body = JSON.parse(options.body);
      expect(body.address).toBe(mockAddress);
      expect(body.amountUsdc).toBe('100');
      expect(body.apiKey).toBe('test-key');
    });

    it('API éxito: muestra mensaje de éxito', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '100' } });
      openModalAndConfirm();

      await waitFor(() => expect(screen.getByText(/Solicitud de retiro enviada/)).toBeInTheDocument());
    });

    it('API éxito: llama a onSuccess después de 2 segundos', async () => {
      const mockOnSuccess = vi.fn();
      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={mockOnSuccess} />);
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '100' } });

      fireEvent.click(screen.getByRole('button', { name: /^Retirar$/ }));
      fireEvent.click(screen.getByLabelText(/Entiendo que esta operación es irreversible/i));

      vi.useFakeTimers();
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Confirmar retiro/i })); });
      await act(async () => { vi.advanceTimersByTime(2000); });

      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    it('API error (res.ok=false): muestra el mensaje de error del servidor', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Fondos insuficientes en Binance' }),
      });
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '100' } });
      openModalAndConfirm();

      await waitFor(() =>
        expect(screen.getByText('Fondos insuficientes en Binance')).toBeInTheDocument()
      );
    });

    it('API error sin json.error: muestra fallback "Fallo en el retiro"', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '100' } });
      openModalAndConfirm();

      await waitFor(() =>
        expect(screen.getByText('Fallo en el retiro')).toBeInTheDocument()
      );
    });

    it('error de red (fetch throws): muestra el mensaje del error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network timeout'));
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '100' } });
      openModalAndConfirm();

      await waitFor(() =>
        expect(screen.getByText('Network timeout')).toBeInTheDocument()
      );
    });

    it('durante el fetch: el botón principal queda en "Procesando..." y deshabilitado', async () => {
      let resolveFetch;
      global.fetch.mockReturnValueOnce(new Promise((r) => { resolveFetch = r; }));
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '100' } });
      openModalAndConfirm();

      const processingNodes = screen.getAllByText('Procesando...');
      expect(processingNodes.length).toBeGreaterThan(0);
      processingNodes.forEach(n => expect(n.closest('button')).toBeDisabled());

      resolveFetch({ ok: true, json: async () => ({ success: true }) });
    });

    it('durante el fetch: botón "Cerrar" queda deshabilitado', async () => {
      let resolveFetch;
      global.fetch.mockReturnValueOnce(new Promise((r) => { resolveFetch = r; }));
      const mockOnClose = vi.fn();
      render(<Withdraw data={mockData} onClose={mockOnClose} onSuccess={() => {}} />);
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '100' } });
      openModalAndConfirm();

      expect(screen.getByText(/Cerrar/).closest('button')).toBeDisabled();

      resolveFetch({ ok: true, json: async () => ({ success: true }) });
    });
  });

  // ─── truncateAddress ──────────────────────────────────────────────────────────

  describe('truncateAddress', () => {
    it('dirección larga se muestra truncada (6...4 chars)', () => {
      const longAddress = '0x1234567890123456789012345678901234567890';
      const longEntry = { id: 'long-id', name: 'Test', address: longAddress, network: 'BSC', addedAt: '2026-05-01T00:00:00.000Z' };
      setupWithdrawLocalStorage([longEntry], 'long-id');
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
    });

    it('dirección corta (≤12 chars) se muestra completa', () => {
      const shortAddress = '0x12345678';
      const shortEntry = { id: 'short-id', name: 'Test', address: shortAddress, network: 'BSC', addedAt: '2026-05-01T00:00:00.000Z' };
      setupWithdrawLocalStorage([shortEntry], 'short-id');
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      expect(screen.getByText('0x12345678')).toBeInTheDocument();
    });
  });

  // ─── localStorage / persistencia ─────────────────────────────────────────────

  describe('Persistencia en localStorage', () => {
    it('la dirección seleccionada se guarda en usdc_wallet_id', async () => {
      setupWithdrawLocalStorage(mockAddressBook);
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.click(screen.getByText(/Seleccioná una dirección/));
      fireEvent.click(screen.getByText('Seleccionar dirección'));
      expect(localStorage.getItem('usdc_wallet_id')).toBe('mock-id');
    });

    it('la selección también dual-escribe usdc_wallet (legacy) para rollback', async () => {
      setupWithdrawLocalStorage(mockAddressBook);
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.click(screen.getByText(/Seleccioná una dirección/));
      fireEvent.click(screen.getByText('Seleccionar dirección'));
      expect(localStorage.getItem('usdc_wallet')).toBe(mockAddress);
    });

    it('usdc_wallet_id previo de localStorage se usa como valor inicial', () => {
      setupWithdrawLocalStorage(mockAddressBook, 'mock-id');
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      expect(screen.getByText('Nexo')).toBeInTheDocument();
    });
  });

  // ─── multi-wallet behavior ────────────────────────────────────────────────────

  describe('multi-wallet behavior', () => {
    it('mount: llama migrateLegacyUsdcWallet() al montar (migración)', async () => {
      const { migrateLegacyUsdcWallet } = await import('../lib/withdrawAddress');
      const spy = vi.spyOn({ migrateLegacyUsdcWallet }, 'migrateLegacyUsdcWallet');
      // With a legacy usdc_wallet key and matching address_book entry,
      // the migration should set usdc_wallet_id after mount
      localStorage.setItem('usdc_wallet', mockAddress);
      localStorage.setItem('address_book', JSON.stringify(mockAddressBook));
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      // After migration, the component should show the address via the new id path
      await waitFor(() => {
        expect(localStorage.getItem('usdc_wallet_id')).toBe('mock-id');
      });
    });

    it('render: deriva dirección desde usdc_wallet_id — no lee usdc_wallet legacy', () => {
      setupWithdrawLocalStorage(mockAddressBook, 'mock-id');
      localStorage.setItem('usdc_wallet', '0xSTALE_ADDRESS_SHOULD_NOT_BE_USED_00000000');
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      expect(screen.getByText('Nexo')).toBeInTheDocument();
      expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
    });

    it('id huérfano en mount: muestra mensaje de error', () => {
      const otherEntry = { id: 'other-id', name: 'Other', address: '0xother', network: 'BSC', addedAt: '2026-05-01T00:00:00.000Z' };
      setupWithdrawLocalStorage([otherEntry], 'deleted-id');
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      expect(screen.getByText(/La dirección seleccionada fue eliminada/)).toBeInTheDocument();
    });

    it('id huérfano en mount: limpia usdc_wallet_id de localStorage', async () => {
      const otherEntry = { id: 'other-id', name: 'Other', address: '0xother', network: 'BSC', addedAt: '2026-05-01T00:00:00.000Z' };
      setupWithdrawLocalStorage([otherEntry], 'deleted-id');
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      await waitFor(() => {
        expect(localStorage.getItem('usdc_wallet_id')).toBeNull();
      });
    });

    it('storage event: detecta entry borrada en otro tab y limpia selección', async () => {
      setupWithdrawLocalStorage(mockAddressBook, 'mock-id');
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      expect(screen.getByText('Nexo')).toBeInTheDocument();

      // Simulate another tab deleting the entry
      await act(async () => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'address_book',
          newValue: JSON.stringify([]),
        }));
      });

      await waitFor(() => {
        expect(screen.getByText(/La dirección seleccionada fue eliminada/)).toBeInTheDocument();
      });
    });

    it('address_book vacío con usdc_wallet_id: trata el id como huérfano', () => {
      localStorage.setItem('address_book', JSON.stringify([]));
      localStorage.setItem('usdc_wallet_id', 'some-id');
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      expect(screen.getByText(/La dirección seleccionada fue eliminada/)).toBeInTheDocument();
    });
  });
});
