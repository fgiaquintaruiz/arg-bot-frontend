import React, { useState } from 'react';
import {
  Calculator as CalcIcon,
  ArrowLeftRight,
  Building2,
  Banknote,
  Check,
  Lock,
  AlertTriangle,
  Copy,
  Smartphone,
} from 'lucide-react';
import Trade from './Trade';
import Withdraw from './Withdraw';

interface TradingWizardProps {
  data: any;
  onRefreshData?: () => void;
}

const CARD: React.CSSProperties = {
  backgroundColor: '#1E2329',
  borderRadius: '12px',
  border: '1px solid #2B3139',
  marginBottom: '12px',
  overflow: 'hidden',
};

const ROW_LABEL: React.CSSProperties = {
  fontSize: '11px',
  color: '#474D57',
  marginBottom: '3px',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
};

const STEP_LABEL_ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '10px 0 6px',
  fontSize: '11px',
  color: '#474D57',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  fontWeight: 600,
};

export default function TradingWizard({ data, onRefreshData }: TradingWizardProps) {
  const [activeStep, setActiveStep] = useState(0);

  // Step 0 — Calculator state
  const [editMode, setEditMode] = useState<'ars' | 'eur'>('ars');
  const [arsAmount, setArsAmount] = useState('500000');
  const [eurAmount, setEurAmount] = useState('');

  // Step 1 — SEPA state
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!data) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#848E9C', fontSize: '14px' }}>
      Cargando tasas de mercado...
    </div>
  );

  // Math
  const usdcArs = parseFloat(data.usdcArsRate) || 1121.00;
  const eurUsdc = parseFloat(data.rate) || 1.08;
  const withdrawalFee = data.fees?.withdrawalUSDC_BEP20 ?? 0.8;
  const tradingFeeRate = 0.001;
  const sepaFee = 1.00;

  const calcFromArs = (ars: number) => {
    const usdcNeeded = ars / usdcArs;
    const usdcAfterWithdrawal = usdcNeeded + withdrawalFee;
    const eurBeforeTradeFee = usdcAfterWithdrawal / eurUsdc;
    return eurBeforeTradeFee + eurBeforeTradeFee * tradingFeeRate + sepaFee;
  };

  const calcFromEur = (eur: number) => {
    const netEur = eur - sepaFee;
    if (netEur <= 0) return { usdc: 0, ars: 0 };
    const grossUsdc = netEur * eurUsdc;
    const netUsdc = grossUsdc - grossUsdc * tradingFeeRate - withdrawalFee;
    return { usdc: Math.max(0, netUsdc), ars: Math.max(0, netUsdc * usdcArs) };
  };

  let displayedArs: number;
  let displayedEur: number;
  if (editMode === 'ars') {
    displayedArs = parseFloat(arsAmount) || 0;
    displayedEur = calcFromArs(displayedArs);
  } else {
    displayedEur = parseFloat(eurAmount) || 0;
    const r = calcFromEur(displayedEur);
    displayedArs = r.ars;
  }

  const usdcForBroker = displayedArs / usdcArs;
  const usdcAtBinance = usdcForBroker + withdrawalFee;
  const beforeTradeFee = usdcAtBinance / eurUsdc;
  const tradingFee = beforeTradeFee * tradingFeeRate;

  const showLowAmountWarning = parseFloat(eurAmount) > 0 && displayedArs <= 0;

  // SEPA
  const binanceIBAN = localStorage.getItem('binance_eur_iban') || '';
  const binanceName = localStorage.getItem('binance_eur_name') || 'Binance Europe Services Ltd';
  const binanceBIC = localStorage.getItem('binance_eur_bic') || 'REVOLT21XXX';
  const binanceBank = localStorage.getItem('binance_bank_name') || '';
  const binanceBankAddr = localStorage.getItem('binance_bank_address') || '';
  const userEmail = localStorage.getItem('user_email') || '';
  const sepaReference = userEmail ? `${userEmail} Binance Deposit` : 'Deposito ARGBOT';

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* v8 ignore start */
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      /* v8 ignore end */
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAllSepaDetails = async () => {
    /* v8 ignore start */
    if (!binanceIBAN) return;
    let allText = `Beneficiario: ${binanceName}\nIBAN: ${binanceIBAN.replace(/\s/g, '')}\nBIC/SWIFT: ${binanceBIC}`;
    if (binanceBank) allText += `\nBanco: ${binanceBank}`;
    if (binanceBankAddr) allText += `\nDirección: ${binanceBankAddr}`;
    allText += `\nMonto: ${displayedEur.toFixed(2)} EUR\nConcepto: ${sepaReference}`;
    try { await navigator.clipboard.writeText(allText); } catch { /* fallback */ }
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 3000);
    /* v8 ignore end */
  };

  const openSettings = () => window.dispatchEvent(new CustomEvent('open-settings', { detail: { tab: 'binance' } }));
  const advance = () => setActiveStep(s => s + 1);
  const retrocede = () => setActiveStep(s => Math.max(0, s - 1));

  const copyBtn = (field: string): React.CSSProperties => ({
    background: '#2B3139',
    border: 'none',
    color: copiedField === field ? '#0ECB81' : '#848E9C',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '11px',
    cursor: 'pointer',
    minHeight: '32px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: "'IBM Plex Sans', sans-serif",
    flexShrink: 0,
  });

  // Step header indicator
  const StepBadge = ({ step, icon: Icon, label }: { step: number; icon: any; label: string }) => {
    const done = step < activeStep;
    const active = step === activeStep;
    const numberedLabel = `${step + 1}. ${label}`;
    return (
      <div
        onClick={done ? () => setActiveStep(step) : undefined}
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: done ? 'rgba(14,203,129,0.04)' : 'transparent',
          borderBottom: active ? '1px solid #2B3139' : 'none',
          cursor: done ? 'pointer' : 'default',
        }}
      >
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
          backgroundColor: done ? 'rgba(14,203,129,0.15)' : active ? 'rgba(240,185,11,0.12)' : '#2B3139',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {done ? <Check size={14} color="#0ECB81" /> : active ? <Icon size={14} color="#F0B90B" /> : <Lock size={12} color="#474D57" />}
        </div>
        <span style={{
          fontSize: '14px',
          fontWeight: active ? 700 : done ? 500 : 400,
          color: done ? '#0ECB81' : active ? '#EAECEF' : '#474D57',
          fontFamily: "'IBM Plex Sans', sans-serif",
          flex: 1,
        }}>
          {numberedLabel}
        </span>
        {done && <span style={{ fontSize: '11px', color: '#474D57' }}>Completado</span>}
        {!done && !active && (
          <span style={{ fontSize: '10px', color: '#474D57', backgroundColor: '#2B3139', padding: '2px 8px', borderRadius: '4px' }}>
            Pendiente
          </span>
        )}
      </div>
    );
  };

  return (
    <div>

      {/* ── Balance strip — visible en todos los pasos ── */}
      <div style={{
        backgroundColor: '#1E2329',
        borderBottom: '1px solid #2B3139',
        padding: '8px 0',
        textAlign: 'right',
        marginBottom: '12px',
        borderRadius: '8px',
        paddingLeft: '16px',
        paddingRight: '16px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '16px',
      }}>
        <span style={{ fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace" }}>
          <span style={{ color: '#848E9C' }}>Disponible: </span>
          <span style={{ color: '#EAECEF' }}>{data?.balances?.eur ? parseFloat(data.balances.eur).toFixed(2) : '—'} €</span>
        </span>
        <span style={{ fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace" }}>
          <span style={{ color: '#848E9C' }}></span>
          <span style={{ color: '#EAECEF' }}>{data?.balances?.usdc ? parseFloat(data.balances.usdc).toFixed(2) : '—'} USDC</span>
        </span>
      </div>

      {/* ── Paso 0: Simulación ── */}
      <div style={CARD}>
        <StepBadge step={0} icon={CalcIcon} label="Simulación" />

        {activeStep === 0 && (
          <div style={{ padding: '20px' }}>
            {!binanceIBAN && (
              <div style={{
                backgroundColor: 'rgba(240,185,11,0.08)', border: '1px solid rgba(240,185,11,0.2)',
                borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
                fontSize: '12px', color: '#F0B90B', display: 'flex', gap: '6px', alignItems: 'flex-start',
              }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
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

            <div style={{ marginBottom: '12px' }}>
              <label style={ROW_LABEL}>Querés recibir (ARS)</label>
              <input
                type="text"
                inputMode="numeric"
                value={editMode === 'ars' ? arsAmount : displayedArs > 0 ? Math.round(displayedArs).toLocaleString('es-AR') : ''}
                onChange={e => { setEditMode('ars'); setArsAmount(e.target.value.replace(/\./g, '')); }}
                style={{
                  width: '100%', padding: '13px 14px', backgroundColor: '#181A20',
                  color: '#EAECEF', border: editMode === 'ars' ? '1px solid #F0B90B' : '1px solid #2B3139',
                  borderRadius: '8px', fontSize: '16px', fontWeight: 600, boxSizing: 'border-box',
                  fontFamily: "'IBM Plex Mono', monospace", outline: 'none',
                }}
                placeholder="500000"
              />
            </div>

            <div style={{
              marginBottom: '16px', backgroundColor: '#181A20', borderRadius: '8px',
              padding: '12px 14px',
              border: showLowAmountWarning
                ? '1px solid #F0B90B'
                : editMode === 'eur' ? '1px solid #F0B90B' : '1px solid #2B3139',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={ROW_LABEL}>Costo Final (EUR)</label>
                {editMode === 'ars' && <span style={{ fontSize: '10px', color: '#F0B90B', fontWeight: 500 }}>Calculado</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#0ECB81', fontSize: '20px', fontWeight: 700, flexShrink: 0, fontFamily: "'IBM Plex Mono', monospace" }}>€</span>
                <input
                  type="number"
                  value={editMode === 'eur' ? eurAmount : displayedEur > 0 ? displayedEur.toFixed(2) : ''}
                  onChange={e => { setEditMode('eur'); setEurAmount(e.target.value); }}
                  style={{
                    width: '100%', padding: '4px 0', backgroundColor: 'transparent',
                    color: '#0ECB81', border: 'none', fontSize: '22px', fontWeight: 700,
                    boxSizing: 'border-box', minWidth: 0, outline: 'none',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                  placeholder="0.00"
                />
              </div>
              {showLowAmountWarning && (
                <div style={{
                  color: '#F0B90B', fontSize: '12px', marginTop: '6px',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}>
                  ⚠ Monto muy bajo — los fees consumen toda la conversión. Probá con un monto mayor.
                </div>
              )}
            </div>

            <div style={{
              backgroundColor: '#181A20', padding: '14px', borderRadius: '8px',
              fontSize: '13px', marginBottom: '14px', border: '1px solid #2B3139',
            }}>
              {[
                { label: 'Depósito SEPA', value: `+ ${sepaFee.toFixed(2)} €`, danger: true },
                { label: `EUR→USDC (${eurUsdc.toFixed(4)})`, value: `${beforeTradeFee.toFixed(2)} €`, danger: false },
                { label: 'Fee trading (0.1%)', value: `+ ${tradingFee.toFixed(4)} €`, danger: true },
                { label: 'Retiro Binance BEP20', value: `+ ${withdrawalFee.toFixed(2)} USDC`, danger: false },
                { label: `USDC destino (${usdcArs})`, value: `${usdcForBroker.toFixed(2)} USDC`, danger: false },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i < 4 ? '8px' : 0, alignItems: 'center' }}>
                  <span style={{ color: '#848E9C', fontSize: '12px' }}>{row.label}</span>
                  <span style={{ color: row.danger ? '#F6465D' : '#EAECEF', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 500 }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={advance}
              disabled={displayedEur <= 0}
              style={{
                width: '100%', padding: '13px',
                backgroundColor: displayedEur > 0 ? '#F0B90B' : '#2B3139',
                color: displayedEur > 0 ? '#181A20' : '#474D57',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
                cursor: displayedEur > 0 ? 'pointer' : 'not-allowed',
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              Continuar con la transferencia →
            </button>
          </div>
        )}

        {activeStep > 0 && (
          <div style={{ padding: '10px 16px 14px', borderTop: '1px solid #2B3139' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#848E9C' }}>Enviás</span>
              <span style={{ color: '#0ECB81', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>{displayedEur.toFixed(2)} EUR</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '4px' }}>
              <span style={{ color: '#848E9C' }}>Recibís</span>
              <span style={{ color: '#EAECEF', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>
                {displayedArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Paso 1: Transferencia SEPA ── */}
      {activeStep >= 1 && (
        <div style={CARD}>
          <StepBadge step={1} icon={Smartphone} label="Transferir al banco" />

          {activeStep === 1 && (
            <div style={{ padding: '20px' }}>
              <button
                onClick={retrocede}
                style={{
                  background: 'transparent', border: 'none',
                  color: '#848E9C', fontSize: '13px', cursor: 'pointer',
                  padding: '0 0 12px', display: 'flex', alignItems: 'center', gap: '4px',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                ← Paso anterior
              </button>

              <div style={{ backgroundColor: '#181A20', borderRadius: '8px', border: '1px solid #2B3139', padding: '16px', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 12px', color: '#848E9C', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Datos de transferencia SEPA
                </p>

                {binanceIBAN ? (
                  <>
                    <button
                      onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); copyAllSepaDetails(); }}
                      onClick={copyAllSepaDetails}
                      style={{
                        width: '100%', padding: '11px',
                        backgroundColor: copiedAll ? 'rgba(14,203,129,0.1)' : '#2B3139',
                        color: copiedAll ? '#0ECB81' : '#EAECEF',
                        border: `1px solid ${copiedAll ? 'rgba(14,203,129,0.3)' : '#474D57'}`,
                        borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                        cursor: 'pointer', marginBottom: '14px', minHeight: '44px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                      }}
                    >
                      {copiedAll ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar todos los datos</>}
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
                          <div style={ROW_LABEL}>{row.label}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              color: '#EAECEF', fontSize: '13px', flex: 1, wordBreak: 'break-all',
                              fontFamily: row.mono ? "'IBM Plex Mono', monospace" : "'IBM Plex Sans', sans-serif",
                            }}>{row.value}</span>
                            <button onClick={() => copyToClipboard(row.copyVal ?? row.value, row.field)} style={copyBtn(row.field)}>
                              {copiedField === row.field ? <Check size={12} /> : <Copy size={12} />}
                              {copiedField === row.field ? '' : 'Copiar'}
                            </button>
                          </div>
                        </div>
                      ))}

                      <div>
                        <div style={ROW_LABEL}>Monto</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#0ECB81', fontSize: '18px', fontWeight: 700, flex: 1, fontFamily: "'IBM Plex Mono', monospace" }}>
                            {displayedEur.toFixed(2)} EUR
                          </span>
                          <button onClick={() => copyToClipboard(displayedEur.toFixed(2), 'amount')} style={copyBtn('amount')}>
                            {copiedField === 'amount' ? <Check size={12} /> : <Copy size={12} />}
                            {copiedField === 'amount' ? '' : 'Copiar'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <div style={ROW_LABEL}>Concepto</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#F0B90B', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace", flex: 1, wordBreak: 'break-all' }}>
                            {sepaReference}
                          </span>
                          <button onClick={() => copyToClipboard(sepaReference, 'ref')} style={copyBtn('ref')}>
                            {copiedField === 'ref' ? <Check size={12} /> : <Copy size={12} />}
                            {copiedField === 'ref' ? '' : 'Copiar'}
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

              <button
                onClick={advance}
                style={{
                  width: '100%', padding: '13px', backgroundColor: 'transparent',
                  color: '#0ECB81', border: '1px solid rgba(14,203,129,0.3)',
                  borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                Ya realicé la transferencia →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Paso 2: Trade ── */}
      {activeStep >= 2 && (
        <>
          {activeStep === 2 && (
            <div style={STEP_LABEL_ROW}>
              <ArrowLeftRight size={12} />
              Paso 3 — Cambiar EUR → USDC
            </div>
          )}
          {activeStep === 2 && (
            <>
              <button
                onClick={retrocede}
                style={{
                  background: 'transparent', border: 'none',
                  color: '#848E9C', fontSize: '13px', cursor: 'pointer',
                  padding: '0 0 12px', display: 'flex', alignItems: 'center', gap: '4px',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                ← Paso anterior
              </button>
              <Trade
                data={data}
                onSuccess={() => { onRefreshData?.(); advance(); }}
              />
            </>
          )}
          {activeStep > 2 && (
            <div style={{ ...CARD, backgroundColor: 'rgba(14,203,129,0.04)' }}>
              <StepBadge step={2} icon={ArrowLeftRight} label="Cambiar EUR → USDC" />
            </div>
          )}
        </>
      )}

      {/* ── Paso 3: Withdraw ── */}
      {activeStep >= 3 && (
        <>
          {activeStep === 3 && (
            <div style={STEP_LABEL_ROW}>
              <Building2 size={12} />
              Paso 4 — Retirar USDC a Bitso
            </div>
          )}
          {activeStep === 3 && (
            <>
              <button
                onClick={retrocede}
                style={{
                  background: 'transparent', border: 'none',
                  color: '#848E9C', fontSize: '13px', cursor: 'pointer',
                  padding: '0 0 12px', display: 'flex', alignItems: 'center', gap: '4px',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                ← Paso anterior
              </button>
              <Withdraw
                data={data}
                onSuccess={() => { onRefreshData?.(); advance(); }}
              />
            </>
          )}
          {activeStep > 3 && (
            <div style={{ ...CARD, backgroundColor: 'rgba(14,203,129,0.04)' }}>
              <StepBadge step={3} icon={Building2} label="Retirar USDC a Bitso" />
            </div>
          )}
        </>
      )}

      {/* ── Paso 4: Ripio USDC → ARS ── */}
      {activeStep >= 4 && (
        <div style={CARD}>
          <StepBadge step={4} icon={Banknote} label="Convertir USDC → ARS en Ripio" />
          {activeStep === 4 && (
            <div style={{ padding: '20px' }}>
              <button
                onClick={retrocede}
                style={{
                  background: 'transparent', border: 'none',
                  color: '#848E9C', fontSize: '13px', cursor: 'pointer',
                  padding: '0 0 12px', display: 'flex', alignItems: 'center', gap: '4px',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                ← Paso anterior
              </button>
              {data.ripioUsdcArsRate ? (
                <>
                  <div style={{
                    backgroundColor: '#181A20', borderRadius: '8px',
                    border: '1px solid #2B3139', padding: '14px', marginBottom: '14px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#848E9C', fontSize: '12px' }}>Rate USDC/ARS (Ripio bid)</span>
                      <span style={{ color: '#0ECB81', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 600 }}>
                        {parseFloat(data.ripioUsdcArsRate).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #2B3139', paddingTop: '10px', marginTop: '4px' }}>
                      <span style={{ color: '#EAECEF', fontSize: '13px', fontWeight: 600 }}>Estimado a recibir</span>
                      <span style={{ color: '#0ECB81', fontSize: '18px', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {(usdcForBroker * parseFloat(data.ripioUsdcArsRate)).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                      </span>
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.15)',
                    borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
                    fontSize: '12px', color: '#848E9C', lineHeight: '1.5',
                  }}>
                    El monto estimado se calcula usando el bid de Ripio en tiempo real. Las comisiones de Ripio no están incluidas — el ARS final recibido será menor. El retiro de ARS a CVU/CBU se hace manualmente desde la app de Ripio.
                  </div>
                </>
              ) : (
                <div style={{
                  backgroundColor: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.15)',
                  borderRadius: '8px', padding: '14px', marginBottom: '16px',
                  fontSize: '13px', color: '#848E9C', textAlign: 'center',
                }}>
                  Rate de Ripio no disponible. Verificá en la app de Ripio.
                </div>
              )}

              <a
                href="https://exchange.ripio.com/app/trade/USDC_ARS"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '13px', boxSizing: 'border-box',
                  backgroundColor: '#2B3139', color: '#EAECEF',
                  border: '1px solid #474D57', borderRadius: '8px',
                  fontSize: '14px', fontWeight: 600, textDecoration: 'none',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                <Banknote size={16} />
                Abrir Ripio USDC/ARS
              </a>
            </div>
          )}
        </div>
      )}

      {activeStep > 0 && (
        <button
          onClick={() => setActiveStep(0)}
          style={{
            width: '100%', padding: '12px', backgroundColor: 'transparent',
            color: '#474D57', border: '1px solid #2B3139', borderRadius: '8px',
            fontSize: '13px', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          ↺ Reiniciar simulación
        </button>
      )}
    </div>
  );
}
