import React, { useState } from 'react';
import { markOnboardingCompleted } from '../utils/onboardingStorage';

interface OnboardingWizardProps {
  onClose: () => void;
}

// ─── Shared styles ─────────────────────────────────────────────────────────────

const OVERLAY: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
};

const CARD: React.CSSProperties = {
  backgroundColor: '#1E2329',
  border: '1px solid #2B3139',
  borderRadius: '20px',
  padding: '28px 24px',
  maxWidth: '360px',
  width: '90%',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  position: 'relative',
};

const TITLE: React.CSSProperties = {
  color: '#EAECEF',
  fontSize: '16px',
  fontWeight: 700,
  margin: '0 0 8px',
  fontFamily: "'IBM Plex Sans', sans-serif",
};

const BODY: React.CSSProperties = {
  color: '#848E9C',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0 0 20px',
};

const BTN_PRIMARY: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  borderRadius: '20px',
  border: 'none',
  backgroundColor: '#0ECB81',
  color: '#181A20',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 700,
  fontFamily: "'IBM Plex Sans', sans-serif",
};

const BTN_SECONDARY: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  borderRadius: '20px',
  border: '1px solid #2B3139',
  backgroundColor: 'transparent',
  color: '#848E9C',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 600,
  fontFamily: "'IBM Plex Sans', sans-serif",
};

const BTN_ROW: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
};

const STEP_INDICATOR: React.CSSProperties = {
  fontSize: '11px',
  color: '#474D57',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '16px',
  fontFamily: "'IBM Plex Mono', monospace",
};

const INFO_BOX: React.CSSProperties = {
  backgroundColor: 'rgba(14,203,129,0.06)',
  border: '1px solid rgba(14,203,129,0.2)',
  borderRadius: '8px',
  padding: '12px 14px',
  marginBottom: '16px',
};

const INFO_BOX_TEXT: React.CSSProperties = {
  margin: 0,
  fontSize: '13px',
  color: '#0ECB81',
  lineHeight: '1.6',
};

// ─── Component ─────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;
type Step1Answer = 'yes' | 'no' | null;
type Step2Answer = 'yes' | 'no' | null;

export default function OnboardingWizard({ onClose }: OnboardingWizardProps) {
  const [step, setStep] = useState<Step>(1);
  const [step1Answer, setStep1Answer] = useState<Step1Answer>(null);
  const [step2Answer, setStep2Answer] = useState<Step2Answer>(null);

  const handleClose = () => {
    markOnboardingCompleted();
    onClose();
  };

  const handleStep1Yes = () => {
    setStep1Answer('yes');
    setStep(2);
  };

  const handleStep1No = () => {
    setStep1Answer('no');
  };

  const handleStep2Yes = () => {
    setStep2Answer('yes');
  };

  const handleStep2No = () => {
    setStep2Answer('no');
  };

  const handleGoToSettings = () => {
    markOnboardingCompleted();
    window.dispatchEvent(new CustomEvent('open-settings', { detail: { tab: 'binance' } }));
    onClose();
  };

  return (
    <div style={OVERLAY} role="dialog" aria-modal="true" aria-label="Bienvenida a ARGBOT">
      <div style={CARD}>

        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Cerrar"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: '#848E9C',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: 1,
            padding: '4px',
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <span style={{ fontSize: '24px' }}>🤖</span>
          <div>
            <h2 style={{ ...TITLE, margin: 0 }}>
              ARGBOT <span style={{ color: '#F0B90B' }}>Setup</span>
            </h2>
          </div>
        </div>

        {/* Step indicator */}
        <p style={STEP_INDICATOR}>Paso {step} de 3</p>

        {/* ── Step 1 ── */}
        {step === 1 && (
          <>
            <p style={TITLE}>¿Ya tenés cuenta en Binance?</p>
            <p style={BODY}>
              ARGBOT necesita tu cuenta de Binance para ejecutar las conversiones EUR→USDC→ARS automáticamente.
            </p>

            {step1Answer === 'no' && (
              <div style={INFO_BOX}>
                <p style={INFO_BOX_TEXT}>
                  Creá tu cuenta primero en{' '}
                  <a
                    href="https://www.binance.com/register"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#F0B90B', fontWeight: 600 }}
                    aria-label="Crear cuenta en Binance"
                  >
                    binance.com/register
                  </a>
                  {' '}y volvé cuando la tengas lista.
                </p>
              </div>
            )}

            <div style={BTN_ROW}>
              <button style={BTN_PRIMARY} onClick={handleStep1Yes}>Sí</button>
              <button style={BTN_SECONDARY} onClick={handleStep1No}>No</button>
            </div>
          </>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <>
            <p style={TITLE}>¿Necesitás ayuda para configurar tus API keys?</p>
            <p style={BODY}>
              Te guiamos para crear las claves con los permisos correctos y agregar la IP del servidor.
            </p>

            {step2Answer === 'yes' && (
              <div style={INFO_BOX}>
                <p style={{ ...INFO_BOX_TEXT, color: '#EAECEF', marginBottom: '8px', fontWeight: 600 }}>
                  Instrucciones paso a paso:
                </p>
                <ol style={{ ...INFO_BOX_TEXT, margin: '0', paddingLeft: '18px', color: '#848E9C' }}>
                  <li>Andá a Binance {'>'} <strong style={{ color: '#EAECEF' }}>API Management</strong></li>
                  <li>Creá una nueva key con permisos <strong style={{ color: '#EAECEF' }}>Spot + Enable Reading</strong></li>
                  <li>Agregá la IP del servidor en el whitelist</li>
                  <li>Guardá el API Key y Secret de forma segura</li>
                </ol>
                <button
                  style={{ ...BTN_PRIMARY, marginTop: '14px', width: '100%', flex: 'unset' }}
                  onClick={() => setStep(3)}
                >
                  Continuar
                </button>
              </div>
            )}

            {step2Answer === 'no' && (
              <div style={INFO_BOX}>
                <p style={INFO_BOX_TEXT}>
                  Perfecto, podés configurarlas en <strong style={{ color: '#EAECEF' }}>Ajustes</strong> cuando quieras.
                </p>
              </div>
            )}

            {step2Answer === null && (
              <div style={BTN_ROW}>
                <button style={BTN_PRIMARY} onClick={handleStep2Yes}>Sí</button>
                <button style={BTN_SECONDARY} onClick={handleStep2No}>No</button>
              </div>
            )}



            {step2Answer === 'no' && (
              <div style={BTN_ROW}>
                <button style={BTN_PRIMARY} onClick={() => setStep(3)}>Continuar</button>
              </div>
            )}
          </>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <>
            <p style={TITLE}>¿Querés guardar tu cuenta de Binance ahora?</p>
            <p style={BODY}>
              Podés configurar tus API keys directamente desde los Ajustes. Es rápido y seguro — se guardan solo en tu dispositivo.
            </p>

            <div style={BTN_ROW}>
              <button style={BTN_PRIMARY} onClick={handleGoToSettings}>
                Ir a Ajustes
              </button>
              <button style={BTN_SECONDARY} onClick={handleClose}>
                Más tarde
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
