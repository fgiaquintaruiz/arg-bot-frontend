import React, { useState } from 'react';
import { ArrowLeftRight, X } from 'lucide-react';
import { API_URL } from '../config';
import { getSelectedWithdrawEntry } from '../lib/withdrawAddress';
import { CoreData } from '../types';

interface TradeProps {
  data: CoreData;
  onClose?: () => void;
  onSuccess: () => void;
}

export default function Trade({ data, onClose, onSuccess }: TradeProps) {
  const [eurInput, setEurInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  if (!data) return <div style={{ color: '#848E9C', padding: '40px 20px', textAlign: 'center', fontSize: '14px' }}>Cargando mercado...</div>;

  const eurAmount = parseFloat(eurInput) || 0;
  const grossUsdc = eurAmount * parseFloat(data.rate || '0');
  const fee = grossUsdc * (data.fees?.tradingRate || 0.001);
  const netUsdc = grossUsdc - fee;

  const serviceFee = parseFloat(localStorage.getItem('service_fee') || '0') || 0;
  const userEmail = localStorage.getItem('user_email') || '';
  const whitelist = (localStorage.getItem('fee_whitelist') || '').split('\n').map(e => e.trim().toLowerCase()).filter(Boolean);
  const isExempt = whitelist.includes(userEmail.toLowerCase());
  const effectiveFee = isExempt ? 0 : serviceFee;

  const handleInitiateTrade = () => {
    if (!eurInput || parseFloat(eurInput) <= 0) return;
    if (parseFloat(eurInput) > parseFloat(data.balances.eur)) {
      setErrorMsg('Saldo insuficiente. Solo tenés ' + data.balances.eur + ' EUR.');
      return;
    }
    setIsConfirming(true);
  };

  const handleConfirmTrade = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const testnet = localStorage.getItem('argbot_testnet') !== 'false';
      const apiKey = localStorage.getItem(testnet ? 'binance_key_testnet' : 'binance_key') || '';
      const apiSecret = localStorage.getItem(testnet ? 'binance_secret_testnet' : 'binance_secret') || '';
      const res = await fetch(`${API_URL}/api/trade`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey, apiSecret, amountEur: eurInput, testnet }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error en el cambio');
      setSuccessMsg('¡Cambio ejecutado con éxito!');
      fetch(`${API_URL}/api/push/notify/trade-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch(() => {});
      let history: any[] = [];
      try { history = JSON.parse(localStorage.getItem("trade_history") || "[]"); } catch { history = []; }
      const usdcArs = parseFloat(data.usdcArsRate || '0');
      const eurUsdc = parseFloat(data.rate || '0');
      const eurArsRate = usdcArs > 0 && eurUsdc > 0 ? (eurUsdc * usdcArs).toFixed(2) : undefined;
      const arsAmount = usdcArs > 0 ? (netUsdc * usdcArs).toFixed(0) : undefined;
      // Binance no cobra fee de retiro para USDC BEP20 — siempre 0
      const binanceFeeEur = '0';
      const usdcDestAddress = getSelectedWithdrawEntry()?.address || undefined;
      history.push({ date: new Date().toISOString(), eur: eurInput, savings: "0", usdcReceived: netUsdc.toFixed(2), serviceFee: effectiveFee.toFixed(2), arsAmount, eurArsRate, eurUsdcRate: eurUsdc > 0 ? eurUsdc.toFixed(4) : undefined, binanceFeeEur, usdcDestAddress });
      localStorage.setItem("trade_history", JSON.stringify(history));
      setEurInput(''); setIsConfirming(false);
      setTimeout(() => onSuccess(), 2000);
    } catch (e: any) {
      setErrorMsg(e.message);
      setIsConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 14px', backgroundColor: '#181A20',
    border: '1px solid #2B3139', color: '#EAECEF', borderRadius: '8px',
    fontSize: '16px', fontWeight: 600, boxSizing: 'border-box',
    fontFamily: "'IBM Plex Mono', monospace", outline: 'none',
  };

  return (
    <div style={{ backgroundColor: '#1E2329', borderRadius: '12px', border: '1px solid #2B3139' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #2B3139', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ArrowLeftRight size={16} color="#848E9C" />
        <h3 style={{ margin: 0, color: '#EAECEF', fontSize: '1rem', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          Cambiar EUR a USDC
        </h3>
      </div>

      <div style={{ padding: '20px' }}>

        {/* Rate + MAX row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#848E9C', marginBottom: '10px', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#474D57', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace" }}>Tasa: {data.rate}</span>
          <button
            onClick={() => { setEurInput(Math.max(0, parseFloat(data.balances?.eur || '0')).toFixed(2)); setIsConfirming(false); setErrorMsg(''); }}
            style={{ padding: '4px 10px', backgroundColor: 'rgba(240,185,11,0.1)', color: '#F0B90B', border: '1px solid rgba(240,185,11,0.2)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            MAX
          </button>
        </div>

        <input
          type="number"
          value={eurInput}
          onChange={(e) => { setEurInput(e.target.value); setIsConfirming(false); setErrorMsg(''); }}
          style={inputStyle}
          placeholder="Monto en EUR"
          disabled={loading || isConfirming}
        />

        <p style={{ fontSize: '12px', color: '#474D57', textAlign: 'center', margin: '10px 0 16px' }}>
          Mínimo ~10 EUR por operación (límite Binance)
        </p>

        {/* Breakdown */}
        <div style={{ backgroundColor: '#181A20', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #2B3139' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
            <span style={{ color: '#848E9C' }}>Comisión est. ({(data.fees?.tradingRate || 0.001) * 100}%)</span>
            <span style={{ color: '#F6465D', fontFamily: "'IBM Plex Mono', monospace" }}>- {fee.toFixed(2)} USDC</span>
          </div>
          {effectiveFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
              <span style={{ color: '#848E9C' }}>Fee de servicio</span>
              <span style={{ color: '#F0B90B', fontFamily: "'IBM Plex Mono', monospace" }}>- €{effectiveFee.toFixed(2)}</span>
            </div>
          )}
          {isExempt && effectiveFee === 0 && serviceFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
              <span style={{ color: '#848E9C' }}>Fee de servicio</span>
              <span style={{ color: '#0ECB81' }}>Exento</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #2B3139', paddingTop: '10px', marginTop: '4px' }}>
            <span style={{ color: '#EAECEF', fontWeight: 600 }}>Recibirás (~)</span>
            <span style={{ color: '#0ECB81', fontSize: '18px', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>{Math.max(0, netUsdc).toFixed(2)} USDC</span>
          </div>
        </div>

        {errorMsg && (
          <div style={{ color: '#F6465D', fontSize: '13px', textAlign: 'center', marginBottom: '14px', backgroundColor: 'rgba(246,70,93,0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(246,70,93,0.2)' }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ color: '#0ECB81', fontSize: '14px', textAlign: 'center', marginBottom: '14px', fontWeight: 600 }}>
            ✓ {successMsg}
          </div>
        )}

        {isConfirming ? (
          <div role="dialog" aria-modal="true" style={{ backgroundColor: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.2)', padding: '18px', borderRadius: '8px', marginBottom: '14px', textAlign: 'center' }}>
            <div style={{ color: '#F0B90B', fontWeight: 700, marginBottom: '10px', fontSize: '14px' }}>Confirmar operación</div>
            <div style={{ fontSize: '13px', marginBottom: '16px', color: '#848E9C' }}>
              Estás a punto de cambiar <span style={{ color: '#EAECEF', fontWeight: 600 }}>{eurInput} EUR</span>. Esta acción es irreversible.
            </div>
            <button
              onClick={handleConfirmTrade}
              style={{ width: '100%', padding: '13px', backgroundColor: '#F6465D', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '8px', fontFamily: "'IBM Plex Sans', sans-serif" }}
              disabled={loading}
            >
              {loading ? 'Ejecutando...' : 'Confirmar'}
            </button>
            <button
              onClick={() => setIsConfirming(false)}
              style={{ width: '100%', padding: '13px', backgroundColor: 'transparent', border: '1px solid #2B3139', color: '#848E9C', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif" }}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={handleInitiateTrade}
              style={{ width: '100%', padding: '13px', backgroundColor: '#0ECB81', color: '#181A20', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '8px', fontFamily: "'IBM Plex Sans', sans-serif" }}
              disabled={loading || !eurInput || parseFloat(eurInput) <= 0}
            >
              Ejecutar cambio
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
          </>
        )}
      </div>
    </div>
  );
}
