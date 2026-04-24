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

### ✅ Lanzado recientemente
- **Whitelist de acceso:** Solo cuentas de Google autorizadas pueden ingresar. Fail-closed si la variable de entorno está vacía.
- **Rediseño UI:** Paleta Binance-inspired, IBM Plex Sans, radios 8-12px y tasas en vivo en el Dashboard.
- **Calculadora bidireccional:** Editá ARS → ves el EUR necesario, o editá EUR → ves los ARS resultantes.
- **Libreta de direcciones BSC:** Guardá wallets con validación EIP-55 y nombre amigable. Retiro solo permite direcciones de la libreta.
- **Historial de operaciones:** Cada operación registra fecha, monto EUR, USDC recibido y fee. El Dashboard muestra las tasas EUR/USDC y USDC/ARS en vivo.
- **Sincronización Google Drive:** Subí y bajá tu config (claves API, libreta, historial) desde Drive. OAuth silencioso, sin contraseña adicional.
- **Transferencia SEPA asistida:** Botón para abrir tu app bancaria con los datos de Binance pre-rellenados. Fallback con copia manual si el banco no soporta \`payto:\`.

### 🔥 Prioridad alta (próximos lanzamientos)
- **Fee de servicio:** Cobro opcional por transferencia — pendiente autorización escrita de redacted (cláusula 3.1). El feature está completo, se activa con un flip de flag.
- **Seguridad backend JWT:** Verificación de tokens Google con \`firebase-admin\` para proteger la API y blindar futuras rutas de estadísticas.
- **Métricas en vivo:** Panel público con total de operaciones, usuarios activos y estadísticas de uso — prueba social de la plataforma.

### 🚀 Próximamente
- **Notificaciones:** Alerta por email o Telegram cuando se completa un retiro exitoso.
- **Historial mejorado:** Filtros por fecha, exportación a CSV.
- **Feed de operaciones:** Lista pública anonimizada de transacciones recientes.

### 🔮 Futuro a mediano plazo
- Soporte para múltiples corredores (EUR→COP, USD→ARS, etc.).
- Integración con más exchanges locales además de Nexo.
- App móvil nativa (PWA avanzada).

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

    const renderMarkdown = (md: string) => {
        const lines = md.split('\n');
        const elements: React.ReactNode[] = [];
        let inCodeBlock = false;
        let codeContent: string[] = [];

        lines.forEach((line, idx) => {
            if (line.trim().startsWith('```')) {
                if (inCodeBlock) {
                    elements.push(
                        <pre key={idx} style={{ backgroundColor: '#181A20', padding: '14px', borderRadius: '8px', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", overflowX: 'auto', marginBottom: '14px', border: '1px solid #2B3139' }}>
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

            if (inCodeBlock) { codeContent.push(line); return; }

            const renderInline = (text: string) => {
                const parts = text.split(/(`[^`]+`)/g);
                return parts.map((part, i) => {
                    if (part.startsWith('`') && part.endsWith('`')) {
                        return <code key={i} style={{ backgroundColor: '#2B3139', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9em', fontFamily: "'IBM Plex Mono', monospace", color: '#EAECEF' }}>{part.slice(1, -1)}</code>;
                    }
                    const boldParts = part.split(/\*\*([^*]+)\*\*/g);
                    if (boldParts.length > 1) {
                        return boldParts.map((bp, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#EAECEF' }}>{bp}</strong> : bp);
                    }
                    return part;
                });
            };

            if (line.startsWith('# ')) {
                elements.push(<h2 key={idx} style={{ color: '#EAECEF', fontSize: '1.2rem', fontWeight: 700, marginTop: '20px', marginBottom: '12px', fontFamily: "'IBM Plex Sans', sans-serif" }}>{renderInline(line.slice(2))}</h2>);
            } else if (line.startsWith('## ')) {
                elements.push(<h3 key={idx} style={{ color: '#F0B90B', fontSize: '1rem', fontWeight: 600, marginTop: '18px', marginBottom: '8px', fontFamily: "'IBM Plex Sans', sans-serif" }}>{renderInline(line.slice(3))}</h3>);
            } else if (line.startsWith('### ')) {
                elements.push(<h4 key={idx} style={{ color: '#848E9C', fontSize: '11px', fontWeight: 600, marginTop: '16px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'IBM Plex Sans', sans-serif" }}>{renderInline(line.slice(4))}</h4>);
            } else if (line.startsWith('> ')) {
                elements.push(<blockquote key={idx} style={{ borderLeft: '2px solid #2B3139', paddingLeft: '14px', color: '#848E9C', fontStyle: 'italic', margin: '10px 0' }}>{renderInline(line.slice(2))}</blockquote>);
            } else if (line.startsWith('- ')) {
                elements.push(<div key={idx} style={{ paddingLeft: '14px', marginBottom: '7px', color: '#848E9C', lineHeight: '1.6', fontSize: '13px', fontFamily: "'IBM Plex Sans', sans-serif" }}>· {renderInline(line.slice(2))}</div>);
            } else if (line.trim() === '') {
                elements.push(<div key={idx} style={{ height: '6px' }} />);
            } else if (line.startsWith('---')) {
                elements.push(<hr key={idx} style={{ border: 'none', borderTop: '1px solid #2B3139', margin: '18px 0' }} />);
            } else {
                elements.push(<p key={idx} style={{ color: '#848E9C', lineHeight: '1.6', fontSize: '13px', marginBottom: '8px', fontFamily: "'IBM Plex Sans', sans-serif" }}>{renderInline(line)}</p>);
            }
        });

        return elements;
    };

    const tabStyle = (tab: string): React.CSSProperties => ({
        padding: '8px 16px',
        backgroundColor: activeTab === tab ? '#F0B90B' : 'transparent',
        color: activeTab === tab ? '#181A20' : '#848E9C',
        border: activeTab === tab ? 'none' : '1px solid #2B3139',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        fontSize: '13px',
        fontFamily: "'IBM Plex Sans', sans-serif",
    });

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', boxSizing: 'border-box' }}>
            <div style={{ backgroundColor: '#1E2329', width: '100%', maxWidth: '760px', height: '90vh', borderRadius: '12px', border: '1px solid #2B3139', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #2B3139', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: '#EAECEF', fontSize: '1rem', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>Novedades y Hoja de Ruta</h2>
                    <button onClick={onClose} aria-label="Cerrar novedades" style={{ background: 'transparent', border: 'none', color: '#848E9C', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1, padding: '4px' }}>✖</button>
                </div>

                {/* Tabs */}
                <div style={{ padding: '12px 24px', display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid #2B3139' }}>
                    <button style={tabStyle('roadmap')} onClick={() => setActiveTab('roadmap')}>Hoja de Ruta</button>
                    <button style={tabStyle('frontend')} onClick={() => setActiveTab('frontend')}>Frontend</button>
                    <button style={tabStyle('backend')} onClick={() => setActiveTab('backend')}>Backend</button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
                    {activeTab === 'roadmap' && renderMarkdown(roadmapContent)}
                    {activeTab === 'frontend' && renderMarkdown(frontChangelog)}
                    {activeTab === 'backend' && renderMarkdown(backChangelog)}
                </div>

            </div>
        </div>
    );
}
