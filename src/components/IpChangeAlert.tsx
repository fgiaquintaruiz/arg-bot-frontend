import React from 'react';
import styles from './IpChangeAlert.module.css';

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
      className={styles.container}
    >
      {/* Left: icon + message */}
      <span className={styles.message}>
        ⚠️
        <span>
          IP del servidor cambió —{' '}
          <code className={styles.code}>
            {newIp}
          </code>
          {' '}— Actualizá la whitelist en Binance
        </span>
      </span>

      {/* Right: CTA + Dismiss */}
      <span className={styles.actions}>
        <button
          onClick={onConfirm}
          aria-label="Actualizar IP en Binance"
          className={styles['confirm-button']}
        >
          Actualizar en Binance
        </button>
        <button
          onClick={onDismiss}
          aria-label="Ignorar cambio de IP"
          className={styles['dismiss-button']}
        >
          Ignorar
        </button>
      </span>
    </div>
  );
}
