import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  registerSW,
  requestNotificationPermission,
  updateStoredIp,
  isPeriodicSyncSupported,
  isIOS,
} from '../utils/swRegistration';

// Mock ServiceWorker registration
function makeMockRegistration(withPeriodicSync = true) {
  return {
    periodicSync: withPeriodicSync
      ? { register: vi.fn().mockResolvedValue(undefined) }
      : undefined,
  };
}

describe('swRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('registerSW', () => {
    it('does nothing when navigator.serviceWorker is not available', async () => {
      vi.stubGlobal('navigator', { serviceWorker: undefined });
      await expect(registerSW()).resolves.toBeUndefined();
    });

    it('calls navigator.serviceWorker.register with /sw-ip-check.js and scope /', async () => {
      const mockReg = makeMockRegistration();
      const mockSW = {
        register: vi.fn().mockResolvedValue(mockReg),
        ready: Promise.resolve(mockReg),
      };
      vi.stubGlobal('navigator', { serviceWorker: mockSW });

      await registerSW();

      expect(mockSW.register).toHaveBeenCalledWith('/sw-ip-check.js', { scope: '/' });
    });

    it('calls periodicSync.register with tag ip-check and minInterval 43200000', async () => {
      const mockReg = makeMockRegistration();
      const mockSW = {
        register: vi.fn().mockResolvedValue(mockReg),
        ready: Promise.resolve(mockReg),
      };
      vi.stubGlobal('navigator', { serviceWorker: mockSW });

      await registerSW();

      expect(mockReg.periodicSync.register).toHaveBeenCalledWith('ip-check', {
        minInterval: 43200000,
      });
    });

    it('does not throw when periodicSync is not available (graceful fallback)', async () => {
      const mockReg = makeMockRegistration(false); // no periodicSync
      const mockSW = {
        register: vi.fn().mockResolvedValue(mockReg),
        ready: Promise.resolve(mockReg),
      };
      vi.stubGlobal('navigator', { serviceWorker: mockSW });

      await expect(registerSW()).resolves.toBeUndefined();
    });

    it('does not throw when registration fails (logs error, no propagation)', async () => {
      const mockSW = {
        register: vi.fn().mockRejectedValue(new Error('SW registration failed')),
        ready: Promise.resolve({}),
      };
      vi.stubGlobal('navigator', { serviceWorker: mockSW });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(registerSW()).resolves.toBeUndefined();
      warnSpy.mockRestore();
    });
  });

  describe('requestNotificationPermission', () => {
    it('calls Notification.requestPermission()', async () => {
      const mockRequest = vi.fn().mockResolvedValue('granted');
      vi.stubGlobal('Notification', { requestPermission: mockRequest, permission: 'default' });

      await requestNotificationPermission();

      expect(mockRequest).toHaveBeenCalled();
    });

    it('returns granted when user accepts', async () => {
      vi.stubGlobal('Notification', {
        requestPermission: vi.fn().mockResolvedValue('granted'),
        permission: 'default',
      });

      const result = await requestNotificationPermission();
      expect(result).toBe('granted');
    });

    it('returns denied when user rejects', async () => {
      vi.stubGlobal('Notification', {
        requestPermission: vi.fn().mockResolvedValue('denied'),
        permission: 'default',
      });

      const result = await requestNotificationPermission();
      expect(result).toBe('denied');
    });

    it('returns default when Notification API is not available', async () => {
      vi.stubGlobal('Notification', undefined);

      const result = await requestNotificationPermission();
      expect(result).toBe('default');
    });
  });

  describe('updateStoredIp', () => {
    it('posts message { type: UPDATE_STORED_IP, ip } via navigator.serviceWorker.controller', async () => {
      const mockPostMessage = vi.fn();
      vi.stubGlobal('navigator', {
        serviceWorker: { controller: { postMessage: mockPostMessage } },
      });

      await updateStoredIp('5.6.7.8');

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'UPDATE_STORED_IP',
        ip: '5.6.7.8',
      });
    });

    it('does not throw when navigator.serviceWorker.controller is null', async () => {
      vi.stubGlobal('navigator', {
        serviceWorker: { controller: null },
      });
      await expect(updateStoredIp('5.6.7.8')).resolves.toBeUndefined();
    });
  });

  describe('isPeriodicSyncSupported', () => {
    it('returns true when periodicSync is in ServiceWorkerRegistration prototype', () => {
      vi.stubGlobal('ServiceWorkerRegistration', {
        prototype: { periodicSync: {} },
      });
      expect(isPeriodicSyncSupported()).toBe(true);
    });

    it('returns false when periodicSync is NOT in ServiceWorkerRegistration prototype', () => {
      vi.stubGlobal('ServiceWorkerRegistration', {
        prototype: {},
      });
      expect(isPeriodicSyncSupported()).toBe(false);
    });

    it('returns false when ServiceWorkerRegistration is not defined', () => {
      vi.stubGlobal('ServiceWorkerRegistration', undefined);
      expect(isPeriodicSyncSupported()).toBe(false);
    });
  });

  describe('isIOS', () => {
    it('returns true when userAgent contains iPhone', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)',
      });
      expect(isIOS()).toBe(true);
    });

    it('returns true when userAgent contains iPad', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0)',
      });
      expect(isIOS()).toBe(true);
    });

    it('returns false when userAgent is Chrome on Android', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/112.0',
      });
      expect(isIOS()).toBe(false);
    });

    it('returns false when userAgent is Chrome on desktop', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/112.0',
      });
      expect(isIOS()).toBe(false);
    });
  });
});
