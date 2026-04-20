import React, { useState, useEffect } from 'react';
import { logout } from './authService';
import pkg from '../package.json';
import { API_URL } from './config';
import Calculator from './components/Calculator';
import Trade from './components/Trade';
import Withdraw from './components/Withdraw';
import History from './components/History';
import Updates from './components/Updates';
import Settings from './components/Settings';

export default function Dashboard({ user }: { user: any }) {
    const [data, setData] = useState<any>(null);
    const [currentView, setCurrentView] = useState('main');

    const apiKey = localStorage.getItem('binance_key');
    const apiSecret = localStorage.getItem('binance_secret');
    const hasKeys = !!apiKey && !!apiSecret;
    const [showUpdates, setShowUpdates] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'sync' | 'binance' | 'fee' | 'support'>('sync');
    const [showUpdateBanner, setShowUpdateBanner] = useState(false);

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
                if (data.version && data.version !== pkg.version) {
                    setShowUpdateBanner(true);
                }
            } catch { /* silent fail */ }
        };
        const interval = setInterval(checkForUpdates, 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Initial data fetch — only on mount/user change
    useEffect(() => {
        fetch(`${API_URL}/api/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: user.email, apiKey, apiSecret })
        })
            .then(async res => {
                if (!res.ok) throw new Error("Server Error");
                return res.json();
            })
            .then(d => setData(d))
            .catch(err => {
                console.error("Error fetching market data", err);
                setData({
                    balances: { eur: "0.00", usdc: "0.00" },
                    rate: "1.08",
                    usdcArsRate: "1150.50",
                    fees: { withdrawalUSDC_BEP20: 0.8, tradingRate: 0.001 }
                });
            });
    }, [user]);

    // Keep-alive polling every 9 minutes to prevent Render sleep
    useEffect(() => {
        const pingBackend = () => {
            fetch(`${API_URL}/api/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: user.email, apiKey: '', apiSecret: '' })
            }).catch(() => { /* silent fail */ });
        };
        const interval = setInterval(pingBackend, 9 * 60 * 1000);
        return () => clearInterval(interval);
    }, [user]);

    const renderView = () => {
        switch (currentView) {
            case 'calculator':
                return <Calculator data={data} onBack={() => setCurrentView('main')} />;
            case 'trade':
                return <Trade data={data} onClose={() => setCurrentView('main')} onSuccess={() => setCurrentView('main')} />;
            case 'withdraw':
                return <Withdraw data={data} onClose={() => setCurrentView('main')} onSuccess={() => setCurrentView('main')} />;
            case 'history':
                return <History onClose={() => setCurrentView('main')} />;
            default:
                return <MainMenu />;
        }
    };

    function MainMenu() {
        const eurUsdc = data ? parseFloat(data.rate).toFixed(4) : '—';
        const usdcArs = data ? parseFloat(data.usdcArsRate).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

        return (
            <div style={{ width: '100%' }}>
                {/* Greeting */}
                <div style={{ marginBottom: '24px' }}>
                    <p style={{ color: '#848E9C', fontSize: '13px', marginBottom: '2px' }}>Bienvenido de vuelta,</p>
                    <h3 style={{ margin: 0, color: '#EAECEF', fontSize: '1.3rem', fontWeight: 700 }}>
                        {user.displayName?.split(' ')[0] || 'Usuario'}
                    </h3>
                </div>

                {/* Live rate strip */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '20px',
                }}>
                    <div style={{
                        flex: 1,
                        backgroundColor: '#1E2329',
                        border: '1px solid #2B3139',
                        borderRadius: '8px',
                        padding: '10px 14px',
                    }}>
                        <p style={{ color: '#848E9C', fontSize: '11px', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>EUR / USDC</p>
                        <p style={{ color: '#0ECB81', fontSize: '15px', fontWeight: 600, margin: 0, fontFamily: "'IBM Plex Mono', monospace" }}>{eurUsdc}</p>
                    </div>
                    <div style={{
                        flex: 1,
                        backgroundColor: '#1E2329',
                        border: '1px solid #2B3139',
                        borderRadius: '8px',
                        padding: '10px 14px',
                    }}>
                        <p style={{ color: '#848E9C', fontSize: '11px', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>USDC / ARS</p>
                        <p style={{ color: '#0ECB81', fontSize: '15px', fontWeight: 600, margin: 0, fontFamily: "'IBM Plex Mono', monospace" }}>{usdcArs}</p>
                    </div>
                </div>

                {/* Action grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {/* Calculadora — CTA primario en amarillo */}
                    <button
                        onClick={() => setCurrentView('calculator')}
                        style={{
                            gridColumn: '1 / -1',
                            padding: '18px 16px',
                            backgroundColor: '#F0B90B',
                            color: '#181A20',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            fontFamily: "'IBM Plex Sans', sans-serif",
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>🧮</span>
                        Calculadora
                    </button>

                    {/* Cambiar EUR */}
                    <button
                        onClick={() => hasKeys && setCurrentView('trade')}
                        style={{
                            opacity: hasKeys ? 1 : 0.45,
                            cursor: hasKeys ? 'pointer' : 'not-allowed',
                            padding: '18px 12px',
                            backgroundColor: '#1E2329',
                            color: '#0ECB81',
                            border: '1px solid #2B3139',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '14px',
                            fontFamily: "'IBM Plex Sans', sans-serif",
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background-color 0.15s',
                        }}
                    >
                        <span style={{ fontSize: '22px' }}>💱</span>
                        Cambiar EUR
                        {!hasKeys && (
                            <span style={{
                                fontSize: '10px',
                                color: '#F6465D',
                                backgroundColor: 'rgba(246,70,93,0.12)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 500,
                            }}>🔒 Config API</span>
                        )}
                    </button>

                    {/* Retirar */}
                    <button
                        onClick={() => hasKeys && setCurrentView('withdraw')}
                        style={{
                            opacity: hasKeys ? 1 : 0.45,
                            cursor: hasKeys ? 'pointer' : 'not-allowed',
                            padding: '18px 12px',
                            backgroundColor: '#1E2329',
                            color: '#C3A1FF',
                            border: '1px solid #2B3139',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '14px',
                            fontFamily: "'IBM Plex Sans', sans-serif",
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background-color 0.15s',
                        }}
                    >
                        <span style={{ fontSize: '22px' }}>🏦</span>
                        Retirar ARS
                        {!hasKeys && (
                            <span style={{
                                fontSize: '10px',
                                color: '#F6465D',
                                backgroundColor: 'rgba(246,70,93,0.12)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 500,
                            }}>🔒 Config API</span>
                        )}
                    </button>

                    {/* Historial */}
                    <button
                        onClick={() => setCurrentView('history')}
                        style={{
                            gridColumn: '1 / -1',
                            padding: '14px 16px',
                            backgroundColor: '#1E2329',
                            color: '#848E9C',
                            border: '1px solid #2B3139',
                            borderRadius: '8px',
                            fontWeight: 500,
                            fontSize: '14px',
                            fontFamily: "'IBM Plex Sans', sans-serif",
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>📋</span>
                        Historial de operaciones
                    </button>
                </div>

                {/* Footer link */}
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button
                        onClick={() => setShowUpdates(true)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#848E9C',
                            cursor: 'pointer',
                            fontSize: '13px',
                            padding: '8px',
                            fontFamily: "'IBM Plex Sans', sans-serif",
                        }}
                    >
                        Novedades y Roadmap →
                    </button>
                </div>
            </div>
        );
    }

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
                    <span style={{ fontSize: '18px', lineHeight: 1 }}>🤖</span>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#EAECEF', letterSpacing: '-0.3px' }}>
                        ARG<span style={{ color: '#F0B90B' }}>BOT</span>
                    </span>
                    <span style={{
                        fontSize: '10px',
                        color: '#474D57',
                        backgroundColor: '#2B3139',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 500,
                        fontFamily: "'IBM Plex Mono', monospace",
                    }}>
                        v{pkg.version}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                        ⚙️
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

            {showUpdates && <Updates onClose={() => setShowUpdates(false)} />}
            {showSettings && <Settings onClose={() => { setShowSettings(false); setSettingsTab('sync'); }} user={user} initialTab={settingsTab} />}

            {/* Update banner */}
            {showUpdateBanner && (
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    backgroundColor: '#1E2329',
                    borderTop: '1px solid #F0B90B',
                    padding: '14px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 9998,
                }}>
                    <span style={{ color: '#EAECEF', fontSize: '14px', fontWeight: 500 }}>
                        Nueva versión disponible
                    </span>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            backgroundColor: '#F0B90B',
                            color: '#181A20',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 18px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: "'IBM Plex Sans', sans-serif",
                        }}
                    >
                        Actualizar
                    </button>
                </div>
            )}
        </div>
    );
}
