import React, { useState } from 'react';

export default function Calculator({ data, onBack }: { data: any, onBack?: () => void }) {
  const [editMode, setEditMode] = useState<'ars' | 'eur'>('ars');
  const [arsAmount, setArsAmount] = useState('500000');
  const [eurAmount, setEurAmount] = useState('');
  const [showSepaDetails, setShowSepaDetails] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!data) return <div style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>Cargando mercado...</div>;

  const usdcArs = parseFloat(data.usdcArsRate) || 1121.00;
  const eurUsdc = parseFloat(data.rate) || 1.08;
  const withdrawalFee = data.fees?.withdrawalUSDC_BEP20 ?? 0.8;
  const tradingFeeRate = 0.001;
  const sepaFee = 1.00;

  const binanceIBAN = 'LT96 3230 0000 0000 0000';
  const binanceName = 'Binance Europe Services Ltd';
  const binanceBIC = 'REVOLT21XXX';
  const userEmail = localStorage.getItem('user_email') || 'tu-email@ejemplo.com';
  const sepaReference = `${userEmail} Binance Deposit`;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const copyAllSepaDetails = async () => {
    const allText = `Beneficiario: ${binanceName}
IBAN: ${binanceIBAN.replace(/\s/g, '')}
BIC/SWIFT: ${binanceBIC}
Monto: ${displayedEur.toFixed(2)} EUR
Concepto: ${sepaReference}`;

    try {
      await navigator.clipboard.writeText(allText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 3000);
    } catch { /* fallback */ }
  };

  const calcFromEur = (eur: number) => {
    const netEur = eur - sepaFee;
    if (netEur <= 0) return { usdc: 0, ars: 0 };
    const grossUsdc = netEur * eurUsdc;
    const tradingFee = grossUsdc * tradingFeeRate;
    const netUsdc = grossUsdc - tradingFee - withdrawalFee;
    return {
      usdc: Math.max(0, netUsdc),
      ars: Math.max(0, netUsdc * usdcArs)
    };
  };

  const calcFromArs = (ars: number) => {
    const usdcNeeded = ars / usdcArs;
    const usdcAfterWithdrawal = usdcNeeded + withdrawalFee;
    const eurBeforeTradeFee = usdcAfterWithdrawal / eurUsdc;
    const tradingFeeEur = eurBeforeTradeFee * tradingFeeRate;
    const totalEur = eurBeforeTradeFee + tradingFeeEur + sepaFee;
    return totalEur;
  };

  let displayedArs: number;
  let displayedEur: number;

  if (editMode === 'ars') {
    const ars = parseFloat(arsAmount) || 0;
    displayedArs = ars;
    displayedEur = calcFromArs(ars);
  } else {
    const eur = parseFloat(eurAmount) || 0;
    displayedEur = eur;
    const result = calcFromEur(eur);
    displayedArs = result.ars;
  }

  const usdcForBroker = displayedArs / usdcArs;
  const usdcAtBinance = usdcForBroker + withdrawalFee;
  const beforeTradeFee = usdcAtBinance / eurUsdc;
  const tradingFee = beforeTradeFee * tradingFeeRate;
  const remitlyEur = (displayedEur + sepaFee) * 1.10;
  const ahorro = remitlyEur - displayedEur;

  const handleArsChange = (val: string) => {
    setEditMode('ars');
    setArsAmount(val);
  };

  const handleEurChange = (val: string) => {
    setEditMode('eur');
    setEurAmount(val);
  };

  const backBtnS: React.CSSProperties = { width: '100%', padding: '16px', backgroundColor: 'transparent', border: 'none', color: '#38bdf8', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' };

  return (
    <div style={{ backgroundColor: '#17212b', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', border: '1px solid #1e293b', maxHeight: '85vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', fontSize: '1.4rem' }}><span style={{fontSize: '24px'}}>🧮</span> Calculadora</h3>

      {/* ARS Input */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>💵 Querés recibir (ARS)</label>
        <input
          type="number"
          value={editMode === 'ars' ? arsAmount : displayedArs > 0 ? displayedArs.toFixed(2) : ''}
          onChange={e => handleArsChange(e.target.value)}
          style={{
            width: '100%', padding: '16px', backgroundColor: '#0f172a', color: '#fff',
            border: editMode === 'ars' ? '2px solid #10b981' : '1px solid #334155',
            borderRadius: '12px', fontSize: '18px', fontWeight: 'bold',
            boxSizing: 'border-box'
          }}
          placeholder="Ej: 500000"
        />
      </div>

      {/* EUR Input — "Costo Final" editable */}
      <div style={{ marginBottom: '20px', backgroundColor: '#0f172a', borderRadius: '16px', padding: '16px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>💶 Costo Final (EUR)</label>
          {editMode === 'ars' && <span style={{ fontSize: '11px', color: '#38bdf8' }}>Calculado desde ARS</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#10b981', fontSize: '22px', fontWeight: 'bold' }}>€</span>
          <input
            type="number"
            value={editMode === 'eur' ? eurAmount : displayedEur > 0 ? displayedEur.toFixed(2) : ''}
            onChange={e => handleEurChange(e.target.value)}
            style={{
              flex: 1, padding: '12px', backgroundColor: 'transparent', color: '#10b981',
              border: editMode === 'eur' ? '2px solid #38bdf8' : 'none',
              borderRadius: '8px', fontSize: '24px', fontWeight: 'bold',
              boxSizing: 'border-box'
            }}
            placeholder="Calculado automáticamente"
          />
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '16px', fontSize: '14px', marginBottom: '20px', border: '1px solid #334155' }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#38bdf8', fontSize: '15px' }}>Desglose:</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8' }}><span>1. Depósito SEPA</span><span style={{ color: '#ef4444' }}>+ {sepaFee.toFixed(2)} €</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8' }}><span>2. EUR→USDC ({eurUsdc.toFixed(2)})</span><span>{beforeTradeFee.toFixed(2)} €</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8' }}><span>3. Fee Trading (0.1%)</span><span style={{ color: '#ef4444' }}>+ {tradingFee.toFixed(4)} €</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8' }}><span>4. Retiro Binance (BEP20)</span><span style={{ color: withdrawalFee === 0 ? '#10b981' : '#ef4444', fontWeight: withdrawalFee === 0 ? 'bold' : 'normal' }}>+ {withdrawalFee.toFixed(2)} USDC</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#94a3b8' }}><span>5. USDC destino ({usdcArs})</span><span>{usdcForBroker.toFixed(2)} USDC</span></div>
      </div>

      {/* Savings */}
      <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#052e16', borderRadius: '12px', border: '1px solid #10b981', marginBottom: '20px' }}>
        <span style={{ fontWeight: 'bold', color: '#34d399', fontSize: '15px' }}>🎉 AHORRO vs REMITLY: {ahorro.toFixed(2)} €</span>
      </div>

      {/* SEPA Transfer Section */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onTouchEnd={(e) => { e.preventDefault(); setShowSepaDetails(!showSepaDetails); }}
          onClick={() => setShowSepaDetails(!showSepaDetails)}
          style={{
            width: '100%', padding: '16px', backgroundColor: '#1e40af', color: '#fff',
            border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            WebkitTapHighlightColor: 'transparent', WebkitAppearance: 'none', touchAction: 'manipulation', minHeight: '52px'
          }}
        >
          🏦 Datos para transferencia SEPA
          <span style={{ fontSize: '12px', opacity: 0.8 }}>{showSepaDetails ? '▲' : '▼'}</span>
        </button>

        {showSepaDetails && (
          <div style={{ marginTop: '12px', backgroundColor: '#0e1621', borderRadius: '16px', border: '1px solid #334155', padding: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#fbbf24', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📋 Transferencia SEPA
            </h4>

            {/* Copy all button */}
            <button
              onTouchEnd={(e) => { e.preventDefault(); copyAllSepaDetails(); }}
              onClick={() => copyAllSepaDetails()}
              style={{
                width: '100%', padding: '14px', backgroundColor: copiedAll ? '#052e16' : '#334155',
                color: copiedAll ? '#10b981' : '#f8fafc',
                border: `1px solid ${copiedAll ? '#10b981' : '#475569'}`,
                borderRadius: '10px', fontSize: '14px', fontWeight: 'bold',
                cursor: 'pointer', marginBottom: '16px',
                WebkitTapHighlightColor: 'transparent', WebkitAppearance: 'none', touchAction: 'manipulation', minHeight: '48px'
              }}
            >
              {copiedAll ? '✅ ¡Copiado!' : '📋 Copiar todos los datos'}
            </button>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Beneficiario</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#f8fafc', fontSize: '14px', flex: 1 }}>{binanceName}</span>
                <button onTouchEnd={(e) => { e.preventDefault(); copyToClipboard(binanceName, 'name'); }} onClick={() => copyToClipboard(binanceName, 'name')} style={{ background: '#334155', border: 'none', color: copiedField === 'name' ? '#10b981' : '#94a3b8', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', minHeight: '36px' }}>
                  {copiedField === 'name' ? '✅' : '📋'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>IBAN</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#f8fafc', fontSize: '14px', fontFamily: 'monospace', flex: 1 }}>{binanceIBAN}</span>
                <button onTouchEnd={(e) => { e.preventDefault(); copyToClipboard(binanceIBAN.replace(/\s/g, ''), 'iban'); }} onClick={() => copyToClipboard(binanceIBAN.replace(/\s/g, ''), 'iban')} style={{ background: '#334155', border: 'none', color: copiedField === 'iban' ? '#10b981' : '#94a3b8', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', minHeight: '36px' }}>
                  {copiedField === 'iban' ? '✅' : '📋'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>BIC/SWIFT</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#f8fafc', fontSize: '14px', fontFamily: 'monospace', flex: 1 }}>{binanceBIC}</span>
                <button onTouchEnd={(e) => { e.preventDefault(); copyToClipboard(binanceBIC, 'bic'); }} onClick={() => copyToClipboard(binanceBIC, 'bic')} style={{ background: '#334155', border: 'none', color: copiedField === 'bic' ? '#10b981' : '#94a3b8', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', minHeight: '36px' }}>
                  {copiedField === 'bic' ? '✅' : '📋'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Monto</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981', fontSize: '18px', fontWeight: 'bold', flex: 1 }}>{displayedEur.toFixed(2)} EUR</span>
                <button onTouchEnd={(e) => { e.preventDefault(); copyToClipboard(displayedEur.toFixed(2), 'amount'); }} onClick={() => copyToClipboard(displayedEur.toFixed(2), 'amount')} style={{ background: '#334155', border: 'none', color: copiedField === 'amount' ? '#10b981' : '#94a3b8', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', minHeight: '36px' }}>
                  {copiedField === 'amount' ? '✅' : '📋'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Concepto / Referencia</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#fbbf24', fontSize: '13px', fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>{sepaReference}</span>
                <button onTouchEnd={(e) => { e.preventDefault(); copyToClipboard(sepaReference, 'ref'); }} onClick={() => copyToClipboard(sepaReference, 'ref')} style={{ background: '#334155', border: 'none', color: copiedField === 'ref' ? '#10b981' : '#94a3b8', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', minHeight: '36px' }}>
                  {copiedField === 'ref' ? '✅' : '📋'}
                </button>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', lineHeight: '1.5', marginTop: '12px' }}>
              ⚠️ Usá solo transferencia <b>SEPA</b> (no SWIFT). El nombre de tu banco debe coincidir con tu cuenta Binance.
            </div>
          </div>
        )}
      </div>

      {onBack && <button onTouchEnd={(e) => { e.preventDefault(); onBack(); }} onClick={onBack} style={backBtnS}><span>⬅</span> <span>Volver al Menú</span></button>}
    </div>
  );
}
