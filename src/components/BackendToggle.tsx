import React, { useState, useEffect } from 'react';
import { BACKENDS, getActiveBackend, setActiveBackend, type BackendKey } from '../config';

interface BackendInfo { version: string; online: boolean }

const fetchVersion = async (url: string): Promise<BackendInfo> => {
  if (!url) return { version: '—', online: false };
  try {
    const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { version: '—', online: false };
    const data = await res.json();
    return { version: data.version || data.info?.build?.version || '—', online: true };
  } catch {
    return { version: '—', online: false };
  }
};

export default function BackendToggle() {
  const [active, setActive] = useState<BackendKey>(getActiveBackend);
  const [info, setInfo] = useState<Record<BackendKey, BackendInfo>>({
    node:   { version: '…', online: false },
    kotlin: { version: '…', online: false },
  });

  useEffect(() => {
    const load = async () => {
      const [node, kotlin] = await Promise.all([
        fetchVersion(BACKENDS.node.url),
        fetchVersion(BACKENDS.kotlin.url),
      ]);
      setInfo({ node, kotlin });
    };
    load();
  }, []);

  const handleSwitch = (key: BackendKey) => {
    /* v8 ignore next */
    if (!BACKENDS[key].url) return;
    setActive(key);
    setActiveBackend(key);
  };

  const kotlinDisabled = !BACKENDS.kotlin.url;

  return (
    <div style={{
      display: 'inline-flex',
      backgroundColor: '#1E2329',
      border: '1px solid #2B3139',
      borderRadius: '20px',
      padding: '3px',
      gap: '2px',
    }}>
      {(['node', 'kotlin'] as BackendKey[]).map((key) => {
        const isActive = active === key;
        const disabled = key === 'kotlin' && kotlinDisabled;
        const { version, online } = info[key];

        return (
          <button
            key={key}
            onClick={() => handleSwitch(key)}
            disabled={disabled}
            title={disabled ? 'Kotlin backend no deployado aún' : `${BACKENDS[key].label} ${version}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '16px',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              backgroundColor: isActive ? '#2B3139' : 'transparent',
              color: isActive ? '#EAECEF' : disabled ? '#474D57' : '#848E9C',
              fontSize: '11px',
              fontWeight: isActive ? 600 : 400,
              fontFamily: "'IBM Plex Mono', monospace",
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: disabled ? '#474D57' : online ? '#0ECB81' : '#F6465D',
              flexShrink: 0,
            }} />
            {BACKENDS[key].label}
            <span style={{ color: isActive ? '#848E9C' : '#474D57', fontSize: '10px' }}>
              {version}
            </span>
          </button>
        );
      })}
    </div>
  );
}
