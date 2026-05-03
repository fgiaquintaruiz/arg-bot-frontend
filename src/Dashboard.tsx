import React, { useState, useEffect, useRef, useMemo } from 'react';
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

const AUTOMATIC_UPDATE = true;

export default function Dashboard({ user }: { user: any }) {
    const [data, setData] = useState<any>(null);
    const testnetRef = useRef<boolean>(false);
    const [isTestnet, setIsTestnet] = useState<boolean>(() => localStorage.getItem('argbot_testnet') !== 'false');
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

    const hasKeys = !!(localStorage.getItem('binance_key') || localStorage.getItem('binance_key_testnet')) &&
                    !!(localStorage.getItem('binance_secret') || localStorage.getItem('binance_secret_testnet'));
    const [showSettings, setShowSettings] = useState(false);
    const [showTestnetModal, setShowTestnetModal] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'sync' | 'binance' | 'alerts'>('sync');
    const [showUpdateBanner, setShowUpdateBanner] = useState(false);
    const [versionUpdating, setVersionUpdating] = useState(false);

    // Listen for custom event to open Settings with specific tab
    useEffect(() => {
      const handler = (e: CustomEvent) => {
        if (e.detail?.tab) {
          setSettingsTab(e.detail.tab as any);
          setShowSettings(true);
        }
      };
      window.addEventListener('open-settings', handler as any);
      return () => window.removeEventListener('open-settings', handler as any);
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
                const data = await res.json();
                if (data.buildDate && data.buildDate !== bundledVersion.buildDate) {
                    if (AUTOMATIC_UPDATE) {
                        setVersionUpdating(true);
                        setTimeout(() => { window.location.href = window.location.pathname + '?_t=' + Date.now(); }, 1500);
                    } else {
                        /* v8 ignore next -- dead branch: AUTOMATIC_UPDATE is always true */
                        setShowUpdateBanner(true);
                    }
                }
            } catch { /* silent fail */ }
        };
        checkForUpdates();
        const interval = setInterval(checkForUpdates, 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchMarketData = () => {
        const testnet = localStorage.getItem('argbot_testnet') !== 'false';
        const apiKey = localStorage.getItem(testnet ? 'binance_key_testnet' : 'binance_key') || '';
        const apiSecret = localStorage.getItem(testnet ? 'binance_secret_testnet' : 'binance_secret') || '';
        fetch(`${getApiUrl()}/api/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: user.email, apiKey, apiSecret, testnet })
        })
            .then(async res => {
                if (!res.ok) throw new Error("Server Error");
                return res.json();
            })
            .then(d => { testnetRef.current = !!d?.testnet; setData(d); })
            .catch(err => {
                console.error("Error fetching market data", err);
                setData({
                    balances: { eur: "0.00", usdc: "0.00" },
                    rate: "1.08",
                    usdcArsRate: "1150.50",
                    fees: { tradingRate: 0.001 }
                });
            });
    };

    // Initial data fetch — on mount/user change
    useEffect(() => { fetchMarketData(); }, [user]);

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
        localStorage.setItem('argbot_testnet', 'false');
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
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: '#181A20',
            display: 'flex',
            flexDirection: 'column',
            color: '#EAECEF',
            overflow: 'hidden', // contenedor fijo; el scroll va en el área de contenido
        }}>
            {/* Testnet banner */}
            {isTestnet && (
                <div style={{
                    backgroundColor: 'rgba(240,185,11,0.12)',
                    borderBottom: '1px solid rgba(240,185,11,0.3)',
                    color: '#F0B90B',
                    padding: '6px 16px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    flexShrink: 0,
                }}>
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
            <div style={{
                backgroundColor: 'rgba(246,70,93,0.1)',
                borderBottom: '1px solid rgba(246,70,93,0.2)',
                color: '#F6465D',
                padding: '6px 16px',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.3px',
                flexShrink: 0,
            }}>
                Acceso restringido — solo usuarios autorizados
            </div>

            {/* Header */}
            <div style={{
                width: '100%',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: isMobile ? 'center' : 'space-between',
                alignItems: 'center',
                padding: isMobile ? '10px 16px' : '0 20px',
                height: isMobile ? 'auto' : '56px',
                gap: isMobile ? '8px' : undefined,
                backgroundColor: '#181A20',
                borderBottom: '1px solid #2B3139',
                flexShrink: 0,
                boxSizing: 'border-box',
            }}>
                {/* Row 1 (mobile) / Left group (desktop): logo + version + Kotlin badge + TESTNET button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: isMobile ? 'center' : undefined }}>
                    <Bot size={16} color="#F0B90B" />
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#EAECEF', letterSpacing: '-0.3px' }}>
                        ARG<span style={{ color: '#F0B90B' }}>BOT</span>
                    </span>
                    <span style={{
                        fontSize: '11px',
                        color: versionUpdating ? '#F0B90B' : '#848E9C',
                        backgroundColor: '#2B3139',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontWeight: 600,
                        fontFamily: "'IBM Plex Mono', monospace",
                        letterSpacing: '0.2px',
                        ...(versionUpdating ? {
                            animation: 'pulse 0.5s ease-in-out infinite',
                        } : {}),
                    }}>
                        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
                        v{pkg.version}
                    </span>
                    <BackendToggle />
                    <button
                        onClick={() => {
                            if (isTestnet) {
                                setShowTestnetModal(true);
                            } else {
                                setIsTestnet(true);
                                localStorage.setItem('argbot_testnet', 'true');
                                fetchMarketData();
                            }
                        }}
                        aria-label={isTestnet ? 'Modo testnet activo' : 'Modo real activo'}
                        style={{
                            background: 'transparent',
                            border: isTestnet ? '1px solid rgba(240,185,11,0.4)' : '1px solid rgba(14,203,129,0.4)',
                            backgroundColor: isTestnet ? 'rgba(240,185,11,0.15)' : 'rgba(14,203,129,0.15)',
                            color: isTestnet ? '#F0B90B' : '#0ECB81',
                            cursor: 'pointer',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            marginRight: isMobile ? undefined : '24px',
                        }}
                    >
                        {isTestnet ? 'TESTNET' : 'REAL'}
                    </button>
                </div>

                {/* Row 2 (mobile) / Right group (desktop): historial + ajustes + salir */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: isMobile ? 'center' : undefined }}>
                    <button
                        onClick={() => setCurrentView('history')}
                        title="Historial"
                        aria-label="Ver historial"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#848E9C',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <HistoryIcon size={17} />
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        title="Configuración"
                        aria-label="Abrir configuración"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#848E9C',
                            fontSize: '18px',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '6px',
                            lineHeight: 1,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <Settings2 size={18} />
                    </button>
                    <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginInline: '8px' }} />
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        title="Salir"
                        aria-label="Salir"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <LogOut size={17} color="#ef4444" />
                    </button>
                </div>
            </div>

            {/* Rate strip */}
            <div style={{
                width: '100%',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                columnGap: '12px',
                rowGap: '4px',
                padding: '6px 12px',
                backgroundColor: '#1E2329',
                borderBottom: '1px solid #2B3139',
                flexShrink: 0,
                boxSizing: 'border-box',
            }}>
                <span style={{ fontSize: '12px', color: '#848E9C', fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' }}>
                    EUR/USDC <span style={{ color: '#0ECB81', fontWeight: 600 }}>
                        {data ? parseFloat(data.rate).toFixed(4) : '—'}
                    </span>
                </span>
                <span style={{ color: '#2B3139' }}>·</span>
                <span style={{ fontSize: '12px', color: '#848E9C', fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' }}>
                    USDC/ARS <span style={{ color: '#0ECB81', fontWeight: 600 }}>
                        {data?.nexoUsdcArsRate ? parseFloat(data.nexoUsdcArsRate).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                    </span>
                </span>
                <span style={{ color: '#2B3139' }}>·</span>
                <span style={{ fontSize: '12px', color: '#848E9C', fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' }}>
                    1 EUR = <span style={{ color: '#0ECB81', fontWeight: 600 }}>
                        {data?.nexoUsdcArsRate ? (parseFloat(data.rate) * parseFloat(data.nexoUsdcArsRate)).toLocaleString('es-AR', { maximumFractionDigits: 0 }) + ' ARS' : '—'}
                    </span>
                </span>
                <span style={{ color: '#2B3139' }}>·</span>
                <span style={{ fontSize: '12px', color: '#848E9C', fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' }}>
                    1 USDC = <span style={{ color: '#0ECB81', fontWeight: 600 }}>
                        {data?.nexoUsdcArsRate ? parseFloat(data.nexoUsdcArsRate).toLocaleString('es-AR', { maximumFractionDigits: 0 }) + ' ARS' : '—'}
                    </span>
                </span>
                {data?.balances?.eur != null && (
                    <span data-testid="rate-strip-balance" style={isMobile ? { width: '100%', textAlign: 'center', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' } : { marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#848E9C', fontSize: '12px' }}>Disponible:</span>
                        <span style={{ color: '#EAECEF' }}>
                            {parseFloat(data.balances.eur).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span style={{ color: '#848E9C' }}> €</span>
                        </span>
                        <span style={{ color: '#2B3139' }}>|</span>
                        <span style={{ color: '#EAECEF' }}>
                            {parseFloat(data.balances.usdc).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span style={{ color: '#848E9C' }}> USDC</span>
                        </span>
                    </span>
                )}
            </div>

            {/* Content — único contenedor de scroll, todo lo demás sin overflow propio */}
            <div style={{
                flex: 1,
                width: '100%',
                overflowY: 'scroll',        // scroll siempre visible → wheel funciona sin hover-focus
                WebkitOverflowScrolling: 'touch',
                overscrollBehaviorY: 'none', // bloquea pull-to-refresh en Android PWA
                padding: '24px 20px 60px',  // paddingBottom generoso para scroll completo
                boxSizing: 'border-box',
            }}>
                <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                    {renderView()}
                </div>
            </div>

            {showSettings && <Settings onClose={() => { setShowSettings(false); setSettingsTab('sync'); }} user={user} initialTab={settingsTab} />}

            {showLogoutConfirm && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px', padding: '24px', maxWidth: '320px', width: '90%',
                        textAlign: 'center'
                    }}>
                        <p style={{ color: '#fff', marginBottom: '20px', fontSize: '16px' }}>
                            ¿Cerrar sesión?
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                style={{
                                    padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'transparent', color: '#ccc', cursor: 'pointer', fontSize: '14px'
                                }}
                            >Cancelar</button>
                            <button
                                onClick={() => { setShowLogoutConfirm(false); logout(); }}
                                style={{
                                    padding: '8px 20px', borderRadius: '8px', border: 'none',
                                    background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600
                                }}
                            >Cerrar sesión</button>
                        </div>
                    </div>
                </div>
            )}

            {showTestnetModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#1E2329', border: '1px solid #2B3139', borderRadius: '20px', padding: '28px 24px', maxWidth: '340px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                        <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '12px' }}>⚠️</div>
                        <h3 style={{ color: '#EAECEF', margin: '0 0 8px', textAlign: 'center', fontSize: '16px' }}>Cambiar a modo REAL</h3>
                        <p style={{ color: '#848E9C', margin: '0 0 24px', textAlign: 'center', fontSize: '13px', lineHeight: '1.5' }}>Tus operaciones afectarán fondos reales en Binance. ¿Confirmás el cambio?</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setShowTestnetModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '20px', border: '1px solid #2B3139', backgroundColor: 'transparent', color: '#848E9C', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>Cancelar</button>
                            <button onClick={handleConfirmRealMode} style={{ flex: 1, padding: '12px', borderRadius: '20px', border: 'none', backgroundColor: '#F6465D', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
