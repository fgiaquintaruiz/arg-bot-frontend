import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  registerSW,
  requestNotificationPermission,
  updateStoredIp,
  isPeriodicSyncSupported,
  isIOS,
  isPushSupported,
  urlBase64ToUint8Array,
  subscribeToPush,
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

describe('isPushSupported', () => {
  it('returns true when PushManager is available', () => {
    vi.stubGlobal('window', { PushManager: {} });
    vi.stubGlobal('navigator', { serviceWorker: {} });
    expect(isPushSupported()).toBe(true);
    vi.unstubAllGlobals();
  });

  it('returns false when PushManager is not available', () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('navigator', { serviceWorker: {} });
    expect(isPushSupported()).toBe(false);
    vi.unstubAllGlobals();
  });
});

describe('urlBase64ToUint8Array', () => {
  it('decodes a base64url string to Uint8Array', () => {
    const base64url = 'BL8CKi0EKvGwLKNkly-HEyUOwmzscs8qFM4bItC_NLmjZD8vRA2-kj0dyU-SdhJPMiOBu_6PLfJRd3v554W5-LI';
    const result = urlBase64ToUint8Array(base64url);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles padding correctly', () => {
    const short = 'YQ';
    const result = urlBase64ToUint8Array(short);
    expect(result).toBeInstanceOf(Uint8Array);
  });
});

describe('subscribeToPush', () => {
  it('calls pushManager.subscribe with userVisibleOnly:true', async () => {
    const mockSubscription = { toJSON: () => ({ endpoint: 'https://example.com', keys: {} }) };
    const mockRegistration = {
      pushManager: { subscribe: vi.fn().mockResolvedValue(mockSubscription) },
    } as unknown as ServiceWorkerRegistration;
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    await subscribeToPush(mockRegistration, 'YQ');

    expect(mockRegistration.pushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true })
    );
    vi.unstubAllGlobals();
  });

  it('posts subscription to /api/push/subscribe', async () => {
    const mockSubscription = { toJSON: () => ({ endpoint: 'https://example.com' }) };
    const mockRegistration = {
      pushManager: { subscribe: vi.fn().mockResolvedValue(mockSubscription) },
    } as unknown as ServiceWorkerRegistration;
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    await subscribeToPush(mockRegistration, 'YQ');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/push/subscribe'),
      expect.objectContaining({ method: 'POST' })
    );
    vi.unstubAllGlobals();
  });

  it('does not throw when fetch fails (fire-and-forget)', async () => {
    const mockSubscription = { toJSON: () => ({}) };
    const mockRegistration = {
      pushManager: { subscribe: vi.fn().mockResolvedValue(mockSubscription) },
    } as unknown as ServiceWorkerRegistration;
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(subscribeToPush(mockRegistration, 'YQ')).resolves.toBeUndefined();
    vi.unstubAllGlobals();
  });
});
