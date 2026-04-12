import React, { useState } from 'react';

export default function Calculator({ data, onBack }: { data: any, onBack?: () => void }) {
  const [arsAmount, setArsAmount] = useState('500000');
  const [sourceCurrency, setSourceCurrency] = useState<'EUR' | 'USD'>('EUR');
  const [showSepaDetails, setShowSepaDetails] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!data) return <div style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>Cargando mercado...</div>;

  const ars = parseFloat(arsAmount) || 0;
  const usdcArs = parseFloat(data.usdcArsRate) || 1121.00;
  const eurUsdc = parseFloat(data.rate) || 1.08;
  const usdUsdc = 1.00; // USD→USDC is ~1:1
  const withdrawalFee = data.fees?.withdrawalUSDC_BEP20 ?? 0.8;
  const tradingFeeRate = 0.001;
  const sepaFee = 1.00;
  const swiftFee = 3.00;

  const isEUR = sourceCurrency === 'EUR';
  const stablecoinRate = isEUR ? eurUsdc : usdUsdc;
  const depositFee = isEUR ? sepaFee : swiftFee;
  const depositLabel = isEUR ? 'Depósito SEPA Binance' : 'Depósito USD a Binance';

  const usdcForBroker = ars / usdcArs;
  const usdcAtBinance = usdcForBroker + withdrawalFee;
  const beforeTradeFee = usdcAtBinance / stablecoinRate;
  const tradingFee = beforeTradeFee * tradingFeeRate;
  const toDeposit = beforeTradeFee + tradingFee;
  const totalCost = toDeposit + depositFee;
  const eurToDeposit = isEUR ? totalCost : totalCost; // For USD, same concept

  const remitlyEur = totalCost * 1.10;
  const ahorro = remitlyEur - totalCost;

  // Binance Europe SEPA deposit details
  const binanceIBAN = 'LT96 3230 0000 0000 0000'; // Binance EU IBAN (user should verify in their Binance app)
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
      // Fallback for older browsers
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

  // Generate payto: URI for Santander and other banking apps
  const paytoUri = `payto:${binanceIBAN.replace(/\s/g, '')}?amount=${eurToDeposit.toFixed(2)}&message=${encodeURIComponent(sepaReference)}`;

  const backBtnS: React.CSSProperties = { width: '100%', padding: '16px', backgroundColor: 'transparent', border: 'none', color: '#38bdf8', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' };

  return (
    <div style={{ backgroundColor: '#17212b', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', border: '1px solid #1e293b' }}>
      <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', fontSize: '1.4rem' }}><span style={{fontSize: '24px'}}>🧮</span> Calculadora</h3>

      {/* Currency Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setSourceCurrency('EUR')}
          style={{
            flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold',
            cursor: 'pointer', border: '2px solid',
            backgroundColor: isEUR ? '#1e293b' : '#0e1621',
            borderColor: isEUR ? '#38bdf8' : '#334155',
            color: isEUR ? '#38bdf8' : '#64748b'
          }}
        >
          🇪🇺 EUR
        </button>
        <button
          onClick={() => setSourceCurrency('USD')}
          style={{
            flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold',
            cursor: 'pointer', border: '2px solid',
            backgroundColor: !isEUR ? '#1e293b' : '#0e1621',
            borderColor: !isEUR ? '#22c55e' : '#334155',
            color: !isEUR ? '#22c55e' : '#64748b'
          }}
        >
          🇺🇸 USD
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Monto a recibir en destino (ARS)</label>
        <input type="number" value={arsAmount} onChange={e => setArsAmount(e.target.value)} style={{ width: '100%', padding: '16px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '12px', fontSize: '16px', boxSizing: 'border-box' }} />
      </div>

      <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '16px', fontSize: '14px', marginBottom: '20px', border: '1px solid #334155' }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#38bdf8', fontSize: '15px' }}>Desglose de la operación:</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8' }}><span>1. {depositLabel}</span><span style={{ color: '#ef4444' }}>+ {depositFee.toFixed(2)} {isEUR ? 'EUR' : 'USD'}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8' }}><span>2. {isEUR ? 'EUR' : 'USD'} para comprar USDC ({stablecoinRate.toFixed(2)})</span><span>{beforeTradeFee.toFixed(2)} {isEUR ? 'EUR' : 'USD'}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8' }}><span>3. Fee Trading (0.1% Spot)</span><span style={{ color: '#ef4444' }}>+ {tradingFee.toFixed(4)} {isEUR ? 'EUR' : 'USD'}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8' }}><span>4. Retiro Binance (BEP20)</span><span style={{ color: withdrawalFee === 0 ? '#10b981' : '#ef4444', fontWeight: withdrawalFee === 0 ? 'bold' : 'normal' }}>+ {withdrawalFee.toFixed(2)} USDC</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#94a3b8' }}><span>5. USDC destino (Tasa: {usdcArs})</span><span>{usdcForBroker.toFixed(2)} USDC</span></div>
        <div style={{ borderTop: '1px dashed #334155', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span style={{color: '#f8fafc'}}>Costo Final:</span><span style={{ color: '#10b981', fontSize: '18px' }}>{totalCost.toFixed(2)} {isEUR ? '€' : 'US$'}</span></div>
      </div>

      {isEUR && (
        <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#052e16', borderRadius: '12px', border: '1px solid #10b981', marginBottom: '24px' }}>
          <span style={{ fontWeight: 'bold', color: '#34d399', fontSize: '15px' }}>🎉 AHORRO vs REMITLY: {ahorro.toFixed(2)} €</span>
        </div>
      )}

      {/* SEPA Transfer Button — EUR only */}
      {isEUR && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setShowSepaDetails(!showSepaDetails)}
            style={{
              width: '100%', padding: '16px', backgroundColor: '#1e40af', color: '#fff',
              border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}
          >
            🏦 Transferir {eurToDeposit.toFixed(2)} € desde mi banco
            <span style={{ fontSize: '12px', opacity: 0.8 }}>{showSepaDetails ? '▲' : '▼'}</span>
          </button>

          {showSepaDetails && (
            <div style={{ marginTop: '12px', backgroundColor: '#0e1621', borderRadius: '16px', border: '1px solid #334155', padding: '20px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#fbbf24', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📋 Datos para Transferencia SEPA
              </h4>

              {/* IBAN */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Beneficiario</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#f8fafc', fontSize: '14px', flex: 1 }}>{binanceName}</span>
                  <button onClick={() => copyToClipboard(binanceName, 'name')} style={{ background: '#334155', border: 'none', color: copiedField === 'name' ? '#10b981' : '#94a3b8', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {copiedField === 'name' ? '✅' : '📋'}
                  </button>
                </div>
              </div>

              {/* IBAN */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>IBAN</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#f8fafc', fontSize: '14px', fontFamily: 'monospace', flex: 1 }}>{binanceIBAN}</span>
                  <button onClick={() => copyToClipboard(binanceIBAN.replace(/\s/g, ''), 'iban')} style={{ background: '#334155', border: 'none', color: copiedField === 'iban' ? '#10b981' : '#94a3b8', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {copiedField === 'iban' ? '✅' : '📋'}
                  </button>
                </div>
              </div>

              {/* BIC/SWIFT */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>BIC/SWIFT</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#f8fafc', fontSize: '14px', fontFamily: 'monospace', flex: 1 }}>{binanceBIC}</span>
                  <button onClick={() => copyToClipboard(binanceBIC, 'bic')} style={{ background: '#334155', border: 'none', color: copiedField === 'bic' ? '#10b981' : '#94a3b8', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {copiedField === 'bic' ? '✅' : '📋'}
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Monto a enviar</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontSize: '18px', fontWeight: 'bold', flex: 1 }}>{eurToDeposit.toFixed(2)} EUR</span>
                  <button onClick={() => copyToClipboard(eurToDeposit.toFixed(2), 'amount')} style={{ background: '#334155', border: 'none', color: copiedField === 'amount' ? '#10b981' : '#94a3b8', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {copiedField === 'amount' ? '✅' : '📋'}
                  </button>
                </div>
              </div>

              {/* Reference */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Concepto / Referencia</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#fbbf24', fontSize: '13px', fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>{sepaReference}</span>
                  <button onClick={() => copyToClipboard(sepaReference, 'ref')} style={{ background: '#334155', border: 'none', color: copiedField === 'ref' ? '#10b981' : '#94a3b8', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {copiedField === 'ref' ? '✅' : '📋'}
                  </button>
                </div>
              </div>

              {/* payto: URI button */}
              <a
                href={paytoUri}
                style={{
                  display: 'block', width: '100%', padding: '14px', backgroundColor: '#10b981', color: '#fff',
                  border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold',
                  textDecoration: 'none', textAlign: 'center', marginBottom: '8px', cursor: 'pointer'
                }}
                onClick={(e) => {
                  // If payto: doesn't work on this device, show a note
                  if (!/android|iphone|ipad/i.test(navigator.userAgent)) {
                    e.preventDefault();
                    alert('En tu celular, tocá este botón desde la app de tu banco (Santander, BBVA, etc.) para que se autocomplete la transferencia.');
                  }
                }}
              >
                📱 Abrir app del banco (Santander, BBVA, etc.)
              </a>

              <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', lineHeight: '1.5' }}>
                ⚠️ Usá solo transferencia <b>SEPA</b> (no SWIFT). El nombre del banco debe coincidir con tu cuenta Binance.
              </div>
            </div>
          )}
        </div>
      )}

      {onBack && <button onClick={onBack} style={backBtnS}><span>⬅</span> <span>Volver al Menú</span></button>}
    </div>
  );
}
