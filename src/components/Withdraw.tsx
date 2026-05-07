import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Building2, User, Pencil, AlertTriangle, X, ChevronRight } from 'lucide-react';
import { API_URL } from '../config';
import AddressBook, { AddressEntry } from './AddressBook';
import {
    getSelectedWithdrawEntry,
    setSelectedWithdrawAddressId,
    clearSelectedWithdrawAddress,
    migrateLegacyUsdcWallet,
} from '../lib/withdrawAddress';
import { CoreData } from '../types';
import { STORAGE_KEYS } from '../utils/storageKeys';
import styles from './Withdraw.module.css';

interface WithdrawProps {
  data: CoreData;
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function Withdraw({ data, onClose, onSuccess }: WithdrawProps) {
    const [selectedId, setSelectedId] = useState<string | null>(
        () => localStorage.getItem(STORAGE_KEYS.USDC_WALLET_ID)
    );
    const [addressBook, setAddressBook] = useState<AddressEntry[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.ADDRESS_BOOK);
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
    const [isTestnetMock, setIsTestnetMock] = useState<boolean>(false);
    const onSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cancel pending onSuccess timer on unmount to prevent state updates on dead components
    useEffect(() => {
        return () => {
            if (onSuccessTimerRef.current !== null) {
                clearTimeout(onSuccessTimerRef.current);
            }
        };
    }, []);

    // Run once on mount: migrate legacy usdc_wallet string to usdc_wallet_id
    useEffect(() => {
        migrateLegacyUsdcWallet();
        const migratedId = localStorage.getItem(STORAGE_KEYS.USDC_WALLET_ID);
        if (migratedId) setSelectedId(migratedId);
    }, []);

    // Cross-tab storage event listener
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEYS.ADDRESS_BOOK) {
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

    if (!data || !data.balances) return <div className={styles.loading}>Cargando saldos...</div>;

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
            const isTestnet = localStorage.getItem(STORAGE_KEYS.ARGBOT_TESTNET) === 'true';

            if (isTestnet) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const mockTxId = `TESTNET-MOCK-${Date.now()}`;
                setSuccessMsg(`Simulación testnet — retiro no ejecutado en Binance real | TX: ${mockTxId}`);
                setIsTestnetMock(true);
                setIsConfirming(false);
                setIrreversibleAccepted(false);
                setLoading(false);
                onSuccessTimerRef.current = setTimeout(() => onSuccess?.(), 2000);
                return;
            }

            const apiKey = localStorage.getItem(STORAGE_KEYS.BINANCE_KEY) || '';
            const apiSecret = localStorage.getItem(STORAGE_KEYS.BINANCE_SECRET) || '';
            const res = await fetch(`${API_URL}/api/withdraw`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey, apiSecret, address, amountUsdc: amount }) });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Fallo en el retiro');
            setSuccessMsg('¡Solicitud de retiro enviada!');
            fetch(`${API_URL}/api/push/notify/withdraw-complete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            }).catch(() => {});
            setIsConfirming(false);
            setIrreversibleAccepted(false);
            onSuccessTimerRef.current = setTimeout(() => onSuccess?.(), 2000);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setErrorMsg(msg);
            setIsConfirming(false);
            setIrreversibleAccepted(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>

            {/* Header */}
            <div className={styles.header}>
                <Building2 size={16} color="#848E9C" />
                <h3 className={styles['header-title']}>
                    Retirar USDC
                </h3>
            </div>

            <div className={styles.body}>

                {/* Address section label */}
                <div className={styles['address-label-row']}>
                    <label className={styles['address-label']}>
                        Destino (Nexo / Lemon / BSC)
                    </label>
                    <span className={hasAddressBookEntry ? styles['address-book-status-ok'] : styles['address-book-status-warn']}>
                        {hasAddressBookEntry ? 'Libreta disponible' : 'Libreta vacía'}
                    </span>
                </div>

                {/* Orphan error message */}
                {isOrphan && (
                    <div className={styles['orphan-error']}>
                        La dirección seleccionada fue eliminada. Elegí otra de tu libreta.
                    </div>
                )}

                {/* Address selector */}
                {hasAddressBookEntry ? (
                    <button
                        onClick={() => setShowAddressBook(true)}
                        onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); setShowAddressBook(true); }}
                        className={`${styles['address-selector']} ${selectedEntry ? styles['address-selector-filled'] : styles['address-selector-empty']}`}
                    >
                        {selectedEntry ? (
                            <div className={styles['address-selector-inner']}>
                                <div className={styles['address-avatar']}><User size={16} color="#0ECB81" /></div>
                                <div className={styles['address-info']}>
                                    <div className={styles['address-name']}>{selectedEntry.name}</div>
                                    <div className={styles['address-truncated']}>{truncateAddress(selectedEntry.address)}</div>
                                </div>
                            </div>
                        ) : (
                            <div className={styles['address-placeholder']}>
                                Seleccioná una dirección <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
                            </div>
                        )}
                        <Pencil size={14} color="#848E9C" className={styles['address-edit-icon']} />
                    </button>
                ) : (
                    <div className={styles['no-addresses-box']}>
                        <div className={styles['no-addresses-label']}>No tenés direcciones guardadas</div>
                        <button
                            onClick={() => setShowAddressBook(true)}
                            onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); setShowAddressBook(true); }}
                            className={styles['open-address-book-btn']}
                        >
                            Abrir libreta de direcciones
                        </button>
                    </div>
                )}

                {/* BSC warning — only when no address selected */}
                {!selectedEntry && (
                    <div className={styles['bsc-warning']}>
                        <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /><strong>Red BSC (BEP20) exclusiva.</strong> Enviá a la red equivocada y perdés los fondos.
                    </div>
                )}

                {/* Amount */}
                <div className={styles['amount-row']}>
                    <span>Disponible: {data.balances.usdc} USDC</span>
                    <button
                        onClick={() => setAmount(data.balances.usdc)}
                        className={styles['max-btn']}
                    >
                        MAX
                    </button>
                </div>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setErrorMsg(''); }}
                    className={styles['amount-input']}
                    placeholder="Monto a retirar"
                />

                {errorMsg && (
                    <div className={styles['error-msg']}>
                        {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div className={styles['success-msg']} style={isTestnetMock ? { borderLeft: '3px solid #F0B90B', background: 'rgba(240,185,11,0.08)' } : undefined}>
                        {isTestnetMock ? (
                            <>
                                <span style={{ background: '#F0B90B', color: '#1E2026', fontWeight: 700, fontSize: '10px', borderRadius: '3px', padding: '1px 5px', marginRight: '6px', letterSpacing: '0.5px' }}>TESTNET</span>
                                {successMsg}
                            </>
                        ) : (
                            <>✓ {successMsg}</>
                        )}
                    </div>
                )}

                {!hasAddressBookEntry && (
                    <div className={styles['no-address-warn']}>
                        Agregá una dirección en la libreta antes de retirar.
                    </div>
                )}

                <button
                    onClick={handleInitiateWithdraw}
                    className={styles['withdraw-btn']}
                    style={{ opacity: loading || !hasAddressBookEntry ? 0.5 : 1 }}
                    disabled={loading || !hasAddressBookEntry}
                >
                    {loading ? 'Procesando...' : 'Retirar'}
                </button>

                {onClose && (
                    <button
                        onClick={onClose}
                        aria-label="Cerrar"
                        className={styles['close-btn']}
                        disabled={loading}
                    >
                        <X size={14} /> Cerrar
                    </button>
                )}
            </div>

            {showAddressBook && (
                <div className={styles.overlay}>
                    <div className={styles['overlay-inner']}>
                        <AddressBook onSelect={handleAddressSelect} onClose={() => setShowAddressBook(false)} />
                    </div>
                </div>
            )}

            {isConfirming && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="withdraw-confirm-title"
                    className={styles['confirm-overlay']}
                >
                    <div className={styles['confirm-dialog']}>
                        <h3 id="withdraw-confirm-title" className={styles['confirm-title']}>
                            Confirmar retiro
                        </h3>

                        <div className={styles['confirm-details']}>
                            <div className={styles['confirm-row']}>
                                <span className={styles['confirm-label']}>Destino</span>
                                <span className={styles['confirm-value']}>{selectedEntry?.name || '—'}</span>
                            </div>
                            <div className={styles['confirm-row']}>
                                <span className={styles['confirm-label']}>Dirección</span>
                                <span className={styles['confirm-value-mono']}>{truncateAddress(address)}</span>
                            </div>
                            <div className={styles['confirm-address-hint']}>
                                verificá los últimos 4 caracteres
                            </div>
                            <div className={styles['confirm-row']}>
                                <span className={styles['confirm-label']}>Monto</span>
                                <span className={styles['confirm-value-mono']}>{amount} USDC</span>
                            </div>
                            <div className={styles['confirm-row']}>
                                <span className={styles['confirm-label']}>Red</span>
                                <span className={styles['confirm-value']}>BSC (BEP20)</span>
                            </div>
                            <div className={styles['confirm-row-last']}>
                                <span className={styles['confirm-label']}>Fee</span>
                                <span className={styles['confirm-fee-value']}>0 USDC</span>
                            </div>
                            <div className={styles['confirm-total-row']}>
                                <span className={styles['confirm-total-label']}>Total que llega al destino</span>
                                <span className={styles['confirm-total-value']}>{amount} USDC</span>
                            </div>
                        </div>

                        <label className={styles['confirm-checkbox-label']}>
                            <input
                                type="checkbox"
                                checked={irreversibleAccepted}
                                onChange={(e) => setIrreversibleAccepted(e.target.checked)}
                                className={styles['confirm-checkbox']}
                                disabled={loading}
                            />
                            <span>Entiendo que esta operación es irreversible</span>
                        </label>

                        <div className={styles['confirm-buttons']}>
                            <button
                                onClick={handleCancelConfirmation}
                                disabled={loading}
                                className={styles['confirm-cancel-btn']}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmWithdraw}
                                disabled={loading || !irreversibleAccepted}
                                className={irreversibleAccepted && !loading ? styles['confirm-submit-btn-active'] : styles['confirm-submit-btn-disabled']}
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
