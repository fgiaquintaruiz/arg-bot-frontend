import React, { useState, useEffect } from 'react';
import { logout } from './authService';
import pkg from '../../../package.json';
import { API_URL } from './config'; // <-- Importamos la URL centralizada

import Calculator from './components/Calculator';
import BinanceConfig from './components/BinanceConfig';
import Trade from './components/Trade';
import Withdraw from './components/Withdraw';
import History from './components/History';

export default function Dashboard({ user }: { user: any }) {
  const [data, setData] = useState<any>(null);
  const [currentView, setCurrentView] = useState('main');

  const apiKey = localStorage.getItem('binance_key');
  const apiSecret = localStorage.getItem('binance_secret');
  const hasKeys = !!apiKey && !!apiSecret;

  useEffect(() => {
    // Usamos API_URL directamente
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
          setData({ balances: { eur: "0.00", usdc: "0.00" }, rate: "1.08", usdcArsRate: "1150.50", fees: { withdrawalUSDC_BEP20: 0.8, tradingRate: 0.001 } });
        });
  }, [user, currentView]);

  const bgPattern = "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='10' y='30' font-family='sans-serif' font-size='14' fill='%231e293b' opacity='0.4'%3E%E2%82%AC%3C/text%3E%3Ctext x='40' y='50' font-family='sans-serif' font-size='14' fill='%231e293b' opacity='0.4'%3E%E2%82%BF%3C/text%3E%3C/svg%3E\")";

  const renderView = () => {
    switch(currentView) {
      case 'calculator': return <Calculator data={data} onBack={() => setCurrentView('main')} />;
      case 'binance': return <BinanceConfig onSave={() => setCurrentView('main')} onCancel={() => setCurrentView('main')} />;
      case 'trade': return <Trade data={data} onClose={() => setCurrentView('main')} onSuccess={() => setCurrentView('main')} />;
      case 'withdraw': return <Withdraw data={data} onClose={() => setCurrentView('main')} onSuccess={() => setCurrentView('main')} />;
      case 'history': return <History onClose={() => setCurrentView('main')} />;
      default:
        return (
            <div style={{ backgroundColor: '#17212b', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', border: '1px solid #1e293b', width: '100%' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#f8fafc', textAlign: 'center', fontSize: '1.4rem' }}>Hola, {user.displayName?.split(' ')[0] || 'Usuario'}</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '30px', textAlign: 'center' }}>¿Qué vas a operar hoy?</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <button onClick={() => setCurrentView('calculator')} style={{ gridColumn: '1 / -1', padding: '24px 10px', backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '32px' }}>🧮</span> Calculadora
                </button>
                <button onClick={() => hasKeys && setCurrentView('trade')} style={{ opacity: hasKeys ? 1 : 0.4, cursor: hasKeys ? 'pointer' : 'not-allowed', padding: '24px 10px', backgroundColor: '#1e293b', color: '#10b981', border: '1px solid #334155', borderRadius: '20px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                  <span style={{ fontSize: '32px' }}>💱</span> Cambiar EUR
                  {!hasKeys && <span style={{fontSize: '11px', color: '#ef4444', backgroundColor: '#450a0a', padding: '4px 8px', borderRadius: '4px'}}>🔒 Requiere API</span>}
                </button>
                <button onClick={() => hasKeys && setCurrentView('withdraw')} style={{ opacity: hasKeys ? 1 : 0.4, cursor: hasKeys ? 'pointer' : 'not-allowed', padding: '24px 10px', backgroundColor: '#1e293b', color: '#a78bfa', border: '1px solid #334155', borderRadius: '20px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                  <span style={{ fontSize: '32px' }}>🏦</span> Retirar ARS
                  {!hasKeys && <span style={{fontSize: '11px', color: '#ef4444', backgroundColor: '#450a0a', padding: '4px 8px', borderRadius: '4px'}}>🔒 Requiere API</span>}
                </button>
                <button onClick={() => setCurrentView('binance')} style={{ padding: '20px 10px', backgroundColor: '#1e293b', color: '#f59e0b', border: '1px solid #334155', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>🔑</span> API Binance
                  {!hasKeys && <span style={{fontSize: '11px', color: '#f59e0b', backgroundColor: '#451a03', padding: '4px 8px', borderRadius: '4px', border: '1px solid #78350f'}}>⚠️ Falta Configurar</span>}
                </button>
                <button onClick={() => setCurrentView('history')} style={{ padding: '20px 10px', backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>📜</span> Historial
                </button>
              </div>
            </div>
        );
    }
  };

  return (
      <div style={{ width: '100vw', minHeight: '100vh', backgroundImage: bgPattern, display: 'flex', flexDirection: 'column', color: '#fff' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: '#0e1621', borderBottom: '1px solid #1e293b', flexShrink: 0, boxSizing: 'border-box' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>ARGBOT <span style={{fontSize:'12px', color:'#54687a', fontWeight: 500}}>v{pkg.version}</span></h2>
          <button onClick={logout} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>Salir</button>
        </div>
        <div style={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', maxWidth: '450px', margin: '0 auto' }}>
            {renderView()}
          </div>
        </div>
      </div>
  );
}