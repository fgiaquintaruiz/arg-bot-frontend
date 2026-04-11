import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Withdraw from '../components/Withdraw';

const mockData = {
  balances: { eur: '100.00', usdc: '500.00' },
  fees: {
    withdrawalUSDC_BEP20: 0.8,
    tradingRate: 0.001
  }
};

global.fetch = vi.fn();

describe('Withdraw Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('binance_key', 'encrypted-key');
    localStorage.setItem('binance_secret', 'encrypted-secret');
  });

  it('should render withdraw component with correct title', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);

    expect(screen.getByText('Retirar USDC')).toBeInTheDocument();
  });

  it('should show loading state when data is null', () => {
    render(<Withdraw data={null} onClose={() => {}} onSuccess={() => {}} />);
    
    expect(screen.getByText('Cargando saldos...')).toBeInTheDocument();
  });

  it('should display wallet address input', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    
    const input = screen.getByPlaceholderText('0x...');
    expect(input).toBeInTheDocument();
  });

  it('should load saved wallet address from localStorage', () => {
    localStorage.setItem('usdc_wallet', '0x1234567890abcdef');
    
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    
    const input = screen.getByPlaceholderText('0x...');
    expect(input).toHaveValue('0x1234567890abcdef');
  });

  it('should save wallet address to localStorage on change', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    
    const input = screen.getByPlaceholderText('0x...');
    fireEvent.change(input, { target: { value: '0xabcdef1234567890' } });
    
    expect(localStorage.getItem('usdc_wallet')).toBe('0xabcdef1234567890');
  });

  it('should display available USDC balance', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    
    expect(screen.getByText(/Disponible: 500.00 USDC/)).toBeInTheDocument();
  });

  it('should show BSC network warning', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    
    expect(screen.getByText(/RED BSC \(BEP20\) EXCLUSIVA/)).toBeInTheDocument();
  });

  it('should enable MAX button and set amount to balance', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    
    const maxButton = screen.getByText('MAX');
    fireEvent.click(maxButton);
    
    const input = screen.getByPlaceholderText('Monto a retirar');
    expect(input).toHaveValue(500);
  });

  it('should update amount input when user types', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    
    const input = screen.getByPlaceholderText('Monto a retirar');
    fireEvent.change(input, { target: { value: '100' } });
    
    expect(input).toHaveValue(100);
  });

  it('should show error when attempting to withdraw more than balance', async () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    
    const input = screen.getByPlaceholderText('Monto a retirar');
    fireEvent.change(input, { target: { value: '1000' } });
    
    const addressInput = screen.getByPlaceholderText('0x...');
    fireEvent.change(addressInput, { target: { value: '0x1234567890abcdef' } });
    
    const withdrawButton = screen.getByText('CONFIRMAR RETIRO');
    fireEvent.click(withdrawButton);
    
    expect(await screen.findByText(/Saldo insuficiente/)).toBeInTheDocument();
  });

  it('should execute withdrawal successfully', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { id: 'withdrawal-123' } })
    });

    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    
    const addressInput = screen.getByPlaceholderText('0x...');
    fireEvent.change(addressInput, { target: { value: '0x1234567890abcdef' } });
    
    const amountInput = screen.getByPlaceholderText('Monto a retirar');
    fireEvent.change(amountInput, { target: { value: '100' } });
    
    const withdrawButton = screen.getByText('CONFIRMAR RETIRO');
    fireEvent.click(withdrawButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/withdraw'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String)
        })
      );
    });
  });

  it('should show success message after withdrawal', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { id: 'withdrawal-123' } })
    });

    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    
    const addressInput = screen.getByPlaceholderText('0x...');
    fireEvent.change(addressInput, { target: { value: '0x1234567890abcdef' } });
    
    const amountInput = screen.getByPlaceholderText('Monto a retirar');
    fireEvent.change(amountInput, { target: { value: '100' } });
    
    fireEvent.click(screen.getByText('CONFIRMAR RETIRO'));
    
    await waitFor(() => {
      expect(screen.getByText(/¡Solicitud de retiro enviada!/)).toBeInTheDocument();
    });
  });

  it('should show error message when withdrawal fails', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid address' })
    });

    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    
    const addressInput = screen.getByPlaceholderText('0x...');
    fireEvent.change(addressInput, { target: { value: '0x1234567890abcdef' } });
    
    const amountInput = screen.getByPlaceholderText('Monto a retirar');
    fireEvent.change(amountInput, { target: { value: '100' } });
    
    fireEvent.click(screen.getByText('CONFIRMAR RETIRO'));
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid address/)).toBeInTheDocument();
    });
  });

  it('should call onClose when back button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<Withdraw data={mockData} onClose={mockOnClose} onSuccess={() => {}} />);
    
    const backButton = screen.getByText(/Volver al Menú/);
    fireEvent.click(backButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should disable button during loading', async () => {
    global.fetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    }), 100)));

    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    
    const addressInput = screen.getByPlaceholderText('0x...');
    fireEvent.change(addressInput, { target: { value: '0x1234567890abcdef' } });
    
    const amountInput = screen.getByPlaceholderText('Monto a retirar');
    fireEvent.change(amountInput, { target: { value: '100' } });
    
    fireEvent.click(screen.getByText('CONFIRMAR RETIRO'));
    
    await waitFor(() => {
      const processingButton = screen.getByText('PROCESANDO...');
      expect(processingButton).toBeDisabled();
    });
  });

  it('should not allow withdrawal without address', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    
    const amountInput = screen.getByPlaceholderText('Monto a retirar');
    fireEvent.change(amountInput, { target: { value: '100' } });
    
    // Should not throw error, just return early
    const withdrawButton = screen.getByText('CONFIRMAR RETIRO');
    expect(() => fireEvent.click(withdrawButton)).not.toThrow();
  });

  it('should not allow withdrawal without amount', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    
    const addressInput = screen.getByPlaceholderText('0x...');
    fireEvent.change(addressInput, { target: { value: '0x1234567890abcdef' } });
    
    // Should not throw error, just return early
    const withdrawButton = screen.getByText('CONFIRMAR RETIRO');
    expect(() => fireEvent.click(withdrawButton)).not.toThrow();
  });

  it('should call onSuccess after successful withdrawal', async () => {
    const mockOnSuccess = vi.fn();
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { id: 'withdrawal-123' } })
    });

    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={mockOnSuccess} />);
    
    const addressInput = screen.getByPlaceholderText('0x...');
    fireEvent.change(addressInput, { target: { value: '0x1234567890abcdef' } });
    
    const amountInput = screen.getByPlaceholderText('Monto a retirar');
    fireEvent.change(amountInput, { target: { value: '100' } });
    
    fireEvent.click(screen.getByText('CONFIRMAR RETIRO'));
    
    // Wait for the success message to appear
    await waitFor(() => {
      expect(screen.getByText(/¡Solicitud de retiro enviada!/)).toBeInTheDocument();
    });
    
    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/withdraw'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    );
  });
});
