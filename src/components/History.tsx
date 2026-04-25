import React, { useState, useEffect } from 'react';

export default function History({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('trade_history') || '[]';
      const data = JSON.parse(raw);
      setHistory(Array.isArray(data) ? [...data].reverse() : []);
    } catch {
      setHistory([]);
    }
  }, []);

  const totalSavings = history.reduce((sum, h) => sum + (parseFloat(h.savings) || 0), 0);

  return (
    <div style={{ backgroundColor: '#1E2329', borderRadius: '12px', border: '1px solid #2B3139', width: '100%', boxSizing: 'border-box' }}>

      <div style={{ padding: '16px 20px', borderBottom: '1px solid #2B3139', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>📋</span>
        <h3 style={{ margin: 0, color: '#EAECEF', fontSize: '1rem', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>Historial de operaciones</h3>
      </div>

      <div style={{ padding: '20px' }}>

        {totalSavings > 0 && (
          <div style={{ textAlign: 'center', padding: '10px 14px', backgroundColor: 'rgba(14,203,129,0.08)', borderRadius: '8px', border: '1px solid rgba(14,203,129,0.2)', marginBottom: '16px' }}>
            <span style={{ fontWeight: 600, color: '#0ECB81', fontSize: '14px' }}>Ahorro total acumulado: +{totalSavings.toFixed(2)} €</span>
          </div>
        )}

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 20px', color: '#474D57', fontSize: '14px' }}>
            No hay operaciones registradas aún.
          </div>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map((h, i) => (
              <div key={i} style={{ backgroundColor: '#181A20', padding: '14px 16px', borderRadius: '8px', border: '1px solid #2B3139' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                  <span style={{ color: '#EAECEF', fontWeight: 600, fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace" }}>{h.eur} EUR → {h.usdcReceived || '?'} USDC</span>
                  <span style={{ color: '#474D57', fontSize: '11px' }}>{new Date(h.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#848E9C', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {h.arsAmount ? `${h.arsAmount} ARS` : '—'}
                  </span>
                  {h.eurArsRate && (
                    <span style={{ color: '#474D57', fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace" }}>
                      1 EUR = {h.eurArsRate} ARS
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={onClose} aria-label="Volver al menú" style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', border: 'none', color: '#848E9C', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '16px', fontFamily: "'IBM Plex Sans', sans-serif" }}>
          ← Volver al menú
        </button>
      </div>
    </div>
  );
}
