// Google Drive API service for syncing ARGBOT data
const CLIENT_ID = '207884217858-ssnie582pel88miikiuodl38qm8esqbp.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_FILENAME = 'argbot-backup.json';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let gapiLoaded = false;

// Dynamically load Google API scripts
const loadGapi = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (gapiLoaded && window.gapi) {
      resolve();
      return;
    }

    const script1 = document.createElement('script');
    script1.src = 'https://apis.google.com/js/api.js';
    script1.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://accounts.google.com/gsi/client';
      script2.onload = () => {
        gapiLoaded = true;
        resolve();
      };
      script2.onerror = reject;
      document.head.appendChild(script2);
    };
    script1.onerror = reject;
    document.head.appendChild(script1);
  });
};

// Initialize Google API client
const initGapi = async (): Promise<void> => {
  console.log('[GoogleDrive] Initializing gapi...');
  await loadGapi();

  return new Promise((resolve, reject) => {
    window.gapi.load('client', {
      callback: async () => {
        try {
          await window.gapi.client.init({
            apiKey: '', // Not needed for OAuth flows with user tokens
            clientId: CLIENT_ID,
            scope: SCOPES,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          console.log('[GoogleDrive] gapi.client initialized');
          resolve();
        } catch (err) {
          console.error('[GoogleDrive] Failed to init gapi.client:', err);
          reject(err);
        }
      },
      onerror: reject,
    });
  });
};

// Authenticate user with Google
const authenticate = async (): Promise<string | null> => {
  console.log('[GoogleDrive] Starting authentication...');

  // Use Google Identity Services (GIS) for OAuth
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.access_token) {
          console.log('[GoogleDrive] Auth successful, got access token');
          // Set the token for gapi
          window.gapi.client.setToken({ access_token: response.access_token });
          resolve(response.access_token);
        } else {
          console.error('[GoogleDrive] Auth failed:', response);
          resolve(null);
        }
      },
    });

    // Request access (will show popup if not already granted)
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

// Upload data to Google Drive
export const uploadToDrive = async (data: any): Promise<boolean> => {
  try {
    console.log('[GoogleDrive] Starting upload...');
    await initGapi();

    const accessToken = await authenticate();
    if (!accessToken) {
      console.log('[GoogleDrive] User cancelled auth');
      return false;
    }

    // Check if file already exists
    const existingFileId = localStorage.getItem('drive_file_id');
    let fileId: string;

    if (existingFileId) {
      // Update existing file
      console.log('[GoogleDrive] Updating existing file:', existingFileId);
      const content = JSON.stringify(data);
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;
      const metadata = JSON.stringify({ name: BACKUP_FILENAME, mimeType: 'application/json' });

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        metadata +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        content +
        closeDelimiter;

      await fetch('https://www.googleapis.com/upload/drive/v3/files/' + existingFileId + '?uploadType=multipart', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"',
        },
        body: multipartRequestBody,
      });

      fileId = existingFileId;
      console.log('[GoogleDrive] File updated successfully');
    } else {
      // Create new file
      console.log('[GoogleDrive] Creating new file...');
      const content = JSON.stringify(data);
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;
      const metadata = JSON.stringify({ name: BACKUP_FILENAME, mimeType: 'application/json' });

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        metadata +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        content +
        closeDelimiter;

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"',
        },
        body: multipartRequestBody,
      });

      const result = await response.json();
      fileId = result.id;
      localStorage.setItem('drive_file_id', fileId);
      console.log('[GoogleDrive] File created with ID:', fileId);
    }

    return true;
  } catch (err) {
    console.error('[GoogleDrive] Upload failed:', err);
    return false;
  }
};

// Download data from Google Drive
export const downloadFromDrive = async (): Promise<any | null> => {
  try {
    console.log('[GoogleDrive] Starting download...');
    await initGapi();

    const accessToken = await authenticate();
    if (!accessToken) {
      console.log('[GoogleDrive] User cancelled auth');
      return null;
    }

    // Search for the backup file
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}'&fields=files(id,name)`,
      {
        headers: { 'Authorization': 'Bearer ' + accessToken },
      }
    );

    const searchResult = await searchResponse.json();
    console.log('[GoogleDrive] Search result:', searchResult);

    if (!searchResult.files || searchResult.files.length === 0) {
      console.log('[GoogleDrive] No backup file found in Drive');
      return null;
    }

    const fileId = searchResult.files[0].id;
    localStorage.setItem('drive_file_id', fileId);

    // Download file content
    const downloadResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { 'Authorization': 'Bearer ' + accessToken },
      }
    );

    const data = await downloadResponse.json();
    console.log('[GoogleDrive] Download successful, got data');
    return data;
  } catch (err) {
    console.error('[GoogleDrive] Download failed:', err);
    return null;
  }
};
