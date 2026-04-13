// Google Drive sync service - uses Google Identity Services + fetch
const CLIENT_ID = '207884217858-ssnie582pel88miikiuodl38qm8esqbp.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_FILENAME = 'argbot-backup.json';

let tokenClient: any = null;
let currentAccessToken: string | null = null;

// Load Google Identity Services script
const loadGIS = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('[GoogleDrive] Google Identity Services loaded');
      resolve();
    };
    script.onerror = () => {
      console.error('[GoogleDrive] Failed to load Google Identity Services');
      reject(new Error('No se pudo cargar Google Identity Services'));
    };
    document.head.appendChild(script);
  });
};

// Authenticate and get access token
const getAccessToken = async (): Promise<string | null> => {
  console.log('[GoogleDrive] Requesting access token...');
  await loadGIS();

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services no disponible'));
      return;
    }

    // Reuse existing token client if available
    if (tokenClient) {
      tokenClient.callback = (response: any) => {
        if (response.access_token) {
          console.log('[GoogleDrive] Got access token');
          currentAccessToken = response.access_token;
          resolve(response.access_token);
        } else {
          console.log('[GoogleDrive] User cancelled or error:', response);
          resolve(null);
        }
      };
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            console.log('[GoogleDrive] Got access token');
            currentAccessToken = response.access_token;
            resolve(response.access_token);
          } else {
            console.log('[GoogleDrive] User cancelled or error:', response);
            resolve(null);
          }
        },
      });
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  });
};

// Make authenticated request to Google Drive API
const driveRequest = async (url: string, options: RequestInit = {}) => {
  const token = currentAccessToken || await getAccessToken();
  if (!token) throw new Error('No se pudo obtener acceso a Google Drive');

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Drive API error ${response.status}: ${errorText}`);
  }

  return response;
};

// Upload data to Google Drive
export const uploadToDrive = async (data: any): Promise<boolean> => {
  try {
    console.log('[GoogleDrive] Starting upload...');

    const token = await getAccessToken();
    if (!token) return false;

    const content = JSON.stringify(data);
    const blob = new Blob([content], { type: 'application/json' });

    // Check if file already exists
    let fileId = localStorage.getItem('drive_file_id');

    if (!fileId) {
      // Search for existing file by name
      console.log('[GoogleDrive] Searching for existing backup file...');
      const searchRes = await driveRequest(
        `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(BACKUP_FILENAME)}'&fields=files(id)`
      );
      const searchData = await searchRes.json();

      if (searchData.files && searchData.files.length > 0) {
        fileId = searchData.files[0].id;
        localStorage.setItem('drive_file_id', fileId);
        console.log('[GoogleDrive] Found existing file:', fileId);
      }
    }

    if (fileId) {
      // Update existing file
      console.log('[GoogleDrive] Updating existing file:', fileId);
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify({ name: BACKUP_FILENAME })], { type: 'application/json' }));
      form.append('file', blob);

      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form,
      });

      console.log('[GoogleDrive] File updated successfully');
    } else {
      // Create new file
      console.log('[GoogleDrive] Creating new file...');
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify({ name: BACKUP_FILENAME })], { type: 'application/json' }));
      form.append('file', blob);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form,
      });

      const result = await response.json();
      fileId = result.id;
      localStorage.setItem('drive_file_id', fileId);
      console.log('[GoogleDrive] File created with ID:', fileId);
    }

    return true;
  } catch (err: any) {
    console.error('[GoogleDrive] Upload failed:', err);
    return false;
  }
};

// Download data from Google Drive
export const downloadFromDrive = async (): Promise<any | null> => {
  try {
    console.log('[GoogleDrive] Starting download...');

    const token = await getAccessToken();
    if (!token) return null;

    // Search for the backup file
    console.log('[GoogleDrive] Searching for backup file...');
    const searchRes = await driveRequest(
      `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(BACKUP_FILENAME)}'&fields=files(id,name)`
    );
    const searchData = await searchRes.json();

    console.log('[GoogleDrive] Search result:', searchData);

    if (!searchData.files || searchData.files.length === 0) {
      console.log('[GoogleDrive] No backup file found');
      return null;
    }

    const fileId = searchData.files[0].id;
    localStorage.setItem('drive_file_id', fileId);

    // Download file content
    console.log('[GoogleDrive] Downloading file content:', fileId);
    const downloadRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );

    if (!downloadRes.ok) {
      throw new Error(`Download failed: ${downloadRes.status}`);
    }

    const data = await downloadRes.json();
    console.log('[GoogleDrive] Download successful');
    return data;
  } catch (err: any) {
    console.error('[GoogleDrive] Download failed:', err);
    return null;
  }
};
