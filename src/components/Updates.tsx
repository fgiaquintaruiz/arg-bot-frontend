import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
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
# 🗺️ Hoja de Ruta de ARGBOT

### 🔥 Prioridad Alta (Próximos lanzamientos)
- **Métricas y Ahorro Global:** Panel en vivo mostrando la cantidad de cálculos, cambios y retiros exitosos, usuarios registrados y el ahorro total generado frente a los servicios de envío tradicionales.
- **Feed de Operaciones (Prueba Social):** Lista pública de transacciones recientes (100% anonimizadas y ofuscadas) para demostrar la actividad real de la plataforma.
- **Seguridad Robusta en el Backend:** Verificación estricta de tokens JWT de Google (firebase-admin) para proteger la API y blindar las nuevas rutas de estadísticas.

### 🚀 Próximamente (En desarrollo)
- **Notificaciones:** Alertas por email o Telegram cuando se complete un retiro exitoso.
- **Historial Mejorado:** Filtros por fecha y exportación a CSV de tus operaciones.

### 🔮 Futuro a mediano plazo
- Soporte para múltiples corredores (ej. USD a ARS, EUR a COP, USD a otros países LATAM).
- Integración con más exchanges locales además de Nexo.
- App móvil nativa (PWA).
- **Sincronización en la nube:** Guardá y cargá tus claves API y libreta de direcciones desde Google Drive para usar la app en múltiples dispositivos.
- **Transferencia bancaria directa:** Generá la transferencia SEPA desde tu banco (Santander, BBVA, etc.) directamente a tu cuenta Binance con un solo toque.

---

## 📊 Arquitectura del Proyecto

### Fase 0: Actual ✅ (SaaS No Custodial)
El usuario usa sus propias claves API de Binance. ARGBOT es un control remoto, no un custodio.

### Fase 1: Semi-automatizado (Tu Cuenta de Exchange)
El usuario envía EUR por SEPA a tu cuenta → tu backend convierte automáticamente → envía USDC a su wallet.

### Fase 2: Pipe Automatizado
Pool de liquidez propio + payouts automáticos en ARS a MercadoPago/Lemon.

### Fase 3: DeFi Independiente
Sin exchanges, sin claves API. Todo on-chain vía DEXs y smart contracts.

> Para más detalles, ver \`ARCHITECTURE.md\` en el repositorio.
    `;

    // Simple markdown-to-React renderer
    const renderMarkdown = (md: string) => {
        const lines = md.split('\n');
        const elements: React.ReactNode[] = [];
        let inCodeBlock = false;
        let codeContent: string[] = [];

        lines.forEach((line, idx) => {
            // Code blocks
            if (line.trim().startsWith('```')) {
                if (inCodeBlock) {
                    elements.push(
                        <pre key={idx} style={{ backgroundColor: '#0e1621', padding: '16px', borderRadius: '12px', fontSize: '13px', fontFamily: 'monospace', overflowX: 'auto', marginBottom: '16px', border: '1px solid #334155' }}>
                            {codeContent.join('\n')}
                        </pre>
                    );
                    codeContent = [];
                    inCodeBlock = false;
                } else {
                    inCodeBlock = true;
                }
                return;
            }

            if (inCodeBlock) {
                codeContent.push(line);
                return;
            }

            // Inline code
            const renderInline = (text: string) => {
                const parts = text.split(/(`[^`]+`)/g);
                return parts.map((part, i) => {
                    if (part.startsWith('`') && part.endsWith('`')) {
                        return <code key={i} style={{ backgroundColor: '#334155', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9em', fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>;
                    }
                    // Bold
                    const boldParts = part.split(/\*\*([^*]+)\*\*/g);
                    if (boldParts.length > 1) {
                        return boldParts.map((bp, j) => {
                            if (j % 2 === 1) return <strong key={j}>{bp}</strong>;
                            return bp;
                        });
                    }
                    return part;
                });
            };

            // Headings
            if (line.startsWith('# ')) {
                elements.push(<h2 key={idx} style={{ color: '#f8fafc', fontSize: '1.4rem', marginTop: '24px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>{renderInline(line.slice(2))}</h2>);
            } else if (line.startsWith('## ')) {
                elements.push(<h3 key={idx} style={{ color: '#38bdf8', fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>{renderInline(line.slice(3))}</h3>);
            } else if (line.startsWith('### ')) {
                elements.push(<h4 key={idx} style={{ color: '#fbbf24', fontSize: '1rem', marginTop: '16px', marginBottom: '8px' }}>{renderInline(line.slice(4))}</h4>);
            } else if (line.startsWith('> ')) {
                elements.push(<blockquote key={idx} style={{ borderLeft: '3px solid #38bdf8', paddingLeft: '16px', color: '#94a3b8', fontStyle: 'italic', margin: '12px 0' }}>{renderInline(line.slice(2))}</blockquote>);
            } else if (line.startsWith('- **')) {
                // Bold list item
                const content = line.slice(2);
                elements.push(<div key={idx} style={{ paddingLeft: '16px', marginBottom: '8px', color: '#cbd5e1', lineHeight: '1.6', fontSize: '14px' }}>• {renderInline(content)}</div>);
            } else if (line.startsWith('- ')) {
                elements.push(<div key={idx} style={{ paddingLeft: '16px', marginBottom: '8px', color: '#cbd5e1', lineHeight: '1.6', fontSize: '14px' }}>• {renderInline(line.slice(2))}</div>);
            } else if (line.trim() === '') {
                elements.push(<div key={idx} style={{ height: '8px' }} />);
            } else if (line.startsWith('---')) {
                elements.push(<hr key={idx} style={{ border: 'none', borderTop: '1px solid #334155', margin: '20px 0' }} />);
            } else {
                elements.push(<p key={idx} style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '14px', marginBottom: '8px' }}>{renderInline(line)}</p>);
            }
        });

        return elements;
    };

    const tabStyle = (tab: string) => ({
        padding: '10px 20px',
        backgroundColor: activeTab === tab ? '#3b82f6' : '#1e293b',
        color: activeTab === tab ? '#fff' : '#94a3b8',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap' as const,
        fontSize: '14px'
    });

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', boxSizing: 'border-box' }}>
            <div style={{ backgroundColor: '#0f172a', width: '100%', maxWidth: '800px', height: '90vh', borderRadius: '24px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>

                {/* Header */}
                <div style={{ padding: '20px 30px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.5rem' }}>📢 Novedades y Hoja de Ruta</h2>
                    <button onClick={onClose} aria-label="Cerrar novedades" style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
                </div>

                {/* Tabs */}
                <div style={{ padding: '16px 30px', display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid #1e293b' }}>
                    <button style={tabStyle('roadmap')} onClick={() => setActiveTab('roadmap')}>🗺️ Hoja de Ruta</button>
                    <button style={tabStyle('frontend')} onClick={() => setActiveTab('frontend')}>🎨 Frontend</button>
                    <button style={tabStyle('backend')} onClick={() => setActiveTab('backend')}>⚙️ Backend</button>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, padding: '20px 30px', overflowY: 'auto' }}>
                    {activeTab === 'roadmap' && renderMarkdown(roadmapContent)}
                    {activeTab === 'frontend' && renderMarkdown(frontChangelog)}
                    {activeTab === 'backend' && renderMarkdown(backChangelog)}
                </div>

            </div>
        </div>
    );
}