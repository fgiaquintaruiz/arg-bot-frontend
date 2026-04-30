import React from 'react';

interface IpChangeAlertProps {
  newIp: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

export default function IpChangeAlert({ newIp, onConfirm, onDismiss }: IpChangeAlertProps) {
  return (
    <div
      role="alert"
      aria-label="Alerta: la IP del servidor cambió"
      style={{
        backgroundColor: 'rgba(240,185,11,0.12)',
        borderBottom: '1px solid rgba(240,185,11,0.4)',
        color: '#F0B90B',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        flexShrink: 0,
        flexWrap: 'wrap',
        boxSizing: 'border-box',
      }}
    >
      {/* Left: icon + message */}
      <span style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
        ⚠️
        <span>
          IP del servidor cambió —{' '}
          <code
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              color: '#EAECEF',
              fontSize: '11px',
              backgroundColor: '#2B3139',
              padding: '1px 5px',
              borderRadius: '3px',
            }}
          >
            {newIp}
          </code>
          {' '}— Actualizá la whitelist en Binance
        </span>
      </span>

      {/* Right: CTA + Dismiss */}
      <span style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={onConfirm}
          aria-label="Actualizar IP en Binance"
          style={{
            backgroundColor: '#F0B90B',
            color: '#181A20',
            border: 'none',
            borderRadius: '20px',
            padding: '5px 14px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.3px',
          }}
        >
          Actualizar en Binance
        </button>
        <button
          onClick={onDismiss}
          aria-label="Ignorar cambio de IP"
          style={{
            background: 'transparent',
            border: '1px solid rgba(240,185,11,0.4)',
            borderRadius: '20px',
            color: '#F0B90B',
            padding: '5px 12px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Ignorar
        </button>
      </span>
    </div>
  );
}
