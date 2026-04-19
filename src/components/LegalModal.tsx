import React, { useState } from 'react';
import { TERMS_TEXT } from '../constants/terms';
import { PRIVACY_TEXT } from '../constants/privacy';

interface LegalModalProps {
    onClose: () => void;
    initialTab?: 'terms' | 'privacy';
}

export default function LegalModal({ onClose, initialTab = 'terms' }: LegalModalProps) {
    const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

    const tabStyle = (tab: string) => ({
        padding: '10px 20px',
        backgroundColor: activeTab === tab ? '#3b82f6' : '#1e293b',
        color: activeTab === tab ? '#fff' : '#94a3b8',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'all 0.2s ease'
    });

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', boxSizing: 'border-box' }}>
            <div style={{ backgroundColor: '#0f172a', width: '100%', maxWidth: '900px', height: '90vh', borderRadius: '24px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>

                {/* Header */}
                <div style={{ padding: '20px 30px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.5rem' }}>Documentación Legal</h2>
                    <button onClick={onClose} aria-label="Cerrar modal legal" style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
                </div>

                {/* Tabs */}
                <div style={{ padding: '20px 30px', display: 'flex', gap: '10px', overflowX: 'auto', borderBottom: '1px solid #1e293b' }}>
                    <button style={tabStyle('terms')} onClick={() => setActiveTab('terms')}>Términos y Condiciones</button>
                    <button style={tabStyle('privacy')} onClick={() => setActiveTab('privacy')}>Políticas de Privacidad</button>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, padding: '30px', overflowY: 'auto', backgroundColor: '#1e293b' }}>
                    <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#cbd5e1', lineHeight: '1.7', fontSize: '14px' }}>
                        {activeTab === 'terms' ? TERMS_TEXT : PRIVACY_TEXT}
                    </div>
                </div>

            </div>
        </div>
    );
}