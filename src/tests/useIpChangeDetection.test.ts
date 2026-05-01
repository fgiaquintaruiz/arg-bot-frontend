import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useIpChangeDetection } from '../hooks/useIpChangeDetection';

// Guard: prevent swRegistration side-effects in jsdom (no navigator.serviceWorker, no BroadcastChannel)
vi.mock('../utils/swRegistration', () => ({
  updateStoredIp: vi.fn().mockResolvedValue(undefined),
  registerSW: vi.fn().mockResolvedValue(undefined),
  requestNotificationPermission: vi.fn().mockResolvedValue('default'),
  isIOS: vi.fn().mockReturnValue(false),
  isPeriodicSyncSupported: vi.fn().mockReturnValue(false),
}));

const LS_KEY = 'last_known_server_ip';

// Helper: create a fetch mock that returns a specific IP
const mockFetchIp = (ip: string) =>
  vi.spyOn(global, 'fetch').mockImplementation(async () => ({
    ok: true,
    json: async () => ({ ip }),
  } as Response));

const mockFetchOkNoIp = (body: object) =>
  vi.spyOn(global, 'fetch').mockImplementation(async () => ({
    ok: true,
    json: async () => body,
  } as Response));

const mockFetchNotOk = () =>
  vi.spyOn(global, 'fetch').mockImplementation(async () => ({
    ok: false,
    json: async () => ({}),
  } as Response));

const mockFetchReject = (err: Error) =>
  vi.spyOn(global, 'fetch').mockImplementation(() => Promise.reject(err));

describe('useIpChangeDetection', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Reset the fetch mock to a neutral implementation after clearAllMocks
    // to avoid stale onceMockImplementations from bleeding between tests
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  // ─── Bootstrap — no IP stored ────────────────────────────────────────────────

  describe('bootstrap — no IP stored', () => {
    it('no IP in localStorage → saves fetched IP silently, ipChanged stays false', async () => {
      mockFetchIp('203.0.113.42');

      const { result } = renderHook(() => useIpChangeDetection());

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(LS_KEY, '203.0.113.42');
      });

      expect(result.current.ipChanged).toBe(false);
    });

    it('no IP in localStorage → banner is NOT shown (ipChanged === false)', async () => {
      mockFetchIp('203.0.113.42');

      const { result } = renderHook(() => useIpChangeDetection());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      expect(result.current.ipChanged).toBe(false);
      expect(result.current.newIp).toBeNull();
    });
  });

  // ─── Stable — same IP ────────────────────────────────────────────────────────

  describe('stable — same IP', () => {
    it('stored IP === fetched IP → ipChanged stays false', async () => {
      localStorage.setItem(LS_KEY, '203.0.113.42');
      mockFetchIp('203.0.113.42');

      const { result } = renderHook(() => useIpChangeDetection());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      expect(result.current.ipChanged).toBe(false);
    });

    it('stored IP === fetched IP → newIp is null', async () => {
      localStorage.setItem(LS_KEY, '203.0.113.42');
      mockFetchIp('203.0.113.42');

      const { result } = renderHook(() => useIpChangeDetection());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      expect(result.current.newIp).toBeNull();
    });

    it('stored IP === fetched IP → localStorage is NOT modified', async () => {
      localStorage.setItem(LS_KEY, '203.0.113.42');
      mockFetchIp('203.0.113.42');

      // Record call count AFTER seeding (1 call from setItem above)
      const callsBefore = (localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.length;

      renderHook(() => useIpChangeDetection());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // No new setItem calls
      expect((localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBefore);
    });
  });

  // ─── Changed — different IP ───────────────────────────────────────────────────

  describe('changed — different IP', () => {
    it('stored IP !== fetched IP → ipChanged becomes true', async () => {
      localStorage.setItem(LS_KEY, '203.0.113.42');
      mockFetchIp('198.51.100.7');

      const { result } = renderHook(() => useIpChangeDetection());

      await waitFor(() => {
        expect(result.current.ipChanged).toBe(true);
      });
    });

    it('stored IP !== fetched IP → newIp is set to the fetched value', async () => {
      localStorage.setItem(LS_KEY, '203.0.113.42');
      mockFetchIp('198.51.100.7');

      const { result } = renderHook(() => useIpChangeDetection());

      await waitFor(() => {
        expect(result.current.newIp).toBe('198.51.100.7');
      });
    });

    it('stored IP !== fetched IP → localStorage is NOT updated automatically', async () => {
      localStorage.setItem(LS_KEY, '203.0.113.42');
      mockFetchIp('198.51.100.7');

      // Record call count AFTER seeding (1 call from setItem above)
      const callsBefore = (localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.length;

      const { result } = renderHook(() => useIpChangeDetection());

      await waitFor(() => {
        expect(result.current.ipChanged).toBe(true);
      });

      // Hook must NOT persist automatically — only on explicit dismiss/persist
      expect((localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBefore);
    });
  });

  // ─── dismiss() ───────────────────────────────────────────────────────────────

  describe('dismiss()', () => {
    it('calling dismiss() sets ipChanged to false', async () => {
      localStorage.setItem(LS_KEY, '203.0.113.42');
      mockFetchIp('198.51.100.7');

      const { result } = renderHook(() => useIpChangeDetection());

      await waitFor(() => {
        expect(result.current.ipChanged).toBe(true);
      });

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.ipChanged).toBe(false);
    });

    it('calling dismiss() persists newIp to localStorage under last_known_server_ip', async () => {
      localStorage.setItem(LS_KEY, '203.0.113.42');
      mockFetchIp('198.51.100.7');

      const { result } = renderHook(() => useIpChangeDetection());

      await waitFor(() => {
        expect(result.current.ipChanged).toBe(true);
      });

      act(() => {
        result.current.dismiss();
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(LS_KEY, '198.51.100.7');
    });
  });

  // ─── persist() ───────────────────────────────────────────────────────────────

  describe('persist()', () => {
    it('calling persist() behaves identically to dismiss()', async () => {
      localStorage.setItem(LS_KEY, '203.0.113.42');
      mockFetchIp('198.51.100.7');

      const { result } = renderHook(() => useIpChangeDetection());

      await waitFor(() => {
        expect(result.current.ipChanged).toBe(true);
      });

      act(() => {
        result.current.persist();
      });

      expect(result.current.ipChanged).toBe(false);
      expect(localStorage.setItem).toHaveBeenCalledWith(LS_KEY, '198.51.100.7');
    });
  });

  // ─── Fetch failure ───────────────────────────────────────────────────────────

  describe('fetch failure', () => {
    it('fetch throws → ipChanged stays false, newIp stays null', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockFetchReject(new Error('network error'));

      localStorage.setItem(LS_KEY, '203.0.113.42');

      const { result } = renderHook(() => useIpChangeDetection());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      await act(async () => {});

      expect(result.current.ipChanged).toBe(false);
      expect(result.current.newIp).toBeNull();
      warnSpy.mockRestore();
    });

    it('fetch returns !ok → ipChanged stays false', async () => {
      mockFetchNotOk();

      localStorage.setItem(LS_KEY, '203.0.113.42');

      const { result } = renderHook(() => useIpChangeDetection());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      await act(async () => {});

      expect(result.current.ipChanged).toBe(false);
    });

    it('fetch returns { ip: undefined } → treated as failure, no banner', async () => {
      mockFetchOkNoIp({ ip: undefined });

      localStorage.setItem(LS_KEY, '203.0.113.42');

      const { result } = renderHook(() => useIpChangeDetection());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      await act(async () => {});

      expect(result.current.ipChanged).toBe(false);
    });

    it('fetch returns { ip: "" } → treated as failure, no banner', async () => {
      mockFetchOkNoIp({ ip: '' });

      localStorage.setItem(LS_KEY, '203.0.113.42');

      const { result } = renderHook(() => useIpChangeDetection());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      await act(async () => {});

      expect(result.current.ipChanged).toBe(false);
    });

    it('fetch returns { ip: 123 } (wrong type) → treated as failure, no banner', async () => {
      mockFetchOkNoIp({ ip: 123 });

      localStorage.setItem(LS_KEY, '203.0.113.42');

      const { result } = renderHook(() => useIpChangeDetection());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      await act(async () => {});

      expect(result.current.ipChanged).toBe(false);
    });
  });

  // ─── Cleanup ─────────────────────────────────────────────────────────────────

  describe('cleanup', () => {
    it('unmount before fetch resolves → no setState called after unmount', async () => {
      let resolveIp!: (value: Response) => void;
      vi.spyOn(global, 'fetch').mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            resolveIp = resolve;
          })
      );

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { unmount } = renderHook(() => useIpChangeDetection());

      // Unmount immediately before fetch resolves
      unmount();

      // Now resolve the fetch after unmount
      await act(async () => {
        resolveIp({
          ok: true,
          json: async () => ({ ip: '203.0.113.42' }),
        } as Response);
        // Give microtasks time to run
        await new Promise((r) => setTimeout(r, 0));
      });

      // No errors about updating unmounted component
      expect(errorSpy.mock.calls.some(args =>
        args.some(a => typeof a === 'string' && a.includes('unmounted'))
      )).toBe(false);

      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });
});
