import { describe, it, expect } from 'vitest';
import { shouldNotify, parseIpResponse } from '../utils/ipPollingLogic';

describe('ipPollingLogic', () => {
  describe('shouldNotify', () => {
    it('returns true when old IP !== new IP and permission is granted', () => {
      expect(shouldNotify('1.2.3.4', '5.6.7.8', 'granted')).toBe(true);
    });

    it('returns false when old IP === new IP', () => {
      expect(shouldNotify('1.2.3.4', '1.2.3.4', 'granted')).toBe(false);
    });

    it('returns false when old IP !== new IP but permission is denied', () => {
      expect(shouldNotify('1.2.3.4', '5.6.7.8', 'denied')).toBe(false);
    });

    it('returns false when old IP !== new IP but permission is default', () => {
      expect(shouldNotify('1.2.3.4', '5.6.7.8', 'default')).toBe(false);
    });

    it('returns false when old IP is null (bootstrap case)', () => {
      expect(shouldNotify(null, '5.6.7.8', 'granted')).toBe(false);
    });

    it('returns false when new IP is empty string', () => {
      expect(shouldNotify('1.2.3.4', '', 'granted')).toBe(false);
    });

    it('returns false when new IP is null', () => {
      expect(shouldNotify('1.2.3.4', null as any, 'granted')).toBe(false);
    });
  });

  describe('parseIpResponse', () => {
    it('returns ip string when response has valid ip field', () => {
      expect(parseIpResponse({ ip: '1.2.3.4' })).toBe('1.2.3.4');
    });

    it('returns null when response has no ip field', () => {
      expect(parseIpResponse({ server: '1.2.3.4' })).toBeNull();
    });

    it('returns null when ip field is empty string', () => {
      expect(parseIpResponse({ ip: '' })).toBeNull();
    });

    it('returns null when ip field is a number', () => {
      expect(parseIpResponse({ ip: 123 })).toBeNull();
    });

    it('returns null when response is null', () => {
      expect(parseIpResponse(null)).toBeNull();
    });

    it('returns null when response is undefined', () => {
      expect(parseIpResponse(undefined)).toBeNull();
    });
  });
});
