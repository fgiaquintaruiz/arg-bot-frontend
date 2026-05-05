import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import LandingDocs from './LandingDocs';
import Updates from './Updates';
import LegalModal from './LegalModal';
import pkg from '../../package.json';
import styles from './Login.module.css';

interface LoginProps {
    onLogin: () => void;
    rejected?: boolean;
}

export default function Login({ onLogin, rejected = false }: LoginProps) {
    const [showUpdates, setShowUpdates] = useState(false);
    const [legalView, setLegalView] = useState<'terms' | 'privacy' | null>(null);

    return (
        <div className={styles.container}>

            {/* Access restricted banner */}
            <div className={styles['restricted-banner']}>
                <strong>Acceso restringido.</strong>{' '}
                Solo cuentas de Google previamente autorizadas. Cualquier otra sesión se cerrará automáticamente.
            </div>

            {/* Hero */}
            <div className={styles.hero}>
                <div className={styles['hero-icon']}>🤖</div>
                <h1 className={styles['hero-title']}>
                    ARG<span className={styles['hero-title-accent']}>BOT</span>
                </h1>
                <p className={styles['hero-subtitle']}>
                    Transferencias internacionales automatizadas<br />de Europa a Argentina.
                </p>

                <button onClick={onLogin} className={styles['google-button']}>
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className={styles['google-icon']} />
                    Continuar con Google
                </button>

                {rejected && (
                    <div className={styles['rejected-banner']}>
                        Cuenta no autorizada. Esta aplicación es privada.
                    </div>
                )}

                <p className={styles['no-password-hint']}>Sin contraseña adicional — solo tu cuenta de Google.</p>
            </div>

            <LandingDocs />

            {/* Footer */}
            <div className={styles.footer}>
                <div className={styles['footer-links']}>
                    <button
                        onClick={() => setLegalView('terms')}
                        className={styles['footer-link-button']}
                    >
                        Términos y Condiciones
                    </button>
                    <button
                        onClick={() => setLegalView('privacy')}
                        className={styles['footer-link-button']}
                    >
                        Políticas de Privacidad
                    </button>
                </div>
                <button
                    onClick={() => setShowUpdates(true)}
                    className={styles['updates-button']}
                >
                    Novedades y Roadmap <ChevronRight size={16} className={styles['updates-chevron']} />
                </button>
                <span className={styles['version-badge']}>
                    v{pkg.version}
                </span>
            </div>

            {showUpdates && <Updates onClose={() => setShowUpdates(false)} />}
            {legalView && <LegalModal initialTab={legalView} onClose={() => setLegalView(null)} />}
        </div>
    );
}
