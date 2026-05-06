import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ─── Mocks externos ────────────────────────────────────────────────────────────

vi.mock('../googleDrive', () => ({
  uploadToDrive: vi.fn(),
  downloadFromDrive: vi.fn(),
  setUserHint: vi.fn(),
}));

vi.mock('../config', () => ({
  API_URL: 'http://localhost:3001',
}));

vi.mock('firebase/auth', () => ({}));

vi.mock('../utils/rateAlertStorage', () => ({
  getRateAlertConfig: vi.fn(() => ({ eurArs: {}, eurUsdc: {} })),
  setRateAlertConfig: vi.fn(),
}));

vi.mock('../utils/storageKeys', () => ({
  STORAGE_KEYS: {
    TRADE_HISTORY: 'trade_history',
    ADDRESS_BOOK: 'address_book',
    USDC_WALLET_ID: 'usdc_wallet_id',
    USDC_WALLET: 'usdc_wallet',
    ARGBOT_TESTNET: 'argbot_testnet',
    BINANCE_KEY: 'binance_key',
    BINANCE_SECRET: 'binance_secret',
    BINANCE_KEY_TESTNET: 'binance_key_testnet',
    BINANCE_SECRET_TESTNET: 'binance_secret_testnet',
    BINANCE_EUR_IBAN: 'binance_eur_iban',
    BINANCE_EUR_NAME: 'binance_eur_name',
    BINANCE_EUR_BIC: 'binance_eur_bic',
    BINANCE_BANK_NAME: 'binance_bank_name',
    BINANCE_BANK_ADDRESS: 'binance_bank_address',
    USER_EMAIL: 'user_email',
    SERVICE_FEE: 'service_fee',
    FEE_WHITELIST: 'fee_whitelist',
    ARGBOT_NOTIF_BANNER_ENABLED: 'argbot_notif_banner_enabled',
    ARGBOT_NOTIF_OPT_IN_DISMISSED: 'argbot_notif_opt_in_dismissed',
    ARGBOT_NOTIFICATIONS_ENABLED: 'argbot_notifications_enabled',
    DRIVE_FILE_ID: 'drive_file_id',
  },
}));

// ─── Import del componente (después de los mocks) ─────────────────────────────

import Settings from '../components/Settings';
import { uploadToDrive, downloadFromDrive } from '../googleDrive';
import { setRateAlertConfig } from '../utils/rateAlertStorage';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockUser = { email: 'test@test.com', uid: 'test-uid' } as any;

const defaultProps = {
  onClose: vi.fn(),
  user: mockUser,
};

function renderSettings(props = {}) {
  return render(<Settings {...defaultProps} {...props} />);
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  // Mock fetch para la IP del servidor (tab binance)
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ ip: '192.168.1.100' }),
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Settings — tab switching', () => {
  it('renderiza con initialTab=sync → tab Sync activa por defecto', () => {
    renderSettings({ initialTab: 'sync' });
    expect(screen.getByText('Sincronización con Google Drive')).toBeInTheDocument();
  });

  it('sin initialTab → tab Sync activa por defecto', () => {
    renderSettings();
    expect(screen.getByText('Sincronización con Google Drive')).toBeInTheDocument();
  });

  it('click en tab Binance → muestra contenido de Binance', async () => {
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Binance' }));
    await waitFor(() => {
      expect(screen.getByText('Configuración de Binance')).toBeInTheDocument();
    });
  });

  it('click en tab Alertas → muestra umbrales de alertas', () => {
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Alertas' }));
    expect(screen.getByText('Alertas de tasa')).toBeInTheDocument();
  });

  it('click en tab Notif → muestra toggle de notificaciones', () => {
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Notif' }));
    expect(screen.getByText('Notificaciones')).toBeInTheDocument();
    expect(screen.getByText('Mostrar banner de notificaciones')).toBeInTheDocument();
  });

  it('renderiza con initialTab=binance → abre directamente en Binance', async () => {
    renderSettings({ initialTab: 'binance' });
    await waitFor(() => {
      expect(screen.getByText('Configuración de Binance')).toBeInTheDocument();
    });
  });

  it('renderiza con initialTab=alerts → abre directamente en Alertas', () => {
    renderSettings({ initialTab: 'alerts' });
    expect(screen.getByText('Alertas de tasa')).toBeInTheDocument();
  });

  it('renderiza con initialTab=notif → abre directamente en Notif', () => {
    renderSettings({ initialTab: 'notif' });
    expect(screen.getByText('Notificaciones')).toBeInTheDocument();
  });

  it('click en X cierra el modal llamando a onClose', () => {
    const onClose = vi.fn();
    renderSettings({ onClose });
    fireEvent.click(screen.getByLabelText('Cerrar configuración'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ─── Tab Sync ─────────────────────────────────────────────────────────────────

describe('Settings — Tab Sync (Google Drive)', () => {
  it('botón Subir llama a uploadToDrive', async () => {
    (uploadToDrive as any).mockResolvedValue(true);
    renderSettings({ initialTab: 'sync' });
    fireEvent.click(screen.getByRole('button', { name: /Subir a Drive/ }));
    await waitFor(() => {
      expect(uploadToDrive).toHaveBeenCalledTimes(1);
    });
  });

  it('upload exitoso → muestra mensaje de éxito', async () => {
    (uploadToDrive as any).mockResolvedValue(true);
    renderSettings({ initialTab: 'sync' });
    fireEvent.click(screen.getByRole('button', { name: /Subir a Drive/ }));
    await waitFor(() => {
      expect(screen.getByText(/Datos subidos a tu Google Drive/)).toBeInTheDocument();
    });
  });

  it('upload fallido (uploadToDrive retorna false) → muestra mensaje de error', async () => {
    (uploadToDrive as any).mockResolvedValue(false);
    renderSettings({ initialTab: 'sync' });
    fireEvent.click(screen.getByRole('button', { name: /Subir a Drive/ }));
    await waitFor(() => {
      expect(screen.getByText(/No se pudo subir/)).toBeInTheDocument();
    });
  });

  it('botón Descargar llama a downloadFromDrive', async () => {
    (downloadFromDrive as any).mockResolvedValue(null);
    renderSettings({ initialTab: 'sync' });
    fireEvent.click(screen.getByRole('button', { name: /Descargar de Drive/ }));
    await waitFor(() => {
      expect(downloadFromDrive).toHaveBeenCalledTimes(1);
    });
  });

  it('download exitoso → restaura datos en localStorage', async () => {
    const driveData = {
      apiKey: 'restored-key',
      apiSecret: 'restored-secret',
      addressBook: '[]',
      tradeHistory: '[]',
      timestamp: '2024-01-01T00:00:00.000Z',
    };
    (downloadFromDrive as any).mockResolvedValue(driveData);
    renderSettings({ initialTab: 'sync' });
    fireEvent.click(screen.getByRole('button', { name: /Descargar de Drive/ }));
    await waitFor(() => {
      expect(localStorage.getItem('binance_key')).toBe('restored-key');
      expect(localStorage.getItem('binance_secret')).toBe('restored-secret');
    });
  });

  it('download exitoso → muestra mensaje de éxito', async () => {
    const driveData = {
      apiKey: 'key',
      timestamp: '2024-01-01T00:00:00.000Z',
    };
    (downloadFromDrive as any).mockResolvedValue(driveData);
    renderSettings({ initialTab: 'sync' });
    fireEvent.click(screen.getByRole('button', { name: /Descargar de Drive/ }));
    await waitFor(() => {
      expect(screen.getByText(/Datos restaurados desde Google Drive/)).toBeInTheDocument();
    });
  });

  it('download retorna null → muestra advertencia de no backup encontrado', async () => {
    (downloadFromDrive as any).mockResolvedValue(null);
    renderSettings({ initialTab: 'sync' });
    fireEvent.click(screen.getByRole('button', { name: /Descargar de Drive/ }));
    await waitFor(() => {
      expect(screen.getByText(/No se encontró un respaldo/)).toBeInTheDocument();
    });
  });
});

// ─── Tab Binance ──────────────────────────────────────────────────────────────

describe('Settings — Tab Binance', () => {
  it('muestra la IP del servidor obtenida de /api/ip', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ ip: '10.0.0.42' }),
    });
    renderSettings({ initialTab: 'binance' });
    await waitFor(() => {
      expect(screen.getByText('10.0.0.42')).toBeInTheDocument();
    });
  });

  it('fetch de IP falla → muestra "No disponible"', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network error'));
    renderSettings({ initialTab: 'binance' });
    await waitFor(() => {
      expect(screen.getByText('No disponible')).toBeInTheDocument();
    });
  });

  it('guarda campos EUR en localStorage al hacer click en Guardar', async () => {
    renderSettings({ initialTab: 'binance' });
    await waitFor(() => screen.getByText('Configuración de Binance'));

    const ibanInput = screen.getByPlaceholderText('LT12 3456 7890 1234 5678');
    fireEvent.change(ibanInput, { target: { value: 'LT12999' } });

    fireEvent.click(screen.getByRole('button', { name: /^Guardar$/ }));

    expect(localStorage.getItem('binance_eur_iban')).toBe('LT12999');
  });

  it('guarda API Key prod en localStorage al hacer Guardar', async () => {
    renderSettings({ initialTab: 'binance' });
    await waitFor(() => screen.getByText('Configuración de Binance'));

    const keyInput = screen.getByPlaceholderText('Tu API Key');
    fireEvent.change(keyInput, { target: { value: 'my-api-key-123' } });

    fireEvent.click(screen.getByRole('button', { name: /^Guardar$/ }));

    expect(localStorage.getItem('binance_key')).toBe('my-api-key-123');
  });

  it('botón Guardar muestra confirmación visual "✓ Guardado"', async () => {
    renderSettings({ initialTab: 'binance' });
    await waitFor(() => screen.getByText('Configuración de Binance'));

    fireEvent.click(screen.getByRole('button', { name: /^Guardar$/ }));
    expect(screen.getByText('✓ Guardado')).toBeInTheDocument();
  });

  it('botón Borrar todo con confirmación → limpia localStorage', async () => {
    localStorage.setItem('binance_key', 'old-key');
    localStorage.setItem('binance_secret', 'old-secret');
    localStorage.setItem('binance_eur_iban', 'old-iban');

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderSettings({ initialTab: 'binance' });
    await waitFor(() => screen.getByText('Configuración de Binance'));

    fireEvent.click(screen.getByRole('button', { name: /Borrar todo/ }));

    expect(localStorage.getItem('binance_key')).toBeNull();
    expect(localStorage.getItem('binance_secret')).toBeNull();
    expect(localStorage.getItem('binance_eur_iban')).toBeNull();
  });

  it('botón Borrar todo con cancel en confirm → NO limpia localStorage', async () => {
    localStorage.setItem('binance_key', 'old-key');

    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderSettings({ initialTab: 'binance' });
    await waitFor(() => screen.getByText('Configuración de Binance'));

    fireEvent.click(screen.getByRole('button', { name: /Borrar todo/ }));

    expect(localStorage.getItem('binance_key')).toBe('old-key');
  });

  it('tab Testnet activo → guarda en binance_key_testnet', async () => {
    renderSettings({ initialTab: 'binance' });
    await waitFor(() => screen.getByText('Configuración de Binance'));

    fireEvent.click(screen.getByRole('button', { name: 'Testnet' }));
    const testnetKeyInput = screen.getByPlaceholderText('Tu API Key (testnet)');
    fireEvent.change(testnetKeyInput, { target: { value: 'testnet-key-xyz' } });

    fireEvent.click(screen.getByRole('button', { name: /^Guardar$/ }));

    expect(localStorage.getItem('binance_key_testnet')).toBe('testnet-key-xyz');
  });
});

// ─── Tab Alerts ───────────────────────────────────────────────────────────────

describe('Settings — Tab Alerts', () => {
  it('guarda umbrales via setRateAlertConfig al hacer click en Guardar alertas', () => {
    renderSettings({ initialTab: 'alerts' });

    const upperInput = screen.getByPlaceholderText('Umbral superior EUR/ARS');
    const lowerInput = screen.getByPlaceholderText('Umbral inferior EUR/ARS');
    fireEvent.change(upperInput, { target: { value: '1500' } });
    fireEvent.change(lowerInput, { target: { value: '1200' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar alertas/ }));

    expect(setRateAlertConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        eurArs: expect.objectContaining({ upper: 1500, lower: 1200 }),
      })
    );
  });

  it('validación EUR/ARS: lower >= upper → muestra error y NO guarda', () => {
    renderSettings({ initialTab: 'alerts' });

    fireEvent.change(screen.getByPlaceholderText('Umbral superior EUR/ARS'), {
      target: { value: '1000' },
    });
    fireEvent.change(screen.getByPlaceholderText('Umbral inferior EUR/ARS'), {
      target: { value: '1200' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Guardar alertas/ }));

    expect(screen.getByText(/EUR\/ARS: el umbral superior debe ser mayor que el inferior/)).toBeInTheDocument();
    expect(setRateAlertConfig).not.toHaveBeenCalled();
  });

  it('validación EUR/USDC: lower >= upper → muestra error', () => {
    renderSettings({ initialTab: 'alerts' });

    fireEvent.change(screen.getByPlaceholderText('Umbral superior EUR/USDC'), {
      target: { value: '0.90' },
    });
    fireEvent.change(screen.getByPlaceholderText('Umbral inferior EUR/USDC'), {
      target: { value: '1.10' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Guardar alertas/ }));

    expect(screen.getByText(/EUR\/USDC: el umbral superior debe ser mayor que el inferior/)).toBeInTheDocument();
    expect(setRateAlertConfig).not.toHaveBeenCalled();
  });

  it('guardar con valores válidos → muestra confirmación "✓ Guardado"', () => {
    renderSettings({ initialTab: 'alerts' });

    fireEvent.change(screen.getByPlaceholderText('Umbral superior EUR/ARS'), {
      target: { value: '1500' },
    });
    fireEvent.change(screen.getByPlaceholderText('Umbral inferior EUR/ARS'), {
      target: { value: '1000' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Guardar alertas/ }));

    expect(screen.getByText('✓ Guardado')).toBeInTheDocument();
  });

  it('guarda umbrales EUR/USDC correctamente', () => {
    renderSettings({ initialTab: 'alerts' });

    fireEvent.change(screen.getByPlaceholderText('Umbral superior EUR/USDC'), {
      target: { value: '1.10' },
    });
    fireEvent.change(screen.getByPlaceholderText('Umbral inferior EUR/USDC'), {
      target: { value: '0.90' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Guardar alertas/ }));

    expect(setRateAlertConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        eurUsdc: expect.objectContaining({ upper: 1.1, lower: 0.9 }),
      })
    );
  });

  it('solo upper definido (sin lower) → guarda sin error de validación', () => {
    renderSettings({ initialTab: 'alerts' });

    fireEvent.change(screen.getByPlaceholderText('Umbral superior EUR/ARS'), {
      target: { value: '1500' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Guardar alertas/ }));

    expect(setRateAlertConfig).toHaveBeenCalled();
    expect(screen.queryByText(/umbral superior debe ser mayor/)).not.toBeInTheDocument();
  });
});

// ─── Tab Notif ────────────────────────────────────────────────────────────────

describe('Settings — Tab Notif', () => {
  it('toggle ON por defecto (localStorage no definido) → banner habilitado', () => {
    renderSettings({ initialTab: 'notif' });
    expect(screen.getByText('Mostrar banner de notificaciones')).toBeInTheDocument();
  });

  it('click en toggle → deshabilita banner y guarda false en localStorage', () => {
    renderSettings({ initialTab: 'notif' });

    // El toggle no tiene role="checkbox", es un div clickable con clase CSS module.
    // No tiene atributo style inline — usamos el primer div dentro del label.
    const toggleDiv = screen.getByText('Mostrar banner de notificaciones')
      .closest('label')!
      .querySelector('div')!;

    fireEvent.click(toggleDiv);

    expect(localStorage.getItem('argbot_notif_banner_enabled')).toBe('false');
  });

  it('click doble en toggle → vuelve a habilitar y guarda true en localStorage', () => {
    renderSettings({ initialTab: 'notif' });

    const toggleDiv = screen.getByText('Mostrar banner de notificaciones')
      .closest('label')!
      .querySelector('div')!;

    fireEvent.click(toggleDiv);
    fireEvent.click(toggleDiv);

    expect(localStorage.getItem('argbot_notif_banner_enabled')).toBe('true');
  });

  it('localStorage con "false" → renderiza toggle deshabilitado', () => {
    localStorage.setItem('argbot_notif_banner_enabled', 'false');
    renderSettings({ initialTab: 'notif' });

    const toggleDiv = screen.getByText('Mostrar banner de notificaciones')
      .closest('label')!
      .querySelector('div')!;

    // CSS modules hash class names in JSDOM — verify the module key is present in className
    expect(toggleDiv.className).toContain('notif-toggle-track-off');
  });
});
