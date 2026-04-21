import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('should show sync and binance tabs (fee and support tabs are removed/gated)', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    expect(screen.getByText('Sync')).toBeInTheDocument();
    expect(screen.getByText('Binance')).toBeInTheDocument();
    expect(screen.queryByText('Soporte')).not.toBeInTheDocument();
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
    fireEvent.click(screen.getByText('Binance'));
    expect(screen.getByText(/Configuración de Binance/)).toBeInTheDocument();
    expect(screen.getByText(/IP para Whitelist/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Tu nombre en Binance/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/LT12/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/REVOLT21XXX/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tu API Key')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tu API Secret')).toBeInTheDocument();
  });

  it('should save binance config to localStorage', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Binance'));

    const ibanInput = screen.getByPlaceholderText(/LT12/);
    fireEvent.change(ibanInput, { target: { value: 'LT96323000000000' } });

    const nameInput = screen.getByPlaceholderText(/Tu nombre en Binance/);
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    fireEvent.click(screen.getByText('Guardar'));

    expect(localStorage.setItem).toHaveBeenCalledWith('binance_eur_iban', 'LT96323000000000');
    expect(localStorage.setItem).toHaveBeenCalledWith('binance_eur_name', 'John Doe');
    expect(screen.getByText('✓ Guardado')).toBeInTheDocument();
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

  it('should include SEPA fields in Drive sync upload payload', async () => {
    const { uploadToDrive } = await import('../googleDrive');
    localStorage.setItem('binance_eur_iban', 'LT96323000000001');
    localStorage.setItem('binance_eur_name', 'Test User');
    localStorage.setItem('binance_eur_bic', 'REVOLT21XXX');
    localStorage.setItem('binance_bank_name', 'Revolut Bank UAB');
    localStorage.setItem('binance_bank_address', 'Vilnius, Lithuania');
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('↑ Subir a Drive'));
    await new Promise(r => setTimeout(r, 50));
    expect(uploadToDrive).toHaveBeenCalledWith(
      expect.objectContaining({
        binanceEurIban: 'LT96323000000001',
        binanceEurName: 'Test User',
        binanceEurBic: 'REVOLT21XXX',
        binanceBankName: 'Revolut Bank UAB',
        binanceBankAddress: 'Vilnius, Lithuania',
      })
    );
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

  // ─── Drive Sync — upload ────────────────────────────────────────────────────

  it('Drive upload success: muestra mensaje de éxito', async () => {
    const { uploadToDrive } = await import('../googleDrive');
    uploadToDrive.mockResolvedValueOnce(true);
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('↑ Subir a Drive'));
    await waitFor(() =>
      expect(screen.getByText(/Datos subidos a tu Google Drive correctamente/)).toBeInTheDocument()
    );
  });

  it('Drive upload returns false: muestra mensaje de error', async () => {
    const { uploadToDrive } = await import('../googleDrive');
    uploadToDrive.mockResolvedValueOnce(false);
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('↑ Subir a Drive'));
    await waitFor(() =>
      expect(screen.getByText(/No se pudo subir/)).toBeInTheDocument()
    );
  });

  it('Drive upload lanza excepción: muestra mensaje con err.message', async () => {
    const { uploadToDrive } = await import('../googleDrive');
    uploadToDrive.mockRejectedValueOnce(new Error('Sin conexión'));
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('↑ Subir a Drive'));
    await waitFor(() =>
      expect(screen.getByText(/Sin conexión/)).toBeInTheDocument()
    );
  });

  it('durante upload: botón muestra "Subiendo..." y el otro queda deshabilitado', async () => {
    const { uploadToDrive } = await import('../googleDrive');
    let resolveUpload;
    uploadToDrive.mockReturnValueOnce(new Promise(r => { resolveUpload = r; }));
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('↑ Subir a Drive'));
    expect(screen.getByText('Subiendo...')).toBeInTheDocument();
    expect(screen.getByText('↓ Descargar de Drive').closest('button')).toBeDisabled();
    resolveUpload(true);
  });

  // ─── Drive Sync — download ──────────────────────────────────────────────────

  it('Drive download success: muestra mensaje de éxito con timestamp', async () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('↓ Descargar de Drive'));
    await waitFor(() =>
      expect(screen.getByText(/Datos restaurados desde Google Drive/)).toBeInTheDocument()
    );
  });

  it('Drive download success: restaura campos en localStorage', async () => {
    const { downloadFromDrive } = await import('../googleDrive');
    downloadFromDrive.mockResolvedValueOnce({
      apiKey: 'restored-key',
      apiSecret: 'restored-secret',
      addressBook: '[{"id":"1"}]',
      tradeHistory: '[]',
      usdcWallet: '0xABC',
      serviceFee: '0.75',
      feeWhitelist: 'admin@test.com',
      binanceEurIban: 'LT96323000000000',
      binanceEurName: 'Test Name',
      binanceEurBic: 'TESTBIC',
      binanceBankName: 'Test Bank',
      binanceBankAddress: 'Test City',
      timestamp: '2026-04-21T00:00:00.000Z',
    });
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('↓ Descargar de Drive'));
    await waitFor(() => expect(screen.getByText(/Datos restaurados/)).toBeInTheDocument());
    expect(localStorage.getItem('binance_eur_iban')).toBe('LT96323000000000');
    expect(localStorage.getItem('binance_key')).toBe('restored-key');
  });

  it('Drive download returns null: muestra "No se encontró un respaldo"', async () => {
    const { downloadFromDrive } = await import('../googleDrive');
    downloadFromDrive.mockResolvedValueOnce(null);
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('↓ Descargar de Drive'));
    await waitFor(() =>
      expect(screen.getByText(/No se encontró un respaldo/)).toBeInTheDocument()
    );
  });

  it('Drive download lanza excepción: muestra mensaje de error', async () => {
    const { downloadFromDrive } = await import('../googleDrive');
    downloadFromDrive.mockRejectedValueOnce(new Error('Drive offline'));
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('↓ Descargar de Drive'));
    await waitFor(() =>
      expect(screen.getByText(/Drive offline/)).toBeInTheDocument()
    );
  });

  it('Drive download error sin mensaje: muestra "Error desconocido"', async () => {
    const { downloadFromDrive } = await import('../googleDrive');
    downloadFromDrive.mockRejectedValueOnce({});
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('↓ Descargar de Drive'));
    await waitFor(() =>
      expect(screen.getByText(/Error desconocido/)).toBeInTheDocument()
    );
  });

  it('durante download: botón muestra "Bajando..."', async () => {
    const { downloadFromDrive } = await import('../googleDrive');
    let resolveDownload;
    downloadFromDrive.mockReturnValueOnce(new Promise(r => { resolveDownload = r; }));
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('↓ Descargar de Drive'));
    expect(screen.getByText('Bajando...')).toBeInTheDocument();
    resolveDownload(null);
  });

  it('Drive download sin campos opcionales: no llama setItem para campos ausentes', async () => {
    const { downloadFromDrive } = await import('../googleDrive');
    downloadFromDrive.mockResolvedValueOnce({
      timestamp: '2026-04-21T00:00:00.000Z',
      // sin apiKey, apiSecret, addressBook, tradeHistory, usdcWallet, serviceFee
    });
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('↓ Descargar de Drive'));
    await waitFor(() => expect(screen.getByText(/Datos restaurados/)).toBeInTheDocument());
    expect(localStorage.getItem('binance_key')).toBeNull();
  });

  it('Drive download sin timestamp: muestra "fecha desconocida" en el mensaje', async () => {
    const { downloadFromDrive } = await import('../googleDrive');
    downloadFromDrive.mockResolvedValueOnce({ apiKey: 'key' });
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('↓ Descargar de Drive'));
    await waitFor(() => expect(screen.getByText(/fecha desconocida/)).toBeInTheDocument());
  });

  it('fetch IP sin campo ip en respuesta: muestra "Error"', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({})
    });
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Binance'));
    await waitFor(() => expect(screen.getByText('Error')).toBeInTheDocument());
  });

  // ─── Binance tab — Save & Clear ─────────────────────────────────────────────

  it('handleSaveBinance: guarda todos los campos en localStorage', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Binance'));

    fireEvent.change(screen.getByPlaceholderText(/Tu nombre en Binance/), { target: { value: 'Juan Pérez' } });
    fireEvent.change(screen.getByPlaceholderText(/LT12/), { target: { value: 'LT96323000000000' } });
    fireEvent.change(screen.getByPlaceholderText(/REVOLT21XXX/), { target: { value: 'LTUVLT22' } });
    fireEvent.change(screen.getByPlaceholderText(/Revolut Bank UAB/), { target: { value: 'Banco X' } });
    fireEvent.change(screen.getByPlaceholderText(/Konstitucijos/), { target: { value: 'Calle Falsa 123' } });
    fireEvent.change(screen.getByPlaceholderText('Tu API Key'), { target: { value: 'myapikey' } });
    fireEvent.change(screen.getByPlaceholderText('Tu API Secret'), { target: { value: 'myapisecret' } });

    fireEvent.click(screen.getByText('Guardar'));

    expect(localStorage.setItem).toHaveBeenCalledWith('binance_eur_name', 'Juan Pérez');
    expect(localStorage.setItem).toHaveBeenCalledWith('binance_eur_iban', 'LT96323000000000');
    expect(localStorage.setItem).toHaveBeenCalledWith('binance_eur_bic', 'LTUVLT22');
    expect(localStorage.setItem).toHaveBeenCalledWith('binance_bank_name', 'Banco X');
    expect(localStorage.setItem).toHaveBeenCalledWith('binance_bank_address', 'Calle Falsa 123');
    expect(localStorage.setItem).toHaveBeenCalledWith('binance_key', 'myapikey');
    expect(localStorage.setItem).toHaveBeenCalledWith('binance_secret', 'myapisecret');
    expect(screen.getByText('✓ Guardado')).toBeInTheDocument();
  });

  it('handleSaveBinance: API keys vacías no se guardan', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Binance'));
    // No llenar API key ni secret
    fireEvent.click(screen.getByText('Guardar'));
    expect(localStorage.setItem).not.toHaveBeenCalledWith('binance_key', expect.anything());
    expect(localStorage.setItem).not.toHaveBeenCalledWith('binance_secret', expect.anything());
  });

  it('handleClearBinance con confirm=true: limpia todos los campos', () => {
    localStorage.setItem('binance_eur_iban', 'LT96323000000000');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Binance'));
    fireEvent.click(screen.getByText('Borrar todo'));
    expect(screen.getByText('✓ Borrado')).toBeInTheDocument();
    expect(localStorage.removeItem).toHaveBeenCalledWith('binance_eur_iban');
    expect(localStorage.removeItem).toHaveBeenCalledWith('binance_key');
  });

  it('handleClearBinance con confirm=false: no modifica nada', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Binance'));
    fireEvent.click(screen.getByText('Borrar todo'));
    expect(screen.queryByText('✓ Borrado')).not.toBeInTheDocument();
    expect(screen.getByText('Borrar todo')).toBeInTheDocument();
  });

  // ─── Server IP ───────────────────────────────────────────────────────────────

  it('Binance tab: muestra la IP del servidor al cargar', async () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Binance'));
    await waitFor(() => expect(screen.getByText('1.2.3.4')).toBeInTheDocument());
  });

  it('Binance tab: muestra "No disponible" si fetch de IP falla', async () => {
    vi.spyOn(window, 'fetch').mockRejectedValueOnce(new Error('network'));
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Binance'));
    await waitFor(() => expect(screen.getByText('No disponible')).toBeInTheDocument());
  });

  it('IP: click "Copiar" → clipboard recibe la IP', async () => {
    const mockWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWrite },
      configurable: true,
      writable: true,
    });
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Binance'));
    await waitFor(() => screen.getByText('1.2.3.4'));
    fireEvent.click(screen.getByText('Copiar'));
    await waitFor(() => expect(mockWrite).toHaveBeenCalledWith('1.2.3.4'));
    expect(screen.getByText('✓ Copiada')).toBeInTheDocument();
  });
});
