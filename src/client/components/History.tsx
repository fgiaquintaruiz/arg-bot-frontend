import React, { useState, useEffect } from 'react';

export default function History({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('trade_history') || '[]');
    setHistory(data.reverse()); // Mostrar más recientes primero
  }, []);

  const backBtnS: React.CSSProperties = { width: '100%', padding: '16px', backgroundColor: 'transparent', border: 'none', color: '#94a3b8', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' };

  return (
    <div style={{ backgroundColor: '#17212b', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', border: '1px solid #1e293b', width: '100%', boxSizing: 'border-box' }}>
      <h3 style={{marginTop:0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem'}}><span style={{fontSize: '24px'}}>📜</span> Historial</h3>
      
      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#8897a7', fontSize: '14px' }}>
          No hay operaciones registradas aún.
        </div>
      ) : (
        <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
          {history.map((h, i) => (
            <div key={i} style={{ backgroundColor: '#0e1621', padding: '16px', borderRadius: '12px', marginBottom: '12px', border: '1px solid #242f3d' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{h.eur} EUR a USDC</span>
                <span style={{ color: '#8897a7', fontSize: '12px' }}>{new Date(h.date).toLocaleDateString()}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#10b981' }}>
                Ahorro aprox: {h.savings} €
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={onClose} style={backBtnS}><span>⬅</span> <span>Volver al Menú</span></button>
    </div>
  );
}
