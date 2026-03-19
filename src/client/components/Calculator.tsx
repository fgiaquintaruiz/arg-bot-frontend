import React, { useState } from 'react';

export default function Calculator({ data, onBack }: { data: any, onBack?: () => void }) {
  const [arsAmount, setArsAmount] = useState('500000');
  if (!data) return <div style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>Cargando mercado...</div>;

  const ars = parseFloat(arsAmount) || 0;
  const usdcArs = parseFloat(data.usdcArsRate) || 1121.00;
  const eurUsdc = parseFloat(data.rate) || 1.08;
  const withdrawalFee = data.fees?.withdrawalUSDC_BEP20 ?? 0.8; 
  const tradingFeeRate = 0.001;
  const sepaFee = 1.00;

  const usdcForBroker = ars / usdcArs;
  const usdcAtBinance = usdcForBroker + withdrawalFee;
  const eurBeforeTradeFee = usdcAtBinance / eurUsdc;
  const tradingFeeEur = eurBeforeTradeFee * tradingFeeRate;
  const eurToDeposit = eurBeforeTradeFee + tradingFeeEur;
  const eurTotal = eurToDeposit + sepaFee;

  const remitlyEur = eurTotal * 1.10;
  const ahorro = remitlyEur - eurTotal;

  const backBtnS: React.CSSProperties = { width: '100%', padding: '16px', backgroundColor: 'transparent', border: 'none', color: '#38bdf8', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' };

  return (
    <div style={{ backgroundColor: '#17212b', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', border: '1px solid #1e293b' }}>
      <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', fontSize: '1.4rem' }}><span style={{fontSize: '24px'}}>🧮</span> Calculadora</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Monto a recibir en destino (ARS)</label>
        <input type="number" value={arsAmount} onChange={e => setArsAmount(e.target.value)} style={{ width: '100%', padding: '16px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '12px', fontSize: '16px', boxSizing: 'border-box' }} />
      </div>

      <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '16px', fontSize: '14px', marginBottom: '20px', border: '1px solid #334155' }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#38bdf8', fontSize: '15px' }}>Desglose de la operación:</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8' }}><span>1. Depósito SEPA Binance</span><span style={{ color: '#ef4444' }}>+ {sepaFee.toFixed(2)} EUR</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8' }}><span>2. EUR para comprar USDC ({eurUsdc})</span><span>{eurBeforeTradeFee.toFixed(2)} EUR</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8' }}><span>3. Fee Trading (0.1% Spot)</span><span style={{ color: '#ef4444' }}>+ {tradingFeeEur.toFixed(4)} EUR</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8' }}><span>4. Retiro Binance (BEP20)</span><span style={{ color: withdrawalFee === 0 ? '#10b981' : '#ef4444', fontWeight: withdrawalFee === 0 ? 'bold' : 'normal' }}>+ {withdrawalFee.toFixed(2)} USDC</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#94a3b8' }}><span>5. USDC destino (Tasa: {usdcArs})</span><span>{usdcForBroker.toFixed(2)} USDC</span></div>
        <div style={{ borderTop: '1px dashed #334155', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span style={{color: '#f8fafc'}}>Costo Final:</span><span style={{ color: '#10b981', fontSize: '18px' }}>{eurTotal.toFixed(2)} €</span></div>
      </div>

      <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#052e16', borderRadius: '12px', border: '1px solid #10b981', marginBottom: '24px' }}>
        <span style={{ fontWeight: 'bold', color: '#34d399', fontSize: '15px' }}>🎉 AHORRO vs REMITLY: {ahorro.toFixed(2)} €</span>
      </div>

      {onBack && <button onClick={onBack} style={backBtnS}><span>⬅</span> <span>Volver al Menú</span></button>}
    </div>
  );
}
