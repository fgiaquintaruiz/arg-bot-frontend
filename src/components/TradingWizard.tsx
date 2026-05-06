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
  ChevronRight,
  CloudDownload,
} from 'lucide-react';
import { downloadFromDrive } from '../googleDrive';
import Trade from './Trade';
import Withdraw from './Withdraw';
import { CoreData } from '../types';
import { STORAGE_KEYS } from '../utils/storageKeys';
import styles from './TradingWizard.module.css';

interface TradingWizardProps {
  data: CoreData | null;
  onRefreshData?: () => void;
}

interface SEPAField {
  label: string;
  value: string;
  field: string;
  mono: boolean;
  copyVal?: string;
}

function StepBadge({ step, icon: Icon, label, activeStep, onStepClick }: {
  step: number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  activeStep: number;
  onStepClick: (step: number) => void;
}) {
  const done = step < activeStep;
  const active = step === activeStep;
  const numberedLabel = `${step + 1}. ${label}`;

  const rowClass = done
    ? styles['step-badge-done']
    : active
    ? styles['step-badge-active']
    : styles['step-badge-locked'];

  const iconClass = done
    ? styles['step-icon-done']
    : active
    ? styles['step-icon-active']
    : styles['step-icon-locked'];

  const labelClass = done
    ? styles['step-label-done']
    : active
    ? styles['step-label-active']
    : styles['step-label-locked'];

  return (
    <div
      onClick={done ? () => onStepClick(step) : undefined}
      className={rowClass}
    >
      <div className={iconClass}>
        {done ? <Check size={14} color="#0ECB81" /> : active ? <Icon size={14} color="#F0B90B" /> : <Lock size={12} color="#474D57" />}
      </div>
      <span className={labelClass}>
        {numberedLabel}
      </span>
      {done && <span className={styles['step-completado']}>Completado</span>}
      {!done && !active && (
        <span className={styles['step-pendiente']}>
          Pendiente
        </span>
      )}
    </div>
  );
}

export default function TradingWizard({ data, onRefreshData }: TradingWizardProps) {
  const [activeStep, setActiveStep] = useState(0);

  // Step 0 — Calculator state
  const [editMode, setEditMode] = useState<'ars' | 'eur'>('ars');
  const [arsAmount, setArsAmount] = useState('500000');
  const [eurAmount, setEurAmount] = useState('');

  // Step 1 — SEPA state
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [bankAccountSaved, setBankAccountSaved] = useState(() => localStorage.getItem(STORAGE_KEYS.BANK_ACCOUNT_SAVED) === 'true');

  if (!data) return (
    <div className={styles.loading}>
      Cargando tasas de mercado...
    </div>
  );

  // Math
  const usdcArs = parseFloat(
    localStorage.getItem(STORAGE_KEYS.USDC_ARS_OVERRIDE) || String(data.usdcArsRate) || '1121.00'
  );
  const eurUsdc = parseFloat(data.rate) || 1.08;
  // Binance no cobra fee de retiro para USDC BEP20 — siempre 0
  const tradingFeeRate = 0.001;
  const sepaFee = 1.00;

  const calcFromArs = (ars: number) => {
    const usdcNeeded = ars / usdcArs;
    const eurBeforeTradeFee = usdcNeeded / eurUsdc;
    return eurBeforeTradeFee + eurBeforeTradeFee * tradingFeeRate + sepaFee;
  };

  const calcFromEur = (eur: number) => {
    const netEur = eur - sepaFee;
    if (netEur <= 0) return { usdc: 0, ars: 0 };
    const grossUsdc = netEur * eurUsdc;
    const netUsdc = grossUsdc - grossUsdc * tradingFeeRate;
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
  const beforeTradeFee = usdcForBroker / eurUsdc;
  const tradingFee = beforeTradeFee * tradingFeeRate;

  const showLowAmountWarning = parseFloat(eurAmount) > 0 && displayedArs <= 0;

  // SEPA
  const binanceIBAN = localStorage.getItem(STORAGE_KEYS.BINANCE_EUR_IBAN) || '';
  const binanceName = localStorage.getItem(STORAGE_KEYS.BINANCE_EUR_NAME) || 'Binance Europe Services Ltd';
  const binanceBIC = localStorage.getItem(STORAGE_KEYS.BINANCE_EUR_BIC) || 'REVOLT21XXX';
  const binanceBank = localStorage.getItem(STORAGE_KEYS.BINANCE_BANK_NAME) || '';
  const binanceBankAddr = localStorage.getItem(STORAGE_KEYS.BINANCE_BANK_ADDRESS) || '';
  const userEmail = localStorage.getItem(STORAGE_KEYS.USER_EMAIL) || '';
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
    try {
      await navigator.clipboard.writeText(allText);
    } catch {
      /* v8 ignore start */
      const ta = document.createElement('textarea');
      ta.value = allText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      /* v8 ignore end */
    }
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 3000);
    /* v8 ignore end */
  };

  const openSettings = () => window.dispatchEvent(new CustomEvent('open-settings', { detail: { tab: 'binance' } }));
  const advance = () => setActiveStep(s => s + 1);
  const retrocede = () => setActiveStep(s => Math.max(0, s - 1));

  return (
    <div>

      {/* ── Paso 0: Simulación ── */}
      <div className={styles.card}>
        <StepBadge step={0} icon={CalcIcon} label="Simulación" activeStep={activeStep} onStepClick={setActiveStep} />

        {activeStep === 0 && (
          <div className={styles['step-content']}>
            {!binanceIBAN && (
              <div className={styles['iban-warning']}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>
                  Configurá tu IBAN de Binance en{' '}
                  <span
                    onClick={openSettings}
                    onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); openSettings(); }}
                    className={styles['iban-warning-link']}
                    data-testid="open-settings-link"
                  >
                    Configuración <ChevronRight size={12} style={{ display: 'inline', verticalAlign: 'middle', marginInline: '2px' }} /> Binance
                  </span>
                  {' · '}
                  <span
                    onClick={downloadFromDrive}
                    onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); downloadFromDrive(); }}
                    className={styles['iban-warning-link']}
                  >
                    <CloudDownload size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />Descargar desde Drive
                  </span>
                </span>
              </div>
            )}

            <div className={styles['fee-breakdown']}>
              {[
                { label: 'Depósito SEPA', value: `+ ${sepaFee.toFixed(2)} €`, danger: true },
                { label: `EUR→USDC (${eurUsdc.toFixed(4)})`, value: `${beforeTradeFee.toFixed(2)} €`, danger: false },
                { label: 'Fee trading (0.1%)', value: `+ ${tradingFee.toFixed(4)} €`, danger: true },
                { label: 'Retiro Binance BEP20', value: '0 USDC', danger: false },
                { label: `USDC destino (${usdcArs})`, value: `${usdcForBroker.toFixed(2)} USDC`, danger: false },
              ].map((row, i) => (
                <div key={i} className={i < 4 ? styles['fee-row'] : styles['fee-row-last']}>
                  <span className={styles['fee-label']}>{row.label}</span>
                  <span className={row.danger ? styles['fee-value-danger'] : styles['fee-value-normal']}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles['ars-input-wrapper']}>
              <label className={styles['row-label']}>Querés recibir (ARS)</label>
              <input
                type="text"
                inputMode="numeric"
                value={editMode === 'ars' ? arsAmount : displayedArs > 0 ? Math.round(displayedArs).toLocaleString('es-AR') : ''}
                onChange={e => { setEditMode('ars'); setArsAmount(e.target.value.replace(/\./g, '')); }}
                className={`${styles['ars-input']} ${editMode === 'ars' ? styles['ars-input-active'] : styles['ars-input-inactive']}`}
                placeholder="500000"
              />
            </div>

            <div className={`${styles['eur-box']} ${showLowAmountWarning || editMode === 'eur' ? styles['eur-box-warning'] : styles['eur-box-inactive']}`}>
              <div className={styles['eur-box-header']}>
                <label className={styles['row-label']}>Costo Final (EUR)</label>
                {editMode === 'ars' && <span className={styles['eur-calculated-badge']}>Calculado</span>}
              </div>
              <div className={styles['eur-input-row']}>
                <span className={styles['eur-symbol']}>€</span>
                <input
                  type="number"
                  value={editMode === 'eur' ? eurAmount : displayedEur > 0 ? displayedEur.toFixed(2) : ''}
                  onChange={e => { setEditMode('eur'); setEurAmount(e.target.value); }}
                  className={styles['eur-input']}
                  placeholder="0.00"
                />
              </div>
              {showLowAmountWarning && (
                <div className={styles['eur-low-warning']}>
                  ⚠ Monto muy bajo — los fees consumen toda la conversión. Probá con un monto mayor.
                </div>
              )}
            </div>

            <button
              onClick={advance}
              disabled={displayedEur <= 0}
              className={displayedEur > 0 ? styles['continue-btn-active'] : styles['continue-btn-disabled']}
            >
              Continuar con la transferencia <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
            </button>
          </div>
        )}

        {activeStep > 0 && (
          <div className={styles['summary-footer']}>
            <div className={styles['summary-row']}>
              <span className={styles['summary-label']}>Enviás</span>
              <span className={styles['summary-value-green']}>{displayedEur.toFixed(2)} EUR</span>
            </div>
            <div className={styles['summary-row-mt']}>
              <span className={styles['summary-label']}>Recibís</span>
              <span className={styles['summary-value-white']}>
                {displayedArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Paso 1: Transferencia SEPA ── */}
      {activeStep >= 1 && (
        <div className={styles.card}>
          <StepBadge step={1} icon={Smartphone} label="Transferir al banco" activeStep={activeStep} onStepClick={setActiveStep} />

          {activeStep === 1 && (
            <div className={styles['step-content']}>
              <button onClick={retrocede} className={styles['back-btn']}>
                {'<'} Paso anterior
              </button>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12, color: '#B7BDC8', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={bankAccountSaved}
                  onChange={e => {
                    setBankAccountSaved(e.target.checked);
                    localStorage.setItem(STORAGE_KEYS.BANK_ACCOUNT_SAVED, String(e.target.checked));
                  }}
                  style={{ accentColor: '#F0B90B', width: 16, height: 16, cursor: 'pointer' }}
                />
                Ya tengo mi cuenta de Heuro agendada en el banco
              </label>

              {!bankAccountSaved && (
                <div className={styles['sepa-box']}>
                  <p className={styles['sepa-title']}>
                    Datos de transferencia SEPA
                  </p>

                  {binanceIBAN ? (
                    <>
                      <button
                        onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); copyAllSepaDetails(); }}
                        onClick={copyAllSepaDetails}
                        className={copiedAll ? styles['copy-all-btn-active'] : styles['copy-all-btn-idle']}
                      >
                        {copiedAll ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar todos los datos</>}
                      </button>

                      <div className={styles['sepa-fields']}>
                        {[
                          { label: 'IBAN', value: binanceIBAN, copyVal: binanceIBAN.replace(/\s/g, ''), field: 'iban', mono: true },
                          { label: 'Beneficiario', value: binanceName, field: 'name', mono: false },
                          { label: 'BIC / SWIFT', value: binanceBIC, field: 'bic', mono: true },
                          ...(binanceBank ? [{ label: 'Banco', value: binanceBank, field: 'bank', mono: false }] : []),
                          ...(binanceBankAddr ? [{ label: 'Dirección del banco', value: binanceBankAddr, field: 'addr', mono: false }] : []),
                        ].map((row: SEPAField) => (
                          <div key={row.field}>
                            <div className={styles['row-label']}>{row.label}</div>
                            <div className={styles['sepa-field-row']}>
                              <span className={row.mono ? styles['sepa-field-value-mono'] : styles['sepa-field-value-default']}>{row.value}</span>
                              <button
                                onClick={() => copyToClipboard(row.copyVal ?? row.value, row.field)}
                                className={`${styles['copy-btn']} ${copiedField === row.field ? styles['copy-btn-copied'] : styles['copy-btn-idle']}`}
                              >
                                {copiedField === row.field ? <Check size={12} /> : <Copy size={12} />}
                                {copiedField === row.field ? '' : 'Copiar'}
                              </button>
                            </div>
                          </div>
                        ))}

                        <div>
                          <div className={styles['row-label']}>Monto</div>
                          <div className={styles['sepa-field-row']}>
                            <span className={styles['sepa-amount-value']}>
                              {displayedEur.toFixed(2)} EUR
                            </span>
                            <button
                              onClick={() => copyToClipboard(displayedEur.toFixed(2), 'amount')}
                              className={`${styles['copy-btn']} ${copiedField === 'amount' ? styles['copy-btn-copied'] : styles['copy-btn-idle']}`}
                            >
                              {copiedField === 'amount' ? <Check size={12} /> : <Copy size={12} />}
                              {copiedField === 'amount' ? '' : 'Copiar'}
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className={styles['row-label']}>Concepto</div>
                          <div className={styles['sepa-field-row']}>
                            <span className={styles['sepa-reference-value']}>
                              {sepaReference}
                            </span>
                            <button
                              onClick={() => copyToClipboard(sepaReference, 'ref')}
                              className={`${styles['copy-btn']} ${copiedField === 'ref' ? styles['copy-btn-copied'] : styles['copy-btn-idle']}`}
                            >
                              {copiedField === 'ref' ? <Check size={12} /> : <Copy size={12} />}
                              {copiedField === 'ref' ? '' : 'Copiar'}
                            </button>
                          </div>
                        </div>

                        <p className={styles['sepa-note']}>
                          Solo transferencia SEPA — no SWIFT
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className={styles['sepa-empty']}>
                      No tenés cuenta SEPA configurada. Agregá tu IBAN en ⚙️ Configuración.
                    </div>
                  )}
                </div>
              )}

              <button onClick={advance} className={styles['done-btn']}>
                Ya realicé la transferencia <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Paso 2: Trade ── */}
      {activeStep >= 2 && (
        <>
          {activeStep === 2 && (
            <div className={styles['step-label-row']}>
              <ArrowLeftRight size={12} />
              Paso 3 — Cambiar EUR → USDC
            </div>
          )}
          {activeStep === 2 && (
            <>
              <button onClick={retrocede} className={styles['back-btn']}>
                {'<'} Paso anterior
              </button>
              <Trade
                data={data}
                onSuccess={() => { onRefreshData?.(); advance(); }}
              />
            </>
          )}
          {activeStep > 2 && (
            <div className={`${styles.card} ${styles['card-done']}`}>
              <StepBadge step={2} icon={ArrowLeftRight} label="Cambiar EUR → USDC" activeStep={activeStep} onStepClick={setActiveStep} />
            </div>
          )}
        </>
      )}

      {/* ── Paso 3: Withdraw ── */}
      {activeStep >= 3 && (
        <>
          {activeStep === 3 && (
            <div className={styles['step-label-row']}>
              <Building2 size={12} />
              Paso 4 — Retirar USDC a Bitso
            </div>
          )}
          {activeStep === 3 && (
            <>
              <button onClick={retrocede} className={styles['back-btn']}>
                {'<'} Paso anterior
              </button>
              <Withdraw
                data={data}
                onSuccess={() => { onRefreshData?.(); advance(); }}
              />
            </>
          )}
          {activeStep > 3 && (
            <div className={`${styles.card} ${styles['card-done']}`}>
              <StepBadge step={3} icon={Building2} label="Retirar USDC a Bitso" activeStep={activeStep} onStepClick={setActiveStep} />
            </div>
          )}
        </>
      )}

      {/* ── Paso 4: Ripio USDC → ARS ── */}
      {activeStep >= 4 && (
        <div className={styles.card}>
          <StepBadge step={4} icon={Banknote} label="Convertir USDC → ARS en Ripio" activeStep={activeStep} onStepClick={setActiveStep} />
          {activeStep === 4 && (
            <div className={styles['step-content']}>
              <button onClick={retrocede} className={styles['back-btn']}>
                {'<'} Paso anterior
              </button>
              {data.nexoUsdcArsRate ? (
                <>
                  <div className={styles['ripio-box']}>
                    <div className={styles['ripio-row']}>
                      <span className={styles['ripio-label']}>USDC/ARS Nexo</span>
                      <span className={styles['ripio-rate']}>
                        {parseFloat(data.nexoUsdcArsRate).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className={styles['ripio-total-row']}>
                      <span className={styles['ripio-total-label']}>Estimado a recibir</span>
                      <span className={styles['ripio-total-value']}>
                        {(usdcForBroker * parseFloat(data.nexoUsdcArsRate)).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS
                      </span>
                    </div>
                  </div>

                  <div className={styles['ripio-disclaimer']}>
                    El monto estimado se calcula usando la tasa de Nexo en tiempo real. Las comisiones de Nexo no están incluidas — el ARS final recibido será menor.
                  </div>
                </>
              ) : (
                <div className={styles['ripio-no-rate']}>
                  Rate de Nexo no disponible. Verificá en la app de Nexo.
                </div>
              )}

              <a
                href="https://exchange.ripio.com/app/trade/USDC_ARS"
                target="_blank"
                rel="noopener noreferrer"
                className={styles['ripio-link']}
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
          className={styles['restart-btn']}
        >
          ↺ Reiniciar simulación
        </button>
      )}
    </div>
  );
}
