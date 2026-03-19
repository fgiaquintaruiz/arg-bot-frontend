import React, { useState } from 'react';

export default function BinanceConfig({ onSave, onCancel }: { onSave: () => void, onCancel: () => void }) {
  const [key, setKey] = useState(localStorage.getItem('binance_key') || '');
  const [secret, setSecret] = useState(localStorage.getItem('binance_secret') || '');

  const handleSave = () => {
    localStorage.setItem('binance_key', key);
    localStorage.setItem('binance_secret', secret);
    onSave();
  };

  const btnS: React.CSSProperties = { width: '100%', padding: '16px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px' };
  const backBtnS: React.CSSProperties = { width: '100%', padding: '16px', backgroundColor: 'transparent', border: 'none', color: '#8897a7', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' };
  const inS: React.CSSProperties = { width: '100%', padding: '16px', backgroundColor: '#0e1621', border: '1px solid #334155', color: 'white', borderRadius: '12px', marginBottom: '16px', fontSize: '14px', boxSizing: 'border-box' };

  return (
    <div style={{ backgroundColor: '#17212b', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', border: '1px solid #1e293b' }}>
      <h3 style={{marginTop:0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem'}}><span style={{fontSize: '24px'}}>🔑</span> API de Binance</h3>
      
      <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px', lineHeight: '1.5' }}>
        Ingresá tus credenciales de lectura y escritura (Spot/Withdrawal). Esta información se guarda <b>localmente en tu dispositivo</b>.
      </p>

      <label style={{display:'block', fontSize:'13px', color:'#94a3b8', marginBottom:'8px'}}>API Key</label>
      <input type="text" value={key} onChange={e => setKey(e.target.value)} style={inS} placeholder="Ingresá tu API Key" />

      <label style={{display:'block', fontSize:'13px', color:'#94a3b8', marginBottom:'8px'}}>API Secret</label>
      <input type="password" value={secret} onChange={e => setSecret(e.target.value)} style={inS} placeholder="Ingresá tu API Secret" />

      <button onClick={handleSave} style={btnS}>GUARDAR CREDENCIALES</button>
      <button onClick={onCancel} style={backBtnS}><span>⬅</span> <span>Volver al Menú</span></button>
    </div>
  );
}
