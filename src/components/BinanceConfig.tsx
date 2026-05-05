import React, {useState, useEffect} from 'react';
import {API_URL} from '../config';
import { STORAGE_KEYS } from '../utils/storageKeys';
import styles from './BinanceConfig.module.css';

const CRYPTOJS_AES_PREFIX = 'U2FsdGVkX1+';

export default function BinanceConfig({onSave, onCancel}: Readonly<{ onSave: () => void, onCancel: () => void }>) {
    const [activeTab, setActiveTab] = useState<'prod' | 'testnet'>(() =>
        localStorage.getItem(STORAGE_KEYS.ARGBOT_TESTNET) === 'true' ? 'testnet' : 'prod'
    );
    const [prodKey, setProdKey] = useState('');
    const [prodSecret, setProdSecret] = useState('');
    const [testnetKey, setTestnetKey] = useState('');
    const [testnetSecret, setTestnetSecret] = useState('');
    const [serverIp, setServerIp] = useState('Obteniendo IP...');
    const [copied, setCopied] = useState(false);
    const [migrated, setMigrated] = useState(false);

    useEffect(() => {
        const storedKey = localStorage.getItem(STORAGE_KEYS.BINANCE_KEY) || '';
        const storedSecret = localStorage.getItem(STORAGE_KEYS.BINANCE_SECRET) || '';

        if (storedKey.startsWith(CRYPTOJS_AES_PREFIX) || storedSecret.startsWith(CRYPTOJS_AES_PREFIX)) {
            localStorage.removeItem(STORAGE_KEYS.BINANCE_KEY);
            localStorage.removeItem(STORAGE_KEYS.BINANCE_SECRET);
            setMigrated(true);
        } else {
            setProdKey(storedKey);
            setProdSecret(storedSecret);
        }

        setTestnetKey(localStorage.getItem(STORAGE_KEYS.BINANCE_KEY_TESTNET) || '');
        setTestnetSecret(localStorage.getItem(STORAGE_KEYS.BINANCE_SECRET_TESTNET) || '');
    }, []);

    useEffect(() => {
        fetch(`${API_URL}/api/ip`)
            .then(res => res.json())
            .then(data => setServerIp(data.ip || 'Error al obtener IP'))
            .catch(() => setServerIp('No se pudo conectar al servidor'));
    }, []);

    const handleSave = () => {
        if (activeTab === 'testnet') {
            localStorage.setItem(STORAGE_KEYS.BINANCE_KEY_TESTNET, testnetKey.trim());
            localStorage.setItem(STORAGE_KEYS.BINANCE_SECRET_TESTNET, testnetSecret.trim());
        } else {
            localStorage.setItem(STORAGE_KEYS.BINANCE_KEY, prodKey.trim());
            localStorage.setItem(STORAGE_KEYS.BINANCE_SECRET, prodSecret.trim());
        }
        onSave();
    };

    const copyIp = () => {
        navigator.clipboard.writeText(serverIp)
            .then(() => setCopied(true))
            .catch(() => {}); // clipboard denied — do nothing
        setTimeout(() => setCopied(false), 2000);
    };

    const isTestnet = activeTab === 'testnet';
    const key = isTestnet ? testnetKey : prodKey;
    const secret = isTestnet ? testnetSecret : prodSecret;
    const setKey = isTestnet ? setTestnetKey : setProdKey;
    const setSecret = isTestnet ? setTestnetSecret : setProdSecret;

    return (
        <div className={styles.container}>

            <div className={styles.header}>
                <span className={styles['header-icon']}>🔑</span>
                <h3 className={styles['header-title']}>
                    API de Binance
                </h3>
            </div>

            <div className={styles.body}>

                <p className={styles.description}>
                    Credenciales Spot/Withdrawal. Se guardan <strong className={styles['description-strong']}>localmente en tu dispositivo</strong>.
                </p>

                {/* Migration notice */}
                {migrated && (
                    <div className={styles['migration-notice']}>
                        <p className={styles['migration-text']}>
                            Tus claves fueron migradas. Por favor, volvé a ingresarlas.
                        </p>
                    </div>
                )}

                {/* IP Whitelist */}
                <div className={styles['ip-box']}>
                    <p className={styles['ip-box-label']}>IP para Whitelist de Binance</p>
                    <div className={styles['ip-box-row']}>
                        <span className={styles['ip-value']}>{serverIp}</span>
                        <button
                            onClick={copyIp}
                            className={copied ? styles['copy-button-copied'] : styles['copy-button-default']}
                        >
                            {copied ? '✓ Copiada' : 'Copiar'}
                        </button>
                    </div>
                </div>

                {/* Producción / Testnet tabs */}
                <div className={styles.tabs}>
                    <button
                        className={activeTab === 'prod' ? styles['tab-active'] : styles['tab-inactive']}
                        onClick={() => setActiveTab('prod')}
                    >
                        Producción
                    </button>
                    <button
                        className={activeTab === 'testnet' ? styles['tab-active'] : styles['tab-inactive']}
                        onClick={() => setActiveTab('testnet')}
                    >
                        Testnet
                    </button>
                </div>

                {isTestnet && (
                    <div className={styles['testnet-notice']}>
                        <p className={styles['testnet-text']}>
                            Estas claves son exclusivas del portal <strong>testnet.binance.vision</strong>
                        </p>
                    </div>
                )}

                <label className={styles['field-label']}>API Key</label>
                <input type="text" value={key} onChange={e => setKey(e.target.value)} className={styles['field-input']} placeholder="Ingresá tu API Key" />

                <label className={styles['field-label']}>API Secret</label>
                <input type="password" value={secret} onChange={e => setSecret(e.target.value)} className={styles['field-input']} placeholder="Ingresá tu API Secret" />

                <button
                    onClick={handleSave}
                    className={styles['save-button']}
                >
                    Guardar credenciales
                </button>
                <button
                    onClick={onCancel}
                    className={styles['cancel-button']}
                >
                    ← Cancelar
                </button>
            </div>
        </div>
    );
}
