// ARGBOT Service Worker — IP Change Detection (Layer 2)
// Architecture: Periodic Background Sync + IndexedDB for SW-side storage
// Pure logic is mirrored in src/utils/ipPollingLogic.ts (unit-tested in Vitest)
const SW_VERSION = '1.0.0';
const DB_NAME = 'argbot-ip';
const STORE_NAME = 'ip';
const IP_KEY = 'last_known_ip';
const BACKEND_URL = 'https://arg-bot-backend-kotlin.onrender.com';
const PERIODIC_SYNC_TAG = 'ip-check';
const MIN_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours

// ── IndexedDB helpers ─────────────────────────────────────────────────────────

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function getStoredIp() {
  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(IP_KEY);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => resolve(null);
  });
}

async function setStoredIp(ip) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ id: IP_KEY, value: ip });
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

// ── IP check handler ──────────────────────────────────────────────────────────

async function handleIpCheck() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ip`);
    if (!res.ok) return;
    const data = await res.json();
    const newIp = data?.ip;
    if (typeof newIp !== 'string' || newIp.trim() === '') return;

    const oldIp = await getStoredIp();

    if (oldIp === null) {
      // Bootstrap: first time — save silently, no notification
      await setStoredIp(newIp);
      return;
    }

    if (oldIp === newIp) return; // no change

    // IP changed — update IDB regardless of notification permission
    await setStoredIp(newIp);

    if (Notification.permission === 'granted') {
      await self.registration.showNotification('Server IP Changed', {
        body: 'Your ARGBOT server IP changed. Please refresh the app.',
        tag: 'ip-change',
        requireInteraction: false,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
      });
    } else {
      // Layer 1 fallback: banner will appear when user opens the app
      console.warn('[SW] IP changed but notification permission not granted. Layer 1 handles on reopen.');
    }
  } catch (err) {
    console.warn('[SW] handleIpCheck error:', err);
  }
}

// ── Event listeners ───────────────────────────────────────────────────────────

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      if ('periodicSync' in self.registration) {
        return self.registration.periodicSync
          .register(PERIODIC_SYNC_TAG, { minInterval: MIN_INTERVAL_MS })
          .catch((err) => {
            console.warn('[SW] periodicSync registration failed on activate:', err);
          });
      }
    })
  );
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === PERIODIC_SYNC_TAG) {
    event.waitUntil(handleIpCheck());
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'UPDATE_STORED_IP' && event.data?.ip) {
    setStoredIp(event.data.ip).catch(console.warn);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: payload.url || 'notification',
      requireInteraction: false,
      data: { url: payload.url || '/' },
    })
  );
});
