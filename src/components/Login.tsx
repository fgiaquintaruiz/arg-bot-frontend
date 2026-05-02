import React, { useState } from 'react';
import LandingDocs from './LandingDocs';
import Updates from './Updates';
import LegalModal from './LegalModal';
import pkg from '../../package.json';

interface LoginProps {
    onLogin: () => void;
    rejected?: boolean;
}

export default function Login({ onLogin, rejected = false }: LoginProps) {
    const [showUpdates, setShowUpdates] = useState(false);
    const [legalView, setLegalView] = useState<'terms' | 'privacy' | null>(null);

    return (
        <div style={{
            maxWidth: '640px',
            margin: '0 auto',
            padding: '40px 20px 60px',
            color: '#EAECEF',
            fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        }}>

            {/* Access restricted banner */}
            <div style={{
                backgroundColor: 'rgba(246,70,93,0.08)',
                border: '1px solid rgba(246,70,93,0.2)',
                color: '#F6465D',
                padding: '10px 16px',
                borderRadius: '8px',
                textAlign: 'center',
                fontSize: '13px',
                lineHeight: 1.5,
                marginBottom: '32px',
            }}>
                <strong>Acceso restringido.</strong>{' '}
                Solo cuentas de Google previamente autorizadas. Cualquier otra sesión se cerrará automáticamente.
            </div>

            {/* Hero */}
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px', lineHeight: 1 }}>🤖</div>
                <h1 style={{ fontSize: '2rem', margin: '0 0 6px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                    ARG<span style={{ color: '#F0B90B' }}>BOT</span>
                </h1>
                <p style={{ fontSize: '1rem', color: '#848E9C', margin: '0 0 28px', lineHeight: 1.5 }}>
                    Transferencias internacionales automatizadas<br />de Europa a Argentina.
                </p>

                <button
                    onClick={onLogin}
                    style={{
                        padding: '13px 28px',
                        fontSize: '15px',
                        backgroundColor: '#fff',
                        color: '#181A20',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                    }}
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
                    Continuar con Google
                </button>

                {rejected && (
                    <div style={{
                        backgroundColor: 'rgba(246,70,93,0.08)',
                        border: '1px solid rgba(246,70,93,0.2)',
                        color: '#F6465D',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        marginTop: '16px',
                        fontSize: '13px',
                    }}>
                        Cuenta no autorizada. Esta aplicación es privada.
                    </div>
                )}

                <p style={{ fontSize: '12px', color: '#474D57', marginTop: '12px' }}>Sin contraseña adicional — solo tu cuenta de Google.</p>
            </div>

            <LandingDocs />

            {/* Footer */}
            <div style={{
                textAlign: 'center',
                marginTop: '40px',
                paddingTop: '20px',
                borderTop: '1px solid #2B3139',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setLegalView('terms')}
                        style={{ background: 'transparent', border: 'none', color: '#474D57', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline', fontFamily: "'IBM Plex Sans', sans-serif" }}
                    >
                        Términos y Condiciones
                    </button>
                    <button
                        onClick={() => setLegalView('privacy')}
                        style={{ background: 'transparent', border: 'none', color: '#474D57', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline', fontFamily: "'IBM Plex Sans', sans-serif" }}
                    >
                        Políticas de Privacidad
                    </button>
                </div>
                <button
                    onClick={() => setShowUpdates(true)}
                    style={{ background: 'transparent', border: 'none', color: '#848E9C', cursor: 'pointer', fontSize: '13px', fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                    Novedades y Roadmap →
                </button>
                <span style={{
                    fontSize: '11px',
                    color: '#848E9C',
                    backgroundColor: '#2B3139',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    fontFamily: "'IBM Plex Mono', monospace",
                    letterSpacing: '0.2px',
                }}>
                    v{pkg.version}
                </span>
            </div>

            {showUpdates && <Updates onClose={() => setShowUpdates(false)} />}
            {legalView && <LegalModal initialTab={legalView} onClose={() => setLegalView(null)} />}
        </div>
    );
}
