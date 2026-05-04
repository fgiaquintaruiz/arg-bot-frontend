import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Withdraw from '../components/Withdraw';

vi.mock('../components/AddressBook', () => ({
  default: ({ onSelect, onClose }: any) => (
    <div data-testid="address-book-mock">
      <button onClick={() => onSelect({
        id: 'mock-id',
        name: 'Nexo Wallet',
        address: '0x1234567890123456789012345678901234567890',
        network: 'BSC',
        addedAt: new Date().toISOString(),
      })}>
        Seleccionar dirección
      </button>
      <button onClick={onClose}>Cerrar libreta</button>
    </div>
  ),
}));

const mockData: any = {
  balances: { eur: '100.00', usdc: '500.00' },
  fees: { tradingRate: 0.001 },
};

const mockAddress = '0x1234567890123456789012345678901234567890';
const mockAddressBook = [{ id: 'mock-id', name: 'Nexo Wallet', address: mockAddress, network: 'BSC', addedAt: '2026-05-01T00:00:00.000Z' }];

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('argbot_testnet', 'false');
  localStorage.setItem('binance_key', 'test-key');
  localStorage.setItem('binance_secret', 'test-secret');
  localStorage.setItem('address_book', JSON.stringify(mockAddressBook));
  localStorage.setItem('usdc_wallet_id', 'mock-id');
  global.fetch = vi.fn();
});

describe('Withdraw confirmation modal', () => {
  it('Test 1: clicking "Retirar" shows modal with all 6 required fields', async () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '100' } });
    // The button label that initiates the modal — copy the Trade.tsx pattern: "Retirar"
    fireEvent.click(screen.getByRole('button', { name: /^Retirar$/i }));

    // Modal opened
    const dialog = screen.getByRole('dialog');
    // 1. Address name (appears both in selector + modal — modal must contain it)
    expect(screen.getAllByText(/Nexo Wallet/).length).toBeGreaterThan(0);
    // 2. Address truncated + verify last 4 chars hint
    expect(screen.getAllByText(/0x1234.*7890/).length).toBeGreaterThan(0);
    expect(screen.getByText(/verific.* los últimos 4 caracteres/i)).toBeInTheDocument();
    // 3. Amount inside modal
    expect(dialog.textContent).toMatch(/100\s*USDC/);
    // 4. Network
    expect(screen.getByText(/BSC.*BEP20/)).toBeInTheDocument();
    // 5. Fee row: label "Fee" + value "0 USDC" in separate elements
    expect(screen.getByText(/^Fee$/i)).toBeInTheDocument();
    expect(screen.getByText(/^0 USDC$/i)).toBeInTheDocument();
    // 6. Total que llega al destino
    expect(screen.getByText(/Total que llega al destino/i)).toBeInTheDocument();

    // Checkbox
    expect(screen.getByLabelText(/Entiendo que esta operación es irreversible/i)).toBeInTheDocument();

    // No fetch called yet
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('Test 2: confirm button disabled when checkbox unchecked, enabled after check', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: /^Retirar$/i }));

    const confirmBtn = screen.getByRole('button', { name: /Confirmar retiro/i });
    expect(confirmBtn).toBeDisabled();

    const checkbox = screen.getByLabelText(/Entiendo que esta operación es irreversible/i);
    fireEvent.click(checkbox);

    expect(confirmBtn).not.toBeDisabled();
  });

  it('Test 3: cancel closes modal without making fetch call', () => {
    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: /^Retirar$/i }));

    expect(screen.getByLabelText(/Entiendo que esta operación es irreversible/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    expect(screen.queryByLabelText(/Entiendo que esta operación es irreversible/i)).not.toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('Test 4: confirming sends POST to /api/withdraw with correct payload', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    render(<Withdraw data={mockData} onClose={() => {}} onSuccess={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText('Monto a retirar'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: /^Retirar$/i }));

    fireEvent.click(screen.getByLabelText(/Entiendo que esta operación es irreversible/i));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar retiro/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const [url, options] = (global.fetch as any).mock.calls[0];
    expect(url).toContain('/api/withdraw');
    const body = JSON.parse(options.body);
    expect(body.address).toBe(mockAddress);
    expect(body.amountUsdc).toBe('100');
    expect(body.apiKey).toBe('test-key');
    expect(body.apiSecret).toBe('test-secret');
  });
});
