import { useState, useEffect } from 'react';
import { getApiUrl } from '../config';
import { updateStoredIp } from '../utils/swRegistration';
import { getLastKnownIp, setLastKnownIp } from '../utils/ipCheckStorage';

export interface UseIpChangeDetectionResult {
  ipChanged: boolean;
  newIp: string | null;
  dismiss: () => void;
  persist: () => void;
}

export function useIpChangeDetection(): UseIpChangeDetectionResult {
  const [ipChanged, setIpChanged] = useState(false);
  const [newIp, setNewIp] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const detect = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/ip`);
        if (!res.ok) return;

        const data = await res.json();
        const fetchedIp: unknown = data?.ip;

        // Validate shape — must be a non-empty string
        if (typeof fetchedIp !== 'string' || fetchedIp.trim() === '') return;

        if (cancelled) return;

        const storedIp = getLastKnownIp();

        if (storedIp === null) {
          // Bootstrap: first time — save silently, no banner
          setLastKnownIp(fetchedIp);
          return;
        }

        if (storedIp !== fetchedIp) {
          // IP changed — show banner
          setNewIp(fetchedIp);
          setIpChanged(true);
        }
        // If same — do nothing (STABLE)
      } catch (err) {
        console.warn('[useIpChangeDetection] Failed to detect IP change:', err);
      }
    };

    detect();
    return () => {
      cancelled = true;
    };
  }, []);

  const acknowledge = () => {
    if (newIp) {
      setLastKnownIp(newIp);
      updateStoredIp(newIp); // sync new IP to SW's IndexedDB via BroadcastChannel (fire-and-forget)
    }
    setIpChanged(false);
  };

  return {
    ipChanged,
    newIp,
    dismiss: acknowledge,
    persist: acknowledge,
  };
}
