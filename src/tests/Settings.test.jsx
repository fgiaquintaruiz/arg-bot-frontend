import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Settings from '../components/Settings';

vi.mock('../utils/rateAlertStorage', () => ({
  getRateAlertConfig: vi.fn(() => ({ eurArs: {}, eurUsdc: {} })),
  setRateAlertConfig: vi.fn(),
}));

const mockUser = { email: 'test@gmail.com', displayName: 'Test User' };

vi.mock('../googleDrive', () => ({
  setUserHint: vi.fn(),
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
    await waitFor(() => expect(uploadToDrive).toHaveBeenCalledWith(
      expect.objectContaining({
        binanceEurIban: 'LT96323000000001',
        binanceEurName: 'Test User',
        binanceEurBic: 'REVOLT21XXX',
        binanceBankName: 'Revolut Bank UAB',
        binanceBankAddress: 'Vilnius, Lithuania',
      })
    ));
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

  it('renderiza sin crashear cuando user no tiene email (branch user?.email falsy)', () => {
    render(<Settings onClose={() => {}} user={{ displayName: 'Sin Email' }} />);
    expect(screen.getByText(/Configuración/)).toBeInTheDocument();
  });

  // ─── Drive Sync — dual key storage (testnet keys) ───────────────────────────

  it('Drive upload includes apiKeyTestnet and apiSecretTestnet', async () => {
    const { uploadToDrive } = await import('../googleDrive');
    localStorage.setItem('binance_key_testnet', 'tn-key-123');
    localStorage.setItem('binance_secret_testnet', 'tn-secret-456');
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('↑ Subir a Drive'));
    await waitFor(() => expect(uploadToDrive).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKeyTestnet: 'tn-key-123',
        apiSecretTestnet: 'tn-secret-456',
      })
    ));
  });

  it('Drive download restores binance_key_testnet and binance_secret_testnet', async () => {
    const { downloadFromDrive } = await import('../googleDrive');
    downloadFromDrive.mockResolvedValueOnce({
      apiKey: 'prod-key',
      apiSecret: 'prod-secret',
      apiKeyTestnet: 'tn-key-restored',
      apiSecretTestnet: 'tn-secret-restored',
      timestamp: '2026-04-28T00:00:00.000Z',
    });
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('↓ Descargar de Drive'));
    await waitFor(() => expect(screen.getByText(/Datos restaurados/)).toBeInTheDocument());
    expect(localStorage.getItem('binance_key_testnet')).toBe('tn-key-restored');
    expect(localStorage.getItem('binance_secret_testnet')).toBe('tn-secret-restored');
  });

  it('handleSaveBinance: ✓ Guardado desaparece después de 3 segundos (setTimeout callback)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Binance'));
    fireEvent.click(screen.getByText('Guardar'));
    expect(screen.getByText('✓ Guardado')).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(3000); });
    expect(screen.queryByText('✓ Guardado')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('handleClearBinance: ✓ Borrado desaparece después de 3 segundos (setTimeout callback)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Binance'));
    fireEvent.click(screen.getByText('Borrar todo'));
    expect(screen.getByText('✓ Borrado')).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(3000); });
    expect(screen.queryByText('✓ Borrado')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  // ─── Alertas tab ─────────────────────────────────────────────────────────────

  it('should show Alertas tab button', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    expect(screen.getByText('Alertas')).toBeInTheDocument();
  });

  it('Alertas tab: clicking shows Alertas content section', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Alertas'));
    expect(screen.getByText(/Alertas de tasa/i)).toBeInTheDocument();
  });

  it('Alertas tab: renders EUR/ARS upper input', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Alertas'));
    expect(screen.getByPlaceholderText('Umbral superior EUR/ARS')).toBeInTheDocument();
  });

  it('Alertas tab: renders EUR/ARS lower input', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Alertas'));
    expect(screen.getByPlaceholderText('Umbral inferior EUR/ARS')).toBeInTheDocument();
  });

  it('Alertas tab: renders EUR/USDC upper input', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Alertas'));
    expect(screen.getByPlaceholderText('Umbral superior EUR/USDC')).toBeInTheDocument();
  });

  it('Alertas tab: renders EUR/USDC lower input', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Alertas'));
    expect(screen.getByPlaceholderText('Umbral inferior EUR/USDC')).toBeInTheDocument();
  });

  it('Alertas tab: save valid thresholds → localStorage setItem called with "rate_alert_config"', async () => {
    const { setRateAlertConfig } = await import('../utils/rateAlertStorage');
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Alertas'));
    fireEvent.change(screen.getByPlaceholderText('Umbral superior EUR/ARS'), { target: { value: '1.20' } });
    fireEvent.change(screen.getByPlaceholderText('Umbral inferior EUR/ARS'), { target: { value: '0.80' } });
    fireEvent.click(screen.getByText('Guardar alertas'));
    expect(setRateAlertConfig).toHaveBeenCalledWith(
      expect.objectContaining({ eurArs: expect.objectContaining({ upper: 1.20, lower: 0.80 }) })
    );
  });

  it('Alertas tab: upper < lower same pair → inline validation error shown', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Alertas'));
    fireEvent.change(screen.getByPlaceholderText('Umbral superior EUR/ARS'), { target: { value: '0.80' } });
    fireEvent.change(screen.getByPlaceholderText('Umbral inferior EUR/ARS'), { target: { value: '1.20' } });
    fireEvent.click(screen.getByText('Guardar alertas'));
    expect(screen.getByText(/superior debe ser mayor/i)).toBeInTheDocument();
  });

  it('Alertas tab: empty fields saved → config has undefined thresholds', async () => {
    const { setRateAlertConfig } = await import('../utils/rateAlertStorage');
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Alertas'));
    // Leave all fields empty
    fireEvent.click(screen.getByText('Guardar alertas'));
    expect(setRateAlertConfig).toHaveBeenCalledWith({
      eurArs: { upper: undefined, lower: undefined },
      eurUsdc: { upper: undefined, lower: undefined },
    });
  });

  it('Alertas tab: shows ✓ Guardado after save', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Alertas'));
    fireEvent.click(screen.getByText('Guardar alertas'));
    expect(screen.getByText('✓ Guardado')).toBeInTheDocument();
  });

  it('should open to alerts tab when initialTab="alerts"', () => {
    render(<Settings onClose={() => {}} user={mockUser} initialTab="alerts" />);
    expect(screen.getByPlaceholderText('Umbral superior EUR/ARS')).toBeInTheDocument();
  });

  it('Alertas tab: alertsSaved desaparece después de 3 segundos', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Alertas'));
    fireEvent.click(screen.getByText('Guardar alertas'));
    expect(screen.getByText('✓ Guardado')).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(3000); });
    expect(screen.queryByText('✓ Guardado')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('Alertas tab: EUR/USDC upper <= lower → validation error shown', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Alertas'));
    fireEvent.change(screen.getByPlaceholderText('Umbral superior EUR/USDC'), { target: { value: '0.90' } });
    fireEvent.change(screen.getByPlaceholderText('Umbral inferior EUR/USDC'), { target: { value: '1.10' } });
    fireEvent.click(screen.getByText('Guardar alertas'));
    expect(screen.getByText(/EUR\/USDC: el umbral superior debe ser mayor/i)).toBeInTheDocument();
  });

  it('Alertas tab: save button is disabled when validation error is present', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Alertas'));
    fireEvent.change(screen.getByPlaceholderText('Umbral superior EUR/ARS'), { target: { value: '0.50' } });
    fireEvent.change(screen.getByPlaceholderText('Umbral inferior EUR/ARS'), { target: { value: '1.00' } });
    fireEvent.click(screen.getByText('Guardar alertas'));
    expect(screen.getByText(/superior debe ser mayor/i)).toBeInTheDocument();
    expect(screen.getByText('Guardar alertas').closest('button')).toBeDisabled();
  });

  it('Alertas tab: initializes fields from getRateAlertConfig', async () => {
    const { getRateAlertConfig } = await import('../utils/rateAlertStorage');
    getRateAlertConfig.mockReturnValue({ eurArs: { upper: 1.5, lower: 0.5 }, eurUsdc: { upper: 1.1, lower: 0.9 } });
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Alertas'));
    expect(screen.getByPlaceholderText('Umbral superior EUR/ARS').value).toBe('1.5');
    expect(screen.getByPlaceholderText('Umbral inferior EUR/ARS').value).toBe('0.5');
    expect(screen.getByPlaceholderText('Umbral superior EUR/USDC').value).toBe('1.1');
    expect(screen.getByPlaceholderText('Umbral inferior EUR/USDC').value).toBe('0.9');
  });

  it('should open to notif tab when initialTab="notif"', () => {
    render(<Settings onClose={() => {}} user={mockUser} initialTab="notif" />);
    expect(screen.getByRole('heading', { name: /Notificaciones/i })).toBeInTheDocument();
    expect(screen.getByText(/Mostrar banner de notificaciones/i)).toBeInTheDocument();
  });

  it('Notif tab: renders toggle and description', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Notif'));
    expect(screen.getByRole('heading', { name: /Notificaciones/i })).toBeInTheDocument();
    expect(screen.getByText(/Mostrar banner de notificaciones/i)).toBeInTheDocument();
    expect(screen.getByText(/Cuando está activo/i)).toBeInTheDocument();
  });

  it('Notif tab: toggle ON → OFF saves "false" to localStorage', () => {
    localStorage.setItem('argbot_notif_banner_enabled', 'true');
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Notif'));
    const toggleDiv = screen.getByText(/Mostrar banner/).closest('label').querySelector('div');
    fireEvent.click(toggleDiv);
    expect(localStorage.setItem).toHaveBeenCalledWith('argbot_notif_banner_enabled', 'false');
  });

  it('Notif tab: toggle OFF → ON saves "true" to localStorage', () => {
    localStorage.setItem('argbot_notif_banner_enabled', 'false');
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Notif'));
    const toggleDiv = screen.getByText(/Mostrar banner/).closest('label').querySelector('div');
    fireEvent.click(toggleDiv);
    expect(localStorage.setItem).toHaveBeenCalledWith('argbot_notif_banner_enabled', 'true');
  });

  it('Notif tab: initial state reads localStorage (false branch)', () => {
    localStorage.setItem('argbot_notif_banner_enabled', 'false');
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Notif'));
    expect(screen.getByText(/Mostrar banner/)).toBeInTheDocument();
  });

  it('Binance tab: switching to Testnet sub-tab shows testnet inputs', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Binance'));
    fireEvent.click(screen.getByText('Testnet'));
    expect(screen.getByPlaceholderText('Tu API Key (testnet)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tu API Secret (testnet)')).toBeInTheDocument();
    expect(screen.getByText(/Claves exclusivas de testnet.binance.vision/)).toBeInTheDocument();
  });

  it('Binance tab: switching back to Producción from Testnet shows prod inputs', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Binance'));
    fireEvent.click(screen.getByText('Testnet'));
    fireEvent.click(screen.getByText('Producción'));
    expect(screen.getByPlaceholderText('Tu API Key')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tu API Secret')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Tu API Key (testnet)')).not.toBeInTheDocument();
  });

  it('handleSaveBinance en testnet: guarda claves testnet si no están vacías', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Binance'));
    fireEvent.click(screen.getByText('Testnet'));
    fireEvent.change(screen.getByPlaceholderText('Tu API Key (testnet)'), { target: { value: 'tn-key' } });
    fireEvent.change(screen.getByPlaceholderText('Tu API Secret (testnet)'), { target: { value: 'tn-secret' } });
    fireEvent.click(screen.getByText('Guardar'));
    expect(localStorage.setItem).toHaveBeenCalledWith('binance_key_testnet', 'tn-key');
    expect(localStorage.setItem).toHaveBeenCalledWith('binance_secret_testnet', 'tn-secret');
  });

  it('handleSaveBinance en testnet: claves vacías no se guardan', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Binance'));
    fireEvent.click(screen.getByText('Testnet'));
    fireEvent.click(screen.getByText('Guardar'));
    expect(localStorage.setItem).not.toHaveBeenCalledWith('binance_key_testnet', expect.anything());
    expect(localStorage.setItem).not.toHaveBeenCalledWith('binance_secret_testnet', expect.anything());
  });

  it('Binance tab: initialTab="binance" reads testnet flag from localStorage', () => {
    localStorage.setItem('argbot_testnet', 'true');
    render(<Settings onClose={() => {}} user={mockUser} initialTab="binance" />);
    expect(screen.getByPlaceholderText('Tu API Key (testnet)')).toBeInTheDocument();
  });

  it('copyToClipboard: catch branch — no throw si clipboard falla', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
      writable: true,
    });
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('Binance'));
    await waitFor(() => screen.getByText('1.2.3.4'));
    expect(() => fireEvent.click(screen.getByText('Copiar'))).not.toThrow();
    await waitFor(() => expect(screen.queryByText('✓ Copiada')).not.toBeInTheDocument());
  });

  it('Drive download con rateAlertConfig válido: restaura umbrales en el formulario', async () => {
    const { downloadFromDrive } = await import('../googleDrive');
    downloadFromDrive.mockResolvedValueOnce({
      rateAlertConfig: JSON.stringify({ eurArs: { upper: 2.0, lower: 1.0 }, eurUsdc: { upper: 1.2, lower: 0.8 } }),
      timestamp: '2026-05-01T00:00:00.000Z',
    });
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('↓ Descargar de Drive'));
    await waitFor(() => expect(screen.getByText(/Datos restaurados/)).toBeInTheDocument());
    expect(localStorage.getItem('rate_alert_config')).not.toBeNull();
  });

  it('Sync tab: volver a Sync desde otra tab muestra contenido de sincronización', () => {
    render(<Settings onClose={() => {}} user={mockUser} />);
    // Navegar a Binance para que activeTab !== 'sync'
    fireEvent.click(screen.getByText('Binance'));
    expect(screen.getByText(/Configuración de Binance/)).toBeInTheDocument();
    // Hacer click en Sync para volver → dispara setActiveTab('sync')
    fireEvent.click(screen.getByText('Sync'));
    expect(screen.getByText(/Sincronización con Google Drive/)).toBeInTheDocument();
    expect(screen.queryByText(/Configuración de Binance/)).not.toBeInTheDocument();
  });

  it('Drive download con rateAlertConfig JSON inválido: no lanza error', async () => {
    const { downloadFromDrive } = await import('../googleDrive');
    downloadFromDrive.mockResolvedValueOnce({
      rateAlertConfig: 'not-valid-json',
      timestamp: '2026-05-01T00:00:00.000Z',
    });
    render(<Settings onClose={() => {}} user={mockUser} />);
    fireEvent.click(screen.getByText('↓ Descargar de Drive'));
    await waitFor(() => expect(screen.getByText(/Datos restaurados/)).toBeInTheDocument());
    expect(localStorage.getItem('rate_alert_config')).toBe('not-valid-json');
  });

});
