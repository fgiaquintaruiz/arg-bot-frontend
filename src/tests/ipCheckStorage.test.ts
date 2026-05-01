import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getLastKnownIp, setLastKnownIp, clearLastKnownIp, STORAGE_KEY } from '../utils/ipCheckStorage';

describe('ipCheckStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('STORAGE_KEY is argbot_last_known_ip', () => {
    expect(STORAGE_KEY).toBe('argbot_last_known_ip');
  });

  it('getLastKnownIp() returns null when localStorage is empty', () => {
    expect(getLastKnownIp()).toBeNull();
  });

  it('getLastKnownIp() returns stored IP when key exists', () => {
    localStorage.setItem(STORAGE_KEY, '1.2.3.4');
    expect(getLastKnownIp()).toBe('1.2.3.4');
  });

  it('setLastKnownIp() writes ip to localStorage under argbot_last_known_ip', () => {
    setLastKnownIp('5.6.7.8');
    expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, '5.6.7.8');
  });

  it('setLastKnownIp() overwrites previous value', () => {
    setLastKnownIp('1.1.1.1');
    setLastKnownIp('2.2.2.2');
    expect(getLastKnownIp()).toBe('2.2.2.2');
  });

  it('clearLastKnownIp() removes the key from localStorage', () => {
    setLastKnownIp('1.2.3.4');
    clearLastKnownIp();
    expect(getLastKnownIp()).toBeNull();
  });

  it('setLastKnownIp() does not throw when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => setLastKnownIp('1.2.3.4')).not.toThrow();
  });
});
