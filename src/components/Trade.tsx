import React, { useState } from 'react';
import { ArrowLeftRight, X } from 'lucide-react';
import { API_URL } from '../config';
import { getSelectedWithdrawEntry } from '../lib/withdrawAddress';
import { CoreData, TradeHistoryEntry } from '../types';
import { STORAGE_KEYS } from '../utils/storageKeys';
import styles from './Trade.module.css';

interface TradeProps {
  data: CoreData;
  onClose?: () => void;
  onSuccess: () => void;
}

export default function Trade({ data, onClose, onSuccess }: TradeProps) {
  const [eurInput, setEurInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  if (!data) return <div className={styles['loading-placeholder']}>Cargando mercado...</div>;

  const eurAmount = parseFloat(eurInput) || 0;
  const grossUsdc = eurAmount * parseFloat(data.rate || '0');
  const fee = grossUsdc * (data.fees?.tradingRate || 0.001);
  const netUsdc = grossUsdc - fee;

  const serviceFee = parseFloat(localStorage.getItem(STORAGE_KEYS.SERVICE_FEE) || '0') || 0;
  const userEmail = localStorage.getItem(STORAGE_KEYS.USER_EMAIL) || '';
  const whitelist = (localStorage.getItem(STORAGE_KEYS.FEE_WHITELIST) || '').split('\n').map(e => e.trim().toLowerCase()).filter(Boolean);
  const isExempt = whitelist.includes(userEmail.toLowerCase());
  const effectiveFee = isExempt ? 0 : serviceFee;

  const handleInitiateTrade = () => {
    if (!eurInput || parseFloat(eurInput) <= 0) return;
    if (parseFloat(eurInput) > parseFloat(data.balances.eur)) {
      setErrorMsg('Saldo insuficiente. Solo tenés ' + data.balances.eur + ' EUR.');
      return;
    }
    setIsConfirming(true);
  };

  const handleConfirmTrade = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const testnet = localStorage.getItem(STORAGE_KEYS.ARGBOT_TESTNET) !== 'false';
      const apiKey = localStorage.getItem(testnet ? STORAGE_KEYS.BINANCE_KEY_TESTNET : STORAGE_KEYS.BINANCE_KEY) || '';
      const apiSecret = localStorage.getItem(testnet ? STORAGE_KEYS.BINANCE_SECRET_TESTNET : STORAGE_KEYS.BINANCE_SECRET) || '';
      const res = await fetch(`${API_URL}/api/trade`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey, apiSecret, amountEur: eurInput, testnet }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error en el cambio');
      setSuccessMsg('¡Cambio ejecutado con éxito!');
      fetch(`${API_URL}/api/push/notify/trade-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch(() => {});
      let history: TradeHistoryEntry[] = [];
      try { history = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || "[]"); } catch { history = []; }
      const brokerRate = parseFloat(data.argCriptoBrokerUsdcArsRate || data.usdcArsRate || '0');
      const eurUsdc = parseFloat(data.rate || '0');
      const eurArsRate = brokerRate > 0 && eurUsdc > 0 ? (eurUsdc * brokerRate).toFixed(2) : undefined;
      const arsAmount = brokerRate > 0 ? (netUsdc * brokerRate).toFixed(0) : undefined;
      // Binance no cobra fee de retiro para USDC BEP20 — siempre 0
      const binanceFeeEur = '0';
      const usdcDestAddress = getSelectedWithdrawEntry()?.address || undefined;
      history.push({ date: new Date().toISOString(), eur: eurInput, savings: "0", usdcReceived: netUsdc.toFixed(2), serviceFee: effectiveFee.toFixed(2), arsAmount, eurArsRate, eurUsdcRate: eurUsdc > 0 ? eurUsdc.toFixed(4) : undefined, binanceFeeEur, usdcDestAddress });
      localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(history));
      setEurInput(''); setIsConfirming(false);
      setTimeout(() => onSuccess(), 2000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(msg);
      setIsConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.header}>
        <ArrowLeftRight size={16} color="#848E9C" />
        <h3 className={styles['header-title']}>
          Cambiar EUR a USDC
        </h3>
      </div>

      <div className={styles.body}>

        {/* Rate + MAX row */}
        <div className={styles['rate-row']}>
          <span className={styles['rate-label']}>Tasa: {data.rate}</span>
          <button
            onClick={() => { setEurInput(Math.max(0, parseFloat(data.balances?.eur || '0')).toFixed(2)); setIsConfirming(false); setErrorMsg(''); }}
            className={styles['max-button']}
          >
            MAX
          </button>
        </div>

        <input
          type="number"
          value={eurInput}
          onChange={(e) => { setEurInput(e.target.value); setIsConfirming(false); setErrorMsg(''); }}
          className={styles['eur-input']}
          placeholder="Monto en EUR"
          disabled={loading || isConfirming}
        />

        <p className={styles['minimum-hint']}>
          Mínimo ~10 EUR por operación (límite Binance)
        </p>

        {/* Breakdown */}
        <div className={styles.breakdown}>
          <div className={styles['breakdown-row']}>
            <span className={styles['breakdown-label']}>Comisión est. ({(data.fees?.tradingRate || 0.001) * 100}%)</span>
            <span className={styles['breakdown-fee']}>- {fee.toFixed(2)} USDC</span>
          </div>
          {effectiveFee > 0 && (
            <div className={styles['breakdown-row']}>
              <span className={styles['breakdown-label']}>Fee de servicio</span>
              <span className={styles['breakdown-service-fee']}>- €{effectiveFee.toFixed(2)}</span>
            </div>
          )}
          {isExempt && effectiveFee === 0 && serviceFee > 0 && (
            <div className={styles['breakdown-row']}>
              <span className={styles['breakdown-label']}>Fee de servicio</span>
              <span className={styles['breakdown-exempt']}>Exento</span>
            </div>
          )}
          <div className={styles['breakdown-total-row']}>
            <span className={styles['breakdown-total-label']}>Recibirás (~)</span>
            <span className={styles['breakdown-total-value']}>{Math.max(0, netUsdc).toFixed(2)} USDC</span>
          </div>
        </div>

        {errorMsg && (
          <div className={styles['error-message']}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className={styles['success-message']}>
            ✓ {successMsg}
          </div>
        )}

        {isConfirming ? (
          <div role="dialog" aria-modal="true" className={styles['confirm-dialog']}>
            <div className={styles['confirm-title']}>Confirmar operación</div>
            <div className={styles['confirm-body']}>
              Estás a punto de cambiar <span className={styles['confirm-body-accent']}>{eurInput} EUR</span>. Esta acción es irreversible.
            </div>
            <button
              onClick={handleConfirmTrade}
              className={styles['confirm-button']}
              disabled={loading}
            >
              {loading ? 'Ejecutando...' : 'Confirmar'}
            </button>
            <button
              onClick={() => setIsConfirming(false)}
              className={styles['cancel-button']}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={handleInitiateTrade}
              className={styles['execute-button']}
              disabled={loading || !eurInput || parseFloat(eurInput) <= 0}
            >
              Ejecutar cambio
            </button>
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className={styles['close-button']}
                disabled={loading}
              >
                <X size={14} /> Cerrar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
