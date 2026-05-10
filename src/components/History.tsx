import React, { useState, useEffect } from 'react';
import { Pencil, Check, X, ClipboardList, Download, Trash2 } from 'lucide-react';
import { tradeHistoryToCsv, downloadCsv } from '../utils/csvExport';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { TradeHistoryEntry } from '../types';
import styles from './History.module.css';

export interface EurArsRateDisplay {
  value: string;
  estimated: boolean;
}

export function calculateDisplayEurArsRate(
  entry: { eurArsRate?: string; eurUsdcRate?: string },
  usdcArsRate: number | null
): EurArsRateDisplay | null {
  // PRIORITY 1 — stored rate is the real rate at the time of the operation
  const storedRate = parseFloat(entry.eurArsRate ?? '');
  if (!isNaN(storedRate) && storedRate > 0) {
    return { value: storedRate.toFixed(2), estimated: false };
  }

  // PRIORITY 2 — estimate using eurUsdcRate × today's usdc/ars override
  const eurUsdc = parseFloat(entry.eurUsdcRate ?? '');
  if (
    !isNaN(eurUsdc) &&
    eurUsdc > 0 &&
    usdcArsRate !== null &&
    !isNaN(usdcArsRate) &&
    usdcArsRate > 0
  ) {
    return { value: (eurUsdc * usdcArsRate).toFixed(2), estimated: true };
  }

  // PRIORITY 3 — not enough data
  return null;
}

const BROKER_NAME_KEY = 'argbot_broker_name';

function truncateAddress(addr: string): string {
  /* v8 ignore next -- caller guards with ternary: `h.usdcDestAddress ? truncateAddress(...) : '—'` */
  if (!addr) return '—';
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function isTestnetEntry(entry: TradeHistoryEntry & { txId?: string }): boolean {
  return typeof entry.txId === 'string' && entry.txId.startsWith('TESTNET-');
}

export default function History({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<(TradeHistoryEntry & { txId?: string })[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [brokerName, setBrokerName] = useState<string>('broker');
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [usdcArsRate, setUsdcArsRate] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]';
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        // Migration: legacy entries without `mode` get 'unknown' — in-memory only, not persisted
        const migrated = data.map(entry => ({ ...entry, mode: entry.mode ?? 'unknown' }));
        setHistory([...migrated].reverse());
      } else {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    }

    const storedBroker = localStorage.getItem(BROKER_NAME_KEY);
    if (storedBroker) setBrokerName(storedBroker);

    const override = localStorage.getItem(STORAGE_KEYS.USDC_ARS_OVERRIDE) || '';
    const parsed = parseFloat(override);
    setUsdcArsRate(!isNaN(parsed) && parsed > 0 ? parsed : null);
  }, []);

  const handleSaveRipioFee = (reversedIndex: number) => {
    // history is reversed — map back to original array
    const raw = localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]';
    const original: TradeHistoryEntry[] = JSON.parse(raw);
    const originalIndex = original.length - 1 - reversedIndex;
    original[originalIndex] = { ...original[originalIndex], ripioFeeArs: editValue };
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(original));
    setHistory(prev => {
      const updated = [...prev];
      updated[reversedIndex] = { ...updated[reversedIndex], ripioFeeArs: editValue };
      return updated;
    });
    setEditingIndex(null);
    setEditValue('');
  };

  const handleDeleteEntry = (reversedIndex: number) => {
    const raw = localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]';
    const original: TradeHistoryEntry[] = JSON.parse(raw);
    const originalIndex = original.length - 1 - reversedIndex;
    original.splice(originalIndex, 1);
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(original));
    setHistory(prev => {
      const updated = [...prev];
      updated.splice(reversedIndex, 1);
      return updated;
    });
    setDeleteConfirmIndex(null);
  };

  const handleExportCsv = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]';
      const records = JSON.parse(raw);
      const csv = tradeHistoryToCsv(Array.isArray(records) ? records : []);
      const today = new Date().toISOString().slice(0, 10);
      downloadCsv(`argbot-history-${today}.csv`, csv);
    } catch {
      // silent — download fails gracefully
    }
  };

  return (
    <div className={styles.container}>

      <button
        aria-label="Cerrar historial"
        onClick={onClose}
        className={styles['close-top-button']}
      >
        <X size={18} />
      </button>

      <div className={styles.header}>
        <ClipboardList size={18} />
        <h3 className={styles['header-title']}>Historial de operaciones</h3>
        <button
          aria-label="Exportar historial como CSV"
          onClick={handleExportCsv}
          disabled={history.length === 0}
          className={`${styles['export-button']} ${history.length === 0 ? styles['export-button-disabled'] : styles['export-button-enabled']}`}
        >
          <Download size={14} />
          Exportar CSV
        </button>
      </div>

      {usdcArsRate === null && (
        <div className={styles['usdc-ars-warning']}>
          ⚠ Verificá la tasa de venta de USDC en tu broker argentino para ver tasas precisas.{' '}
          <button
            aria-label="Configurar"
            className={styles['usdc-ars-warning-link']}
            onClick={() => window.dispatchEvent(new CustomEvent('open-settings', { detail: { tab: 'alerts' } }))}
          >
            Configurar
          </button>
        </div>
      )}

      <div className={styles.body}>

        {/* Delete confirmation dialog */}
        {deleteConfirmIndex !== null && (
          <div className={styles['delete-dialog-overlay']}>
            <div className={styles['delete-dialog']}>
              <p className={styles['delete-dialog-text']}>
                ¿Eliminar esta operación del historial? Esta acción no se puede deshacer.
              </p>
              <div className={styles['delete-dialog-actions']}>
                <button
                  onClick={() => setDeleteConfirmIndex(null)}
                  className={styles['delete-cancel-button']}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteEntry(deleteConfirmIndex)}
                  className={styles['delete-confirm-button']}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {history.length === 0 ? (
          <div className={styles['empty-state']}>
            No hay operaciones registradas aún.
          </div>
        ) : (
          <div className={styles['cards-list']}>
            {history.map((h, i) => {
              const testnet = isTestnetEntry(h);
              const displayEurArsRate = calculateDisplayEurArsRate(h, usdcArsRate);
              return (
                <div
                  key={h.date + '-' + h.eur + '-' + i}
                  data-testid="history-card"
                  className={`${styles.card} ${testnet ? styles['card-testnet'] : ''}`}
                >
                  {/* Fecha + testnet badge row */}
                  <div className={styles['card-header-row']}>
                    <small
                      data-testid="card-date"
                      className={styles['card-date']}
                    >
                      {new Date(h.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </small>
                    {testnet && (
                      <span className={styles['testnet-badge']}>TESTNET</span>
                    )}
                    <button
                      aria-label="Eliminar operación"
                      onClick={() => setDeleteConfirmIndex(i)}
                      className={styles['delete-button']}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>

                  {/* Monto principal */}
                  <div className={styles['card-amount-row']}>
                    <span className={styles['card-amount']}>
                      {h.eur} EUR → {h.usdcReceived || '?'} USDC
                    </span>
                  </div>

                  {/* ARS row */}
                  <div className={styles['card-ars-row']}>
                    <span className={styles['card-ars']}>
                      {h.arsAmount ? `${h.arsAmount} ARS` : '—'}
                    </span>
                    {displayEurArsRate !== null ? (
                      <span className={styles['card-rate']}>
                        {displayEurArsRate.estimated ? '1 EUR ≈ ' : '1 EUR = '}
                        {parseFloat(displayEurArsRate.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ARS
                      </span>
                    ) : (
                      <span className={styles['card-rate-unavailable']}>
                        Tasa EUR/ARS no disponible
                      </span>
                    )}
                  </div>

                  {/* Dirección destino USDC */}
                  <div className={styles['card-meta']}>
                    → {h.usdcDestAddress ? truncateAddress(h.usdcDestAddress) : '—'}
                  </div>

                  {/* Tipo de cambio Binance EUR→USDC */}
                  <div className={styles['card-meta']}>
                    1 EUR = {h.eurUsdcRate ? h.eurUsdcRate : '—'} USDC
                  </div>

                  {/* Comisión Binance */}
                  <div className={styles['card-meta-last']}>
                    Fee Binance: {h.binanceFeeEur ? `${h.binanceFeeEur} EUR` : '— EUR'}
                  </div>

                  {/* Comisión broker — editable */}
                  <div className={styles['ripio-row']}>
                    {editingIndex === i ? (
                      <>
                        <span>Comisión {brokerName}:</span>
                        <input
                          type="number"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          placeholder="monto"
                          className={styles['ripio-input']}
                        />
                        <span>ARS</span>
                        <button
                          aria-label="guardar comisión ripio"
                          onClick={() => handleSaveRipioFee(i)}
                          className={styles['ripio-save-button']}
                        >
                          <Check size={12} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span>
                          Comisión {brokerName}: {h.ripioFeeArs ? `${h.ripioFeeArs} ARS` : '— ARS'}
                        </span>
                        <button
                          aria-label="editar comisión ripio"
                          onClick={() => { setEditingIndex(i); setEditValue(h.ripioFeeArs || ''); }}
                          className={styles['ripio-edit-button']}
                        >
                          <Pencil size={10} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={onClose} aria-label="Cerrar" className={styles['close-bottom-button']}>
          <X size={14} /> Cerrar
        </button>
      </div>
    </div>
  );
}
