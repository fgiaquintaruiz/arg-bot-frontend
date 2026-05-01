import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getRateAlertConfig, setRateAlertConfig } from '../utils/rateAlertStorage';

describe('rateAlertStorage', () => {
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('getRateAlertConfig() returns DEFAULT_CONFIG when localStorage is empty', () => {
    const config = getRateAlertConfig();
    expect(config).toEqual({ eurArs: {}, eurUsdc: {} });
  });

  it('getRateAlertConfig() returns parsed config when key exists', () => {
    const stored = { eurArs: { upper: 1.2, lower: 0.8 }, eurUsdc: { upper: 1.1 } };
    localStorage.setItem('rate_alert_config', JSON.stringify(stored));
    const config = getRateAlertConfig();
    expect(config).toEqual(stored);
  });

  it('getRateAlertConfig() returns DEFAULT_CONFIG when JSON is malformed', () => {
    localStorage.setItem('rate_alert_config', '{bad json');
    const config = getRateAlertConfig();
    expect(config).toEqual({ eurArs: {}, eurUsdc: {} });
  });

  it('setRateAlertConfig() writes JSON to localStorage key "rate_alert_config"', () => {
    const config = { eurArs: { upper: 1.15 }, eurUsdc: { lower: 0.95 } };
    setRateAlertConfig(config);
    const stored = JSON.parse(localStorage.getItem('rate_alert_config')!);
    expect(stored).toEqual(config);
  });

  it('setRateAlertConfig() does not throw when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => setRateAlertConfig({ eurArs: {}, eurUsdc: {} })).not.toThrow();
  });
});
