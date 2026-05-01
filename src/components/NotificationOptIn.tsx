import React, { useState, useEffect } from 'react';
import { requestNotificationPermission, isIOS, isPeriodicSyncSupported } from '../utils/swRegistration';

const DISMISS_KEY = 'argbot_notif_opt_in_dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

export default function NotificationOptIn() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<'idle' | 'granted' | 'denied'>('idle');

  useEffect(() => {
    if (isIOS() || !isPeriodicSyncSupported()) return;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - parseInt(dismissed, 10) < DISMISS_DURATION_MS) return;
    setVisible(true);
  }, []);

  const handleEnable = async () => {
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
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
    return <div role="status">Notifications enabled</div>;
  }
  if (status === 'denied') {
    return <div role="status">Notifications blocked — enable in browser settings</div>;
  }
  if (!visible) return null;

  return (
    <div role="banner" aria-label="Enable IP change notifications">
      <p>Get notified when the server IP changes (up to 24h delay)</p>
      <button aria-label="Enable Notifications" onClick={handleEnable}>
        Enable Notifications
      </button>
      <button aria-label="Dismiss" onClick={handleDismiss}>
        Dismiss
      </button>
    </div>
  );
}
