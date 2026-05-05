import React, { useState, useEffect } from 'react';
import { requestNotificationPermission, isIOS, isPeriodicSyncSupported, isPushSupported, subscribeToPush } from '../utils/swRegistration';
import { STORAGE_KEYS } from '../utils/storageKeys';
import styles from './NotificationOptIn.module.css';

const DISMISS_KEY = STORAGE_KEYS.ARGBOT_NOTIF_OPT_IN_DISMISSED;
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

export default function NotificationOptIn() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<'idle' | 'granted' | 'denied'>('idle');

  useEffect(() => {
    // show banner only when push/periodic-sync available, permission not yet granted, and dismiss cooldown elapsed
    if (isIOS() || (!isPeriodicSyncSupported() && !isPushSupported())) return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') return;
    const bannerEnabled = localStorage.getItem(STORAGE_KEYS.ARGBOT_NOTIF_BANNER_ENABLED);
    if (bannerEnabled === 'false') return;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - parseInt(dismissed, 10) < DISMISS_DURATION_MS) return;
    setVisible(true);
  }, []);

  const handleEnable = async () => {
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      if (isPushSupported()) {
        try {
          const reg = await navigator.serviceWorker.ready;
          await subscribeToPush(reg, import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '');
        } catch (err) {
          console.error('[Push] VAPID subscription failed:', err);
        }
      }
      localStorage.setItem(STORAGE_KEYS.ARGBOT_NOTIFICATIONS_ENABLED, 'true');
      setStatus('granted');
      setVisible(false);
    } else {
      setStatus('denied');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setVisible(false);
  };

  if (status === 'granted') {
    return null;
  }

  if (status === 'denied') {
    return (
      <div role="status" className={styles.banner}>
        <span className={styles['denied-text']}>
          Notificaciones bloqueadas — habilitá en configuración del navegador
        </span>
        <button
          aria-label="Dismiss"
          onClick={handleDismiss}
          className={styles['dismiss-button-sm']}
        >
          Cerrar
        </button>
      </div>
    );
  }

  if (!visible) return null;

  return (
    <div
      role="banner"
      aria-label="Enable IP change notifications"
      className={styles.banner}
    >
      <p className={styles['opt-in-text']}>
        Recibí notificaciones cuando cambie la IP del servidor (hasta 24h de demora)
      </p>
      <div className={styles['button-group']}>
        <button
          aria-label="Enable Notifications"
          onClick={handleEnable}
          className={styles['enable-button']}
        >
          Activar notificaciones
        </button>
        <button
          aria-label="Dismiss"
          onClick={handleDismiss}
          className={styles['dismiss-button']}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
