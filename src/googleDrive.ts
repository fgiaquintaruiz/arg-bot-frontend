// Google Drive sync service - uses Google Identity Services + fetch
import { STORAGE_KEYS } from './utils/storageKeys';

const CLIENT_ID = '207884217858-ssnie582pel88miikiuodl38qm8esqbp.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_FILENAME = 'argbot-backup.json';
const TOKEN_KEY = 'gd_token';
const TOKEN_EXPIRY_KEY = 'gd_token_expiry';
// Google tokens duran 3600s — refrescamos 5 min antes para no fallar a mitad
const TOKEN_TTL_MS = 55 * 60 * 1000;

interface TokenClient {
  callback: (response: { access_token?: string }) => void;
  requestAccessToken: (options: { prompt: string }) => void;
}

export interface DriveData {
  version?: number;
  timestamp?: string;
  apiKey?: string;
  apiSecret?: string;
  apiKeyTestnet?: string;
  apiSecretTestnet?: string;
  addressBook?: string;
  tradeHistory?: string;
  usdcWallet?: string;
  binanceEurIban?: string;
  binanceEurName?: string;
  binanceEurBic?: string;
  binanceBankName?: string;
  binanceBankAddress?: string;
  rateAlertConfig?: string;
}

let tokenClient: TokenClient | null = null;
let userEmailHint: string | null = null;

// Llamar desde Settings al montar, con el email del usuario logueado.
// Evita que Google muestre el account picker cuando hay múltiples cuentas.
export const setUserHint = (email: string) => {
  userEmailHint = email;
};

const loadGIS = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'));
    document.head.appendChild(script);
  });
};

const getCachedToken = (): string | null => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!token || !expiry) return null;
  if (Date.now() > parseInt(expiry, 10)) {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    return null;
  }
  return token;
};

const cacheToken = (token: string) => {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + TOKEN_TTL_MS));
};

export const storeTokenFromFirebase = (token: string): void => {
  cacheToken(token);
};

const getAccessToken = async (forceConsent = false): Promise<string | null> => {
  // Token válido en sessionStorage → evita el popup completamente
  if (!forceConsent) {
    const cached = getCachedToken();
    if (cached) return cached;
  }

  await loadGIS();

  return new Promise((resolve) => {
    if (!window.google?.accounts?.oauth2) { resolve(null); return; }

    const doRequest = (client: TokenClient) => {
      client.callback = (response: { access_token?: string }) => {
        if (response.access_token) {
          cacheToken(response.access_token);
          resolve(response.access_token);
        } else {
          resolve(null);
        }
      };
      client.requestAccessToken({ prompt: forceConsent ? 'consent' : '' });
    };

    if (tokenClient) {
      doRequest(tokenClient);
    } else {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        // login_hint evita el account picker cuando ya sabemos qué cuenta usar
        ...(userEmailHint ? { login_hint: userEmailHint } : {}),
        callback: () => {},
      });
      doRequest(tokenClient);
    }
  });
};

const driveRequest = async (url: string, options: RequestInit = {}) => {
  const token = getCachedToken() || await getAccessToken();
  /* v8 ignore next -- defensive guard: callers (uploadToDrive/downloadFromDrive) already check token before calling driveRequest */
  if (!token) throw new Error('No se pudo obtener acceso a Google Drive');

  const response = await fetch(url, {
    ...options,
    headers: { 'Authorization': `Bearer ${token}`, ...options.headers },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Drive API error ${response.status}: ${errorText}`);
  }

  return response;
};

export const uploadToDrive = async (data: DriveData): Promise<boolean> => {
  try {
    const token = getCachedToken() || await getAccessToken(false) || await getAccessToken(true);
    if (!token) return false;

    const content = JSON.stringify(data);
    const blob = new Blob([content], { type: 'application/json' });
    let fileId = localStorage.getItem(STORAGE_KEYS.DRIVE_FILE_ID);

    if (!fileId) {
      const searchRes = await driveRequest(
        `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(BACKUP_FILENAME)}'&fields=files(id)`
      );
      const searchData = await searchRes.json();
      if (searchData.files?.length > 0) {
        fileId = searchData.files[0].id;
        localStorage.setItem(STORAGE_KEYS.DRIVE_FILE_ID, fileId!);
      }
    }

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify({ name: BACKUP_FILENAME })], { type: 'application/json' }));
    form.append('file', blob);

    if (fileId) {
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form,
      });
    } else {
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form,
      });
      const result = await response.json();
      localStorage.setItem(STORAGE_KEYS.DRIVE_FILE_ID, result.id);
    }

    return true;
  } catch (err) {
    console.error('[GoogleDrive] Upload failed:', err);
    return false;
  }
};

export const downloadFromDrive = async (): Promise<DriveData | null> => {
  try {
    const token = getCachedToken() || await getAccessToken(false) || await getAccessToken(true);
    if (!token) return null;

    const searchRes = await driveRequest(
      `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(BACKUP_FILENAME)}'&fields=files(id,name)`
    );
    const searchData = await searchRes.json();

    if (!searchData.files?.length) return null;

    const fileId = searchData.files[0].id;
    localStorage.setItem(STORAGE_KEYS.DRIVE_FILE_ID, fileId);

    const downloadRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!downloadRes.ok) throw new Error(`Download failed: ${downloadRes.status}`);
    return await downloadRes.json();
  } catch (err) {
    console.error('[GoogleDrive] Download failed:', err);
    return null;
  }
};
