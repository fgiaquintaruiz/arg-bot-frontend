import React, { useState, useEffect } from 'react';
import { Pencil, Check, X, ClipboardList, Download } from 'lucide-react';
import { tradeHistoryToCsv, downloadCsv } from '../utils/csvExport';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { TradeHistoryEntry } from '../types';
import styles from './History.module.css';

function truncateAddress(addr: string): string {
  /* v8 ignore next -- caller guards with ternary: `h.usdcDestAddress ? truncateAddress(...) : '—'` */
  if (!addr) return '—';
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function History({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<TradeHistoryEntry[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]';
      const data = JSON.parse(raw);
      setHistory(Array.isArray(data) ? [...data].reverse() : []);
    } catch {
      setHistory([]);
    }
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

      <div className={styles.body}>

        {history.length === 0 ? (
          <div className={styles['empty-state']}>
            No hay operaciones registradas aún.
          </div>
        ) : (
          <div className={styles['cards-list']}>
            {history.map((h, i) => (
              <div
                key={h.date + '-' + h.eur + '-' + i}
                data-testid="history-card"
                className={styles.card}
              >
                {/* Fecha — top-left, primera línea */}
                <small
                  data-testid="card-date"
                  className={styles['card-date']}
                >
                  {new Date(h.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </small>

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
                  {h.eurArsRate && (
                    <span className={styles['card-rate']}>
                      1 EUR = {h.eurArsRate} ARS
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

                {/* Comisión Ripio — editable */}
                <div className={styles['ripio-row']}>
                  {editingIndex === i ? (
                    <>
                      <span>Comisión Ripio:</span>
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
                        Comisión Ripio: {h.ripioFeeArs ? `${h.ripioFeeArs} ARS` : '— ARS'}
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
            ))}
          </div>
        )}

        <button onClick={onClose} aria-label="Cerrar" className={styles['close-bottom-button']}>
          <X size={14} /> Cerrar
        </button>
      </div>
    </div>
  );
}
