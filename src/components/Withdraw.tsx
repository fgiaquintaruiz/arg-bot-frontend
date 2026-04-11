import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import AddressBook from './AddressBook';

export interface CoreData { balances: { eur: string; usdc: string }; fees: { tradingRate: number; withdrawalUSDC_BEP20: number }; }
interface WithdrawProps { data: CoreData; onClose?: () => void; onSuccess?: () => void; }

export default function Withdraw({ data, onClose, onSuccess }: WithdrawProps) {
    const [address, setAddress] = useState<string>(localStorage.getItem('usdc_wallet') || '');
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [successMsg, setSuccessMsg] = useState<string>('');
    const [showAddressBook, setShowAddressBook] = useState<boolean>(false);

    useEffect(() => { localStorage.setItem('usdc_wallet', address); }, [address]);

    if (!data || !data.balances) return <div style={{ color: '#8897a7', padding: '20px', textAlign: 'center' }}>Cargando saldos...</div>;

    const handleAddressSelect = (selectedAddress: string) => {
        setAddress(selectedAddress);
        setShowAddressBook(false);
    };

    const handleWithdraw = async () => {
        if (!address || !amount || parseFloat(amount) <= 0) return;
        if (parseFloat(amount) > parseFloat(data.balances.usdc)) {
            setErrorMsg('Saldo insuficiente. Solo tenés ' + data.balances.usdc + ' USDC.');
            return;
        }

        setLoading(true); setErrorMsg(''); setSuccessMsg('');
        try {
            // Usamos API_URL directamente
            const res = await fetch(`${API_URL}/api/withdraw`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: localStorage.getItem('binance_key'), apiSecret: localStorage.getItem('binance_secret'), address, amountUsdc: amount }) });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Fallo en el retiro');
            setSuccessMsg('¡Solicitud de retiro enviada!');
            setTimeout(() => onSuccess && onSuccess(), 2000);
        } catch (e: any) { setErrorMsg(e.message); } finally { setLoading(false); }
    };

    const btnS: React.CSSProperties = { width: '100%', padding: '16px', backgroundColor: '#a78bfa', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px' };
    const backBtnS: React.CSSProperties = { width: '100%', padding: '16px', backgroundColor: 'transparent', border: 'none', color: '#a78bfa', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s' };

    return (
        <div style={{ backgroundColor: '#17212b', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', border: '1px solid #1e293b' }}>
            <h3 style={{marginTop:0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem'}}><span style={{fontSize: '24px'}}>🏦</span> Retirar USDC</h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{fontSize:'13px', color:'#94a3b8'}}>Wallet Destino (BuenBit/Lemon):</label>
                <span style={{fontSize:'11px', color:'#4caf50'}}>💾 Auto-guardado</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input value={address} onChange={(e)=>setAddress(e.target.value)} style={{ flex: 1, width: 'auto', padding: '16px', backgroundColor: '#0e1621', border: '1px solid #334155', color: 'white', borderRadius: '12px', fontSize: '16px', boxSizing: 'border-box' }} placeholder="0x..." />
                <button
                    onClick={() => setShowAddressBook(true)}
                    style={{
                        padding: '16px 20px',
                        backgroundColor: '#1e293b',
                        color: '#38bdf8',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                    title="Open Address Book"
                >
                    📖
                </button>
            </div>

            <div style={{ backgroundColor: '#2d2013', border: '1px solid #ff9800', color: '#ffb74d', padding: '16px', borderRadius: '12px', fontSize: '12px', marginBottom: '20px', lineHeight: '1.5', textAlign: 'center' }}>
                <b>⚠️ RED BSC (BEP20) EXCLUSIVA:</b> Si envías a una red equivocada, los fondos se perderán.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
                <span>Disponible: {data.balances.usdc} USDC</span>
                <button onClick={() => setAmount(data.balances.usdc)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 'bold' }}>MAX</button>
            </div>
            <input type="number" value={amount} onChange={(e)=>{setAmount(e.target.value); setErrorMsg('');}} style={{ width: '100%', padding: '16px', backgroundColor: '#0e1621', border: '1px solid #334155', color: 'white', borderRadius: '12px', marginBottom: '24px', fontSize: '16px', boxSizing: 'border-box' }} placeholder="Monto a retirar" />

            {errorMsg && <div style={{ color: '#ef5350', fontSize: '14px', marginBottom: '16px', textAlign: 'center', backgroundColor: '#450a0a', padding: '10px', borderRadius: '8px' }}>⚠️ {errorMsg}</div>}
            {successMsg && <div style={{ color: '#4caf50', fontSize: '14px', marginBottom: '16px', textAlign: 'center', fontWeight: 'bold' }}>✅ {successMsg}</div>}

            <button onClick={handleWithdraw} style={btnS} disabled={loading}>{loading ? 'PROCESANDO...' : 'CONFIRMAR RETIRO'}</button>
            {onClose && <button onClick={onClose} style={backBtnS} disabled={loading}><span>⬅</span> <span>Volver al Menú</span></button>}

            {showAddressBook && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    padding: '20px',
                    boxSizing: 'border-box'
                }}>
                    <div style={{ maxWidth: '500px', width: '100%' }}>
                        <AddressBook onSelect={handleAddressSelect} onClose={() => setShowAddressBook(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}