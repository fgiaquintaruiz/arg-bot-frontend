import React, { useState, useEffect, useRef } from 'react';
import { Settings2, AlertTriangle, Bot, History as HistoryIcon } from 'lucide-react';
import { logout } from './authService';
import pkg from '../package.json';
import bundledVersion from '../public/version.json';
import { getApiUrl } from './config';
import TradingWizard from './components/TradingWizard';
import History from './components/History';
import Updates from './components/Updates';
import Settings from './components/Settings';
import BackendToggle from './components/BackendToggle';

const AUTOMATIC_UPDATE = true;

export default function Dashboard({ user }: { user: any }) {
    const [data, setData] = useState<any>(null);
    const testnetRef = useRef<boolean>(false);
    const [isTestnet, setIsTestnet] = useState<boolean>(() => localStorage.getItem('argbot_testnet') !== 'false');
    const [currentView, setCurrentView] = useState('calculator');

    const apiKey = localStorage.getItem('binance_key');
    const apiSecret = localStorage.getItem('binance_secret');
    const hasKeys = !!apiKey && !!apiSecret;
    const [showUpdates, setShowUpdates] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'sync' | 'binance' | 'fee'>('sync');
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
                        setTimeout(() => window.location.reload(), 1500);
                    } else {
                        setShowUpdateBanner(true);
                    }
                }
            } catch { /* silent fail */ }
        };
        const interval = setInterval(checkForUpdates, 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchMarketData = () => {
        fetch(`${getApiUrl()}/api/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: user.email, apiKey, apiSecret, testnet: isTestnet })
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
                    fees: { withdrawalUSDC_BEP20: 0.8, tradingRate: 0.001 }
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
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 20px',
                height: '56px',
                backgroundColor: '#181A20',
                borderBottom: '1px solid #2B3139',
                flexShrink: 0,
                boxSizing: 'border-box',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                </div>

                <BackendToggle />

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                        onClick={() => {
                            if (isTestnet) {
                                const confirmed = window.confirm('⚠️ Vas a conectar con Binance REAL. Tus operaciones afectarán fondos reales. ¿Confirmás?');
                                if (confirmed) {
                                    setIsTestnet(false);
                                    localStorage.setItem('argbot_testnet', 'false');
                                    fetchMarketData();
                                }
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
                            marginRight: '24px',
                        }}
                    >
                        {isTestnet ? 'TESTNET' : 'REAL'}
                    </button>
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
                    <button
                        onClick={logout}
                        style={{
                            background: 'transparent',
                            border: '1px solid #2B3139',
                            color: '#848E9C',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontFamily: "'IBM Plex Sans', sans-serif",
                            letterSpacing: '0.2px',
                        }}
                    >
                        Salir
                    </button>
                </div>
            </div>

            {/* Rate strip */}
            <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                padding: '6px 20px',
                backgroundColor: '#1E2329',
                borderBottom: '1px solid #2B3139',
                flexShrink: 0,
                boxSizing: 'border-box',
            }}>
                <span style={{ fontSize: '12px', color: '#848E9C', fontFamily: "'IBM Plex Mono', monospace" }}>
                    EUR/USDC <span style={{ color: '#0ECB81', fontWeight: 600 }}>
                        {data ? parseFloat(data.rate).toFixed(4) : '—'}
                    </span>
                </span>
                <span style={{ color: '#2B3139' }}>·</span>
                <span style={{ fontSize: '12px', color: '#848E9C', fontFamily: "'IBM Plex Mono', monospace" }}>
                    USDC/ARS <span style={{ color: '#0ECB81', fontWeight: 600 }}>
                        {data?.ripioUsdcArsRate ? parseFloat(data.ripioUsdcArsRate).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                    </span>
                </span>
                <span style={{ color: '#2B3139' }}>·</span>
                <span style={{ fontSize: '12px', color: '#848E9C', fontFamily: "'IBM Plex Mono', monospace" }}>
                    1 EUR = <span style={{ color: '#0ECB81', fontWeight: 600 }}>
                        {data?.ripioUsdcArsRate ? (parseFloat(data.rate) * parseFloat(data.ripioUsdcArsRate)).toLocaleString('es-AR', { maximumFractionDigits: 0 }) + ' ARS' : '—'}
                    </span>
                </span>
                <span style={{ color: '#2B3139' }}>·</span>
                <span style={{ fontSize: '12px', color: '#848E9C', fontFamily: "'IBM Plex Mono', monospace" }}>
                    1 USDC = <span style={{ color: '#0ECB81', fontWeight: 600 }}>
                        {data?.ripioUsdcArsRate ? parseFloat(data.ripioUsdcArsRate).toLocaleString('es-AR', { maximumFractionDigits: 0 }) + ' ARS' : '—'}
                    </span>
                </span>
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

            {/* showUpdates no tiene entrada de UI — dead code */}
            {showUpdates && <Updates onClose={/* v8 ignore next */ () => setShowUpdates(false)} />}
            {showSettings && <Settings onClose={() => { setShowSettings(false); setSettingsTab('sync'); }} user={user} initialTab={settingsTab} />}

        </div>
    );
}
