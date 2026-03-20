import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
// Importamos el changelog del frontend directamente usando Vite
import frontChangelog from '../../CHANGELOG.md?raw';

export default function Updates({ onClose }: { onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'roadmap' | 'frontend' | 'backend'>('roadmap');
    const [backChangelog, setBackChangelog] = useState('Cargando changelog del servidor...');

    useEffect(() => {
        if (activeTab === 'backend') {
            fetch(`${API_URL}/api/changelog`)
                .then(res => res.text())
                .then(text => setBackChangelog(text))
                .catch(() => setBackChangelog('Error al cargar el historial del servidor.'));
        }
    }, [activeTab]);

    const roadmapContent = `
# 🗺️ Roadmap de ARGBOT

### 🚀 Próximamente (En desarrollo)
- **Seguridad Militar Backend:** Verificación estricta de tokens JWT de Google (firebase-admin) para blindar la API.
- **Notificaciones:** Alertas por email o Telegram cuando se complete un retiro exitoso.
- **Historial Mejorado:** Filtros por fecha y exportación a CSV de tus operaciones.

### 🔮 Futuro a mediano plazo
- Soporte para múltiples corredores (ej. USD a ARS, EUR a COP).
- Integración con más exchanges locales además de Buenbit.
- App móvil nativa (PWA).
  `;

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
            <div style={{ backgroundColor: '#0f172a', width: '100%', maxWidth: '800px', height: '90vh', borderRadius: '24px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>

                {/* Header */}
                <div style={{ padding: '20px 30px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.5rem' }}>Novedades y Roadmap</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
                </div>

                {/* Tabs */}
                <div style={{ padding: '20px 30px', display: 'flex', gap: '10px', overflowX: 'auto' }}>
                    <button style={tabStyle('roadmap')} onClick={() => setActiveTab('roadmap')}>🗺️ Roadmap</button>
                    <button style={tabStyle('frontend')} onClick={() => setActiveTab('frontend')}>🎨 Frontend Changelog</button>
                    <button style={tabStyle('backend')} onClick={() => setActiveTab('backend')}>⚙️ Backend Changelog</button>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, padding: '0 30px 30px 30px', overflowY: 'auto' }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#cbd5e1', lineHeight: '1.6', fontSize: '14px', backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px' }}>
            {activeTab === 'roadmap' && roadmapContent}
              {activeTab === 'frontend' && frontChangelog}
              {activeTab === 'backend' && backChangelog}
          </pre>
                </div>

            </div>
        </div>
    );
}