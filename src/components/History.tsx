import React, { useState, useEffect } from 'react';
import { Pencil, Check, X, ClipboardList, Download } from 'lucide-react';
import { tradeHistoryToCsv, downloadCsv } from '../utils/csvExport';

function truncateAddress(addr: string): string {
  /* v8 ignore next -- caller guards with ternary: `h.usdcDestAddress ? truncateAddress(...) : '—'` */
  if (!addr) return '—';
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function History({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('trade_history') || '[]';
      const data = JSON.parse(raw);
      setHistory(Array.isArray(data) ? [...data].reverse() : []);
    } catch {
      setHistory([]);
    }
  }, []);

  const handleSaveRipioFee = (reversedIndex: number) => {
    // history is reversed — map back to original array
    const raw = localStorage.getItem('trade_history') || '[]';
    const original: any[] = JSON.parse(raw);
    const originalIndex = original.length - 1 - reversedIndex;
    original[originalIndex] = { ...original[originalIndex], ripioFeeArs: editValue };
    localStorage.setItem('trade_history', JSON.stringify(original));
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
      const raw = localStorage.getItem('trade_history') || '[]';
      const records = JSON.parse(raw);
      const csv = tradeHistoryToCsv(Array.isArray(records) ? records : []);
      const today = new Date().toISOString().slice(0, 10);
      downloadCsv(`argbot-history-${today}.csv`, csv);
    } catch {
      // silent — download fails gracefully
    }
  };

  return (
    <div style={{ backgroundColor: '#1E2329', borderRadius: '12px', border: '1px solid #2B3139', width: '100%', boxSizing: 'border-box', position: 'relative' }}>

      <button
        aria-label="Cerrar historial"
        onClick={onClose}
        style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#848E9C', display: 'flex', alignItems: 'center', padding: '2px' }}
      >
        <X size={18} />
      </button>

      <div style={{ padding: '16px 20px', borderBottom: '1px solid #2B3139', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ClipboardList size={18} />
        <h3 style={{ margin: 0, color: '#EAECEF', fontSize: '1rem', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>Historial de operaciones</h3>
        <button
          aria-label="Exportar historial como CSV"
          onClick={handleExportCsv}
          disabled={history.length === 0}
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: '1px solid #2B3139',
            borderRadius: '6px',
            cursor: history.length === 0 ? 'not-allowed' : 'pointer',
            color: history.length === 0 ? '#474D57' : '#848E9C',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            fontSize: '12px',
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          <Download size={14} />
          Exportar CSV
        </button>
      </div>

      <div style={{ padding: '20px' }}>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 20px', color: '#474D57', fontSize: '14px' }}>
            No hay operaciones registradas aún.
          </div>
        ) : (
          <div style={{ maxHeight: '460px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map((h, i) => (
              <div
                key={i}
                data-testid="history-card"
                style={{ backgroundColor: '#181A20', padding: '14px 16px', borderRadius: '8px', border: '1px solid #2B3139' }}
              >
                {/* Fecha — top-left, primera línea */}
                <small
                  data-testid="card-date"
                  style={{ display: 'block', color: '#474D57', fontSize: '11px', marginBottom: '6px', fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {new Date(h.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </small>

                {/* Monto principal */}
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ color: '#EAECEF', fontWeight: 600, fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {h.eur} EUR → {h.usdcReceived || '?'} USDC
                  </span>
                </div>

                {/* ARS row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ color: '#848E9C', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {h.arsAmount ? `${h.arsAmount} ARS` : '—'}
                  </span>
                  {h.eurArsRate && (
                    <span style={{ color: '#474D57', fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace" }}>
                      1 EUR = {h.eurArsRate} ARS
                    </span>
                  )}
                </div>

                {/* Dirección destino USDC */}
                <div style={{ fontSize: '11px', color: '#474D57', fontFamily: "'IBM Plex Mono', monospace", marginBottom: '4px' }}>
                  → {h.usdcDestAddress ? truncateAddress(h.usdcDestAddress) : '—'}
                </div>

                {/* Tipo de cambio Binance EUR→USDC */}
                <div style={{ fontSize: '11px', color: '#474D57', fontFamily: "'IBM Plex Mono', monospace", marginBottom: '4px' }}>
                  1 EUR = {h.eurUsdcRate ? h.eurUsdcRate : '—'} USDC
                </div>

                {/* Comisión Binance */}
                <div style={{ fontSize: '11px', color: '#474D57', fontFamily: "'IBM Plex Mono', monospace", marginBottom: '6px' }}>
                  Fee Binance: {h.binanceFeeEur ? `${h.binanceFeeEur} EUR` : '— EUR'}
                </div>

                {/* Comisión Ripio — editable */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#474D57', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {editingIndex === i ? (
                    <>
                      <span>Comisión Ripio:</span>
                      <input
                        type="number"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        placeholder="monto"
                        style={{
                          width: '80px',
                          padding: '2px 6px',
                          backgroundColor: '#1E2329',
                          border: '1px solid #F0B90B',
                          color: '#EAECEF',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontFamily: "'IBM Plex Mono', monospace",
                          outline: 'none',
                        }}
                      />
                      <span>ARS</span>
                      <button
                        aria-label="guardar comisión ripio"
                        onClick={() => handleSaveRipioFee(i)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: '#0ECB81', display: 'flex', alignItems: 'center' }}
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
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: '#474D57', display: 'flex', alignItems: 'center' }}
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

        <button onClick={onClose} aria-label="Cerrar" style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', border: 'none', color: '#848E9C', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '16px', fontFamily: "'IBM Plex Sans', sans-serif" }}>
          <X size={14} /> Cerrar
        </button>
      </div>
    </div>
  );
}
