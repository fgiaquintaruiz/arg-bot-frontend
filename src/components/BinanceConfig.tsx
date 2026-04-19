import React, {useState, useEffect} from 'react';
import {API_URL} from '../config';
import CryptoJS from 'crypto-js';
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

export default function BinanceConfig({onSave, onCancel}: Readonly<{ onSave: () => void, onCancel: () => void }>) {
    const [key, setKey] = useState(localStorage.getItem('binance_key') || '');
    const [secret, setSecret] = useState(localStorage.getItem('binance_secret') || '');
    const [serverIp, setServerIp] = useState('Obteniendo IP...');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/api/ip`)
            .then(res => res.json())
            .then(data => setServerIp(data.ip || 'Error al obtener IP'))
            .catch(() => setServerIp('No se pudo conectar al servidor'));
    }, []);

    const handleSave = () => {
        if (!ENCRYPTION_KEY) return alert("Error: Encryption key missing");
        const encryptedKey = CryptoJS.AES.encrypt(key, ENCRYPTION_KEY).toString();
        const encryptedSecret = CryptoJS.AES.encrypt(secret, ENCRYPTION_KEY).toString();
        localStorage.setItem('binance_key', encryptedKey);
        localStorage.setItem('binance_secret', encryptedSecret);
        onSave();
    };

    const copyIp = () => {
        navigator.clipboard.writeText(serverIp);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '13px 14px', backgroundColor: '#181A20',
        border: '1px solid #2B3139', color: '#EAECEF', borderRadius: '8px',
        marginBottom: '16px', fontSize: '14px', boxSizing: 'border-box',
        fontFamily: "'IBM Plex Mono', monospace", outline: 'none',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '11px', color: '#474D57',
        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px',
    };

    return (
        <div style={{ backgroundColor: '#1E2329', borderRadius: '12px', border: '1px solid #2B3139' }}>

            <div style={{ padding: '16px 20px', borderBottom: '1px solid #2B3139', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>🔑</span>
                <h3 style={{ margin: 0, color: '#EAECEF', fontSize: '1rem', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                    API de Binance
                </h3>
            </div>

            <div style={{ padding: '20px' }}>

                <p style={{ fontSize: '13px', color: '#848E9C', marginBottom: '16px', lineHeight: '1.6', margin: '0 0 16px' }}>
                    Credenciales Spot/Withdrawal. Se guardan <strong style={{ color: '#EAECEF' }}>localmente en tu dispositivo</strong>.
                </p>

                {/* IP Whitelist */}
                <div style={{ backgroundColor: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.2)', padding: '12px 14px', borderRadius: '8px', marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#F0B90B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>IP para Whitelist de Binance</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#EAECEF', flex: 1 }}>{serverIp}</span>
                        <button
                            onClick={copyIp}
                            style={{ padding: '6px 14px', backgroundColor: copied ? 'rgba(14,203,129,0.1)' : 'rgba(240,185,11,0.1)', color: copied ? '#0ECB81' : '#F0B90B', border: `1px solid ${copied ? 'rgba(14,203,129,0.3)' : 'rgba(240,185,11,0.3)'}`, borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif", whiteSpace: 'nowrap' }}
                        >
                            {copied ? '✓ Copiada' : 'Copiar'}
                        </button>
                    </div>
                </div>

                <label style={labelStyle}>API Key</label>
                <input type="text" value={key} onChange={e => setKey(e.target.value)} style={inputStyle} placeholder="Ingresá tu API Key" />

                <label style={labelStyle}>API Secret</label>
                <input type="password" value={secret} onChange={e => setSecret(e.target.value)} style={inputStyle} placeholder="Ingresá tu API Secret" />

                <button
                    onClick={handleSave}
                    style={{ width: '100%', padding: '13px', backgroundColor: '#F0B90B', color: '#181A20', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '8px', fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                    Guardar credenciales
                </button>
                <button
                    onClick={onCancel}
                    style={{ width: '100%', padding: '13px', backgroundColor: 'transparent', border: 'none', color: '#848E9C', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                    ← Cancelar
                </button>
            </div>
        </div>
    );
}
