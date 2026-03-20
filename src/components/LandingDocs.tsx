import React from 'react';

export default function LandingDocs() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

            {/* What does the app do? */}
            <div style={{ backgroundColor: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155' }}>
                <h2 style={{ fontSize: '1.4rem', marginTop: 0, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚡</span> ¿Cómo funciona ARGBOT?
                </h2>
                <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '15px' }}>
                    Las plataformas tradicionales cobran comisiones ocultas y ofrecen un tipo de cambio desfavorable. ARGBOT soluciona esto <b>automatizando el mercado cripto</b>:
                </p>
                <ul style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '15px', paddingLeft: '20px' }}>
                    <li><b>Cálculo exacto:</b> Utilizamos la API pública de <b>Buenbit</b> en tiempo real para calcular exactamente cuántos Euros necesitás para cubrir tu meta en Pesos Argentinos (ARS).</li>
                    <li><b>Ejecución P2P:</b> Automatizamos la compra de USDC en Binance usando tus propios fondos en EUR.</li>
                    <li><b>Retiros flexibles:</b> Aunque cotizamos con Buenbit, el bot puede enviar tus USDC a <b>cualquier billetera compatible con la red BEP20 (BSC)</b> que vos configures.</li>
                    <li><b>Visión a futuro:</b> Actualmente optimizado para el corredor Europa ➡️ Argentina, con arquitectura preparada para expandirse a nuevos mercados globales.</li>
                </ul>
            </div>

            {/* Prerequisites & Binance Rules */}
            <div style={{ backgroundColor: '#2d2013', padding: '25px', borderRadius: '16px', border: '1px solid #ff9800' }}>
                <h2 style={{ fontSize: '1.4rem', marginTop: 0, color: '#ffb74d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚠️</span> Requisitos Previos y Reglas de Depósito
                </h2>
                <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '15px', marginBottom: '10px' }}>
                    Antes de utilizar la herramienta, el usuario <b>debe crear por su cuenta</b> sus perfiles en Binance y en su exchange local. Tené en cuenta las siguientes restricciones estrictas impuestas por Binance para el fondeo de Euros:
                </p>
                <ul style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '15px', paddingLeft: '20px', margin: 0 }}>
                    <li>El nombre que aparezca en tu cuenta bancaria emisora <b>debe coincidir exactamente</b> con el nombre registrado en tu cuenta de Binance.</li>
                    <li><b>No se admiten transferencias SWIFT.</b> Los fondos enviados a través de SWIFT serán rechazados por la red bancaria y tardarán hasta 2 semanas en ser devueltos al remitente. Usá exclusivamente transferencias SEPA.</li>
                </ul>
            </div>

            {/* Security & Legal Disclaimer */}
            <div style={{ backgroundColor: '#17212b', padding: '25px', borderRadius: '16px', border: '1px solid #334155' }}>
                <h2 style={{ fontSize: '1.4rem', marginTop: 0, color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🛡️</span> Transparencia, Seguridad y Términos Legales
                </h2>

                <div style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '14px' }}>
                    <p style={{ marginBottom: '12px' }}>
                        <b style={{ color: '#cbd5e1' }}>1. Arquitectura "Non-Custodial" (Sin custodia):</b> ARGBOT es estrictamente una interfaz de automatización. <b>En ningún momento tomamos control, custodia, ni almacenamos tu dinero.</b> Tus API Keys de Binance se cifran y guardan exclusivamente en el <i>localStorage</i> de tu navegador. Nuestro servidor solo procesa las instrucciones en tránsito sin retener credenciales.
                    </p>

                    <p style={{ marginBottom: '12px' }}>
                        <b style={{ color: '#cbd5e1' }}>2. Permisos mínimos y Whitelist:</b> Al generar tus llaves en Binance, solo debés habilitar "Lectura", "Spot/Margin Trading" y "Retiros". Exigimos el uso de la <b>Whitelist (Lista Blanca)</b> de direcciones IP en Binance, lo que garantiza que, incluso en un escenario de vulnerabilidad extrema, los retiros solo puedan ir a tus propias billeteras pre-aprobadas.
                    </p>

                    <p style={{ marginBottom: '12px' }}>
                        <b style={{ color: '#cbd5e1' }}>3. Independencia corporativa:</b> ARGBOT es una herramienta independiente y no posee asociación, patrocinio, ni relación legal con plataformas como Binance, Buenbit, Lemon, Remitly, Western Union o similares. Las marcas mencionadas son propiedad de sus respectivos dueños y se nombran a título netamente informativo.
                    </p>

                    <p style={{ margin: 0 }}>
                        <b style={{ color: '#cbd5e1' }}>4. Exención de responsabilidad (Cláusula "As-Is"):</b> El servicio se provee "tal cual". El usuario asume la responsabilidad total de mantener la seguridad de sus dispositivos, de las claves de API generadas y de la exactitud de las direcciones de retiro introducidas. ARGBOT no se hace responsable por bloqueos de cuentas de terceros, errores de tipeo en direcciones blockchain, ni fluctuaciones imprevistas del mercado criptográfico.
                    </p>
                </div>
            </div>

        </div>
    );
}