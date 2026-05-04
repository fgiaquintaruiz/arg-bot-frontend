import React, { useState, useEffect } from 'react';
import { requestNotificationPermission, isIOS, isPeriodicSyncSupported, isPushSupported, subscribeToPush } from '../utils/swRegistration';

const DISMISS_KEY = 'argbot_notif_opt_in_dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

export default function NotificationOptIn() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<'idle' | 'granted' | 'denied'>('idle');

  useEffect(() => {
    if (isIOS() || (!isPeriodicSyncSupported() && !isPushSupported())) return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') return;
    const bannerEnabled = localStorage.getItem('argbot_notif_banner_enabled');
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
      localStorage.setItem('argbot_notifications_enabled', 'true');
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
      <div
        role="status"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(24,26,32,0.97)',
          borderTop: '1px solid #2B3139',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span style={{ color: '#848E9C', fontSize: '12px' }}>
          Notificaciones bloqueadas — habilitá en configuración del navegador
        </span>
        <button
          aria-label="Dismiss"
          onClick={handleDismiss}
          style={{
            backgroundColor: 'transparent',
            color: '#848E9C',
            border: '1px solid #2B3139',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'IBM Plex Sans', sans-serif",
            minHeight: '30px',
            flexShrink: 0,
          }}
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
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(24,26,32,0.97)',
        borderTop: '1px solid #2B3139',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <p style={{ color: '#848E9C', fontSize: '13px', margin: 0, flex: 1 }}>
        Recibí notificaciones cuando cambie la IP del servidor (hasta 24h de demora)
      </p>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          aria-label="Enable Notifications"
          onClick={handleEnable}
          style={{
            backgroundColor: '#F0B90B',
            color: '#181A20',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'IBM Plex Sans', sans-serif",
            minHeight: '36px',
          }}
        >
          Activar notificaciones
        </button>
        <button
          aria-label="Dismiss"
          onClick={handleDismiss}
          style={{
            backgroundColor: 'transparent',
            color: '#848E9C',
            border: '1px solid #2B3139',
            borderRadius: '6px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'IBM Plex Sans', sans-serif",
            minHeight: '36px',
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
