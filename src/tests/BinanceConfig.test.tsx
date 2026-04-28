import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BinanceConfig from '../components/BinanceConfig';

describe('BinanceConfig — plain-text key storage (no encryption)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(Storage.prototype, 'setItem');
    vi.spyOn(Storage.prototype, 'getItem');
    vi.spyOn(Storage.prototype, 'removeItem');
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ip: '1.2.3.4' }),
    } as unknown as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  // ─── Test 1: plain-text storage ─────────────────────────────────────────────

  it('save API keys → localStorage stores plain text, NOT a CryptoJS ciphertext', () => {
    render(<BinanceConfig onSave={() => {}} onCancel={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText('Ingresá tu API Key'), {
      target: { value: 'my-plain-api-key' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ingresá tu API Secret'), {
      target: { value: 'my-plain-api-secret' },
    });

    fireEvent.click(screen.getByText('Guardar credenciales'));

    // Must store exactly the plain value
    expect(localStorage.setItem).toHaveBeenCalledWith('binance_key', 'my-plain-api-key');
    expect(localStorage.setItem).toHaveBeenCalledWith('binance_secret', 'my-plain-api-secret');

    // Must NOT store CryptoJS AES ciphertext (prefix "U2FsdGVkX1+")
    const keyCall = (localStorage.setItem as ReturnType<typeof vi.spyOn>).mock.calls.find(
      ([k]) => k === 'binance_key'
    );
    const secretCall = (localStorage.setItem as ReturnType<typeof vi.spyOn>).mock.calls.find(
      ([k]) => k === 'binance_secret'
    );
    expect(keyCall?.[1]).not.toMatch(/^U2FsdGVkX1\+/);
    expect(secretCall?.[1]).not.toMatch(/^U2FsdGVkX1\+/);
  });

  // ─── Test 2: save valid keys → no alert, onSave called ──────────────────────

  it('save with valid keys → no alert shown, onSave callback called', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const onSave = vi.fn();

    render(<BinanceConfig onSave={onSave} onCancel={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText('Ingresá tu API Key'), {
      target: { value: 'validkey123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ingresá tu API Secret'), {
      target: { value: 'validsecret456' },
    });

    fireEvent.click(screen.getByText('Guardar credenciales'));

    expect(alertMock).not.toHaveBeenCalled();
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  // ─── Test 3: migration — old ciphertext detected on mount ───────────────────

  it('on mount with old CryptoJS ciphertext → clears both keys and shows re-enter notice', async () => {
    // Seed localStorage with old AES ciphertext values
    localStorage.setItem('binance_key', 'U2FsdGVkX1+abc123encryptedstuff==');
    localStorage.setItem('binance_secret', 'U2FsdGVkX1+xyz789encryptedstuff==');

    render(<BinanceConfig onSave={() => {}} onCancel={() => {}} />);

    // Both keys must be removed
    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith('binance_key');
      expect(localStorage.removeItem).toHaveBeenCalledWith('binance_secret');
    });

    // Migration notice must be visible
    expect(
      screen.getByText(/volvé a ingresarlas/i)
    ).toBeInTheDocument();
  });
});
