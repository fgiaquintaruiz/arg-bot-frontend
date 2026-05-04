import React, { useState, useEffect, useMemo } from 'react';
import { Building2, User, Pencil, AlertTriangle, X, ChevronRight } from 'lucide-react';
import { API_URL } from '../config';
import AddressBook, { AddressEntry } from './AddressBook';
import {
    getSelectedWithdrawEntry,
    setSelectedWithdrawAddressId,
    clearSelectedWithdrawAddress,
    migrateLegacyUsdcWallet,
} from '../lib/withdrawAddress';

export interface CoreData {
  balances: { eur: string; usdc: string };
  fees: { tradingRate: number };
}
interface WithdrawProps {
  data: CoreData;
  onClose?: () => void;
  onSuccess?: () => void;
  variant?: 'standalone' | 'embedded';
}

export default function Withdraw({ data, onClose, onSuccess, variant = 'standalone' }: WithdrawProps) {
    const [selectedId, setSelectedId] = useState<string | null>(
        () => localStorage.getItem('usdc_wallet_id')
    );
    const [addressBook, setAddressBook] = useState<AddressEntry[]>(() => {
        try {
            const stored = localStorage.getItem('address_book');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [successMsg, setSuccessMsg] = useState<string>('');
    const [showAddressBook, setShowAddressBook] = useState<boolean>(false);
    const [isConfirming, setIsConfirming] = useState<boolean>(false);
    const [irreversibleAccepted, setIrreversibleAccepted] = useState<boolean>(false);

    // Run once on mount: migrate legacy usdc_wallet string to usdc_wallet_id
    useEffect(() => {
        migrateLegacyUsdcWallet();
        const migratedId = localStorage.getItem('usdc_wallet_id');
        if (migratedId) setSelectedId(migratedId);
    }, []);

    // Cross-tab storage event listener
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'address_book') {
                try {
                    const updated: AddressEntry[] = e.newValue ? JSON.parse(e.newValue) : [];
                    setAddressBook(updated);
                    if (selectedId && !updated.find(entry => entry.id === selectedId)) {
                        clearSelectedWithdrawAddress();
                        setSelectedId(null);
                        setErrorMsg('La dirección seleccionada fue eliminada. Elegí otra.');
                        setShowAddressBook(true);
                    }
                } catch { /* graceful degradation */ }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [selectedId]);

    const selectedEntry = useMemo(
        () => selectedId ? addressBook.find(e => e.id === selectedId) ?? null : null,
        [selectedId, addressBook]
    );

    const address = selectedEntry?.address ?? '';
    const isOrphan = selectedId !== null && selectedEntry === null;
    const hasAddressBookEntry = addressBook.length > 0;

    // Orphan detection on render/mount
    useEffect(() => {
        if (isOrphan) {
            clearSelectedWithdrawAddress();
            setSelectedId(null);
            setErrorMsg('La dirección seleccionada fue eliminada. Elegí otra.');
            setShowAddressBook(true);
        }
    }, [isOrphan]);

    const truncateAddress = (addr: string) => {
        if (addr.length <= 12) return addr;
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const handleAddressSelect = (entry: AddressEntry) => {
        setSelectedWithdrawAddressId(entry);
        setSelectedId(entry.id);
        setShowAddressBook(false);
    };

    if (!data || !data.balances) return <div style={{ color: '#848E9C', padding: '40px 20px', textAlign: 'center', fontSize: '14px' }}>Cargando saldos...</div>;

    const handleInitiateWithdraw = () => {
        /* v8 ignore start */
        if (!hasAddressBookEntry) {
            setErrorMsg('Debes agregar una dirección en la libreta de direcciones primero.');
            setShowAddressBook(true);
            return;
        }
        /* v8 ignore end */
        if (!selectedEntry) {
            setErrorMsg('Seleccioná una dirección de tu libreta.');
            return;
        }
        if (!amount || parseFloat(amount) <= 0) return;
        if (parseFloat(amount) > parseFloat(data.balances.usdc)) {
            setErrorMsg('Saldo insuficiente. Solo tenés ' + data.balances.usdc + ' USDC.');
            return;
        }
        setErrorMsg('');
        setIrreversibleAccepted(false);
        setIsConfirming(true);
    };

    const handleCancelConfirmation = () => {
        setIsConfirming(false);
        setIrreversibleAccepted(false);
    };

    const handleConfirmWithdraw = async () => {
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            const isTestnet = localStorage.getItem('argbot_testnet') !== 'false';
            const apiKey = localStorage.getItem(isTestnet ? 'binance_key_testnet' : 'binance_key') || '';
            const apiSecret = localStorage.getItem(isTestnet ? 'binance_secret_testnet' : 'binance_secret') || '';
            const res = await fetch(`${API_URL}/api/withdraw`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey, apiSecret, address, amountUsdc: amount }) });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Fallo en el retiro');
            setSuccessMsg('¡Solicitud de retiro enviada!');
            fetch(`${API_URL}/api/push/notify/withdraw-complete`, {
              method: 'POST',              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            }).catch(() => {});
            setIsConfirming(false);
            setIrreversibleAccepted(false);
            setTimeout(() => onSuccess && onSuccess(), 2000);
        } catch (e: any) {
            setErrorMsg(e.message);
            setIsConfirming(false);
            setIrreversibleAccepted(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#1E2329', borderRadius: '12px', border: '1px solid #2B3139' }}>

            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #2B3139', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={16} color="#848E9C" />
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

                {/* Orphan error message */}
                {isOrphan && (
                    <div style={{ color: '#F6465D', fontSize: '13px', marginBottom: '14px' }}>
                        La dirección seleccionada fue eliminada. Elegí otra de tu libreta.
                    </div>
                )}

                {/* Address selector */}
                {hasAddressBookEntry ? (
                    <button
                        onClick={() => setShowAddressBook(true)}
                        onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); setShowAddressBook(true); }}
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
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(14,203,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><User size={16} color="#0ECB81" /></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: '#EAECEF', fontWeight: 600, fontSize: '14px', userSelect: 'none' }}>{selectedEntry.name}</div>
                                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#848E9C', fontSize: '12px', marginTop: '2px', userSelect: 'none' }}>{truncateAddress(selectedEntry.address)}</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: '#474D57', fontSize: '14px', flex: 1, userSelect: 'none' }}>
                                Seleccioná una dirección <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
                            </div>
                        )}
                        <Pencil size={14} color="#848E9C" style={{ marginLeft: '8px', flexShrink: 0 }} />
                    </button>
                ) : (
                    <div style={{ backgroundColor: '#181A20', border: '1px solid #2B3139', borderRadius: '8px', padding: '16px', marginBottom: '12px', textAlign: 'center' }}>
                        <div style={{ color: '#848E9C', fontSize: '13px', marginBottom: '12px' }}>No tenés direcciones guardadas</div>
                        <button
                            onClick={() => setShowAddressBook(true)}
                            onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); setShowAddressBook(true); }}
                            style={{ padding: '10px 20px', backgroundColor: 'rgba(240,185,11,0.1)', color: '#F0B90B', border: '1px solid rgba(240,185,11,0.2)', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
                        >
                            Abrir libreta de direcciones
                        </button>
                    </div>
                )}

                {/* BSC warning — only when no address selected */}
                {!selectedEntry && (
                    <div style={{ backgroundColor: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.15)', color: '#F0B90B', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '14px', lineHeight: '1.5' }}>
                        <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /><strong>Red BSC (BEP20) exclusiva.</strong> Enviá a la red equivocada y perdés los fondos.
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
                    onClick={handleInitiateWithdraw}
                    style={{ width: '100%', padding: '13px', backgroundColor: '#C3A1FF', color: '#181A20', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '8px', fontFamily: "'IBM Plex Sans', sans-serif", opacity: loading || !hasAddressBookEntry ? 0.5 : 1 }}
                    disabled={loading || !hasAddressBookEntry}
                >
                    {loading ? 'Procesando...' : 'Retirar'}
                </button>

                {onClose && (
                    <button
                        onClick={onClose}
                        aria-label="Cerrar"
                        style={{ width: '100%', padding: '13px', backgroundColor: 'transparent', border: 'none', color: '#848E9C', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif", display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                        disabled={loading}
                    >
                        <X size={14} /> Cerrar
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

            {isConfirming && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="withdraw-confirm-title"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '20px', boxSizing: 'border-box' }}
                >
                    <div style={{ maxWidth: '460px', width: '100%', backgroundColor: '#1E2329', borderRadius: '12px', border: '1px solid #2B3139', padding: '20px' }}>
                        <h3 id="withdraw-confirm-title" style={{ margin: '0 0 14px', color: '#EAECEF', fontSize: '1rem', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                            Confirmar retiro
                        </h3>

                        <div style={{ backgroundColor: '#181A20', border: '1px solid #2B3139', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                                <span style={{ color: '#848E9C' }}>Destino</span>
                                <span style={{ color: '#EAECEF', fontWeight: 600 }}>{selectedEntry?.name || '—'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                                <span style={{ color: '#848E9C' }}>Dirección</span>
                                <span style={{ color: '#EAECEF', fontFamily: "'IBM Plex Mono', monospace" }}>{truncateAddress(address)}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#F0B90B', textAlign: 'right', marginBottom: '10px' }}>
                                verificá los últimos 4 caracteres
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                                <span style={{ color: '#848E9C' }}>Monto</span>
                                <span style={{ color: '#EAECEF', fontFamily: "'IBM Plex Mono', monospace" }}>{amount} USDC</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                                <span style={{ color: '#848E9C' }}>Red</span>
                                <span style={{ color: '#EAECEF' }}>BSC (BEP20)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                                <span style={{ color: '#848E9C' }}>Fee</span>
                                <span style={{ color: '#0ECB81', fontFamily: "'IBM Plex Mono', monospace" }}>Fee: 0 USDC</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #2B3139', paddingTop: '10px', marginTop: '4px' }}>
                                <span style={{ color: '#EAECEF', fontWeight: 600 }}>Total que llega al destino</span>
                                <span style={{ color: '#0ECB81', fontSize: '16px', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>{amount} USDC</span>
                            </div>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '14px', fontSize: '13px', color: '#EAECEF', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={irreversibleAccepted}
                                onChange={(e) => setIrreversibleAccepted(e.target.checked)}
                                style={{ marginTop: '2px', cursor: 'pointer' }}
                                disabled={loading}
                            />
                            <span>Entiendo que esta operación es irreversible</span>
                        </label>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={handleCancelConfirmation}
                                disabled={loading}
                                style={{ flex: 1, padding: '13px', backgroundColor: 'transparent', border: '1px solid #2B3139', color: '#848E9C', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmWithdraw}
                                disabled={loading || !irreversibleAccepted}
                                style={{ flex: 1, padding: '13px', backgroundColor: irreversibleAccepted && !loading ? '#F6465D' : '#2B3139', color: irreversibleAccepted && !loading ? '#fff' : '#474D57', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: irreversibleAccepted && !loading ? 'pointer' : 'not-allowed', fontFamily: "'IBM Plex Sans', sans-serif" }}
                            >
                                {loading ? 'Procesando...' : 'Confirmar retiro'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
