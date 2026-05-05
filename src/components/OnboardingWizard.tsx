import React, { useState } from 'react';
import { markOnboardingCompleted } from '../utils/onboardingStorage';
import styles from './OnboardingWizard.module.css';

interface OnboardingWizardProps {
  onClose: () => void;
}

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
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Bienvenida a ARGBOT">
      <div className={styles.card}>

        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Cerrar"
          className={styles['close-button']}
        >
          ×
        </button>

        {/* Header */}
        <div className={styles['header-row']}>
          <span className={styles['header-icon']}>🤖</span>
          <div>
            <h2 className={styles['title-inline']}>
              ARGBOT <span className={styles['title-accent']}>Setup</span>
            </h2>
          </div>
        </div>

        {/* Step indicator */}
        <p className={styles['step-indicator']}>Paso {step} de 3</p>

        {/* ── Step 1 ── */}
        {step === 1 && (
          <>
            <p className={styles.title}>¿Ya tenés cuenta en Binance?</p>
            <p className={styles.body}>
              ARGBOT necesita tu cuenta de Binance para ejecutar las conversiones EUR→USDC→ARS automáticamente.
            </p>

            {step1Answer === 'no' && (
              <div className={styles['info-box']}>
                <p className={styles['info-box-text']}>
                  Creá tu cuenta primero en{' '}
                  <a
                    href="https://www.binance.com/register"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles['info-box-link']}
                    aria-label="Crear cuenta en Binance"
                  >
                    binance.com/register
                  </a>
                  {' '}y volvé cuando la tengas lista.
                </p>
              </div>
            )}

            <div className={styles['btn-row']}>
              <button className={styles['btn-primary']} onClick={handleStep1Yes}>Sí</button>
              <button className={styles['btn-secondary']} onClick={handleStep1No}>No</button>
            </div>
          </>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <>
            <p className={styles.title}>¿Necesitás ayuda para configurar tus API keys?</p>
            <p className={styles.body}>
              Te guiamos para crear las claves con los permisos correctos y agregar la IP del servidor.
            </p>

            {step2Answer === 'yes' && (
              <div className={styles['info-box']}>
                <p className={styles['info-box-title']}>
                  Instrucciones paso a paso:
                </p>
                <ol className={styles['info-box-list']}>
                  <li>Andá a Binance {'>'} <strong className={styles['info-box-list-strong']}>API Management</strong></li>
                  <li>Creá una nueva key con permisos <strong className={styles['info-box-list-strong']}>Spot + Enable Reading</strong></li>
                  <li>Agregá la IP del servidor en el whitelist</li>
                  <li>Guardá el API Key y Secret de forma segura</li>
                </ol>
                <button
                  className={styles['btn-primary-full']}
                  onClick={() => setStep(3)}
                >
                  Continuar
                </button>
              </div>
            )}

            {step2Answer === 'no' && (
              <div className={styles['info-box']}>
                <p className={styles['info-box-text']}>
                  Perfecto, podés configurarlas en <strong className={styles['info-box-list-strong']}>Ajustes</strong> cuando quieras.
                </p>
              </div>
            )}

            {step2Answer === null && (
              <div className={styles['btn-row']}>
                <button className={styles['btn-primary']} onClick={handleStep2Yes}>Sí</button>
                <button className={styles['btn-secondary']} onClick={handleStep2No}>No</button>
              </div>
            )}

            {step2Answer === 'no' && (
              <div className={styles['btn-row']}>
                <button className={styles['btn-primary']} onClick={() => setStep(3)}>Continuar</button>
              </div>
            )}
          </>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <>
            <p className={styles.title}>¿Querés guardar tu cuenta de Binance ahora?</p>
            <p className={styles.body}>
              Podés configurar tus API keys directamente desde los Ajustes. Es rápido y seguro — se guardan solo en tu dispositivo.
            </p>

            <div className={styles['btn-row']}>
              <button className={styles['btn-primary']} onClick={handleGoToSettings}>
                Ir a Ajustes
              </button>
              <button className={styles['btn-secondary']} onClick={handleClose}>
                Más tarde
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
