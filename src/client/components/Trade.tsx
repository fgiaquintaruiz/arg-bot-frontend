import React, { useState } from 'react';
import { API_URL } from '../config';

export interface CoreData { balances: { eur: string; usdc: string }; rate: string; usdcArsRate?: string; fees: { tradingRate: number; withdrawalUSDC_BEP20: number }; }
interface TradeProps { data: CoreData; onClose: () => void; onSuccess: () => void; }

export default function Trade({ data, onClose, onSuccess }: TradeProps) {
  const [eurInput, setEurInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  if (!data) return <div style={{ color: '#8897a7', padding: '20px', textAlign: 'center' }}>Cargando mercado...</div>;

  const eurAmount = parseFloat(eurInput) || 0;
  const grossUsdc = eurAmount * parseFloat(data.rate || '0');
  const fee = grossUsdc * (data.fees?.tradingRate || 0.001);
  const netUsdc = grossUsdc - fee;

  const handleInitiateTrade = () => {
    if (!eurInput || parseFloat(eurInput) <= 0) return;
    if (parseFloat(eurInput) > parseFloat(data.balances.eur)) {
      setErrorMsg('Saldo insuficiente. Solo tenés ' + data.balances.eur + ' EUR.');
      return;
    }
    setIsConfirming(true);
  };

  const handleConfirmTrade = async () => {
    setLoading(true); setErrorMsg(''); setSuccessMsg('');
    try {
      // Usamos API_URL directamente
      const res = await fetch(`${API_URL}/api/trade`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: localStorage.getItem('binance_key'), apiSecret: localStorage.getItem('binance_secret'), amountEur: eurInput }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error en el cambio');
      setSuccessMsg('¡Cambio ejecutado con éxito!');
      const history = JSON.parse(localStorage.getItem("trade_history") || "[]");
      history.push({ date: new Date().toISOString(), eur: eurInput, savings: '0.00' });
      localStorage.setItem("trade_history", JSON.stringify(history));
      setEurInput(''); setIsConfirming(false);
      setTimeout(() => onSuccess(), 2000);
    } catch (e: any) { setErrorMsg(e.message); setIsConfirming(false); } finally { setLoading(false); }
  };

  const btnS: React.CSSProperties = { width: '100%', padding: '16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px' };
  const backBtnS: React.CSSProperties = { width: '100%', padding: '16px', backgroundColor: 'transparent', border: 'none', color: '#10b981', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' };

  return (
      <div style={{ backgroundColor: '#17212b', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', border: '1px solid #1e293b' }}>
        <h3 style={{marginTop:0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem'}}><span style={{fontSize: '24px'}}>💱</span> Cambiar EUR a USDC</h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#8897a7', marginBottom: '15px', alignItems: 'center' }}>
          <div>Disponible: {data.balances?.eur || '0.00'} € <button onClick={() => {setEurInput(data.balances?.eur || ''); setIsConfirming(false); setErrorMsg('');}} style={{ marginLeft: '8px', padding: '4px 8px', backgroundColor: '#242f3d', color: '#6ab3f3', border: '1px solid #2b5278', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>MAX</button></div>
          <span>Tasa: {data.rate}</span>
        </div>

        <input type="number" value={eurInput} onChange={(e) => {setEurInput(e.target.value); setIsConfirming(false); setErrorMsg('');}} style={{ width: '100%', padding: '16px', backgroundColor: '#0e1621', border: '1px solid #242f3d', color: 'white', borderRadius: '12px', marginBottom: '10px', fontSize: '16px', boxSizing: 'border-box' }} placeholder="Monto en EUR a cambiar" disabled={loading || isConfirming} />

        <div style={{ fontSize: '12px', color: '#8897a7', textAlign: 'center', marginBottom: '20px' }}>ℹ️ Nota: Binance requiere un mínimo de ~10 EUR por operación.</div>

        <div style={{backgroundColor:'#0e1621', padding:'20px', borderRadius:'16px', marginBottom:'24px', border: '1px solid #242f3d'}}>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#ef5350', marginBottom:'8px'}}><span>Comisión est. ({(data.fees?.tradingRate || 0.001) * 100}%):</span><span>- {fee.toFixed(2)} USDC</span></div>
          <div style={{display:'flex', justifyContent:'space-between', color:'#4caf50', fontSize:'18px'}}><span>Recibirás (~):</span><span style={{fontWeight:'bold'}}>{Math.max(0, netUsdc).toFixed(2)} USDC</span></div>
        </div>

        {errorMsg && <div style={{ color: '#ef5350', fontSize: '14px', textAlign: 'center', marginBottom: '16px', backgroundColor: '#450a0a', padding: '10px', borderRadius: '8px' }}>⚠️ {errorMsg}</div>}
        {successMsg && <div style={{ color: '#4caf50', fontSize: '14px', textAlign: 'center', marginBottom: '16px', fontWeight: 'bold' }}>✅ {successMsg}</div>}

        {isConfirming ? (
            <div style={{ backgroundColor: '#2d2013', border: '1px solid #ff9800', padding: '20px', borderRadius: '16px', marginBottom: '16px', textAlign: 'center' }}>
              <div style={{ color: '#ffb74d', fontWeight: 'bold', marginBottom: '12px', fontSize: '15px' }}>⚠️ POR FAVOR CONFIRMA</div>
              <div style={{ fontSize: '14px', marginBottom: '20px', color: '#f8fafc' }}>Estás a punto de cambiar <b>{eurInput} EUR</b>. Esta acción no se puede deshacer.</div>
              <button onClick={handleConfirmTrade} style={{...btnS, backgroundColor: '#d32f2f'}} disabled={loading}>{loading ? 'EJECUTANDO...' : 'SÍ, CONFIRMAR'}</button>
              <button onClick={() => setIsConfirming(false)} style={{...backBtnS, color: '#8897a7'}} disabled={loading}>CANCELAR</button>
            </div>
        ) : (
            <>
              <button onClick={handleInitiateTrade} style={btnS} disabled={loading || !eurInput || parseFloat(eurInput) <= 0}>EJECUTAR CAMBIO</button>
              <button onClick={onClose} style={backBtnS} disabled={loading}><span>⬅</span> <span>Volver al Menú</span></button>
            </>
        )}
      </div>
  );
}