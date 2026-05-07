import { getApiUrl } from '../config';

const SW_PATH = '/sw-ip-check.js';
const PERIODIC_SYNC_TAG = 'ip-check';
const MIN_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours

export async function registerSW(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((registration as any).periodicSync) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (registration as any).periodicSync.register(PERIODIC_SYNC_TAG, {
          minInterval: MIN_INTERVAL_MS,
        });
      } catch {
        // periodicSync not supported or permission denied — silent fallback to Layer 1
      }
    }
  } catch (err) {
    console.warn('[swRegistration] SW registration failed:', err);
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'default';
  return Notification.requestPermission();
}

export async function updateStoredIp(ip: string): Promise<void> {
  navigator.serviceWorker.controller?.postMessage({ type: 'UPDATE_STORED_IP', ip });
}

export function isPeriodicSyncSupported(): boolean {
  try {
    return (
      typeof ServiceWorkerRegistration !== 'undefined' &&
      'periodicSync' in ServiceWorkerRegistration.prototype
    );
  } catch {
    /* v8 ignore next — ServiceWorkerRegistration.prototype access throws only in exotic environments not reproducible in jsdom */
    return false;
  }
}

export function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'PushManager' in window && 'serviceWorker' in navigator;
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
  vapidPublicKey: string
): Promise<void> {
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
  fetch(`${getApiUrl()}/api/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription.toJSON()),
  }).catch((err) => console.error('[Push] subscribe failed:', err));
}
