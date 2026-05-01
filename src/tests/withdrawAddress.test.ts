import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getSelectedWithdrawEntry,
  setSelectedWithdrawAddressId,
  clearSelectedWithdrawAddress,
  migrateLegacyUsdcWallet,
} from '../lib/withdrawAddress';

const makeEntry = (overrides = {}) => ({
  id: 'entry-1',
  name: 'Main',
  address: '0xabcdefABCDEF1234567890abcdefABCDEF123456',
  network: 'BSC' as const,
  addedAt: '2026-05-01T00:00:00.000Z',
  ...overrides,
});

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

// ─── getSelectedWithdrawEntry ──────────────────────────────────────────────────

describe('getSelectedWithdrawEntry', () => {
  it('returns null when usdc_wallet_id not in localStorage', () => {
    expect(getSelectedWithdrawEntry()).toBe(null);
  });

  it('returns null when usdc_wallet_id exists but address_book is empty', () => {
    localStorage.setItem('usdc_wallet_id', 'entry-1');
    localStorage.setItem('address_book', JSON.stringify([]));
    expect(getSelectedWithdrawEntry()).toBe(null);
  });

  it('returns matching AddressEntry when id matches an entry in address_book', () => {
    const entry = makeEntry();
    localStorage.setItem('usdc_wallet_id', 'entry-1');
    localStorage.setItem('address_book', JSON.stringify([entry]));
    expect(getSelectedWithdrawEntry()).toEqual(entry);
  });

  it('returns null when usdc_wallet_id does not match any address_book entry (orphan)', () => {
    localStorage.setItem('usdc_wallet_id', 'deleted-id');
    localStorage.setItem('address_book', JSON.stringify([makeEntry({ id: 'other-id' })]));
    expect(getSelectedWithdrawEntry()).toBe(null);
  });

  it('returns null gracefully when address_book is malformed JSON', () => {
    localStorage.setItem('usdc_wallet_id', 'entry-1');
    localStorage.setItem('address_book', '{invalid-json}');
    expect(getSelectedWithdrawEntry()).toBe(null);
  });
});

// ─── setSelectedWithdrawAddressId ─────────────────────────────────────────────

describe('setSelectedWithdrawAddressId', () => {
  it('writes usdc_wallet_id with entry.id', () => {
    const entry = makeEntry();
    setSelectedWithdrawAddressId(entry);
    expect(localStorage.getItem('usdc_wallet_id')).toBe('entry-1');
  });

  it('dual-writes usdc_wallet (legacy key) with entry.address', () => {
    const entry = makeEntry();
    setSelectedWithdrawAddressId(entry);
    expect(localStorage.getItem('usdc_wallet')).toBe(entry.address);
  });
});

// ─── clearSelectedWithdrawAddress ────────────────────────────────────────────

describe('clearSelectedWithdrawAddress', () => {
  it('removes usdc_wallet_id from localStorage', () => {
    localStorage.setItem('usdc_wallet_id', 'entry-1');
    clearSelectedWithdrawAddress();
    expect(localStorage.getItem('usdc_wallet_id')).toBeNull();
  });

  it('does NOT remove usdc_wallet legacy key', () => {
    localStorage.setItem('usdc_wallet_id', 'entry-1');
    localStorage.setItem('usdc_wallet', '0xsome_address');
    clearSelectedWithdrawAddress();
    expect(localStorage.getItem('usdc_wallet')).toBe('0xsome_address');
  });
});

// ─── migrateLegacyUsdcWallet ──────────────────────────────────────────────────

describe('migrateLegacyUsdcWallet', () => {
  it('sets usdc_wallet_id when legacy address matches address_book entry (case-insensitive)', () => {
    const entry = makeEntry({ id: 'entry-1', address: '0xABCDEFabcdef1234567890ABCDEFabcdef123456' });
    localStorage.setItem('usdc_wallet', entry.address.toLowerCase());
    localStorage.setItem('address_book', JSON.stringify([entry]));
    migrateLegacyUsdcWallet();
    expect(localStorage.getItem('usdc_wallet_id')).toBe('entry-1');
  });

  it('removes usdc_wallet key after successful migration', () => {
    const entry = makeEntry();
    localStorage.setItem('usdc_wallet', entry.address);
    localStorage.setItem('address_book', JSON.stringify([entry]));
    migrateLegacyUsdcWallet();
    expect(localStorage.getItem('usdc_wallet')).toBeNull();
  });

  it('is idempotent — calling twice does not duplicate writes or throw', () => {
    const entry = makeEntry();
    localStorage.setItem('usdc_wallet', entry.address);
    localStorage.setItem('address_book', JSON.stringify([entry]));
    migrateLegacyUsdcWallet();
    migrateLegacyUsdcWallet();
    expect(localStorage.getItem('usdc_wallet_id')).toBe('entry-1');
    expect(localStorage.getItem('usdc_wallet')).toBeNull();
  });

  it('no-ops when usdc_wallet_id already exists', () => {
    localStorage.setItem('usdc_wallet_id', 'existing-id');
    localStorage.setItem('usdc_wallet', '0xold_address');
    localStorage.setItem('address_book', JSON.stringify([makeEntry({ id: 'existing-id' })]));
    migrateLegacyUsdcWallet();
    expect(localStorage.getItem('usdc_wallet_id')).toBe('existing-id');
    expect(localStorage.getItem('usdc_wallet')).toBe('0xold_address');
  });

  it('no-ops when usdc_wallet legacy key is absent', () => {
    localStorage.setItem('address_book', JSON.stringify([makeEntry()]));
    migrateLegacyUsdcWallet();
    expect(localStorage.getItem('usdc_wallet_id')).toBeNull();
  });

  it('no-ops and keeps legacy key when address has no match in address_book', () => {
    localStorage.setItem('usdc_wallet', '0xunknown_address_not_in_book');
    localStorage.setItem('address_book', JSON.stringify([makeEntry({ address: '0xdifferent_address_not_matching' })]));
    migrateLegacyUsdcWallet();
    expect(localStorage.getItem('usdc_wallet_id')).toBeNull();
    expect(localStorage.getItem('usdc_wallet')).toBe('0xunknown_address_not_in_book');
  });

  it('handles corrupt address_book gracefully without throwing', () => {
    localStorage.setItem('usdc_wallet', '0xsome_address');
    localStorage.setItem('address_book', '{invalid json}');
    expect(() => migrateLegacyUsdcWallet()).not.toThrow();
    expect(localStorage.getItem('usdc_wallet_id')).toBeNull();
    expect(localStorage.getItem('usdc_wallet')).toBe('0xsome_address');
  });
});
