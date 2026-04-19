import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Settings from '../components/Settings';

const mockUser = { email: 'test@gmail.com', displayName: 'Test User' };

vi.mock('../googleDrive', () => ({
  uploadToDrive: vi.fn().mockResolvedValue(true),
  downloadFromDrive: vi.fn().mockResolvedValue({
    version: 1,
    timestamp: '2026-04-10T10:00:00.000Z',
    apiKey: 'test-key',
    apiSecret: 'test-secret',
    addressBook: '[]',
    tradeHistory: '[]',
    usdcWallet: '0x123',
    serviceFee: '0.50',
    feeWhitelist: ''
  })
}));

describe('Settings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Ensure localStorage methods are available
    vi.spyOn(Storage.prototype, 'setItem');
    vi.spyOn(Storage.prototype, 'getItem');
    vi.spyOn(Storage.prototype, 'removeItem');
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ip: '1.2.3.4' })
    });
  });

  it('should render settings with title', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    expect(screen.getByText(/Configuración/)).toBeInTheDocument();
  });

  it('should show sync, binance and support tabs (fee tab is gated)', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    expect(screen.getByText('☁️ Sync')).toBeInTheDocument();
    expect(screen.getByText('🏦 Binance')).toBeInTheDocument();
    expect(screen.getByText('📧 Soporte')).toBeInTheDocument();
  });

  it('should NOT render the Fee tab while FEE_ENABLED is false', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    expect(screen.queryByText('💰 Fee')).not.toBeInTheDocument();
    expect(screen.queryByText(/Fee de Servicio/)).not.toBeInTheDocument();
  });

  it('should coerce initialTab="fee" to sync while Fee is disabled', () => {
    render(<Settings onClose={() => {}} user={mockUser} initialTab="fee" />);
    expect(screen.getByText(/Sincronización con Google Drive/)).toBeInTheDocument();
    expect(screen.queryByText(/Fee de Servicio/)).not.toBeInTheDocument();
  });

  it('should show sync tab content by default', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    expect(screen.getByText(/Sincronización con Google Drive/)).toBeInTheDocument();
  });

  it('should show binance tab with all fields', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('🏦 Binance'));
    expect(screen.getByText(/Configuración de Binance/)).toBeInTheDocument();
    expect(screen.getByText(/IP para Whitelist/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Tu nombre completo/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/LT12/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/REVOLT21XXX/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Tu API Key/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Tu API Secret/)).toBeInTheDocument();
  });

  it('should save binance config to localStorage', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('🏦 Binance'));

    const ibanInput = screen.getByPlaceholderText(/LT12/);
    fireEvent.change(ibanInput, { target: { value: 'LT96323000000000' } });

    const nameInput = screen.getByPlaceholderText(/Tu nombre completo/);
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    fireEvent.click(screen.getByText('💾 Guardar'));

    expect(localStorage.setItem).toHaveBeenCalledWith('binance_eur_iban', 'LT96323000000000');
    expect(localStorage.setItem).toHaveBeenCalledWith('binance_eur_name', 'John Doe');
    expect(screen.getByText('✅ ¡Guardado!')).toBeInTheDocument();
  });

  // Fee tab behavior tests are skipped while FEE_ENABLED === false (pending redacted authorization).
  // Re-enable by removing `.skip` when the flag is flipped in Settings.tsx.
  it.skip('should show fee tab with inputs', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('💰 Fee'));
    expect(screen.getByText(/Fee de Servicio/)).toBeInTheDocument();
  });

  it.skip('should save fee configuration', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('💰 Fee'));
    const feeInput = screen.getByDisplayValue('0.50');
    fireEvent.change(feeInput, { target: { value: '0.75' } });
    fireEvent.click(screen.getByText('💾 Guardar Configuración'));
    expect(localStorage.setItem).toHaveBeenCalledWith('service_fee', '0.75');
  });

  it.skip('should reject invalid fee values', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('💰 Fee'));
    const feeInput = screen.getByDisplayValue('0.50');
    fireEvent.change(feeInput, { target: { value: '5.00' } });
    fireEvent.click(screen.getByText('💾 Guardar Configuración'));
    expect(alertMock).toHaveBeenCalledWith('El fee debe ser entre 0.00 y 1.00 EUR');
    alertMock.mockRestore();
  });

  it('should show support tab with email', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('📧 Soporte'));
    expect(screen.getByText(/soporte@argbot.app/)).toBeInTheDocument();
  });

  it('should open to specified initial tab', () => {
    render(<Settings onClose={() => {}} user={mockUser} initialTab="binance" />);
    expect(screen.getByText(/Configuración de Binance/)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<Settings onClose={mockOnClose} user={mockUser} />);
    const closeButton = screen.getByText('✖');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
