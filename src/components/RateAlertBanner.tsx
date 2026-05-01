import React from 'react';

interface RateAlertBannerProps {
  pair: string;
  direction: 'upper' | 'lower';
  currentRate: number;
  threshold: number;
  onDismiss: () => void;
}

export default function RateAlertBanner({ pair, direction, currentRate, threshold, onDismiss }: RateAlertBannerProps) {
  const isUpper = direction === 'upper';

  const color = isUpper ? '#F0B90B' : '#0ECB81';
  const bgColor = isUpper ? 'rgba(240,185,11,0.12)' : 'rgba(14,203,129,0.12)';
  const borderColor = isUpper ? 'rgba(240,185,11,0.4)' : 'rgba(14,203,129,0.4)';
  const symbol = isUpper ? '≥' : '≤';
  const icon = isUpper ? '📈' : '📉';

  return (
    <div
      role="alert"
      aria-label={`Alerta de rate: ${pair}`}
      style={{
        backgroundColor: bgColor,
        borderBottom: `1px solid ${borderColor}`,
        color,
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
        {icon}
        <span>
          {pair} {symbol} {threshold} (ahora: {currentRate.toFixed(4)})
        </span>
      </span>

      {/* Right: dismiss */}
      <button
        onClick={onDismiss}
        aria-label={`Descartar alerta ${pair}`}
        style={{
          background: 'transparent',
          border: `1px solid ${borderColor}`,
          borderRadius: '20px',
          color,
          padding: '5px 12px',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Descartar
      </button>
    </div>
  );
}
