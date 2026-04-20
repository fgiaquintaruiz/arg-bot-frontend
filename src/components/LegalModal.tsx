import React, { useState } from 'react';
import { TERMS_TEXT } from '../constants/terms';
import { PRIVACY_TEXT } from '../constants/privacy';

interface LegalModalProps {
    onClose: () => void;
    initialTab?: 'terms' | 'privacy';
}

export default function LegalModal({ onClose, initialTab = 'terms' }: LegalModalProps) {
    const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

    const tabStyle = (tab: string): React.CSSProperties => ({
        padding: '8px 16px',
        backgroundColor: activeTab === tab ? '#F0B90B' : 'transparent',
        color: activeTab === tab ? '#181A20' : '#848E9C',
        border: activeTab === tab ? 'none' : '1px solid #2B3139',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '13px',
        fontFamily: "'IBM Plex Sans', sans-serif",
    });

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', boxSizing: 'border-box' }}>
            <div style={{ backgroundColor: '#1E2329', width: '100%', maxWidth: '860px', height: '90vh', borderRadius: '12px', border: '1px solid #2B3139', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                <div style={{ padding: '16px 24px', borderBottom: '1px solid #2B3139', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: '#EAECEF', fontSize: '1rem', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>Documentación Legal</h2>
                    <button onClick={onClose} aria-label="Cerrar modal legal" style={{ background: 'transparent', border: 'none', color: '#848E9C', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1, padding: '4px' }}>✖</button>
                </div>

                <div style={{ padding: '12px 24px', display: 'flex', gap: '8px', borderBottom: '1px solid #2B3139' }}>
                    <button style={tabStyle('terms')} onClick={() => setActiveTab('terms')}>Términos y Condiciones</button>
                    <button style={tabStyle('privacy')} onClick={() => setActiveTab('privacy')}>Políticas de Privacidad</button>
                </div>

                <div style={{ flex: 1, padding: '24px', overflowY: 'auto', backgroundColor: '#181A20' }}>
                    <div style={{ whiteSpace: 'pre-wrap', fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: '#848E9C', lineHeight: '1.7', fontSize: '13px' }}>
                        {activeTab === 'terms' ? TERMS_TEXT : PRIVACY_TEXT}
                    </div>
                </div>

            </div>
        </div>
    );
}
