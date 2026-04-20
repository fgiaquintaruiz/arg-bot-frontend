import React from 'react';

export default function LandingDocs() {
    const card: React.CSSProperties = {
        backgroundColor: '#1E2329',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #2B3139',
    };

    const itemStyle: React.CSSProperties = {
        color: '#848E9C',
        lineHeight: '1.7',
        fontSize: '14px',
        marginBottom: '10px',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>

            {/* Card 1: Qué hace */}
            <div style={card}>
                <h2 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '14px', color: '#EAECEF', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚡</span> ¿Cómo te ayuda ARGBOT?
                </h2>
                <p style={itemStyle}>
                    Olvidate de las comisiones ocultas de los servicios de envío tradicionales. Automatizamos el mercado cripto por vos:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                        ['🎯', 'Cálculo exacto', 'Miramos el precio en tiempo real para decirte exactamente cuántos EUR necesitás.'],
                        ['🤖', 'Piloto automático', 'El bot entra a Binance y compra los USDC usando tus propios Euros.'],
                        ['💸', 'A donde vos quieras', 'Podés mandar tus USDC a cualquier billetera BEP20 (Lemon, Nexo, Fiwind, etc.).'],
                    ].map(([icon, title, desc]) => (
                        <div key={title} style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
                            <span style={{ flexShrink: 0 }}>{icon}</span>
                            <span style={{ color: '#848E9C' }}><strong style={{ color: '#EAECEF' }}>{title}:</strong> {desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Card 2: Antes de arrancar */}
            <div style={{ ...card, backgroundColor: 'rgba(240,185,11,0.05)', border: '1px solid rgba(240,185,11,0.15)' }}>
                <h2 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '14px', color: '#F0B90B', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚠️</span> Antes de arrancar
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                        ['📝', 'Tu nombre tiene que coincidir', 'La cuenta bancaria desde donde mandás los EUR tiene que estar a tu mismo nombre que la de Binance.'],
                        ['🛑', 'Cero transferencias SWIFT', 'Usá solo SEPA. Por SWIFT, el banco lo rebota y tu plata puede quedar trabada hasta 2 semanas.'],
                    ].map(([icon, title, desc]) => (
                        <div key={title} style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
                            <span style={{ flexShrink: 0 }}>{icon}</span>
                            <span style={{ color: '#848E9C' }}><strong style={{ color: '#F0B90B' }}>{title}:</strong> {desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Card 3: Seguridad */}
            <div style={card}>
                <h2 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '14px', color: '#EAECEF', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🛡️</span> Tu plata, tu seguridad
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                        ['No tocamos tus fondos', 'ARGBOT es un control remoto, no un banco. Tus claves quedan encriptadas solo en tu dispositivo.'],
                        ['Permisos mínimos + whitelist IP', 'Solo permisos de lectura, trade y retiro. Con la whitelist IP de Binance, los retiros solo van a tu wallet.'],
                        ['Herramienta independiente', 'Sin relación comercial con Binance, Nexo ni ninguna otra empresa.'],
                        ['Las cosas claras', 'Vos sos responsable de verificar que la dirección de retiro sea la correcta antes de confirmar.'],
                    ].map(([title, desc], i) => (
                        <div key={i} style={{ fontSize: '13px', color: '#848E9C' }}>
                            <strong style={{ color: '#EAECEF' }}>{i + 1}. {title}:</strong> {desc}
                        </div>
                    ))}
                </div>
            </div>

            {/* Card 4: Trust badges */}
            <div style={{ ...card, border: '1px solid rgba(14,203,129,0.2)', backgroundColor: 'rgba(14,203,129,0.04)' }}>
                <h2 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '14px', color: '#0ECB81', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✅</span> ¿Por qué confiar en ARGBOT?
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                        ['🔒', 'AES-256', 'Encriptación local'],
                        ['🌐', 'Open Source', 'Código en GitHub'],
                        ['📧', 'Soporte', 'soporte@argbot.app'],
                        ['🔑', 'Solo lectura', 'Sin acceso a depósitos'],
                    ].map(([icon, title, sub]) => (
                        <div key={title} style={{ backgroundColor: '#181A20', padding: '14px', borderRadius: '8px', textAlign: 'center', border: '1px solid #2B3139' }}>
                            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{icon}</div>
                            <div style={{ color: '#EAECEF', fontWeight: 600, fontSize: '12px', marginBottom: '2px' }}>{title}</div>
                            <div style={{ color: '#474D57', fontSize: '11px' }}>{sub}</div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
