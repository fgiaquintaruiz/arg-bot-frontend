import React, {useState, useEffect} from 'react';
import {API_URL} from '../config';
import CryptoJS from 'crypto-js';
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

export default function BinanceConfig({onSave, onCancel}: Readonly<{ onSave: () => void, onCancel: () => void }>) {
    const [key, setKey] = useState(localStorage.getItem('binance_key') || '');
    const [secret, setSecret] = useState(localStorage.getItem('binance_secret') || '');
    const [serverIp, setServerIp] = useState('Obteniendo IP del servidor...');
    useEffect(() => {
        fetch(`${API_URL}/api/ip`)
            .then(res => res.json())
            .then(data => setServerIp(data.ip || 'Error al obtener IP'))
            .catch(() => setServerIp('No se pudo conectar al servidor'));
    }, []);

    const handleSave = () => {
        if (!ENCRYPTION_KEY) return alert("Error: Encryption key missing");

        // Encriptamos antes de guardar en localStorage
        const encryptedKey = CryptoJS.AES.encrypt(key, ENCRYPTION_KEY).toString();
        const encryptedSecret = CryptoJS.AES.encrypt(secret, ENCRYPTION_KEY).toString();

        localStorage.setItem('binance_key', encryptedKey);
        localStorage.setItem('binance_secret', encryptedSecret);
        onSave();
    };

    const btnS: React.CSSProperties = {
        width: '100%',
        padding: '16px',
        backgroundColor: '#f59e0b',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '15px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginBottom: '12px'
    };
    const backBtnS: React.CSSProperties = {
        width: '100%',
        padding: '16px',
        backgroundColor: 'transparent',
        border: 'none',
        color: '#8897a7',
        borderRadius: '12px',
        fontSize: '15px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px'
    };
    const inS: React.CSSProperties = {
        width: '100%',
        padding: '16px',
        backgroundColor: '#0e1621',
        border: '1px solid #334155',
        color: 'white',
        borderRadius: '12px',
        marginBottom: '16px',
        fontSize: '14px',
        boxSizing: 'border-box'
    };

    return (
        <div style={{ backgroundColor: '#17212b', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', border: '1px solid #1e293b' }}>
            <h3 style={{marginTop:0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem'}}><span style={{fontSize: '24px'}}>🔑</span> API de Binance</h3>

            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', lineHeight: '1.5' }}>
                Ingresá tus credenciales de lectura y escritura (Spot/Withdrawal). Esta información se guarda <b>localmente en tu dispositivo</b>.
            </p>

            <div style={{ backgroundColor: '#2d2013', border: '1px solid #ff9800', padding: '12px', borderRadius: '12px', marginBottom: '20px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#ffb74d', marginBottom: '6px' }}><b>⚠️ IP para la Whitelist de Binance:</b></p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#fff' }}>{serverIp}</span>
                    <button onClick={() => navigator.clipboard.writeText(serverIp)} style={{ background: '#ff9800', color: '#000', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>COPIAR</button>
                </div>
            </div>

            <label style={{display:'block', fontSize:'13px', color:'#94a3b8', marginBottom:'8px'}}>API Key</label>
            <input type="text" value={key} onChange={e => setKey(e.target.value)} style={inS} placeholder="Ingresá tu API Key" />

            <label style={{display:'block', fontSize:'13px', color:'#94a3b8', marginBottom:'8px'}}>API Secret</label>
            <input type="password" value={secret} onChange={e => setSecret(e.target.value)} style={inS} placeholder="Ingresá tu API Secret" />

            <button onClick={handleSave} style={btnS}>GUARDAR CREDENCIALES</button>
            <button onClick={onCancel} style={backBtnS}><span>⬅</span> <span>Volver al Menú</span></button>
        </div>
    );
}
