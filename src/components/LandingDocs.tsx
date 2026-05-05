import React from 'react';
import styles from './LandingDocs.module.css';

export default function LandingDocs() {
    return (
        <div className={styles.container}>

            {/* Card 1: Qué hace */}
            <div className={styles.card}>
                <h2 className={styles['card-title']}>
                    <span>⚡</span> ¿Cómo te ayuda ARGBOT?
                </h2>
                <p className={styles['item-text']}>
                    Olvidate de las comisiones ocultas de los servicios de envío tradicionales. Automatizamos el mercado cripto por vos:
                </p>
                <div className={styles['items-list']}>
                    {[
                        ['🎯', 'Cálculo exacto', 'Miramos el precio en tiempo real para decirte exactamente cuántos EUR necesitás.'],
                        ['🤖', 'Piloto automático', 'El bot entra a Binance y compra los USDC usando tus propios Euros.'],
                        ['💸', 'A donde vos quieras', 'Podés mandar tus USDC a cualquier billetera BEP20 (Lemon, Nexo, Fiwind, etc.).'],
                    ].map(([icon, title, desc]) => (
                        <div key={title} className={styles['item-row']}>
                            <span className={styles['item-icon']}>{icon}</span>
                            <span className={styles['item-description']}><strong className={styles['item-description-strong']}>{title}:</strong> {desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Card 2: Antes de arrancar */}
            <div className={styles['card-warning']}>
                <h2 className={styles['card-title-warning']}>
                    <span>⚠️</span> Antes de arrancar
                </h2>
                <div className={styles['items-list']}>
                    {[
                        ['📝', 'Tu nombre tiene que coincidir', 'La cuenta bancaria desde donde mandás los EUR tiene que estar a tu mismo nombre que la de Binance.'],
                        ['🛑', 'Cero transferencias SWIFT', 'Usá solo SEPA. Por SWIFT, el banco lo rebota y tu plata puede quedar trabada hasta 2 semanas.'],
                    ].map(([icon, title, desc]) => (
                        <div key={title} className={styles['item-row']}>
                            <span className={styles['item-icon']}>{icon}</span>
                            <span className={styles['item-description']}><strong className={styles['item-description-strong-warning']}>{title}:</strong> {desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Card 3: Seguridad */}
            <div className={styles.card}>
                <h2 className={styles['card-title']}>
                    <span>🛡️</span> Tu plata, tu seguridad
                </h2>
                <div className={styles['items-list-lg']}>
                    {[
                        ['No tocamos tus fondos', 'ARGBOT es un control remoto, no un banco. Tus claves quedan encriptadas solo en tu dispositivo.'],
                        ['Permisos mínimos + whitelist IP', 'Solo permisos de lectura, trade y retiro. Con la whitelist IP de Binance, los retiros solo van a tu wallet.'],
                        ['Herramienta independiente', 'Sin relación comercial con Binance, Nexo ni ninguna otra empresa.'],
                        ['Las cosas claras', 'Vos sos responsable de verificar que la dirección de retiro sea la correcta antes de confirmar.'],
                    ].map(([title, desc], i) => (
                        <div key={i} className={styles['security-item']}>
                            <strong className={styles['security-item-strong']}>{i + 1}. {title}:</strong> {desc}
                        </div>
                    ))}
                </div>
            </div>

            {/* Card 4: Trust */}
            <div className={styles['card-trust']}>
                <h2 className={styles['card-title-trust']}>
                    <span>✅</span> ¿Por qué confiar en ARGBOT?
                </h2>
                <div className={styles['items-list']}>
                    {[
                        ['🔒', 'Encriptación AES-256 local', 'Tus claves nunca salen de tu dispositivo sin cifrar.'],
                        ['🌐', 'Open Source', 'Todo el código está en GitHub para que lo puedas revisar.'],
                        ['🔑', 'Permisos mínimos', 'Solo lectura, trade y retiro. Sin acceso a depósitos fiat.'],
                    ].map(([icon, title, desc]) => (
                        <div key={title} className={styles['item-row']}>
                            <span className={styles['item-icon']}>{icon}</span>
                            <span className={styles['item-description']}>
                                <strong className={styles['item-description-strong-trust']}>{title}</strong>
                                {desc ? ` — ${desc}` : ''}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
