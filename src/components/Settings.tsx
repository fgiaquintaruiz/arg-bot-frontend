import React, { useState, useEffect } from 'react';
import { uploadToDrive, downloadFromDrive } from '../googleDrive';
import { API_URL } from '../config';

// Service fee is disabled pending written authorization from redacted (contractual requirement). Flip to `true` once authorization is obtained — rest of the fee logic is preserved intentionally.
const FEE_ENABLED = false;

export default function Settings({ onClose, user, initialTab }: { onClose: () => void; user: any; initialTab?: string }) {
  const [activeTab, setActiveTab] = useState<'sync' | 'binance' | 'fee' | 'support'>(() => {
    const tab = (initialTab as any) || 'sync';
    return (!FEE_ENABLED && tab === 'fee') ? 'sync' : tab;
  });
  const [syncStatus, setSyncStatus] = useState<'none' | 'loading' | 'success' | 'error' | 'uploading' | 'downloading'>('none');
  const [syncMessage, setSyncMessage] = useState('');
  const [serviceFee, setServiceFee] = useState<string>(() => localStorage.getItem('service_fee') || '0');
  const [feeWhitelist, setFeeWhitelist] = useState<string>(() => localStorage.getItem('fee_whitelist') || '');
  const [binanceEurIban, setBinanceEurIban] = useState<string>(() => localStorage.getItem('binance_eur_iban') || '');
  const [binanceEurName, setBinanceEurName] = useState<string>(() => localStorage.getItem('binance_eur_name') || '');
  const [binanceEurBic, setBinanceEurBic] = useState<string>(() => localStorage.getItem('binance_eur_bic') || '');
  const [binanceBankName, setBinanceBankName] = useState<string>(() => localStorage.getItem('binance_bank_name') || '');
  const [binanceBankAddress, setBinanceBankAddress] = useState<string>(() => localStorage.getItem('binance_bank_address') || '');
  const [binanceApiKey, setBinanceApiKey] = useState<string>(() => localStorage.getItem('binance_key') || '');
  const [binanceApiSecret, setBinanceApiSecret] = useState<string>(() => localStorage.getItem('binance_secret') || '');
  const [serverIp, setServerIp] = useState<string>('Cargando...');
  const [binanceSaved, setBinanceSaved] = useState(false);
  const [binanceCleared, setBinanceCleared] = useState(false);
  const [feeSaved, setFeeSaved] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const SUPPORT_EMAIL = 'soporte@argbot.app';

  // Fetch server IP for Binance whitelist
  useEffect(() => {
    if (activeTab === 'binance') {
      fetch(`${API_URL}/api/ip`)
        .then(res => res.json())
        .then(data => setServerIp(data.ip || 'Error'))
        .catch(() => setServerIp('No disponible'));
    }
  }, [activeTab]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch { /* fallback */ }
  };

  // Google Drive Sync
  const handleDriveSync = async (action: 'upload' | 'download') => {
    setSyncStatus(action === 'upload' ? 'uploading' : 'downloading');
    setSyncMessage(action === 'upload' ? 'Conectando con Google Drive...' : 'Conectando con Google Drive...');

    try {
      if (action === 'upload') {
        const dataToSync = {
          version: 1,
          timestamp: new Date().toISOString(),
          apiKey: localStorage.getItem('binance_key') || '',
          apiSecret: localStorage.getItem('binance_secret') || '',
          addressBook: localStorage.getItem('address_book') || '[]',
          tradeHistory: localStorage.getItem('trade_history') || '[]',
          usdcWallet: localStorage.getItem('usdc_wallet') || '',
          serviceFee: localStorage.getItem('service_fee') || '0.50',
          feeWhitelist: localStorage.getItem('fee_whitelist') || ''
        };

        console.log('[Settings] Uploading to Google Drive...');
        const success = await uploadToDrive(dataToSync);

        if (success) {
          setSyncStatus('success');
          setSyncMessage('✅ Datos subidos a tu Google Drive correctamente. Ya podés descargarlos desde cualquier dispositivo.');
          console.log('[Settings] Upload successful');
        } else {
          setSyncStatus('error');
          setSyncMessage('❌ No se pudo subir. Cancelaste el permiso o hubo un error de conexión.');
        }
      } else {
        console.log('[Settings] Downloading from Google Drive...');
        const data = await downloadFromDrive();

        if (data) {
          // Restore data
          if (data.apiKey) localStorage.setItem('binance_key', data.apiKey);
          if (data.apiSecret) localStorage.setItem('binance_secret', data.apiSecret);
          if (data.addressBook) localStorage.setItem('address_book', data.addressBook);
          if (data.tradeHistory) localStorage.setItem('trade_history', data.tradeHistory);
          if (data.usdcWallet) localStorage.setItem('usdc_wallet', data.usdcWallet);
          if (data.serviceFee) localStorage.setItem('service_fee', data.serviceFee);
          if (data.feeWhitelist) localStorage.setItem('fee_whitelist', data.feeWhitelist);

          setSyncStatus('success');
          setSyncMessage(`✅ Datos restaurados desde Google Drive (${data.timestamp || 'fecha desconocida'}). Recargá la página para aplicar los cambios.`);
          console.log('[Settings] Download successful');
        } else {
          setSyncStatus('error');
          setSyncMessage('⚠️ No se encontró un respaldo en tu Google Drive. Primero necesitás subir tus datos desde otro dispositivo.');
        }
      }
    } catch (err: any) {
      console.error('[Settings] Sync error:', err);
      setSyncStatus('error');
      setSyncMessage(`❌ Error: ${err.message || 'Error desconocido'}`);
    }
  };

  const handleSaveFee = () => {
    const fee = parseFloat(serviceFee);
    if (isNaN(fee) || fee < 0 || fee > 1) {
      alert('El fee debe ser entre 0.00 y 1.00 EUR');
      return;
    }
    localStorage.setItem('service_fee', fee.toFixed(2));
    localStorage.setItem('fee_whitelist', feeWhitelist);
    setFeeSaved(true);
    setTimeout(() => setFeeSaved(false), 3000);
  };

  const copySupportEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch { /* fallback not needed for modern browsers */ }
  };

  // Save Binance config
  const handleSaveBinance = () => {
    localStorage.setItem('binance_eur_iban', binanceEurIban.trim());
    localStorage.setItem('binance_eur_name', binanceEurName.trim());
    localStorage.setItem('binance_eur_bic', binanceEurBic.trim());
    localStorage.setItem('binance_bank_name', binanceBankName.trim());
    localStorage.setItem('binance_bank_address', binanceBankAddress.trim());
    if (binanceApiKey.trim()) localStorage.setItem('binance_key', binanceApiKey.trim());
    if (binanceApiSecret.trim()) localStorage.setItem('binance_secret', binanceApiSecret.trim());
    setBinanceSaved(true);
    setBinanceCleared(false);
    setTimeout(() => setBinanceSaved(false), 3000);
  };

  // Clear Binance config
  const handleClearBinance = () => {
    if (!confirm('¿Estás seguro de que querés borrar todos los datos de Binance? Esta acción no se puede deshacer.')) return;
    localStorage.removeItem('binance_eur_iban');
    localStorage.removeItem('binance_eur_name');
    localStorage.removeItem('binance_eur_bic');
    localStorage.removeItem('binance_bank_name');
    localStorage.removeItem('binance_bank_address');
    localStorage.removeItem('binance_key');
    localStorage.removeItem('binance_secret');
    setBinanceEurIban('');
    setBinanceEurName('');
    setBinanceEurBic('');
    setBinanceBankName('');
    setBinanceBankAddress('');
    setBinanceApiKey('');
    setBinanceApiSecret('');
    setBinanceCleared(true);
    setBinanceSaved(false);
    setTimeout(() => setBinanceCleared(false), 3000);
  };

  const tabStyle = (tab: string) => ({
    flex: 1, padding: '10px 8px', backgroundColor: activeTab === tab ? '#3b82f6' : '#1e293b',
    color: activeTab === tab ? '#fff' : '#94a3b8', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: 'all 0.2s ease'
  });

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: '#0f172a', width: '100%', maxWidth: '500px', maxHeight: '85vh', borderRadius: '24px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.3rem' }}>⚙️ Configuración</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
        </div>

        {/* Tabs */}
        <div style={{ padding: '12px 24px', display: 'flex', gap: '8px', borderBottom: '1px solid #1e293b' }}>
          <button style={tabStyle('sync')} onClick={() => setActiveTab('sync')}>☁️ Sync</button>
          <button style={tabStyle('binance')} onClick={() => setActiveTab('binance')}>🏦 Binance</button>
          {FEE_ENABLED && (
            <button style={tabStyle('fee')} onClick={() => setActiveTab('fee')}>💰 Fee</button>
          )}
          <button style={tabStyle('support')} onClick={() => setActiveTab('support')}>📧 Soporte</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>

          {/* SYNC TAB */}
          {activeTab === 'sync' && (
            <div>
              <h4 style={{ color: '#f8fafc', margin: '0 0 12px 0', fontSize: '15px' }}>Sincronización con Google Drive</h4>
              <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>
                Guardá tus claves API, libreta de direcciones e historial en Google Drive para usar ARGBOT desde cualquier dispositivo. Tus datos se encriptan antes de subirse.
              </p>

              <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🔒</span>
                  <div>
                    <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '14px' }}>Encriptado AES-256</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>Tus datos se cifran antes de subirse</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>📱</span>
                  <div>
                    <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '14px' }}>Multi-dispositivo</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>Usá la app desde cualquier celular o PC</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <button
                  onTouchEnd={(e) => { e.preventDefault(); handleDriveSync('upload'); }}
                  onClick={() => handleDriveSync('upload')}
                  disabled={syncStatus === 'uploading' || syncStatus === 'downloading'}
                  style={{
                    flex: 1, padding: '16px', backgroundColor: '#10b981', color: '#fff',
                    border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold',
                    cursor: syncStatus === 'uploading' ? 'wait' : 'pointer', opacity: syncStatus === 'uploading' ? 0.7 : 1,
                    WebkitTapHighlightColor: 'transparent', WebkitAppearance: 'none', touchAction: 'manipulation',
                    minHeight: '48px'
                  }}
                >
                  {syncStatus === 'uploading' ? '⏳ Subiendo...' : '📤 Subir a Drive'}
                </button>
                <button
                  onTouchEnd={(e) => { e.preventDefault(); handleDriveSync('download'); }}
                  onClick={() => handleDriveSync('download')}
                  disabled={syncStatus === 'uploading' || syncStatus === 'downloading'}
                  style={{
                    flex: 1, padding: '16px', backgroundColor: '#3b82f6', color: '#fff',
                    border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold',
                    cursor: syncStatus === 'downloading' ? 'wait' : 'pointer', opacity: syncStatus === 'downloading' ? 0.7 : 1,
                    WebkitTapHighlightColor: 'transparent', WebkitAppearance: 'none', touchAction: 'manipulation',
                    minHeight: '48px'
                  }}
                >
                  {syncStatus === 'downloading' ? '⏳ Bajando...' : '📥 Descargar de Drive'}
                </button>
              </div>

              {syncMessage && (
                <div style={{
                  padding: '12px', borderRadius: '10px', fontSize: '13px', lineHeight: '1.5',
                  backgroundColor: syncStatus === 'success' ? '#052e16' : syncStatus === 'error' ? '#450a0a' : '#1e293b',
                  color: syncStatus === 'success' ? '#10b981' : syncStatus === 'error' ? '#ef4444' : '#94a3b8',
                  border: `1px solid ${syncStatus === 'success' ? '#10b981' : syncStatus === 'error' ? '#7f1d1d' : '#334155'}`
                }}>
                  {syncMessage}
                </div>
              )}
            </div>
          )}

          {/* BINANCE TAB */}
          {activeTab === 'binance' && (
            <div>
              <h4 style={{ color: '#f8fafc', margin: '0 0 12px 0', fontSize: '15px' }}>🏦 Configuración de Binance</h4>

              {/* IP Whitelist */}
              <div style={{ backgroundColor: '#2d2013', border: '1px solid #ff9800', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#ffb74d', marginBottom: '6px' }}><b>⚠️ IP para Whitelist de Binance:</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#fff' }}>{serverIp}</span>
                  <button
                    onTouchEnd={(e) => { e.preventDefault(); copyToClipboard(serverIp, 'serverip'); }}
                    onClick={() => copyToClipboard(serverIp, 'serverip')}
                    style={{ background: '#ff9800', color: '#000', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', minHeight: '32px' }}
                  >
                    {copiedField === 'serverip' ? '✅' : '📋 COPIAR'}
                  </button>
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>
                  Agregá esta IP en Binance → Gestión de API → Restricciones de IP
                </div>
              </div>

              {/* EUR Deposit Details */}
              <h5 style={{ color: '#38bdf8', margin: '0 0 12px 0', fontSize: '14px' }}>💶 Datos de Depósito EUR</h5>
              <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.5', marginBottom: '16px' }}>
                Copialos desde Binance → Billetera → Depósito → EUR → Datos SEPA
              </p>

              <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #334155' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Beneficiario (tu nombre en Binance)</label>
                <input
                  type="text"
                  value={binanceEurName}
                  onChange={e => setBinanceEurName(e.target.value)}
                  placeholder="Tu nombre completo como aparece en Binance"
                  style={{
                    width: '100%', padding: '12px', backgroundColor: '#0e1621', border: '1px solid #334155',
                    color: '#f8fafc', borderRadius: '8px', fontSize: '14px',
                    boxSizing: 'border-box', marginBottom: '12px'
                  }}
                />

                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>IBAN</label>
                <input
                  type="text"
                  value={binanceEurIban}
                  onChange={e => setBinanceEurIban(e.target.value)}
                  placeholder="Ej: LT12 3456 7890 1234 5678"
                  style={{
                    width: '100%', padding: '12px', backgroundColor: '#0e1621', border: '1px solid #334155',
                    color: '#f8fafc', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace',
                    boxSizing: 'border-box', marginBottom: '12px'
                  }}
                />

                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>BIC/SWIFT</label>
                <input
                  type="text"
                  value={binanceEurBic}
                  onChange={e => setBinanceEurBic(e.target.value)}
                  placeholder="Ej: REVOLT21XXX"
                  style={{
                    width: '100%', padding: '12px', backgroundColor: '#0e1621', border: '1px solid #334155',
                    color: '#f8fafc', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace',
                    boxSizing: 'border-box', marginBottom: '12px'
                  }}
                />

                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Banco</label>
                <input
                  type="text"
                  value={binanceBankName}
                  onChange={e => setBinanceBankName(e.target.value)}
                  placeholder="Ej: Revolut Bank UAB"
                  style={{
                    width: '100%', padding: '12px', backgroundColor: '#0e1621', border: '1px solid #334155',
                    color: '#f8fafc', borderRadius: '8px', fontSize: '14px',
                    boxSizing: 'border-box', marginBottom: '12px'
                  }}
                />

                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Dirección del banco</label>
                <input
                  type="text"
                  value={binanceBankAddress}
                  onChange={e => setBinanceBankAddress(e.target.value)}
                  placeholder="Ej: Konstitucijos pr. 21B, Vilnius"
                  style={{
                    width: '100%', padding: '12px', backgroundColor: '#0e1621', border: '1px solid #334155',
                    color: '#f8fafc', borderRadius: '8px', fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* API Keys */}
              <h5 style={{ color: '#fbbf24', margin: '0 0 12px 0', fontSize: '14px' }}>🔑 Claves API de Binance</h5>
              <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.5', marginBottom: '16px' }}>
                Crealas en Binance → Gestión de API → Nueva clave. Permisos: lectura, trade, retiro.
              </p>

              <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #334155' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>API Key</label>
                <input
                  type="password"
                  value={binanceApiKey}
                  onChange={e => setBinanceApiKey(e.target.value)}
                  autoComplete="off"
                  data-form-type="other"
                  placeholder="Tu API Key"
                  style={{
                    width: '100%', padding: '12px', backgroundColor: '#0e1621', border: '1px solid #334155',
                    color: '#f8fafc', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace',
                    boxSizing: 'border-box', marginBottom: '12px'
                  }}
                />

                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>API Secret</label>
                <input
                  type="password"
                  value={binanceApiSecret}
                  onChange={e => setBinanceApiSecret(e.target.value)}
                  autoComplete="new-password"
                  data-form-type="other"
                  placeholder="Tu API Secret"
                  style={{
                    width: '100%', padding: '12px', backgroundColor: '#0e1621', border: '1px solid #334155',
                    color: '#f8fafc', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Save / Clear buttons */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <button
                  onTouchEnd={(e) => { e.preventDefault(); handleSaveBinance(); }}
                  onClick={handleSaveBinance}
                  style={{
                    flex: 1, padding: '14px',
                    backgroundColor: binanceSaved ? '#052e16' : '#10b981',
                    color: binanceSaved ? '#10b981' : '#fff',
                    border: binanceSaved ? '1px solid #10b981' : 'none',
                    borderRadius: '10px', fontSize: '14px', fontWeight: 'bold',
                    cursor: 'pointer', minHeight: '48px'
                  }}
                >
                  {binanceSaved ? '✅ ¡Guardado!' : '💾 Guardar'}
                </button>
                <button
                  onTouchEnd={(e) => { e.preventDefault(); handleClearBinance(); }}
                  onClick={handleClearBinance}
                  style={{
                    flex: 1, padding: '14px',
                    backgroundColor: binanceCleared ? '#450a0a' : '#dc2626',
                    color: binanceCleared ? '#ef4444' : '#fff',
                    border: binanceCleared ? '1px solid #7f1d1d' : 'none',
                    borderRadius: '10px', fontSize: '14px', fontWeight: 'bold',
                    cursor: 'pointer', minHeight: '48px'
                  }}
                >
                  {binanceCleared ? '✅ ¡Borrado!' : '🗑️ Borrar todo'}
                </button>
              </div>
            </div>
          )}

          {/* FEE TAB */}
          {FEE_ENABLED && activeTab === 'fee' && (
            <div>
              <h4 style={{ color: '#f8fafc', margin: '0 0 12px 0', fontSize: '15px' }}>Fee de Servicio</h4>
              <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>
                Configurá cuánto cobrás por operación completa (cambio + retiro). Los usuarios en la lista de exentos no pagan fee.
              </p>

              <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '1px solid #334155' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Fee por operación (EUR)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 'bold' }}>€</span>
                  <input
                    type="number"
                    value={serviceFee}
                    onChange={e => setServiceFee(e.target.value)}
                    min="0"
                    max="1"
                    step="0.05"
                    style={{
                      flex: 1, padding: '14px', backgroundColor: '#0e1621', border: '1px solid #334155',
                      color: '#f8fafc', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', gap: '4px' }}>
                  {['0.10', '0.25', '0.50', '0.75', '1.00'].map(v => (
                    <button
                      key={v}
                      onTouchEnd={(e) => { e.preventDefault(); setServiceFee(v); }}
                      onClick={() => setServiceFee(v)}
                      style={{
                        flex: 1, padding: '10px 4px', backgroundColor: serviceFee === v ? '#3b82f6' : '#0e1621',
                        color: serviceFee === v ? '#fff' : '#94a3b8', border: '1px solid #334155',
                        borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold',
                        WebkitTapHighlightColor: 'transparent', WebkitAppearance: 'none', touchAction: 'manipulation',
                        minHeight: '44px'
                      }}
                    >
                      €{v}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '1px solid #334155' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Lista de exentos (emails, uno por línea)</label>
                <textarea
                  value={feeWhitelist}
                  onChange={e => setFeeWhitelist(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%', padding: '14px', backgroundColor: '#0e1621', border: '1px solid #334155',
                    color: '#f8fafc', borderRadius: '10px', fontSize: '13px', fontFamily: 'monospace',
                    boxSizing: 'border-box', resize: 'vertical'
                  }}
                  placeholder="usuario1@gmail.com&#10;usuario2@hotmail.com"
                />
              </div>

              <button
                onTouchEnd={(e) => { e.preventDefault(); handleSaveFee(); }}
                onClick={handleSaveFee}
                style={{
                  width: '100%', padding: '16px', backgroundColor: feeSaved ? '#10b981' : '#3b82f6',
                  color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold',
                  cursor: 'pointer', transition: 'background-color 0.3s',
                  WebkitTapHighlightColor: 'transparent', WebkitAppearance: 'none', touchAction: 'manipulation',
                  minHeight: '52px'
                }}
              >
                {feeSaved ? '✅ Guardado' : '💾 Guardar Configuración'}
              </button>
            </div>
          )}

          {/* SUPPORT TAB */}
          {activeTab === 'support' && (
            <div>
              <h4 style={{ color: '#f8fafc', margin: '0 0 12px 0', fontSize: '15px' }}>Soporte</h4>
              <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>
                ¿Tenés algún problema o consulta? Estamos para ayudarte.
              </p>

              <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '1px solid #334155', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📧</div>
                <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Email de soporte</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span style={{ color: '#38bdf8', fontSize: '16px', fontWeight: 'bold' }}>{SUPPORT_EMAIL}</span>
                  <button
                    onClick={copySupportEmail}
                    style={{
                      background: '#334155', border: 'none', color: copiedEmail ? '#10b981' : '#94a3b8',
                      borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold'
                    }}
                  >
                    {copiedEmail ? '✅' : '📋'}
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '1px solid #334155' }}>
                <h5 style={{ color: '#fbbf24', margin: '0 0 12px 0', fontSize: '14px' }}>🛡️ Tu Seguridad</h5>
                <ul style={{ margin: 0, padding: '0 0 0 16px', color: '#cbd5e1', fontSize: '13px', lineHeight: '1.8' }}>
                  <li>Tus claves API se encriptan con AES-256 en tu navegador</li>
                  <li>Nunca almacenamos tus claves en nuestros servidores</li>
                  <li>Solo se necesitan permisos de lectura, trade y retiro en Binance</li>
                  <li>Recomendamos activar IP Whitelist en Binance</li>
                  <li>Código abierto en <a href="https://github.com/fgiaquintaruiz/arg-bot-frontend" style={{ color: '#38bdf8' }}>GitHub</a></li>
                </ul>
              </div>

              <div style={{ backgroundColor: '#052e16', borderRadius: '12px', padding: '16px', border: '1px solid #10b981' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>✅</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '14px' }}>Código Abierto</span>
                </div>
                <p style={{ color: '#6ee7b7', fontSize: '12px', margin: 0, lineHeight: '1.6' }}>
                  ARGBOT es open-source. Podés revisar todo el código en nuestro repositorio de GitHub para verificar que no hay nada sospechoso.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
