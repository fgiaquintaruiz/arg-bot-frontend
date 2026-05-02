import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// TOKEN_KEY and TOKEN_EXPIRY_KEY are private — we replicate the values here
const TOKEN_KEY = 'gd_token';
const TOKEN_EXPIRY_KEY = 'gd_token_expiry';
const TOKEN_TTL_MS = 55 * 60 * 1000;

function seedToken(token = 'cached-token') {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + TOKEN_TTL_MS));
}

describe('googleDrive', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
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

  describe('uploadToDrive', () => {
    it('usa token cacheado si existe (no llama a GIS)', async () => {
      seedToken();
      // search → no existing file
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ files: [] }) })
        // POST → returns new file id
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'new-file-id' }) });

      const { uploadToDrive } = await import('../googleDrive');
      const result = await uploadToDrive({ key: 'value' });

      expect(result).toBe(true);
      // window.google should never be touched — no GIS script appended
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
      // search returns no files
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ files: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'created-id' }) });

      const { uploadToDrive } = await import('../googleDrive');
      const result = await uploadToDrive({ key: 'value' });

      expect(result).toBe(true);
      expect(localStorage.getItem('drive_file_id')).toBe('created-id');
    });

    it('retorna false si no hay token disponible', async () => {
      // sessionStorage vacío; simulamos que loadGIS falla (onerror) para no colgar el test
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'script') {
          // Disparar onerror en el próximo tick para simular fallo de carga GIS
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

    it('retorna el JSON del archivo si existe', async () => {
      seedToken();
      const fileData = { trades: [{ id: 1 }] };
      (global.fetch as ReturnType<typeof vi.fn>)
        // search
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ files: [{ id: 'file-123', name: 'argbot-backup.json' }] }),
        })
        // download
        .mockResolvedValueOnce({ ok: true, json: async () => fileData });

      const { downloadFromDrive } = await import('../googleDrive');
      const result = await downloadFromDrive();
      expect(result).toEqual(fileData);
    });

    it('retorna null si la descarga falla', async () => {
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
  });
});
