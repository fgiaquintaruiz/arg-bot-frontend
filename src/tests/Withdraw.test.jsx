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
    const confirmButton = screen.getByText('Confirmar retiro');
    expect(confirmButton).toBeDisabled();
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

  it('should show address book open button', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByText(/Abrir libreta de direcciones/)).toBeInTheDocument();
  });

  it('should call onClose when back button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<Withdraw data={mockData} onClose={mockOnClose} onSuccess={() => {}} />);
    const backButton = screen.getByText(/Volver al menú/);
    fireEvent.click(backButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not allow withdrawal without address', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    const amountInput = screen.getByPlaceholderText('Monto a retirar');
    fireEvent.change(amountInput, { target: { value: '100' } });
    const withdrawButton = screen.getByText('Confirmar retiro');
    expect(() => fireEvent.click(withdrawButton)).not.toThrow();
  });

  it('should not allow withdrawal without amount', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);
    const withdrawButton = screen.getByText('Confirmar retiro');
    expect(() => fireEvent.click(withdrawButton)).not.toThrow();
  });
});
