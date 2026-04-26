import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function Calculator({ data, onBack }: { data: any, onBack?: () => void }) {
  const [editMode, setEditMode] = useState<'ars' | 'eur'>('ars');
  const [arsAmount, setArsAmount] = useState('500000');
  const [eurAmount, setEurAmount] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!data) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#848E9C', fontSize: '14px' }}>
      Cargando tasas de mercado...
    </div>
  );

  const usdcArs = parseFloat(data.ripioUsdcArsRate) || 1482.00;
  const eurUsdc = parseFloat(data.rate) || 1.08;
  const withdrawalFee = data.fees?.withdrawalUSDC_BEP20 ?? 0.8;
  const tradingFeeRate = 0.001;
  const sepaFee = 1.00;

  const binanceIBAN = localStorage.getItem('binance_eur_iban') || '';
  const binanceName = localStorage.getItem('binance_eur_name') || 'Binance Europe Services Ltd';
  const binanceBIC = localStorage.getItem('binance_eur_bic') || 'REVOLT21XXX';
  const binanceBank = localStorage.getItem('binance_bank_name') || '';
  const binanceBankAddr = localStorage.getItem('binance_bank_address') || '';
  const userEmail = localStorage.getItem('user_email') || '';
  const sepaReference = userEmail ? `${userEmail} Binance Deposit` : 'Deposito ARGBOT';
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
    /* v8 ignore start */
    if (!binanceIBAN) return;
    /* v8 ignore end */
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
    if (eur <= 0) return { usdc: 0, ars: 0 };
    const ars = eur * eurUsdc * usdcArs;
    const grossUsdc = eur * eurUsdc;
    const tradingFee = grossUsdc * tradingFeeRate;
    const netUsdc = Math.max(0, grossUsdc - tradingFee - withdrawalFee);
    return { usdc: netUsdc, ars };
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

  const handleArsChange = (val: string) => { setEditMode('ars'); setArsAmount(val); };
  const handleEurChange = (val: string) => { setEditMode('eur'); setEurAmount(val); };

  const openSettings = () => window.dispatchEvent(new CustomEvent('open-settings', { detail: { tab: 'binance' } }));

  // ─── shared micro styles ───
  const copyBtn = (field: string): React.CSSProperties => ({
    background: '#2B3139',
    border: 'none',
    color: copiedField === field ? '#0ECB81' : '#848E9C',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '11px',
    cursor: 'pointer',
    minHeight: '32px',
    fontFamily: "'IBM Plex Sans', sans-serif",
  });

  const rowLabel: React.CSSProperties = {
    fontSize: '11px',
    color: '#474D57',
    marginBottom: '3px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.4px',
  };

  return (
    <div style={{
      backgroundColor: '#1E2329',
      borderRadius: '12px',
      border: '1px solid #2B3139',
    }}>

      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #2B3139',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span style={{ fontSize: '18px' }}>🧮</span>
        <h3 style={{ margin: 0, color: '#EAECEF', fontSize: '1rem', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          Calculadora
        </h3>
      </div>

      <div style={{ padding: '20px' }}>

        {/* IBAN warning */}
        {needsIbanConfig && (
          <div style={{
            backgroundColor: 'rgba(240,185,11,0.08)',
            border: '1px solid rgba(240,185,11,0.2)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#F0B90B',
            display: 'flex',
            gap: '6px',
            alignItems: 'flex-start',
          }}>
            <span>⚠️</span>
            <span>
              Configurá tu IBAN de Binance en{' '}
              <span
                onClick={openSettings}
                onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); openSettings(); }}
                style={{ color: '#F0B90B', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
              >
                Configuración → Binance
              </span>
            </span>
          </div>
        )}

        {/* ARS Input */}
        <div style={{ marginBottom: '12px' }}>
          <label style={rowLabel}>Querés recibir (ARS)</label>
          <input
            type="number"
            value={editMode === 'ars' ? arsAmount : displayedArs > 0 ? Math.round(displayedArs).toLocaleString('es-AR') : ''}
            onChange={e => handleArsChange(e.target.value)}
            style={{
              width: '100%',
              padding: '13px 14px',
              backgroundColor: '#181A20',
              color: '#EAECEF',
              border: editMode === 'ars' ? '1px solid #F0B90B' : '1px solid #2B3139',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              boxSizing: 'border-box',
              fontFamily: "'IBM Plex Mono', monospace",
              outline: 'none',
            }}
            placeholder="500000"
          />
        </div>

        {/* EUR Costo Final */}
        <div style={{
          marginBottom: '16px',
          backgroundColor: '#181A20',
          borderRadius: '8px',
          padding: '12px 14px',
          border: editMode === 'eur' ? '1px solid #F0B90B' : '1px solid #2B3139',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={rowLabel}>Costo Final (EUR)</label>
            {editMode === 'ars' && <span style={{ fontSize: '10px', color: '#F0B90B', fontWeight: 500 }}>Calculado</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#0ECB81', fontSize: '20px', fontWeight: 700, flexShrink: 0, fontFamily: "'IBM Plex Mono', monospace" }}>€</span>
            <input
              type="number"
              value={editMode === 'eur' ? eurAmount : displayedEur > 0 ? displayedEur.toFixed(2) : ''}
              onChange={e => handleEurChange(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 0',
                backgroundColor: 'transparent',
                color: '#0ECB81',
                border: 'none',
                fontSize: '22px',
                fontWeight: 700,
                boxSizing: 'border-box',
                minWidth: 0,
                outline: 'none',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Breakdown */}
        <div style={{
          backgroundColor: '#181A20',
          padding: '14px',
          borderRadius: '8px',
          fontSize: '13px',
          marginBottom: '14px',
          border: '1px solid #2B3139',
        }}>
          {[
            { label: 'Depósito SEPA', value: `+ ${sepaFee.toFixed(2)} €`, danger: true },
            { label: `EUR→USDC (${eurUsdc.toFixed(4)})`, value: `${beforeTradeFee.toFixed(2)} €`, danger: false },
            { label: 'Fee trading (0.1%)', value: `+ ${tradingFee.toFixed(4)} €`, danger: true },
            { label: 'Retiro Binance BEP20', value: `+ ${withdrawalFee.toFixed(2)} USDC`, danger: false },
            { label: `USDC destino (${usdcArs.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`, value: `${usdcForBroker.toFixed(2)} USDC`, danger: false },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: i < 4 ? '8px' : 0,
              alignItems: 'center',
            }}>
              <span style={{ color: '#848E9C', fontSize: '12px' }}>{row.label}</span>
              <span style={{
                color: row.danger ? '#F6465D' : '#EAECEF',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '12px',
                fontWeight: 500,
              }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* SEPA Details panel — siempre visible */}
        <div style={{
          backgroundColor: '#181A20',
          borderRadius: '8px',
          border: '1px solid #2B3139',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <p style={{ margin: '0 0 12px', color: '#848E9C', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Datos de transferencia SEPA
          </p>

          {binanceIBAN ? (
            <>
              <button
                onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); copyAllSepaDetails(); }}
                onClick={copyAllSepaDetails}
                style={{
                  width: '100%',
                  padding: '11px',
                  backgroundColor: copiedAll ? 'rgba(14,203,129,0.1)' : '#2B3139',
                  color: copiedAll ? '#0ECB81' : '#EAECEF',
                  border: `1px solid ${copiedAll ? 'rgba(14,203,129,0.3)' : '#474D57'}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '14px',
                  minHeight: '44px',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                {copiedAll ? '✅ Copiado' : 'Copiar todos los datos'}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'IBAN', value: binanceIBAN, copyVal: binanceIBAN.replace(/\s/g, ''), field: 'iban', mono: true },
                  { label: 'Beneficiario', value: binanceName, field: 'name', mono: false },
                  { label: 'BIC / SWIFT', value: binanceBIC, field: 'bic', mono: true },
                  ...(binanceBank ? [{ label: 'Banco', value: binanceBank, field: 'bank', mono: false }] : []),
                  ...(binanceBankAddr ? [{ label: 'Dirección del banco', value: binanceBankAddr, field: 'addr', mono: false }] : []),
                ].map((row: any) => (
                  <div key={row.field}>
                    <div style={rowLabel}>{row.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        color: '#EAECEF',
                        fontSize: '13px',
                        flex: 1,
                        fontFamily: row.mono ? "'IBM Plex Mono', monospace" : "'IBM Plex Sans', sans-serif",
                        wordBreak: 'break-all',
                      }}>{row.value}</span>
                      <button
                        onClick={() => copyToClipboard(row.copyVal ?? row.value, row.field)}
                        style={copyBtn(row.field)}
                      >
                        {copiedField === row.field ? '✓' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Amount */}
                <div>
                  <div style={rowLabel}>Monto</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#0ECB81', fontSize: '18px', fontWeight: 700, flex: 1, fontFamily: "'IBM Plex Mono', monospace" }}>
                      {displayedEur.toFixed(2)} EUR
                    </span>
                    <button onClick={() => copyToClipboard(displayedEur.toFixed(2), 'amount')} style={copyBtn('amount')}>
                      {copiedField === 'amount' ? '✓' : 'Copiar'}
                    </button>
                  </div>
                </div>

                {/* Concepto */}
                <div>
                  <div style={rowLabel}>Concepto</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#F0B90B', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace", flex: 1, wordBreak: 'break-all' }}>
                      {sepaReference}
                    </span>
                    <button onClick={() => copyToClipboard(sepaReference, 'ref')} style={copyBtn('ref')}>
                      {copiedField === 'ref' ? '✓' : 'Copiar'}
                    </button>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '11px', color: '#474D57', textAlign: 'center' }}>
                  Solo transferencia SEPA — no SWIFT
                </p>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px', color: '#848E9C', fontSize: '13px' }}>
              No tenés cuenta SEPA configurada. Agregá tu IBAN en ⚙️ Configuración.
            </div>
          )}
        </div>

        {onBack && (
          <button
            onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); onBack(); }}
            onClick={onBack}
            aria-label="Cerrar"
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#848E9C',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <X size={14} /> Cerrar
          </button>
        )}
      </div>
    </div>
  );
}
