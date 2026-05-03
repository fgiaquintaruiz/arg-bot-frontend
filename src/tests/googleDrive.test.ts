import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const TOKEN_KEY = 'gd_token';
const TOKEN_EXPIRY_KEY = 'gd_token_expiry';
const TOKEN_TTL_MS = 55 * 60 * 1000;

function seedToken(token = 'cached-token') {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + TOKEN_TTL_MS));
}

function seedExpiredToken(token = 'expired-token') {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() - 1000));
}

function makeGoogleOAuth2(accessToken: string | null = 'gis-token') {
  const client = {
    callback: (_response: any) => {},
    requestAccessToken: vi.fn(function (this: any) {
      this.callback({ access_token: accessToken });
    }),
  };
  return {
    accounts: {
      oauth2: {
        initTokenClient: vi.fn(() => client),
        _client: client,
      },
    },
  };
}

describe('googleDrive', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
    global.fetch = vi.fn();
    delete (window as any).google;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete (window as any).google;
  });

  describe('storeTokenFromFirebase', () => {
    it('guarda token en sessionStorage con la key correcta', async () => {
      const { storeTokenFromFirebase } = await import('../googleDrive');
      storeTokenFromFirebase('my-firebase-token');
      expect(sessionStorage.getItem(TOKEN_KEY)).toBe('my-firebase-token');
    });

    it('guarda expiración en sessionStorage', async () => {
      const { storeTokenFromFirebase } = await import('../googleDrive');
      const before = Date.now();
      storeTokenFromFirebase('my-firebase-token');
      const after = Date.now();
      const expiry = parseInt(sessionStorage.getItem(TOKEN_EXPIRY_KEY)!, 10);
      expect(expiry).toBeGreaterThanOrEqual(before + TOKEN_TTL_MS);
      expect(expiry).toBeLessThanOrEqual(after + TOKEN_TTL_MS);
    });
  });

  describe('setUserHint', () => {
    it('se puede llamar sin error', async () => {
      const { setUserHint } = await import('../googleDrive');
      expect(() => setUserHint('user@example.com')).not.toThrow();
    });
  });

  describe('uploadToDrive', () => {
    it('usa token cacheado si existe (no llama a GIS)', async () => {
      seedToken();
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ files: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'new-file-id' }) });

      const { uploadToDrive } = await import('../googleDrive');
      const result = await uploadToDrive({ key: 'value' });

      expect(result).toBe(true);
      expect(document.querySelectorAll('script[src*="gsi"]').length).toBe(0);
    });

    it('hace PATCH si drive_file_id existe en localStorage', async () => {
      seedToken();
      localStorage.setItem('drive_file_id', 'existing-id');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true });

      const { uploadToDrive } = await import('../googleDrive');
      const result = await uploadToDrive({ key: 'value' });

      expect(result).toBe(true);
      const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain('existing-id');
      expect(options.method).toBe('PATCH');
    });

    it('hace POST si no existe drive_file_id, guarda el id devuelto', async () => {
      seedToken();
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ files: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'created-id' }) });

      const { uploadToDrive } = await import('../googleDrive');
      const result = await uploadToDrive({ key: 'value' });

      expect(result).toBe(true);
      expect(localStorage.getItem('drive_file_id')).toBe('created-id');
    });

    it('usa file id encontrado en la búsqueda si no estaba en localStorage', async () => {
      seedToken();
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ files: [{ id: 'found-id' }] }),
        })
        .mockResolvedValueOnce({ ok: true });

      const { uploadToDrive } = await import('../googleDrive');
      const result = await uploadToDrive({ key: 'value' });

      expect(result).toBe(true);
      expect(localStorage.getItem('drive_file_id')).toBe('found-id');
      const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
      expect(url).toContain('found-id');
      expect(options.method).toBe('PATCH');
    });

    it('retorna false si no hay token disponible', async () => {
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'script') {
          setTimeout(() => (el as HTMLScriptElement).onerror?.(new Event('error')), 0);
        }
        return el;
      });

      const { uploadToDrive } = await import('../googleDrive');
      const result = await uploadToDrive({ key: 'value' });
      expect(result).toBe(false);

      vi.restoreAllMocks();
    });

    it('retorna false si fetch falla', async () => {
      seedToken();
      localStorage.setItem('drive_file_id', 'existing-id');
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { uploadToDrive } = await import('../googleDrive');
      const result = await uploadToDrive({ key: 'value' });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('obtiene token via GIS cuando sessionStorage está vacío', async () => {
      (window as any).google = makeGoogleOAuth2('gis-fresh-token');

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ files: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'gis-file-id' }) });

      const { uploadToDrive } = await import('../googleDrive');
      const result = await uploadToDrive({ key: 'value' });

      expect(result).toBe(true);
    });

    it('retorna false si GIS devuelve token null en ambos intentos', async () => {
      const client = {
        callback: (_response: any) => {},
        requestAccessToken: vi.fn(function (this: any) {
          this.callback({});
        }),
      };
      (window as any).google = {
        accounts: {
          oauth2: {
            initTokenClient: vi.fn(() => client),
          },
        },
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { uploadToDrive } = await import('../googleDrive');
      const result = await uploadToDrive({ key: 'value' });

      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('downloadFromDrive', () => {
    it('retorna null si no hay archivos en Drive', async () => {
      seedToken();
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [] }),
      });

      const { downloadFromDrive } = await import('../googleDrive');
      const result = await downloadFromDrive();
      expect(result).toBeNull();
    });

    it('retorna el JSON del archivo si existe y guarda fileId en localStorage', async () => {
      seedToken();
      const fileData = { trades: [{ id: 1 }] };
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ files: [{ id: 'file-123', name: 'argbot-backup.json' }] }),
        })
        .mockResolvedValueOnce({ ok: true, json: async () => fileData });

      const { downloadFromDrive } = await import('../googleDrive');
      const result = await downloadFromDrive();
      expect(result).toEqual(fileData);
      expect(localStorage.getItem('drive_file_id')).toBe('file-123');
    });

    it('retorna null si la descarga falla con status no-ok', async () => {
      seedToken();
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ files: [{ id: 'file-123', name: 'argbot-backup.json' }] }),
        })
        .mockResolvedValueOnce({ ok: false, status: 403 });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { downloadFromDrive } = await import('../googleDrive');
      const result = await downloadFromDrive();
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    it('retorna null si fetch de descarga lanza error de red', async () => {
      seedToken();
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ files: [{ id: 'file-123', name: 'argbot-backup.json' }] }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { downloadFromDrive } = await import('../googleDrive');
      const result = await downloadFromDrive();
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    it('retorna null si no hay token disponible', async () => {
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'script') {
          setTimeout(() => (el as HTMLScriptElement).onerror?.(new Event('error')), 0);
        }
        return el;
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { downloadFromDrive } = await import('../googleDrive');
      const result = await downloadFromDrive();
      expect(result).toBeNull();
      consoleSpy.mockRestore();
      vi.restoreAllMocks();
    });
  });

  describe('getCachedToken — branches', () => {
    it('retorna null si token está en sessionStorage pero expirado', async () => {
      seedExpiredToken();
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('no token'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'script') {
          setTimeout(() => (el as HTMLScriptElement).onerror?.(new Event('error')), 0);
        }
        return el;
      });

      const { uploadToDrive } = await import('../googleDrive');
      const result = await uploadToDrive({});
      expect(result).toBe(false);
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(sessionStorage.getItem(TOKEN_EXPIRY_KEY)).toBeNull();
      consoleSpy.mockRestore();
      vi.restoreAllMocks();
    });

    it('retorna null si solo tiene token pero no expiry', async () => {
      sessionStorage.setItem(TOKEN_KEY, 'orphan-token');

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'script') {
          setTimeout(() => (el as HTMLScriptElement).onerror?.(new Event('error')), 0);
        }
        return el;
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { uploadToDrive } = await import('../googleDrive');
      const result = await uploadToDrive({});
      expect(result).toBe(false);
      consoleSpy.mockRestore();
      vi.restoreAllMocks();
    });
  });

  describe('driveRequest — error handling', () => {
    it('lanza error cuando la respuesta no es ok', async () => {
      seedToken();
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { downloadFromDrive } = await import('../googleDrive');
      const result = await downloadFromDrive();
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    it('lanza error cuando response.text() falla también', async () => {
      seedToken();
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => { throw new Error('text parse error'); },
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { downloadFromDrive } = await import('../googleDrive');
      const result = await downloadFromDrive();
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    it('lanza error en driveRequest si GIS no devuelve token (sin cache)', async () => {
      const client = {
        callback: (_response: any) => {},
        requestAccessToken: vi.fn(function (this: any) {
          this.callback({});
        }),
      };
      (window as any).google = {
        accounts: {
          oauth2: {
            initTokenClient: vi.fn(() => client),
          },
        },
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { downloadFromDrive } = await import('../googleDrive');
      const result = await downloadFromDrive();
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('getAccessToken — GIS branches', () => {
    it('usa tokenClient existente si ya fue inicializado', async () => {
      (window as any).google = makeGoogleOAuth2('reuse-token');

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValue({ ok: true, json: async () => ({ files: [] }) });
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ files: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'id-1' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ files: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'id-2' }) });

      const { uploadToDrive } = await import('../googleDrive');
      const result1 = await uploadToDrive({ call: 1 });
      sessionStorage.clear();
      const result2 = await uploadToDrive({ call: 2 });

      expect(result1).toBe(true);
      expect(result2).toBe(true);

      const initCalls = (window as any).google.accounts.oauth2.initTokenClient.mock.calls.length;
      expect(initCalls).toBe(1);
    });

    it('incluye login_hint cuando setUserHint fue llamado', async () => {
      const fakeGoogle = makeGoogleOAuth2('hint-token');
      (window as any).google = fakeGoogle;

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ files: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'hint-file-id' }) });

      const { setUserHint, uploadToDrive } = await import('../googleDrive');
      setUserHint('user@example.com');
      const result = await uploadToDrive({ data: true });

      expect(result).toBe(true);
      const initArgs = fakeGoogle.accounts.oauth2.initTokenClient.mock.calls[0][0];
      expect(initArgs.login_hint).toBe('user@example.com');
    });

    it('no incluye login_hint cuando userEmailHint no fue establecido', async () => {
      const fakeGoogle = makeGoogleOAuth2('no-hint-token');
      (window as any).google = fakeGoogle;

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ files: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'no-hint-id' }) });

      const { uploadToDrive } = await import('../googleDrive');
      const result = await uploadToDrive({ data: true });

      expect(result).toBe(true);
      const initArgs = fakeGoogle.accounts.oauth2.initTokenClient.mock.calls[0][0];
      expect(initArgs.login_hint).toBeUndefined();
    });

    it('resuelve null si window.google no está disponible después de loadGIS', async () => {
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'script') {
          setTimeout(() => {
            delete (window as any).google;
            (el as HTMLScriptElement).onload?.(new Event('load'));
          }, 0);
        }
        return el;
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { uploadToDrive } = await import('../googleDrive');
      const result = await uploadToDrive({});
      expect(result).toBe(false);
      consoleSpy.mockRestore();
      vi.restoreAllMocks();
    });

    it('loadGIS resuelve inmediatamente si window.google.accounts.oauth2 ya existe', async () => {
      (window as any).google = makeGoogleOAuth2('already-loaded-token');

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ files: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'loaded-id' }) });

      const appendChildSpy = vi.spyOn(document.head, 'appendChild');
      const { uploadToDrive } = await import('../googleDrive');
      const result = await uploadToDrive({});

      expect(result).toBe(true);
      const scriptAppended = appendChildSpy.mock.calls.some(
        (call) => (call[0] as HTMLScriptElement).src?.includes('gsi')
      );
      expect(scriptAppended).toBe(false);
      appendChildSpy.mockRestore();
    });
  });
});
