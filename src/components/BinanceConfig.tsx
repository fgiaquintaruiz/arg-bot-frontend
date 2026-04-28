import React, {useState, useEffect} from 'react';
import {API_URL} from '../config';

const CRYPTOJS_AES_PREFIX = 'U2FsdGVkX1+';

export default function BinanceConfig({onSave, onCancel}: Readonly<{ onSave: () => void, onCancel: () => void }>) {
    const [activeTab, setActiveTab] = useState<'prod' | 'testnet'>(() =>
        localStorage.getItem('argbot_testnet') === 'true' ? 'testnet' : 'prod'
    );
    const [prodKey, setProdKey] = useState('');
    const [prodSecret, setProdSecret] = useState('');
    const [testnetKey, setTestnetKey] = useState('');
    const [testnetSecret, setTestnetSecret] = useState('');
    const [serverIp, setServerIp] = useState('Obteniendo IP...');
    const [copied, setCopied] = useState(false);
    const [migrated, setMigrated] = useState(false);

    useEffect(() => {
        const storedKey = localStorage.getItem('binance_key') || '';
        const storedSecret = localStorage.getItem('binance_secret') || '';

        if (storedKey.startsWith(CRYPTOJS_AES_PREFIX) || storedSecret.startsWith(CRYPTOJS_AES_PREFIX)) {
            localStorage.removeItem('binance_key');
            localStorage.removeItem('binance_secret');
            setMigrated(true);
        } else {
            setProdKey(storedKey);
            setProdSecret(storedSecret);
        }

        setTestnetKey(localStorage.getItem('binance_key_testnet') || '');
        setTestnetSecret(localStorage.getItem('binance_secret_testnet') || '');
    }, []);

    useEffect(() => {
        fetch(`${API_URL}/api/ip`)
            .then(res => res.json())
            .then(data => setServerIp(data.ip || 'Error al obtener IP'))
            .catch(() => setServerIp('No se pudo conectar al servidor'));
    }, []);

    const handleSave = () => {
        if (activeTab === 'testnet') {
            localStorage.setItem('binance_key_testnet', testnetKey.trim());
            localStorage.setItem('binance_secret_testnet', testnetSecret.trim());
        } else {
            localStorage.setItem('binance_key', prodKey.trim());
            localStorage.setItem('binance_secret', prodSecret.trim());
        }
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

    const tabBtnStyle = (tab: 'prod' | 'testnet'): React.CSSProperties => ({
        flex: 1, padding: '7px 10px',
        backgroundColor: activeTab === tab ? '#F0B90B' : 'transparent',
        color: activeTab === tab ? '#181A20' : '#848E9C',
        border: activeTab === tab ? 'none' : '1px solid #2B3139',
        borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12px',
        fontFamily: "'IBM Plex Sans', sans-serif",
    });

    const isTestnet = activeTab === 'testnet';
    const key = isTestnet ? testnetKey : prodKey;
    const secret = isTestnet ? testnetSecret : prodSecret;
    const setKey = isTestnet ? setTestnetKey : setProdKey;
    const setSecret = isTestnet ? setTestnetSecret : setProdSecret;

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

                {/* Migration notice */}
                {migrated && (
                    <div style={{ backgroundColor: 'rgba(246,70,93,0.08)', border: '1px solid rgba(246,70,93,0.3)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#F6465D', lineHeight: '1.5' }}>
                            Tus claves fueron migradas. Por favor, volvé a ingresarlas.
                        </p>
                    </div>
                )}

                {/* IP Whitelist */}
                <div style={{ backgroundColor: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.2)', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px' }}>
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

                {/* Producción / Testnet tabs */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                    <button style={tabBtnStyle('prod')} onClick={() => setActiveTab('prod')}>
                        Producción
                    </button>
                    <button style={tabBtnStyle('testnet')} onClick={() => setActiveTab('testnet')}>
                        Testnet
                    </button>
                </div>

                {isTestnet && (
                    <div style={{ backgroundColor: 'rgba(14,203,129,0.06)', border: '1px solid rgba(14,203,129,0.2)', padding: '9px 12px', borderRadius: '6px', marginBottom: '14px' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#0ECB81', lineHeight: '1.5' }}>
                            Estas claves son exclusivas del portal <strong>testnet.binance.vision</strong>
                        </p>
                    </div>
                )}

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
