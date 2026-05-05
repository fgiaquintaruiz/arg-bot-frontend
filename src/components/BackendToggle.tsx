import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config';
import styles from './BackendToggle.module.css';

interface BackendInfo { version: string; online: boolean }

const fetchVersion = async (url: string): Promise<BackendInfo> => {
  if (!url) return { version: '—', online: false };
  try {
    const res = await fetch(`${url}/api/version`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { version: '—', online: false };
    const data = await res.json();
    return {
      version: data.version
        || data.info?.build?.version
        || data.build?.version
        || data.app?.version
        || data.application?.version
        || '—',
      online: true,
    };
  } catch {
    return { version: '—', online: false };
  }
};

export default function BackendToggle() {
  const [info, setInfo] = useState<BackendInfo>({ version: '…', online: false });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchVersion(getApiUrl()).then(result => {
      const prev = sessionStorage.getItem('argbot_last_version');
      if (prev && prev !== result.version && result.version !== '—') {
        setUpdating(true);
        setTimeout(() => { window.location.href = window.location.pathname + '?v=' + Date.now(); }, 1500);
      }
      if (result.version !== '—') {
        sessionStorage.setItem('argbot_last_version', result.version);
      }
      setInfo(result);
    });
  }, []);

  return (
    <div className={styles.container}>
      <span className={`${styles.dot} ${info.online ? styles['dot-online'] : styles['dot-offline']}`} />
      <span className={styles.label}>
        Kotlin
      </span>
      <span className={`${styles.version} ${updating ? styles['version-updating'] : styles['version-idle']}`}>
        {info.version}
      </span>
    </div>
  );
}
