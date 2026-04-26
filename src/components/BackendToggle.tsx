import React, { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '../config';

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
  const prevVersionRef = useRef<string>('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchVersion(getApiUrl()).then(result => {
      if (prevVersionRef.current !== '' && result.version !== '—' && result.version !== prevVersionRef.current) {
        setUpdating(true);
        setTimeout(() => { window.location.href = window.location.pathname + '?_t=' + Date.now(); }, 1500);
      }
      prevVersionRef.current = result.version;
      setInfo(result);
    });
  }, []);

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      backgroundColor: '#1E2329',
      border: '1px solid #2B3139',
      borderRadius: '20px',
      padding: '4px 10px',
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: info.online ? '#0ECB81' : '#F6465D',
        flexShrink: 0,
      }} />
      <span style={{
        color: '#EAECEF',
        fontSize: '11px',
        fontWeight: 600,
        fontFamily: "'IBM Plex Mono', monospace",
        whiteSpace: 'nowrap',
      }}>
        Kotlin
      </span>
      <span style={{
        color: updating ? '#F0B90B' : '#848E9C',
        fontSize: '10px',
        fontFamily: "'IBM Plex Mono', monospace",
        ...(updating ? { animation: 'pulse 0.5s ease-in-out infinite' } : {}),
      }}>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
        {info.version}
      </span>
    </div>
  );
}
