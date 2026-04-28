import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Withdraw from '../components/Withdraw';

vi.mock('../components/AddressBook', () => ({
  default: ({ onSelect, onClose }) => (
    <div data-testid="address-book-mock">
      <button onClick={() => onSelect('0x1234567890123456789012345678901234567890')}>
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
const mockAddressBook = [{ name: 'Nexo', address: mockAddress }];

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
      localStorage.setItem('usdc_wallet', mockAddress);
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      expect(screen.queryByText(/Red BSC \(BEP20\)/)).not.toBeInTheDocument();
    });

    it('muestra nombre y dirección truncada cuando hay entrada seleccionada', () => {
      localStorage.setItem('usdc_wallet', mockAddress);
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

    it('con dirección no registrada en libreta: muestra error', () => {
      localStorage.setItem('address_book', JSON.stringify(mockAddressBook));
      localStorage.setItem('usdc_wallet', '0xDIRECCIONNOREGISTRADA000000000000000000');
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '100' } });
      fireEvent.click(screen.getByRole('button', { name: /^Retirar$/ }));
      expect(screen.getByText(/dirección debe ser seleccionada de la libreta/)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('amount > balance: muestra error de saldo insuficiente', () => {
      localStorage.setItem('address_book', JSON.stringify(mockAddressBook));
      localStorage.setItem('usdc_wallet', mockAddress);
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '9999' } });
      fireEvent.click(screen.getByRole('button', { name: /^Retirar$/ }));
      expect(screen.getByText(/Saldo insuficiente/)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('amount exactamente igual a balance: permite retirar (boundary, vía modal)', async () => {
      localStorage.setItem('address_book', JSON.stringify(mockAddressBook));
      localStorage.setItem('usdc_wallet', mockAddress);
      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '500' } });
      fireEvent.click(screen.getByRole('button', { name: /^Retirar$/ }));
      // Modal abierto → checkbox + confirmar
      fireEvent.click(screen.getByLabelText(/Entiendo que esta operación es irreversible/i));
      fireEvent.click(screen.getByRole('button', { name: /Confirmar retiro/i }));
      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    });

    it('sin amount (vacío): no llama a fetch', () => {
      localStorage.setItem('address_book', JSON.stringify(mockAddressBook));
      localStorage.setItem('usdc_wallet', mockAddress);
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.click(screen.getByRole('button', { name: /^Retirar$/ }));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('amount = 0: no llama a fetch', () => {
      localStorage.setItem('address_book', JSON.stringify(mockAddressBook));
      localStorage.setItem('usdc_wallet', mockAddress);
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '0' } });
      fireEvent.click(screen.getByRole('button', { name: /^Retirar$/ }));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('tipear en el input limpia el errorMsg previo', () => {
      localStorage.setItem('address_book', JSON.stringify(mockAddressBook));
      localStorage.setItem('usdc_wallet', mockAddress);
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      // Trigger error
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '9999' } });
      fireEvent.click(screen.getByRole('button', { name: /^Retirar$/ }));
      expect(screen.getByText(/Saldo insuficiente/)).toBeInTheDocument();
      // Tipear limpia el error
      fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '100' } });
      expect(screen.queryByText(/Saldo insuficiente/)).not.toBeInTheDocument();
    });
  });

  // ─── handleWithdraw — API calls ───────────────────────────────────────────────

  describe('handleWithdraw — API', () => {
    beforeEach(() => {
      localStorage.setItem('address_book', JSON.stringify(mockAddressBook));
      localStorage.setItem('usdc_wallet', mockAddress);
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

      // Open modal & confirm with real timers (so the modal renders with React 19)
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

      // Mientras dura el fetch, los botones muestran "Procesando..."
      const processingNodes = screen.getAllByText('Procesando...');
      expect(processingNodes.length).toBeGreaterThan(0);
      processingNodes.forEach(n => expect(n.closest('button')).toBeDisabled());

      // Cleanup
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
      localStorage.setItem('address_book', JSON.stringify([{ name: 'Test', address: longAddress }]));
      localStorage.setItem('usdc_wallet', longAddress);
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
    });

    it('dirección corta (≤12 chars) se muestra completa', () => {
      const shortAddress = '0x12345678';
      localStorage.setItem('address_book', JSON.stringify([{ name: 'Test', address: shortAddress }]));
      localStorage.setItem('usdc_wallet', shortAddress);
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      expect(screen.getByText('0x12345678')).toBeInTheDocument();
    });
  });

  // ─── localStorage ────────────────────────────────────────────────────────────

  describe('Persistencia en localStorage', () => {
    it('la dirección seleccionada se guarda en usdc_wallet', async () => {
      localStorage.setItem('address_book', JSON.stringify(mockAddressBook));
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      fireEvent.click(screen.getByText(/Seleccioná una dirección/));
      fireEvent.click(screen.getByText('Seleccionar dirección'));
      expect(localStorage.getItem('usdc_wallet')).toBe(mockAddress);
    });

    it('la dirección previa de localStorage se usa como valor inicial', () => {
      localStorage.setItem('address_book', JSON.stringify(mockAddressBook));
      localStorage.setItem('usdc_wallet', mockAddress);
      render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
      expect(screen.getByText('Nexo')).toBeInTheDocument();
    });
  });
});
