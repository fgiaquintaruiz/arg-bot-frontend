import React from 'react';

export default function LandingDocs() {
    const cardStyle: React.CSSProperties = {
        backgroundColor: '#1e293b', // Un azul oscuro más suave
        padding: '30px',
        borderRadius: '20px',
        border: '1px solid #334155',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        transition: 'transform 0.2s ease',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '1.3rem',
        marginTop: 0,
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontWeight: '600'
    };

    const pStyle: React.CSSProperties = {
        color: '#cbd5e1',
        lineHeight: '1.7',
        fontSize: '15px',
        marginBottom: '16px'
    };

    const listStyle: React.CSSProperties = {
        color: '#cbd5e1',
        lineHeight: '1.8',
        fontSize: '15px',
        paddingLeft: '0',
        listStyleType: 'none',
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>

            {/* Card 1: Qué hace */}
            <div style={cardStyle}>
                <h2 style={{ ...titleStyle, color: '#60a5fa' }}>
                    <span style={{ fontSize: '1.5rem' }}>⚡</span> ¿Cómo te ayuda ARGBOT?
                </h2>
                <p style={pStyle}>
                    Olvidate de las comisiones ocultas y los tipos de cambio malos de las remesadoras tradicionales. Nosotros hacemos el trabajo pesado automatizando el mercado cripto por vos:
                </p>
                <ul style={listStyle}>
                    <li>🎯 <b>Cálculo exacto:</b> Miramos el precio en tiempo real de Buenbit para decirte justo cuántos Euros necesitás enviar para que te lleguen los Pesos que querés.</li>
                    <li>🤖 <b>Piloto automático:</b> El bot entra a Binance y compra los USDC usando tus propios Euros.</li>
                    <li>💸 <b>A donde vos quieras:</b> Aunque usamos Buenbit de referencia, podés mandar tus USDC a cualquier billetera de la red BEP20 (Lemon, Buenbit, Fiwind, etc.).</li>
                </ul>
            </div>

            {/* Card 2: Reglas claras */}
            <div style={{...cardStyle, backgroundColor: '#2d2417', borderColor: '#78350f'}}>
                <h2 style={{ ...titleStyle, color: '#fbbf24' }}>
                    <span style={{ fontSize: '1.5rem' }}>⚠️</span> Antes de arrancar
                </h2>
                <p style={pStyle}>
                    Para que todo fluya, necesitás tener tus propias cuentas en Binance y en tu exchange argentino. Además, Binance tiene un par de reglas de oro para cuando mandes tus Euros:
                </p>
                <ul style={listStyle}>
                    <li>📝 <b>Tu nombre tiene que coincidir:</b> La cuenta bancaria desde donde mandás los Euros tiene que estar a tu mismo nombre que la cuenta de Binance.</li>
                    <li>🛑 <b>Cero transferencias SWIFT:</b> Usá solo transferencias <b>SEPA</b>. Si mandás por SWIFT, el banco lo rebota y tu plata puede quedar trabada hasta 2 semanas.</li>
                </ul>
            </div>

            {/* Card 3: Seguridad y Legales */}
            <div style={cardStyle}>
                <h2 style={{ ...titleStyle, color: '#f87171' }}>
                    <span style={{ fontSize: '1.5rem' }}>🛡️</span> Tu plata, tu seguridad
                </h2>
                <ul style={listStyle}>
                    <li>
                        <b style={{ color: '#fff' }}>1. Nosotros no tocamos tus fondos:</b>
                        <br />ARGBOT es un control remoto, no un banco. No guardamos tu plata ni tus contraseñas. Tus claves de Binance quedan encriptadas solo en tu compu/celular.
                    </li>
                    <li>
                        <b style={{ color: '#fff' }}>2. Permisos mínimos y candado IP:</b>
                        <br />El bot solo necesita permisos para leer, hacer trade y retirar. Al usar la "Lista Blanca" de Binance con la IP de nuestro servidor, te asegurás de que los retiros solo puedan ir a tu propia billetera.
                    </li>
                    <li>
                        <b style={{ color: '#fff' }}>3. Herramienta independiente:</b>
                        <br />ARGBOT fue creado para facilitar envíos y no tiene relación comercial con Binance, Buenbit ni Remitly.
                    </li>
                    <li>
                        <b style={{ color: '#fff' }}>4. Las cosas claras:</b>
                        <br />Vos sos responsable de cuidar tus dispositivos y de revisar que la dirección de retiro sea la correcta. No nos podemos hacer cargo si te equivocás de red al pegar la dirección o si Binance bloquea tu cuenta por otros motivos.
                    </li>
                </ul>
            </div>

        </div>
    );
}