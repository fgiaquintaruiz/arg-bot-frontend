import React, { useState, useEffect } from 'react';
import { Pencil, Check, X, ClipboardList, Download, Trash2, Plus } from 'lucide-react';
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

interface NewEntryForm {
  date: string;
  mode: 'testnet' | 'prod' | '';
  eur: string;
  usdcReceived: string;
  arsAmount: string;
  eurUsdcRate: string;
  binanceFeeEur: string;
  ripioFeeArs: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function blankForm(): NewEntryForm {
  return {
    date: todayIso(),
    mode: '',
    eur: '',
    usdcReceived: '',
    arsAmount: '',
    eurUsdcRate: '',
    binanceFeeEur: '',
    ripioFeeArs: '',
  };
}

export default function History({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<(TradeHistoryEntry & { txId?: string })[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [brokerName, setBrokerName] = useState<string>('broker');
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [usdcArsRate, setUsdcArsRate] = useState<number | null>(null);
  const [showNewEntryModal, setShowNewEntryModal] = useState<boolean>(false);
  const [newEntryForm, setNewEntryForm] = useState<NewEntryForm>(blankForm());
  const [newEntryErrors, setNewEntryErrors] = useState<Partial<Record<keyof NewEntryForm, string>>>({});

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
    let original: TradeHistoryEntry[] = [];
    try {
      original = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]');
    } catch {
      return;
    }
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
    let original: TradeHistoryEntry[] = [];
    try {
      original = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]');
    } catch {
      return;
    }
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

  const handleSaveNewEntry = () => {
    const errors: Partial<Record<keyof NewEntryForm, string>> = {};

    // Validate date — required, not future
    if (!newEntryForm.date) {
      errors.date = 'La fecha es requerida.';
    } else {
      const today = todayIso();
      if (newEntryForm.date > today) {
        errors.date = 'La fecha no puede ser futura.';
      }
    }

    // Validate mode — required
    if (!newEntryForm.mode) {
      errors.mode = 'El modo es requerido.';
    }

    // Validate EUR — required, > 0
    const eurVal = parseFloat(newEntryForm.eur);
    if (!newEntryForm.eur || isNaN(eurVal) || eurVal <= 0) {
      errors.eur = 'El monto EUR debe ser mayor a 0.';
    }

    // Validate USDC — required, > 0
    const usdcVal = parseFloat(newEntryForm.usdcReceived);
    if (!newEntryForm.usdcReceived || isNaN(usdcVal) || usdcVal <= 0) {
      errors.usdcReceived = 'El monto USDC debe ser mayor a 0.';
    }

    if (Object.keys(errors).length > 0) {
      setNewEntryErrors(errors);
      return;
    }

    // Build entry
    const eurUsdcVal = parseFloat(newEntryForm.eurUsdcRate);
    // arsVal gates the EUR/ARS calculation: only persist the derived rate when the user
    // also provided an ARS amount (i.e. the operation actually settled in ARS).
    const arsVal = parseFloat(newEntryForm.arsAmount);
    const usdcArsOverride = parseFloat(localStorage.getItem(STORAGE_KEYS.USDC_ARS_OVERRIDE) || '');
    let eurArsRate: string | undefined;
    if (!isNaN(eurUsdcVal) && eurUsdcVal > 0 && !isNaN(arsVal) && arsVal > 0 && !isNaN(usdcArsOverride) && usdcArsOverride > 0) {
      eurArsRate = (eurUsdcVal * usdcArsOverride).toFixed(2);
    }

    const newEntry: TradeHistoryEntry & { txId?: string } = {
      date: new Date(newEntryForm.date).toISOString(),
      eur: newEntryForm.eur,
      savings: '0',
      usdcReceived: newEntryForm.usdcReceived,
      serviceFee: '0',
      mode: newEntryForm.mode as 'testnet' | 'prod',
      arsAmount: newEntryForm.arsAmount || undefined,
      eurUsdcRate: newEntryForm.eurUsdcRate || undefined,
      eurArsRate,
      binanceFeeEur: newEntryForm.binanceFeeEur || undefined,
      ripioFeeArs: newEntryForm.ripioFeeArs || undefined,
    };

    // Persist — append to original array (History reverses on load)
    let original: TradeHistoryEntry[] = [];
    try {
      original = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]');
    } catch {
      original = [];
    }
    original.push(newEntry);
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(original));

    // Update in-memory state — prepend (list is reversed)
    setHistory(prev => [{ ...newEntry, mode: newEntry.mode ?? 'unknown' }, ...prev]);

    // Close modal and reset
    setShowNewEntryModal(false);
    setNewEntryForm(blankForm());
    setNewEntryErrors({});
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
          aria-label="Nueva operación"
          onClick={() => { setShowNewEntryModal(true); setNewEntryForm(blankForm()); setNewEntryErrors({}); }}
          className={styles['new-entry-button']}
        >
          <Plus size={12} />
          Nueva operación
        </button>
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

        {/* New entry modal */}
        {showNewEntryModal && (
          <div className={styles['new-entry-overlay']}>
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Nueva operación"
              className={styles['new-entry-dialog']}
            >
              <p className={styles['new-entry-title']}>Nueva operación manual</p>

              {/* Fecha — aria-label on input so getByLabelText works; label is aria-hidden to avoid duplicate getByText matches */}
              <div className={styles['new-entry-field']}>
                <label htmlFor="ne-date" aria-hidden="true" className={styles['new-entry-label']}>Fecha</label>
                <input
                  id="ne-date"
                  aria-label="Fecha"
                  type="date"
                  value={newEntryForm.date}
                  onChange={e => setNewEntryForm(f => ({ ...f, date: e.target.value }))}
                  className={styles['new-entry-input']}
                  max={todayIso()}
                />
                {newEntryErrors.date && (
                  <span role="alert" className={styles['new-entry-error']}>{newEntryErrors.date}</span>
                )}
              </div>

              {/* Modo */}
              <div className={styles['new-entry-field']}>
                <label htmlFor="ne-mode" aria-hidden="true" className={styles['new-entry-label']}>Modo</label>
                <select
                  id="ne-mode"
                  aria-label="Modo"
                  value={newEntryForm.mode}
                  onChange={e => setNewEntryForm(f => ({ ...f, mode: e.target.value as 'testnet' | 'prod' | '' }))}
                  className={styles['new-entry-select']}
                >
                  <option value="">Seleccionar modo</option>
                  <option value="prod">prod</option>
                  <option value="testnet">testnet</option>
                </select>
                {newEntryErrors.mode && (
                  <span role="alert" className={styles['new-entry-error']}>{newEntryErrors.mode}</span>
                )}
              </div>

              {/* Monto EUR */}
              <div className={styles['new-entry-field']}>
                <label htmlFor="ne-eur" aria-hidden="true" className={styles['new-entry-label']}>Monto EUR</label>
                <input
                  id="ne-eur"
                  aria-label="Monto EUR"
                  type="number"
                  value={newEntryForm.eur}
                  onChange={e => setNewEntryForm(f => ({ ...f, eur: e.target.value }))}
                  placeholder="ej: 100"
                  className={styles['new-entry-input']}
                />
                {newEntryErrors.eur && (
                  <span role="alert" className={styles['new-entry-error']}>{newEntryErrors.eur}</span>
                )}
              </div>

              {/* USDC recibido */}
              <div className={styles['new-entry-field']}>
                <label htmlFor="ne-usdc" aria-hidden="true" className={styles['new-entry-label']}>USDC recibido</label>
                <input
                  id="ne-usdc"
                  aria-label="USDC recibido"
                  type="number"
                  value={newEntryForm.usdcReceived}
                  onChange={e => setNewEntryForm(f => ({ ...f, usdcReceived: e.target.value }))}
                  placeholder="ej: 107.5"
                  className={styles['new-entry-input']}
                />
                {newEntryErrors.usdcReceived && (
                  <span role="alert" className={styles['new-entry-error']}>{newEntryErrors.usdcReceived}</span>
                )}
              </div>

              {/* Monto ARS — opcional */}
              <div className={styles['new-entry-field']}>
                <label htmlFor="ne-ars" aria-hidden="true" className={styles['new-entry-label']}>Monto ARS (opcional)</label>
                <input
                  id="ne-ars"
                  aria-label="Monto ARS"
                  type="number"
                  value={newEntryForm.arsAmount}
                  onChange={e => setNewEntryForm(f => ({ ...f, arsAmount: e.target.value }))}
                  placeholder="ej: 120000"
                  className={styles['new-entry-input']}
                />
              </div>

              {/* Tasa EUR/USDC — opcional */}
              <div className={styles['new-entry-field']}>
                <label htmlFor="ne-eurusdc" aria-hidden="true" className={styles['new-entry-label']}>Tasa EUR/USDC (opcional)</label>
                <input
                  id="ne-eurusdc"
                  aria-label="Tasa EUR/USDC"
                  type="number"
                  value={newEntryForm.eurUsdcRate}
                  onChange={e => setNewEntryForm(f => ({ ...f, eurUsdcRate: e.target.value }))}
                  placeholder="ej: 1.075"
                  className={styles['new-entry-input']}
                />
              </div>

              {/* Fee Binance EUR — opcional */}
              <div className={styles['new-entry-field']}>
                <label htmlFor="ne-binancefee" aria-hidden="true" className={styles['new-entry-label']}>Fee Binance EUR (opcional)</label>
                <input
                  id="ne-binancefee"
                  aria-label="Fee Binance EUR"
                  type="number"
                  value={newEntryForm.binanceFeeEur}
                  onChange={e => setNewEntryForm(f => ({ ...f, binanceFeeEur: e.target.value }))}
                  placeholder="ej: 0"
                  className={styles['new-entry-input']}
                />
              </div>

              {/* Comisión broker ARS — opcional */}
              <div className={styles['new-entry-field']}>
                <label htmlFor="ne-brokerfee" aria-hidden="true" className={styles['new-entry-label']}>Comisión {brokerName} ARS (opcional)</label>
                <input
                  id="ne-brokerfee"
                  aria-label="Comisión broker ARS"
                  type="number"
                  value={newEntryForm.ripioFeeArs}
                  onChange={e => setNewEntryForm(f => ({ ...f, ripioFeeArs: e.target.value }))}
                  placeholder="ej: 1500"
                  className={styles['new-entry-input']}
                />
              </div>

              <div className={styles['new-entry-actions']}>
                <button
                  onClick={() => { setShowNewEntryModal(false); setNewEntryErrors({}); }}
                  className={styles['new-entry-cancel']}
                >
                  Cancelar
                </button>
                <button
                  aria-label="Guardar nueva operación"
                  onClick={handleSaveNewEntry}
                  className={styles['new-entry-save']}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

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
