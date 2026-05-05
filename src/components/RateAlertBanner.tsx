import React from 'react';
import styles from './RateAlertBanner.module.css';

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
      className={styles['banner-container']}
      style={{ backgroundColor: bgColor, borderBottom: `1px solid ${borderColor}`, color }}
    >
      {/* Left: icon + message */}
      <span className={styles.message}>
        {icon}
        <span>
          {pair} {symbol} {threshold} (ahora: {currentRate.toFixed(4)})
        </span>
      </span>

      {/* Right: dismiss */}
      <button
        onClick={onDismiss}
        aria-label={`Descartar alerta ${pair}`}
        className={styles['dismiss-button']}
        style={{ border: `1px solid ${borderColor}`, color }}
      >
        Descartar
      </button>
    </div>
  );
}
