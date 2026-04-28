import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Trade from '../components/Trade';

const mockData = {
  balances: { eur: '100.00', usdc: '200.00' },
  rate: '1.0850',
  usdcArsRate: '1150.50',
  fees: {
    withdrawalUSDC_BEP20: 0.8,
    tradingRate: 0.001
  }
};

global.fetch = vi.fn();

describe('Trade Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('binance_key', 'encrypted-key');
    localStorage.setItem('binance_secret', 'encrypted-secret');
  });

  it('should render trade component with correct title', () => {
    render(<Trade data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByText('Cambiar EUR a USDC')).toBeInTheDocument();
  });

  it('should show loading state when data is null', () => {
    render(<Trade data={null} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByText('Cargando mercado...')).toBeInTheDocument();
  });

  it('should display exchange rate', () => {
    render(<Trade data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByText(/Tasa: 1.0850/)).toBeInTheDocument();
  });

  it('should NOT display "Disponible" balance row (moved to TradingWizard strip)', () => {
    render(<Trade data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.queryByText(/Disponible:/)).not.toBeInTheDocument();
  });

  it('should update EUR input when user types', () => {
    render(<Trade data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    const input = screen.getByPlaceholderText('Monto en EUR');
    fireEvent.change(input, { target: { value: '50' } });
    expect(input).toHaveValue(50);
  });

  it('should calculate expected USDC amount', () => {
    render(<Trade data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    const input = screen.getByPlaceholderText('Monto en EUR');
    fireEvent.change(input, { target: { value: '100' } });
    const eurAmount = 100;
    const rate = 1.0850;
    const feeRate = 0.001;
    const grossUsdc = eurAmount * rate;
    const fee = grossUsdc * feeRate;
    const netUsdc = grossUsdc - fee;
    expect(screen.getByText(`${netUsdc.toFixed(2)} USDC`)).toBeInTheDocument();
  });

  it('should display trading fee information', () => {
    render(<Trade data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByText(/Comisión est./)).toBeInTheDocument();
    expect(screen.getByText(/0.1%/)).toBeInTheDocument();
  });

  it('should show minimum EUR warning', () => {
    render(<Trade data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByText(/Mínimo ~10 EUR/)).toBeInTheDocument();
  });

  it('should enable MAX button and set amount to balance', () => {
    render(<Trade data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    const maxButton = screen.getByText('MAX');
    fireEvent.click(maxButton);
    const input = screen.getByPlaceholderText('Monto en EUR');
    expect(input).toHaveValue(100);
  });

  it('should show confirmation dialog when initiating trade', () => {
    render(<Trade data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    const input = screen.getByPlaceholderText('Monto en EUR');
    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.click(screen.getByText('Ejecutar cambio'));
    expect(screen.getByText(/Confirmar operación/)).toBeInTheDocument();
    expect(screen.getByText(/Estás a punto de cambiar/)).toBeInTheDocument();
  });

  it('should show error when attempting to trade more than balance', () => {
    render(<Trade data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    const input = screen.getByPlaceholderText('Monto en EUR');
    fireEvent.change(input, { target: { value: '200' } });
    fireEvent.click(screen.getByText('Ejecutar cambio'));
    expect(screen.getByText(/Saldo insuficiente/)).toBeInTheDocument();
  });

  it('should execute trade when confirmed', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { orderId: 12345 } })
    });
    render(<Trade data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    const input = screen.getByPlaceholderText('Monto en EUR');
    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.click(screen.getByText('Ejecutar cambio'));
    fireEvent.click(screen.getByText('Confirmar'));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/trade'),
        expect.objectContaining({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: expect.stringContaining('50') })
      );
    });
  });

  it('should show success message after trade', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { orderId: 12345 } })
    });
    render(<Trade data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    const input = screen.getByPlaceholderText('Monto en EUR');
    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.click(screen.getByText('Ejecutar cambio'));
    fireEvent.click(screen.getByText('Confirmar'));
    await waitFor(() => {
      expect(screen.getByText(/¡Cambio ejecutado con éxito!/)).toBeInTheDocument();
    });
  });

  it('should show error message when trade fails', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Trade failed due to insufficient balance' })
    });
    render(<Trade data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    const input = screen.getByPlaceholderText('Monto en EUR');
    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.click(screen.getByText('Ejecutar cambio'));
    fireEvent.click(screen.getByText('Confirmar'));
    await waitFor(() => {
      expect(screen.getByText(/Trade failed due to insufficient balance/)).toBeInTheDocument();
    });
  });

  it('should call onClose when back button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<Trade data={mockData} onClose={mockOnClose} onSuccess={() => {}} />);
    fireEvent.click(screen.getByText(/Cerrar/));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should cancel confirmation when cancel button is clicked', () => {
    render(<Trade data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    const input = screen.getByPlaceholderText('Monto en EUR');
    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.click(screen.getByText('Ejecutar cambio'));
    expect(screen.getByText(/Confirmar operación/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancelar'));
    expect(screen.queryByText(/Confirmar operación/)).not.toBeInTheDocument();
  });

  it('should save trade to localStorage after success', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { orderId: 12345 } })
    });
    render(<Trade data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    const input = screen.getByPlaceholderText('Monto en EUR');
    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.click(screen.getByText('Ejecutar cambio'));
    fireEvent.click(screen.getByText('Confirmar'));
    await waitFor(() => {
      const history = JSON.parse(localStorage.getItem('trade_history') || '[]');
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('eur', '50');
    });
  });

  it('should include testnet flag in POST body when testnet mode is active', async () => {
    localStorage.setItem('argbot_testnet', 'true');
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { orderId: 99 } })
    });
    render(<Trade data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    const input = screen.getByPlaceholderText('Monto en EUR');
    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.click(screen.getByText('Ejecutar cambio'));
    fireEvent.click(screen.getByText('Confirmar'));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/trade'),
        expect.objectContaining({
          body: expect.stringContaining('"testnet":true'),
        })
      );
    });
  });

  it('should include testnet:false in POST body when testnet mode is inactive', async () => {
    localStorage.setItem('argbot_testnet', 'false');
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { orderId: 99 } })
    });
    render(<Trade data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    const input = screen.getByPlaceholderText('Monto en EUR');
    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.click(screen.getByText('Ejecutar cambio'));
    fireEvent.click(screen.getByText('Confirmar'));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/trade'),
        expect.objectContaining({
          body: expect.stringContaining('"testnet":false'),
        })
      );
    });
  });

  it('should disable buttons during loading', async () => {
    global.fetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    }), 100)));
    render(<Trade data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    const input = screen.getByPlaceholderText('Monto en EUR');
    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.click(screen.getByText('Ejecutar cambio'));
    fireEvent.click(screen.getByText('Confirmar'));
    await waitFor(() => {
      const confirmButton = screen.getByText('Ejecutando...');
      expect(confirmButton).toBeDisabled();
    });
  });
});
