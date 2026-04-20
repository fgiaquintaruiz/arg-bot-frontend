import React, { useState, useEffect, useMemo } from 'react';
import { API_URL } from '../config';
import AddressBook, { AddressEntry } from './AddressBook';

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

    if (!data || !data.balances) return <div style={{ color: '#848E9C', padding: '40px 20px', textAlign: 'center', fontSize: '14px' }}>Cargando saldos...</div>;

    const addressBook = useMemo(() => {
        try {
            const stored = localStorage.getItem('address_book');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    }, []);
    const hasAddressBookEntry = addressBook.length > 0;

    const selectedEntry = useMemo(
        () => addressBook.find((entry: AddressEntry) => entry.address.toLowerCase() === address.toLowerCase()),
        [address, addressBook]
    );
    const truncateAddress = (addr: string) => {
        if (addr.length <= 12) return addr;
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const handleAddressSelect = (selectedAddress: string) => {
        setAddress(selectedAddress);
        setShowAddressBook(false);
    };

    const handleWithdraw = async () => {
        if (!hasAddressBookEntry) {
            setErrorMsg('Debes agregar una dirección en la libreta de direcciones primero.');
            setShowAddressBook(true);
            return;
        }
        if (address && hasAddressBookEntry) {
            const isInBook = addressBook.some((entry: AddressEntry) => entry.address.toLowerCase() === address.toLowerCase());
            if (!isInBook) {
                setErrorMsg('La dirección debe ser seleccionada de la libreta de direcciones.');
                return;
            }
        }
        if (!address || !amount || parseFloat(amount) <= 0) return;
        if (parseFloat(amount) > parseFloat(data.balances.usdc)) {
            setErrorMsg('Saldo insuficiente. Solo tenés ' + data.balances.usdc + ' USDC.');
            return;
        }
        setLoading(true); setErrorMsg(''); setSuccessMsg('');
        try {
            const res = await fetch(`${API_URL}/api/withdraw`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: localStorage.getItem('binance_key'), apiSecret: localStorage.getItem('binance_secret'), address, amountUsdc: amount }) });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Fallo en el retiro');
            setSuccessMsg('¡Solicitud de retiro enviada!');
            setTimeout(() => onSuccess && onSuccess(), 2000);
        } catch (e: any) { setErrorMsg(e.message); } finally { setLoading(false); }
    };

    return (
        <div style={{ backgroundColor: '#1E2329', borderRadius: '12px', border: '1px solid #2B3139' }}>

            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #2B3139', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>🏦</span>
                <h3 style={{ margin: 0, color: '#EAECEF', fontSize: '1rem', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                    Retirar USDC
                </h3>
            </div>

            <div style={{ padding: '20px' }}>

                {/* Address section label */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', color: '#474D57', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Destino (Nexo / Lemon / BSC)
                    </label>
                    <span style={{ fontSize: '11px', color: hasAddressBookEntry ? '#0ECB81' : '#F0B90B', fontWeight: 500 }}>
                        {hasAddressBookEntry ? 'Libreta disponible' : 'Libreta vacía'}
                    </span>
                </div>

                {/* Address selector */}
                {hasAddressBookEntry ? (
                    <button
                        onClick={() => setShowAddressBook(true)}
                        onTouchEnd={(e) => { e.preventDefault(); setShowAddressBook(true); }}
                        style={{
                            backgroundColor: '#181A20',
                            border: selectedEntry ? '1px solid #0ECB81' : '1px solid #2B3139',
                            borderRadius: '8px', padding: '14px 16px', marginBottom: '12px',
                            width: '100%', textAlign: 'left', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            WebkitTapHighlightColor: 'transparent', WebkitAppearance: 'none',
                            touchAction: 'manipulation', minHeight: '64px',
                        }}
                    >
                        {selectedEntry ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(14,203,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>👤</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: '#EAECEF', fontWeight: 600, fontSize: '14px', userSelect: 'none' }}>{selectedEntry.name}</div>
                                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#848E9C', fontSize: '12px', marginTop: '2px', userSelect: 'none' }}>{truncateAddress(selectedEntry.address)}</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: '#474D57', fontSize: '14px', flex: 1, userSelect: 'none' }}>
                                Seleccioná una dirección →
                            </div>
                        )}
                        <span style={{ color: '#848E9C', fontSize: '14px', marginLeft: '8px', flexShrink: 0 }}>✏️</span>
                    </button>
                ) : (
                    <div style={{ backgroundColor: '#181A20', border: '1px solid #2B3139', borderRadius: '8px', padding: '16px', marginBottom: '12px', textAlign: 'center' }}>
                        <div style={{ color: '#848E9C', fontSize: '13px', marginBottom: '12px' }}>No tenés direcciones guardadas</div>
                        <button
                            onClick={() => setShowAddressBook(true)}
                            onTouchEnd={(e) => { e.preventDefault(); setShowAddressBook(true); }}
                            style={{ padding: '10px 20px', backgroundColor: 'rgba(240,185,11,0.1)', color: '#F0B90B', border: '1px solid rgba(240,185,11,0.2)', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
                        >
                            Abrir libreta de direcciones
                        </button>
                    </div>
                )}

                {/* BSC warning — only when no address selected */}
                {!selectedEntry && (
                    <div style={{ backgroundColor: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.15)', color: '#F0B90B', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '14px', lineHeight: '1.5' }}>
                        ⚠️ <strong>Red BSC (BEP20) exclusiva.</strong> Enviá a la red equivocada y perdés los fondos.
                    </div>
                )}

                {/* Amount */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#848E9C', marginBottom: '8px', alignItems: 'center' }}>
                    <span>Disponible: {data.balances.usdc} USDC</span>
                    <button
                        onClick={() => setAmount(data.balances.usdc)}
                        style={{ padding: '3px 10px', backgroundColor: 'rgba(240,185,11,0.1)', color: '#F0B90B', border: '1px solid rgba(240,185,11,0.2)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}
                    >
                        MAX
                    </button>
                </div>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setErrorMsg(''); }}
                    style={{ width: '100%', padding: '13px 14px', backgroundColor: '#181A20', border: '1px solid #2B3139', color: '#EAECEF', borderRadius: '8px', marginBottom: '16px', fontSize: '16px', fontWeight: 600, boxSizing: 'border-box', fontFamily: "'IBM Plex Mono', monospace", outline: 'none' }}
                    placeholder="Monto a retirar"
                />

                {errorMsg && (
                    <div style={{ color: '#F6465D', fontSize: '13px', marginBottom: '14px', textAlign: 'center', backgroundColor: 'rgba(246,70,93,0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(246,70,93,0.2)' }}>
                        {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div style={{ color: '#0ECB81', fontSize: '14px', marginBottom: '14px', textAlign: 'center', fontWeight: 600 }}>
                        ✓ {successMsg}
                    </div>
                )}

                {!hasAddressBookEntry && (
                    <div style={{ color: '#F0B90B', fontSize: '12px', marginBottom: '14px', textAlign: 'center', backgroundColor: 'rgba(240,185,11,0.06)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(240,185,11,0.15)' }}>
                        Agregá una dirección en la libreta antes de retirar.
                    </div>
                )}

                <button
                    onClick={handleWithdraw}
                    style={{ width: '100%', padding: '13px', backgroundColor: '#C3A1FF', color: '#181A20', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '8px', fontFamily: "'IBM Plex Sans', sans-serif', opacity: loading || !hasAddressBookEntry ? 0.5 : 1" }}
                    disabled={loading || !hasAddressBookEntry}
                >
                    {loading ? 'Procesando...' : 'Confirmar retiro'}
                </button>

                {onClose && (
                    <button
                        onClick={onClose}
                        aria-label="Volver al menú"
                        style={{ width: '100%', padding: '13px', backgroundColor: 'transparent', border: 'none', color: '#848E9C', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
                        disabled={loading}
                    >
                        ← Volver al menú
                    </button>
                )}
            </div>

            {showAddressBook && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}>
                    <div style={{ maxWidth: '500px', width: '100%' }}>
                        <AddressBook onSelect={handleAddressSelect} onClose={() => setShowAddressBook(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}
