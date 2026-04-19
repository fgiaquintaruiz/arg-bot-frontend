import React, { useState } from 'react';
import LandingDocs from './LandingDocs';
import Updates from './Updates';
import LegalModal from './LegalModal';

interface LoginProps {
    onLogin: () => void;
    rejected?: boolean;
}

export default function Login({ onLogin, rejected = false }: LoginProps) {
    const [showUpdates, setShowUpdates] = useState(false);
    const [legalView, setLegalView] = useState<'terms' | 'privacy' | null>(null);

    const bannerStyle: React.CSSProperties = {
        backgroundColor: '#7f1d1d',
        color: '#fef2f2',
        padding: '12px 16px',
        borderRadius: '6px',
        textAlign: 'center',
        fontSize: '14px',
        lineHeight: 1.4
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            <div style={{ ...bannerStyle, marginBottom: '24px' }}>
                <strong>Acceso restringido</strong>
                <div style={{ marginTop: '4px' }}>
                    Esta aplicación es de uso privado y solo admite cuentas de Google previamente autorizadas. Si tu cuenta no está en la lista, la sesión se cerrará automáticamente.
                </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#fff' }}>
                    <span style={{ fontSize: '3rem' }}>🤖</span><br />
                    ARGBOT <span style={{ fontSize: '1rem', backgroundColor: '#334155', padding: '4px 8px', borderRadius: '12px', verticalAlign: 'middle' }}>v1.8.158</span>
                </h1>
                <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '30px' }}>
                    Transferencias internacionales automatizadas de Europa a Argentina.
                </p>

                <button
                    onClick={onLogin}
                    style={{ padding: '15px 30px', fontSize: '1.1rem', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', margin: '0 auto', gap: '10px', boxShadow: '0 4px 15px rgba(255,255,255,0.2)' }}
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '24px', height: '24px' }} />
                    Continuar con Google
                </button>

                {rejected && (
                    <div style={{ ...bannerStyle, marginTop: '20px' }}>
                        <strong>Cuenta no autorizada.</strong> Esta aplicación es privada.
                    </div>
                )}

                <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '15px' }}>Sin contraseñas adicionales. Solo tu cuenta de Google.</p>
            </div>

            <LandingDocs />

            <div style={{ textAlign: 'center', marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <button onClick={() => setLegalView('terms')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>
                        Términos y Condiciones
                    </button>
                    <button onClick={() => setLegalView('privacy')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>
                        Políticas de Privacidad
                    </button>
                </div>

                <button onClick={() => setShowUpdates(true)} style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                    🗺️ Novedades y Roadmap
                </button>
            </div>

            {showUpdates && <Updates onClose={() => setShowUpdates(false)} />}
            {legalView && <LegalModal initialTab={legalView} onClose={() => setLegalView(null)} />}
        </div>
    );
}
