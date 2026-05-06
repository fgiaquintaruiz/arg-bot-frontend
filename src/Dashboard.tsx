import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Settings2, AlertTriangle, Bot, History as HistoryIcon, LogOut } from 'lucide-react';
import { logout } from './authService';
import pkg from '../package.json';
import bundledVersion from '../public/version.json';
import { getApiUrl } from './config';
import TradingWizard from './components/TradingWizard';
import History from './components/History';
import Settings from './components/Settings';
import BackendToggle from './components/BackendToggle';
import { useIpChangeDetection } from './hooks/useIpChangeDetection';
import IpChangeAlert from './components/IpChangeAlert';
import { useRateAlert } from './hooks/useRateAlert';
import RateAlertBanner from './components/RateAlertBanner';
import { getRateAlertConfig } from './utils/rateAlertStorage';
import { CoreData } from './types';
import { STORAGE_KEYS } from './utils/storageKeys';
import styles from './Dashboard.module.css';

const AUTOMATIC_UPDATE = true;

export default function Dashboard({ user }: { user: User }) {
    const [data, setData] = useState<CoreData | null>(null);
    const [marketLoading, setMarketLoading] = useState(false);
    const [isTestnet, setIsTestnet] = useState<boolean>(() => localStorage.getItem(STORAGE_KEYS.ARGBOT_TESTNET) !== 'false');
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
    const [currentView, setCurrentView] = useState('calculator');

    const { ipChanged, newIp, dismiss, persist } = useIpChangeDetection();

    const rateAlertConfig = useMemo(() => getRateAlertConfig(), []);

    const eurArsRate = useMemo(() => {
        if (!data?.rate || !data?.nexoUsdcArsRate) return null;
        return parseFloat(data.rate) * parseFloat(data.nexoUsdcArsRate);
    }, [data?.rate, data?.nexoUsdcArsRate]);

    const eurArsAlert = useRateAlert(eurArsRate, rateAlertConfig.eurArs);
    const eurUsdcAlert = useRateAlert(data?.rate, rateAlertConfig.eurUsdc);

    const [showSettings, setShowSettings] = useState(false);
    const [showTestnetModal, setShowTestnetModal] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'sync' | 'binance' | 'alerts' | 'notif'>('sync');
    const [versionUpdating, setVersionUpdating] = useState(false);

    // Listen for custom event to open Settings with specific tab
    useEffect(() => {
      const handler = (e: CustomEvent) => {
        if (e.detail?.tab) {
          setSettingsTab(e.detail.tab as 'sync' | 'binance' | 'alerts' | 'notif');
          setShowSettings(true);
        }
      };
      window.addEventListener('open-settings', handler as EventListener);
      return () => window.removeEventListener('open-settings', handler as EventListener);
    }, []);

    // Responsive breakpoint tracking
    useEffect(() => {
      const handler = () => setIsMobile(window.innerWidth < 640);
      window.addEventListener('resize', handler);
      return () => window.removeEventListener('resize', handler);
    }, []);

    // Auto-update detection — poll version.json every 60 seconds
    useEffect(() => {
        const checkForUpdates = async () => {
            try {
                const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
                if (!res.ok) return;
                const versionPayload = await res.json();
                if (versionPayload.buildDate && versionPayload.buildDate !== bundledVersion.buildDate) {
                    if (AUTOMATIC_UPDATE) {
                        setVersionUpdating(true);
                        setTimeout(() => { window.location.href = window.location.pathname + '?_t=' + Date.now(); }, 1500);
                    }
                }
            } catch { /* silent fail */ }
        };
        checkForUpdates();
        const interval = setInterval(checkForUpdates, 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchMarketData = useCallback(() => {
        const testnet = localStorage.getItem(STORAGE_KEYS.ARGBOT_TESTNET) !== 'false';
        const apiKey = localStorage.getItem(testnet ? STORAGE_KEYS.BINANCE_KEY_TESTNET : STORAGE_KEYS.BINANCE_KEY) || '';
        const apiSecret = localStorage.getItem(testnet ? STORAGE_KEYS.BINANCE_SECRET_TESTNET : STORAGE_KEYS.BINANCE_SECRET) || '';
        setMarketLoading(true);
        const fetchWithRetry = async (attempts: number): Promise<void> => {
            for (let i = 0; i < attempts; i++) {
                try {
                    const res = await fetch(`${getApiUrl()}/api/data`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userEmail: user.email, apiKey, apiSecret, testnet })
                    });
                    if (!res.ok) throw new Error("Server Error");
                    const d = await res.json();
                    setData(d);
                    return;
                } catch (err) {
                    if (i < attempts - 1) await new Promise(r => setTimeout(r, 2000));
                    else throw err;
                }
            }
        };
        fetchWithRetry(3)
            .catch(err => {
                console.error("Error fetching market data", err);
                setData({
                    balances: { eur: "0.00", usdc: "0.00" },
                    rate: "1.08",
                    usdcArsRate: "1150.50",
                    fees: { tradingRate: 0.001 }
                });
            })
            .finally(() => { setMarketLoading(false); });
    }, [user]);

    // Initial data fetch — on mount/user change
    useEffect(() => { fetchMarketData(); }, [fetchMarketData]);

    // Keep-alive polling every 9 minutes to prevent Render sleep
    useEffect(() => {
        const pingBackend = () => {
            fetch(`${getApiUrl()}/api/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: user.email, apiKey: '', apiSecret: '' })
            }).catch(() => { /* silent fail */ });
        };
        const interval = setInterval(pingBackend, 9 * 60 * 1000);
        return () => clearInterval(interval);
    }, [user]);

    const handleConfirmRealMode = () => {
        setIsTestnet(false);
        localStorage.setItem(STORAGE_KEYS.ARGBOT_TESTNET, 'false');
        fetchMarketData();
        setShowTestnetModal(false);
    };

    const renderView = () => {
        if (currentView === 'history') {
            return <History onClose={() => setCurrentView('calculator')} />;
        }
        return <TradingWizard data={data} onRefreshData={fetchMarketData} />;
    };

    return (
        <div className={styles.root}>
            {/* Testnet banner */}
            {isTestnet && (
                <div className={styles['testnet-banner']}>
                    BINANCE TESTNET — datos y saldos de prueba, no reales
                </div>
            )}

            {/* IP Change Alert banner */}
            {ipChanged && newIp && (
                <IpChangeAlert
                    newIp={newIp}
                    onConfirm={() => {
                        persist();
                        window.dispatchEvent(new CustomEvent('open-settings', { detail: { tab: 'binance' } }));
                    }}
                    onDismiss={dismiss}
                />
            )}

            {/* Rate Alert banners */}
            {eurArsAlert.alertActive && eurArsAlert.direction && eurArsAlert.currentRate !== null && eurArsAlert.threshold !== null && (
                <RateAlertBanner
                    pair="EUR/ARS"
                    direction={eurArsAlert.direction}
                    currentRate={eurArsAlert.currentRate}
                    threshold={eurArsAlert.threshold}
                    onDismiss={eurArsAlert.dismiss}
                />
            )}
            {eurUsdcAlert.alertActive && eurUsdcAlert.direction && eurUsdcAlert.currentRate !== null && eurUsdcAlert.threshold !== null && (
                <RateAlertBanner
                    pair="EUR/USDC"
                    direction={eurUsdcAlert.direction}
                    currentRate={eurUsdcAlert.currentRate}
                    threshold={eurUsdcAlert.threshold}
                    onDismiss={eurUsdcAlert.dismiss}
                />
            )}

            {/* Access restricted banner */}
            <div className={styles['restricted-banner']}>
                Acceso restringido — solo usuarios autorizados
            </div>

            {/* Header */}
            <div className={`${styles.header} ${isMobile ? styles['header-mobile'] : styles['header-desktop']}`}>
                {/* Row 1 (mobile) / Left group (desktop): logo + version + Kotlin badge + TESTNET button */}
                <div className={isMobile ? styles['header-left-mobile'] : styles['header-left']}>
                    <Bot size={16} color="#F0B90B" />
                    <span className={styles['logo-text']}>
                        ARG<span className={styles['logo-accent']}>BOT</span>
                    </span>
                    <span className={`${styles['version-badge']} ${versionUpdating ? styles['version-badge-updating'] : styles['version-badge-normal']}`}>
                        v{pkg.version}
                    </span>
                    <BackendToggle />
                    <button
                        onClick={() => {
                            if (isTestnet) {
                                setShowTestnetModal(true);
                            } else {
                                setIsTestnet(true);
                                localStorage.setItem(STORAGE_KEYS.ARGBOT_TESTNET, 'true');
                                fetchMarketData();
                            }
                        }}
                        aria-label={isTestnet ? 'Modo testnet activo' : 'Modo real activo'}
                        className={`${isTestnet ? styles['testnet-toggle-testnet'] : styles['testnet-toggle-real']} ${isMobile ? '' : styles['testnet-toggle-desktop']}`}
                    >
                        {isTestnet ? 'TESTNET' : 'REAL'}
                    </button>
                </div>

                {/* Row 2 (mobile) / Right group (desktop): historial + ajustes + salir */}
                <div className={isMobile ? styles['header-right-mobile'] : styles['header-right']}>
                    <button
                        onClick={() => setCurrentView('history')}
                        title="Historial"
                        aria-label="Ver historial"
                        className={styles['icon-btn']}
                    >
                        <HistoryIcon size={17} />
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        title="Configuración"
                        aria-label="Abrir configuración"
                        className={styles['icon-btn-settings']}
                    >
                        <Settings2 size={18} />
                    </button>
                    <div className={styles.divider} />
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        title="Salir"
                        aria-label="Salir"
                        className={styles['logout-btn']}
                    >
                        <LogOut size={17} color="#ef4444" />
                    </button>
                </div>
            </div>

            {/* Rate strip */}
            <div className={styles['rate-strip']}>
                {marketLoading && (
                    <span className={styles['rate-loading']}>
                        Actualizando...
                    </span>
                )}
                {(() => {
                    const overrideRaw = localStorage.getItem(STORAGE_KEYS.USDC_ARS_OVERRIDE);
                    const displayedUsdcArs = overrideRaw
                        ? parseFloat(overrideRaw)
                        : data?.nexoUsdcArsRate
                        ? parseFloat(data.nexoUsdcArsRate)
                        : null;
                    return (
                        <>
                            <span className={styles['rate-item']}>
                                EUR/USDC <span className={styles['rate-value']}>
                                    {data ? parseFloat(data.rate).toFixed(4) : '—'}
                                </span>
                            </span>
                            <span className={styles['rate-separator']}>·</span>
                            <span className={styles['rate-item']}>
                                USDC/ARS{overrideRaw ? ' ★' : ''} <span className={styles['rate-value']}>
                                    {displayedUsdcArs !== null ? displayedUsdcArs.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                </span>
                            </span>
                            <span className={styles['rate-separator']}>·</span>
                            <span className={styles['rate-item']}>
                                1 EUR = <span className={styles['rate-value']}>
                                    {displayedUsdcArs !== null && data ? (parseFloat(data.rate) * displayedUsdcArs).toLocaleString('es-AR', { maximumFractionDigits: 0 }) + ' ARS' : '—'}
                                </span>
                            </span>
                            <span className={styles['rate-separator']}>·</span>
                            <span className={styles['rate-item']}>
                                1 USDC = <span className={styles['rate-value']}>
                                    {displayedUsdcArs !== null ? displayedUsdcArs.toLocaleString('es-AR', { maximumFractionDigits: 0 }) + ' ARS' : '—'}
                                </span>
                            </span>
                        </>
                    );
                })()}
                {data?.balances?.eur != null && (
                    <span data-testid="rate-strip-balance" className={isMobile ? styles['rate-balance-mobile'] : styles['rate-balance-desktop']}>
                        <span className={styles['balance-label']}>Disponible:</span>
                        <span className={styles['balance-value']}>
                            {parseFloat(data.balances.eur).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className={styles['balance-currency']}> €</span>
                        </span>
                        <span className={styles['balance-pipe']}>|</span>
                        <span className={styles['balance-value']}>
                            {parseFloat(data.balances.usdc).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className={styles['balance-currency']}> USDC</span>
                        </span>
                    </span>
                )}
            </div>

            {/* Content — único contenedor de scroll, todo lo demás sin overflow propio */}
            <div className={styles.content}>
                <div className={styles['content-inner']}>
                    {renderView()}
                </div>
            </div>

            {showSettings && <Settings onClose={() => { setShowSettings(false); setSettingsTab('sync'); }} user={user} initialTab={settingsTab} />}

            {showLogoutConfirm && (
                <div className={styles['logout-overlay']}>
                    <div className={styles['logout-dialog']}>
                        <p className={styles['logout-question']}>
                            ¿Cerrar sesión?
                        </p>
                        <div className={styles['logout-buttons']}>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className={styles['logout-cancel-btn']}
                            >Cancelar</button>
                            <button
                                onClick={() => { setShowLogoutConfirm(false); logout(); }}
                                className={styles['logout-confirm-btn']}
                            >Cerrar sesión</button>
                        </div>
                    </div>
                </div>
            )}

            {showTestnetModal && (
                <div className={styles['testnet-overlay']}>
                    <div className={styles['testnet-dialog']}>
                        <div className={styles['testnet-icon']}>⚠️</div>
                        <h3 className={styles['testnet-modal-title']}>Cambiar a modo REAL</h3>
                        <p className={styles['testnet-modal-desc']}>Tus operaciones afectarán fondos reales en Binance. ¿Confirmás el cambio?</p>
                        <div className={styles['testnet-modal-buttons']}>
                            <button onClick={() => setShowTestnetModal(false)} className={styles['testnet-cancel-btn']}>Cancelar</button>
                            <button onClick={handleConfirmRealMode} className={styles['testnet-confirm-btn']}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
