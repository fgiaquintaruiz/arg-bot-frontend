import React, { useState } from 'react';

export default function Calculator({ data, onBack }: { data: any, onBack?: () => void }) {
  const [editMode, setEditMode] = useState<'ars' | 'eur'>('ars');
  const [arsAmount, setArsAmount] = useState('500000');
  const [eurAmount, setEurAmount] = useState('');
  const [showSepaDetails, setShowSepaDetails] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [tryingBankApp, setTryingBankApp] = useState(false);
  const [bankAppFailed, setBankAppFailed] = useState(false);

  if (!data) return <div style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>Cargando mercado...</div>;

  const usdcArs = parseFloat(data.usdcArsRate) || 1121.00;
  const eurUsdc = parseFloat(data.rate) || 1.08;
  const withdrawalFee = data.fees?.withdrawalUSDC_BEP20 ?? 0.8;
  const tradingFeeRate = 0.001;
  const sepaFee = 1.00;

  // User-configurable Binance EUR deposit details (saved to localStorage)
  const binanceIBAN = localStorage.getItem('binance_eur_iban') || '';
  const binanceName = localStorage.getItem('binance_eur_name') || 'Binance Europe Services Ltd';
  const binanceBIC = localStorage.getItem('binance_eur_bic') || 'REVOLT21XXX';
  const binanceBank = localStorage.getItem('binance_bank_name') || '';
  const binanceBankAddr = localStorage.getItem('binance_bank_address') || '';
  const userEmail = localStorage.getItem('user_email') || '';
  const sepaReference = userEmail ? `${userEmail} Binance Deposit` : 'Deposito ARGBOT';

  // Show warning if user hasn't configured their Binance EUR deposit account
  const needsIbanConfig = !binanceIBAN;

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
    if (!binanceIBAN) return;
    let allText = `Beneficiario: ${binanceName}\nIBAN: ${binanceIBAN.replace(/\s/g, '')}\nBIC/SWIFT: ${binanceBIC}`;
    if (binanceBank) allText += `\nBanco: ${binanceBank}`;
    if (binanceBankAddr) allText += `\nDirección: ${binanceBankAddr}`;
    allText += `\nMonto: ${displayedEur.toFixed(2)} EUR\nConcepto: ${sepaReference}`;
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
    return { usdc: Math.max(0, netUsdc), ars: Math.max(0, netUsdc * usdcArs) };
  };

  const calcFromArs = (ars: number) => {
    const usdcNeeded = ars / usdcArs;
    const usdcAfterWithdrawal = usdcNeeded + withdrawalFee;
    const eurBeforeTradeFee = usdcAfterWithdrawal / eurUsdc;
    const tradingFeeEur = eurBeforeTradeFee * tradingFeeRate;
    return eurBeforeTradeFee + tradingFeeEur + sepaFee;
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

  const handleArsChange = (val: string) => { setEditMode('ars'); setArsAmount(val); };
  const handleEurChange = (val: string) => { setEditMode('eur'); setEurAmount(val); };

  // Try to open bank app with payto: URI
  const openBankApp = () => {
    if (!binanceIBAN) {
      setShowSepaDetails(true);
      return;
    }

    setTryingBankApp(true);
    setBankAppFailed(false);

    const iban = binanceIBAN.replace(/\s/g, '');
    const amount = displayedEur.toFixed(2);
    const concept = sepaReference;

    /**
     * payto: URI — estándar europeo para pagos SEPA
     * Formato: payto:IBAN?amount=X.XX&message=Concepto
     *
     * Qué hace: intenta abrir tu app bancaria con los datos pre-rellenados
     * Qué NO hace: no procesa el pago automáticamente (vos confirmás en tu banco)
     *
     * Soporte: funciona con algunos bancos europeos que adoptaron el estándar.
     * Si tu banco no lo soporta, se muestra un mensaje con los datos para copiar.
     */
    const paytoUri = `payto:${iban}?amount=${amount}&message=${encodeURIComponent(concept)}`;

    let appOpened = false;
    const handleVisibility = () => {
      if (document.hidden) {
        appOpened = true;
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    window.location.href = paytoUri;

    setTimeout(() => {
      document.removeEventListener('visibilitychange', handleVisibility);
      setTryingBankApp(false);
      if (!appOpened) {
        setBankAppFailed(true);
      }
    }, 3000);
  };

  const backBtnS: React.CSSProperties = { width: '100%', padding: '16px', backgroundColor: 'transparent', border: 'none', color: '#38bdf8', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' };

  return (
    <div style={{ backgroundColor: '#17212b', padding: '24px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', border: '1px solid #1e293b', maxHeight: '85vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', fontSize: '1.3rem' }}><span style={{fontSize: '22px'}}>🧮</span> Calculadora</h3>

      {/* Binance EUR account warning */}
      {needsIbanConfig && (
        <div style={{ backgroundColor: '#451a03', border: '1px solid #78350f', borderRadius: '12px', padding: '12px', marginBottom: '16px', textAlign: 'center' }}>
          <span style={{ color: '#fbbf24', fontSize: '12px' }}>
            ⚠️ Configurá tu IBAN de depósito EUR de Binance en ⚙️ Configuración para usar la transferencia automática.
          </span>
        </div>
      )}

      {/* ARS Input */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>💵 Querés recibir (ARS)</label>
        <input
          type="number"
          value={editMode === 'ars' ? arsAmount : displayedArs > 0 ? displayedArs.toFixed(2) : ''}
          onChange={e => handleArsChange(e.target.value)}
          style={{
            width: '100%', padding: '14px', backgroundColor: '#0f172a', color: '#fff',
            border: editMode === 'ars' ? '2px solid #10b981' : '1px solid #334155',
            borderRadius: '12px', fontSize: '16px', fontWeight: 'bold',
            boxSizing: 'border-box'
          }}
          placeholder="Ej: 500000"
        />
      </div>

      {/* EUR "Costo Final" */}
      <div style={{ marginBottom: '16px', backgroundColor: '#0f172a', borderRadius: '12px', padding: '14px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ fontSize: '12px', color: '#94a3b8' }}>💶 Costo Final</label>
          {editMode === 'ars' && <span style={{ fontSize: '10px', color: '#38bdf8' }}>Calculado</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#10b981', fontSize: '18px', fontWeight: 'bold', flexShrink: 0 }}>€</span>
          <input
            type="number"
            value={editMode === 'eur' ? eurAmount : displayedEur > 0 ? displayedEur.toFixed(2) : ''}
            onChange={e => handleEurChange(e.target.value)}
            style={{
              width: '100%', padding: '10px 8px', backgroundColor: 'transparent', color: '#10b981',
              border: editMode === 'eur' ? '2px solid #38bdf8' : 'none',
              borderRadius: '8px', fontSize: '20px', fontWeight: 'bold',
              boxSizing: 'border-box', minWidth: 0
            }}
            placeholder="Calculado"
          />
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '12px', fontSize: '13px', marginBottom: '16px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#94a3b8' }}><span>1. Depósito SEPA</span><span style={{ color: '#ef4444' }}>+ {sepaFee.toFixed(2)} €</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#94a3b8' }}><span>2. EUR→USDC ({eurUsdc.toFixed(2)})</span><span>{beforeTradeFee.toFixed(2)} €</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#94a3b8' }}><span>3. Fee Trading (0.1%)</span><span style={{ color: '#ef4444' }}>+ {tradingFee.toFixed(4)} €</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#94a3b8' }}><span>4. Retiro Binance (BEP20)</span><span>+ {withdrawalFee.toFixed(2)} USDC</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#94a3b8' }}><span>5. USDC destino ({usdcArs})</span><span>{usdcForBroker.toFixed(2)} USDC</span></div>
      </div>

      {/* Savings */}
      <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#052e16', borderRadius: '10px', border: '1px solid #10b981', marginBottom: '16px' }}>
        <span style={{ fontWeight: 'bold', color: '#34d399', fontSize: '14px' }}>🎉 AHORRO vs REMITLY: {ahorro.toFixed(2)} €</span>
      </div>

      {/* SEPA Transfer Section */}
      <div style={{ marginBottom: '16px' }}>
        {/* Button 1: Try to open bank app */}
        <button
          onTouchEnd={(e) => { e.preventDefault(); openBankApp(); }}
          onClick={() => openBankApp()}
          disabled={tryingBankApp}
          style={{
            width: '100%', padding: '14px',
            backgroundColor: tryingBankApp ? '#059669' : '#10b981',
            color: '#fff', border: 'none', borderRadius: '12px',
            fontSize: '15px', fontWeight: 'bold', cursor: tryingBankApp ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginBottom: '10px', minHeight: '48px'
          }}
        >
          {tryingBankApp ? (
            <>
              <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}>⏳</span>
              Abriendo tu banco...
            </>
          ) : (
            <>📱 Abrir app del banco</>
          )}
        </button>

        {/* Button 2: Show details to copy */}
        <button
          onTouchEnd={(e) => { e.preventDefault(); setShowSepaDetails(!showSepaDetails); }}
          onClick={() => setShowSepaDetails(!showSepaDetails)}
          style={{
            width: '100%', padding: '14px', backgroundColor: '#1e40af', color: '#fff',
            border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginBottom: '0px', minHeight: '48px'
          }}
        >
          📋 Ver datos para copiar
          <span style={{ fontSize: '11px', opacity: 0.8 }}>{showSepaDetails ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Inline message if bank app failed (replaces ugly alert) */}
      {bankAppFailed && (
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
          <div style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
            ℹ️ Tu banco no abrió automáticamente
          </div>
          <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.5', marginBottom: '10px' }}>
            El formato <code style={{ backgroundColor: '#334155', padding: '2px 6px', borderRadius: '4px' }}>payto:</code> es un estándar europeo que algunos bancos soportan para pre-rellenar transferencias. Si tu banco no lo soporta aún, podés copiar los datos tocando el botón azul de arriba 👆.
          </div>
          <button
            onClick={() => { setBankAppFailed(false); setShowSepaDetails(true); }}
            style={{ width: '100%', padding: '10px', backgroundColor: '#334155', color: '#f8fafc', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            👆 Mostrar datos para copiar
          </button>
        </div>
      )}

      {/* SEPA Details (expandable) */}
      {showSepaDetails && (
        <div style={{ backgroundColor: '#0e1621', borderRadius: '12px', border: '1px solid #334155', padding: '16px', marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#fbbf24', fontSize: '13px' }}>📋 Datos de transferencia</h4>

          {/* Copy all */}
          {binanceIBAN && (
            <button
              onTouchEnd={(e) => { e.preventDefault(); copyAllSepaDetails(); }}
              onClick={() => copyAllSepaDetails()}
              style={{
                width: '100%', padding: '12px', backgroundColor: copiedAll ? '#052e16' : '#334155',
                color: copiedAll ? '#10b981' : '#f8fafc',
                border: `1px solid ${copiedAll ? '#10b981' : '#475569'}`,
                borderRadius: '8px', fontSize: '13px', fontWeight: 'bold',
                cursor: 'pointer', marginBottom: '12px', minHeight: '44px'
              }}
            >
              {copiedAll ? '✅ ¡Copiado!' : '📋 Copiar todos los datos'}
            </button>
          )}

          {binanceIBAN ? (
            <>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Beneficiario</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#f8fafc', fontSize: '13px', flex: 1 }}>{binanceName}</span>
                  <button onClick={() => copyToClipboard(binanceName, 'name')} style={{ background: '#334155', border: 'none', color: copiedField === 'name' ? '#10b981' : '#94a3b8', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer', minHeight: '32px' }}>
                    {copiedField === 'name' ? '✅' : '📋'}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>IBAN</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#f8fafc', fontSize: '13px', fontFamily: 'monospace', flex: 1 }}>{binanceIBAN}</span>
                  <button onClick={() => copyToClipboard(binanceIBAN.replace(/\s/g, ''), 'iban')} style={{ background: '#334155', border: 'none', color: copiedField === 'iban' ? '#10b981' : '#94a3b8', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer', minHeight: '32px' }}>
                    {copiedField === 'iban' ? '✅' : '📋'}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>BIC/SWIFT</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#f8fafc', fontSize: '13px', fontFamily: 'monospace', flex: 1 }}>{binanceBIC}</span>
                  <button onClick={() => copyToClipboard(binanceBIC, 'bic')} style={{ background: '#334155', border: 'none', color: copiedField === 'bic' ? '#10b981' : '#94a3b8', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer', minHeight: '32px' }}>
                    {copiedField === 'bic' ? '✅' : '📋'}
                  </button>
                </div>
              </div>
              {binanceBank && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Banco</div>
                  <div style={{ color: '#f8fafc', fontSize: '13px' }}>{binanceBank}</div>
                </div>
              )}
              {binanceBankAddr && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Dirección del banco</div>
                  <div style={{ color: '#f8fafc', fontSize: '13px' }}>{binanceBankAddr}</div>
                </div>
              )}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Monto</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold', flex: 1 }}>{displayedEur.toFixed(2)} EUR</span>
                  <button onClick={() => copyToClipboard(displayedEur.toFixed(2), 'amount')} style={{ background: '#334155', border: 'none', color: copiedField === 'amount' ? '#10b981' : '#94a3b8', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer', minHeight: '32px' }}>
                    {copiedField === 'amount' ? '✅' : '📋'}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Concepto</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#fbbf24', fontSize: '12px', fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>{sepaReference}</span>
                  <button onClick={() => copyToClipboard(sepaReference, 'ref')} style={{ background: '#334155', border: 'none', color: copiedField === 'ref' ? '#10b981' : '#94a3b8', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer', minHeight: '32px' }}>
                    {copiedField === 'ref' ? '✅' : '📋'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '13px' }}>
              ⚙️ Configurá tu IBAN de Binance en <b>⚙️ Configuración</b> para ver los datos aquí.
            </div>
          )}

          <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', marginTop: '8px' }}>
            ⚠️ Solo transferencia <b>SEPA</b> (no SWIFT)
          </div>
        </div>
      )}

      {onBack && <button onTouchEnd={(e) => { e.preventDefault(); onBack(); }} onClick={onBack} style={backBtnS}><span>⬅</span> <span>Volver al Menú</span></button>}

      {/* Spinner animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
