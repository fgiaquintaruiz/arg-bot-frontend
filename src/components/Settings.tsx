import React, { useState, useEffect } from 'react';
import { uploadToDrive, downloadFromDrive, setUserHint } from '../googleDrive';
import { API_URL } from '../config';

export default function Settings({ onClose, user, initialTab }: { onClose: () => void; user: any; initialTab?: string }) {
  const [activeTab, setActiveTab] = useState<'sync' | 'binance'>(() => {
    return ((initialTab as any) || 'sync') as 'sync' | 'binance';
  });
  const [syncStatus, setSyncStatus] = useState<'none' | 'loading' | 'success' | 'error' | 'uploading' | 'downloading'>('none');
  const [syncMessage, setSyncMessage] = useState('');
  const [binanceEurIban, setBinanceEurIban] = useState<string>(() => localStorage.getItem('binance_eur_iban') || '');
  const [binanceEurName, setBinanceEurName] = useState<string>(() => localStorage.getItem('binance_eur_name') || '');
  const [binanceEurBic, setBinanceEurBic] = useState<string>(() => localStorage.getItem('binance_eur_bic') || '');
  const [binanceBankName, setBinanceBankName] = useState<string>(() => localStorage.getItem('binance_bank_name') || '');
  const [binanceBankAddress, setBinanceBankAddress] = useState<string>(() => localStorage.getItem('binance_bank_address') || '');
  const [binanceApiKey, setBinanceApiKey] = useState<string>(() => localStorage.getItem('binance_key') || '');
  const [binanceApiSecret, setBinanceApiSecret] = useState<string>(() => localStorage.getItem('binance_secret') || '');
  const [binanceApiTabActive, setBinanceApiTabActive] = useState<'prod' | 'testnet'>(() =>
    localStorage.getItem('argbot_testnet') === 'true' ? 'testnet' : 'prod'
  );
  const [binanceApiKeyTestnet, setBinanceApiKeyTestnet] = useState<string>(() => localStorage.getItem('binance_key_testnet') || '');
  const [binanceApiSecretTestnet, setBinanceApiSecretTestnet] = useState<string>(() => localStorage.getItem('binance_secret_testnet') || '');
  const [serverIp, setServerIp] = useState<string>('Cargando...');
  const [binanceSaved, setBinanceSaved] = useState(false);
  const [binanceCleared, setBinanceCleared] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Registrar el email del usuario para evitar el account picker de Google
  useEffect(() => {
    if (user?.email) setUserHint(user.email);
  }, [user]);

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
      setTimeout(/* v8 ignore next */ () => setCopiedField(null), 2000);
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
          apiKeyTestnet: localStorage.getItem('binance_key_testnet') || '',
          apiSecretTestnet: localStorage.getItem('binance_secret_testnet') || '',
          addressBook: localStorage.getItem('address_book') || '[]',
          tradeHistory: localStorage.getItem('trade_history') || '[]',
          usdcWallet: localStorage.getItem('usdc_wallet') || '',
          binanceEurIban: localStorage.getItem('binance_eur_iban') || '',
          binanceEurName: localStorage.getItem('binance_eur_name') || '',
          binanceEurBic: localStorage.getItem('binance_eur_bic') || '',
          binanceBankName: localStorage.getItem('binance_bank_name') || '',
          binanceBankAddress: localStorage.getItem('binance_bank_address') || '',
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
          if (data.apiKeyTestnet) localStorage.setItem('binance_key_testnet', data.apiKeyTestnet);
          if (data.apiSecretTestnet) localStorage.setItem('binance_secret_testnet', data.apiSecretTestnet);
          if (data.addressBook) localStorage.setItem('address_book', data.addressBook);
          if (data.tradeHistory) localStorage.setItem('trade_history', data.tradeHistory);
          if (data.usdcWallet) localStorage.setItem('usdc_wallet', data.usdcWallet);
          if (data.binanceEurIban) localStorage.setItem('binance_eur_iban', data.binanceEurIban);
          if (data.binanceEurName) localStorage.setItem('binance_eur_name', data.binanceEurName);
          if (data.binanceEurBic) localStorage.setItem('binance_eur_bic', data.binanceEurBic);
          if (data.binanceBankName) localStorage.setItem('binance_bank_name', data.binanceBankName);
          if (data.binanceBankAddress) localStorage.setItem('binance_bank_address', data.binanceBankAddress);

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

  // Save Binance config
  const handleSaveBinance = () => {
    localStorage.setItem('binance_eur_iban', binanceEurIban.trim());
    localStorage.setItem('binance_eur_name', binanceEurName.trim());
    localStorage.setItem('binance_eur_bic', binanceEurBic.trim());
    localStorage.setItem('binance_bank_name', binanceBankName.trim());
    localStorage.setItem('binance_bank_address', binanceBankAddress.trim());
    if (binanceApiTabActive === 'testnet') {
      if (binanceApiKeyTestnet.trim()) localStorage.setItem('binance_key_testnet', binanceApiKeyTestnet.trim());
      if (binanceApiSecretTestnet.trim()) localStorage.setItem('binance_secret_testnet', binanceApiSecretTestnet.trim());
    } else {
      if (binanceApiKey.trim()) localStorage.setItem('binance_key', binanceApiKey.trim());
      if (binanceApiSecret.trim()) localStorage.setItem('binance_secret', binanceApiSecret.trim());
    }
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
    localStorage.removeItem('binance_key_testnet');
    localStorage.removeItem('binance_secret_testnet');
    setBinanceEurIban('');
    setBinanceEurName('');
    setBinanceEurBic('');
    setBinanceBankName('');
    setBinanceBankAddress('');
    setBinanceApiKey('');
    setBinanceApiSecret('');
    setBinanceApiKeyTestnet('');
    setBinanceApiSecretTestnet('');
    setBinanceCleared(true);
    setBinanceSaved(false);
    setTimeout(() => setBinanceCleared(false), 3000);
  };

  const tabStyle = (tab: string): React.CSSProperties => ({
    flex: 1, padding: '8px 6px',
    backgroundColor: activeTab === tab ? '#F0B90B' : 'transparent',
    color: activeTab === tab ? '#181A20' : '#848E9C',
    border: activeTab === tab ? 'none' : '1px solid #2B3139',
    borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12px',
    fontFamily: "'IBM Plex Sans', sans-serif",
  });

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: '#1E2329', width: '100%', maxWidth: '500px', maxHeight: '85vh', borderRadius: '12px', border: '1px solid #2B3139', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2B3139', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: '#EAECEF', fontSize: '1rem', fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>Configuración</h2>
          <button onClick={onClose} aria-label="Cerrar configuración" style={{ background: 'transparent', border: 'none', color: '#848E9C', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1, padding: '4px' }}>✖</button>
        </div>

        {/* Tabs */}
        <div style={{ padding: '10px 20px', display: 'flex', gap: '6px', borderBottom: '1px solid #2B3139' }}>
          <button style={tabStyle('sync')} onClick={() => setActiveTab('sync')}>Sync</button>
          <button style={tabStyle('binance')} onClick={() => setActiveTab('binance')}>Binance</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>

          {/* SYNC TAB */}
          {activeTab === 'sync' && (
            <div>
              <h4 style={{ color: '#EAECEF', margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>Sincronización con Google Drive</h4>
              <p style={{ color: '#848E9C', fontSize: '13px', lineHeight: '1.6', marginBottom: '16px' }}>
                Guardá tus claves API, libreta de direcciones e historial en Google Drive. Los datos se encriptan antes de subirse.
              </p>

              <div style={{ backgroundColor: '#181A20', borderRadius: '8px', padding: '14px', marginBottom: '14px', border: '1px solid #2B3139' }}>
                {[['🔒', 'Encriptado AES-256', 'Tus datos se cifran antes de subirse'], ['📱', 'Multi-dispositivo', 'Usá la app desde cualquier celular o PC']].map(([icon, title, sub]) => (
                  <div key={title} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: title === 'Encriptado AES-256' ? '10px' : 0 }}>
                    <span>{icon}</span>
                    <div>
                      <div style={{ color: '#EAECEF', fontWeight: 600, fontSize: '13px' }}>{title}</div>
                      <div style={{ color: '#848E9C', fontSize: '12px' }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button
                  onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); handleDriveSync('upload'); }}
                  onClick={() => handleDriveSync('upload')}
                  disabled={syncStatus === 'uploading' || syncStatus === 'downloading'}
                  style={{ flex: 1, padding: '13px', backgroundColor: '#0ECB81', color: '#181A20', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: syncStatus === 'uploading' ? 'wait' : 'pointer', opacity: syncStatus === 'uploading' ? 0.7 : 1, WebkitTapHighlightColor: 'transparent', WebkitAppearance: 'none', touchAction: 'manipulation', minHeight: '48px', fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  {syncStatus === 'uploading' ? 'Subiendo...' : '↑ Subir a Drive'}
                </button>
                <button
                  onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); handleDriveSync('download'); }}
                  onClick={() => handleDriveSync('download')}
                  disabled={syncStatus === 'uploading' || syncStatus === 'downloading'}
                  style={{ flex: 1, padding: '13px', backgroundColor: 'transparent', color: '#EAECEF', border: '1px solid #2B3139', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: syncStatus === 'downloading' ? 'wait' : 'pointer', opacity: syncStatus === 'downloading' ? 0.7 : 1, WebkitTapHighlightColor: 'transparent', WebkitAppearance: 'none', touchAction: 'manipulation', minHeight: '48px', fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  {syncStatus === 'downloading' ? 'Bajando...' : '↓ Descargar de Drive'}
                </button>
              </div>

              {syncMessage && (
                <div style={{
                  padding: '12px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.5',
                  backgroundColor: syncStatus === 'success' ? 'rgba(14,203,129,0.08)' : syncStatus === 'error' ? 'rgba(246,70,93,0.08)' : '#181A20',
                  color: syncStatus === 'success' ? '#0ECB81' : syncStatus === 'error' ? '#F6465D' : '#848E9C',
                  border: `1px solid ${syncStatus === 'success' ? 'rgba(14,203,129,0.2)' : syncStatus === 'error' ? 'rgba(246,70,93,0.2)' : '#2B3139'}`
                }}>
                  {syncMessage}
                </div>
              )}
            </div>
          )}

          {/* BINANCE TAB */}
          {activeTab === 'binance' && (
            <div>
              <h4 style={{ color: '#EAECEF', margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Configuración de Binance</h4>

              {/* IP Whitelist */}
              <div style={{ backgroundColor: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.2)', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', color: '#F0B90B', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>IP para Whitelist de Binance</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#EAECEF', flex: 1 }}>{serverIp}</span>
                  <button
                    onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); copyToClipboard(serverIp, 'serverip'); }}
                    onClick={() => copyToClipboard(serverIp, 'serverip')}
                    style={{ padding: '5px 12px', backgroundColor: copiedField === 'serverip' ? 'rgba(14,203,129,0.1)' : 'rgba(240,185,11,0.1)', color: copiedField === 'serverip' ? '#0ECB81' : '#F0B90B', border: `1px solid ${copiedField === 'serverip' ? 'rgba(14,203,129,0.3)' : 'rgba(240,185,11,0.3)'}`, borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', minHeight: '32px', fontFamily: "'IBM Plex Sans', sans-serif" }}
                  >
                    {copiedField === 'serverip' ? '✓ Copiada' : 'Copiar'}
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#474D57', marginTop: '6px' }}>
                  Binance → Gestión de API → Restricciones de IP
                </div>
              </div>

              {/* EUR Deposit Details */}
              <p style={{ color: '#848E9C', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, margin: '0 0 8px' }}>Datos de Depósito EUR</p>
              <p style={{ color: '#474D57', fontSize: '12px', lineHeight: '1.5', marginBottom: '12px' }}>
                Binance → Billetera → Depósito → EUR → Datos SEPA
              </p>

              <div style={{ backgroundColor: '#181A20', borderRadius: '8px', padding: '14px', marginBottom: '14px', border: '1px solid #2B3139', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Beneficiario', val: binanceEurName, set: setBinanceEurName, ph: 'Tu nombre en Binance', mono: false },
                  { label: 'IBAN', val: binanceEurIban, set: setBinanceEurIban, ph: 'LT12 3456 7890 1234 5678', mono: true },
                  { label: 'BIC / SWIFT', val: binanceEurBic, set: setBinanceEurBic, ph: 'REVOLT21XXX', mono: true },
                  { label: 'Banco', val: binanceBankName, set: setBinanceBankName, ph: 'Revolut Bank UAB', mono: false },
                  { label: 'Dirección del banco', val: binanceBankAddress, set: setBinanceBankAddress, ph: 'Konstitucijos pr. 21B, Vilnius', mono: false },
                ].map(({ label, val, set, ph, mono }) => (
                  <div key={label}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#474D57', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
                    <input type="text" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                      style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1E2329', border: '1px solid #2B3139', color: '#EAECEF', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', fontFamily: mono ? "'IBM Plex Mono', monospace" : "'IBM Plex Sans', sans-serif", outline: 'none' }}
                    />
                  </div>
                ))}
              </div>

              {/* API Keys */}
              <p style={{ color: '#848E9C', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, margin: '0 0 8px' }}>Claves API de Binance</p>
              <p style={{ color: '#474D57', fontSize: '12px', lineHeight: '1.5', marginBottom: '12px' }}>
                Binance → Gestión de API → Nueva clave. Permisos: lectura, trade, retiro.
              </p>

              <div style={{ backgroundColor: '#181A20', borderRadius: '8px', padding: '14px', marginBottom: '14px', border: '1px solid #2B3139', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Producción / Testnet tab bar */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['prod', 'testnet'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setBinanceApiTabActive(tab)}
                      style={{
                        flex: 1, padding: '7px 10px',
                        backgroundColor: binanceApiTabActive === tab ? '#F0B90B' : 'transparent',
                        color: binanceApiTabActive === tab ? '#181A20' : '#848E9C',
                        border: binanceApiTabActive === tab ? 'none' : '1px solid #2B3139',
                        borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12px',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                      }}
                    >
                      {tab === 'prod' ? 'Producción' : 'Testnet'}
                    </button>
                  ))}
                </div>

                {binanceApiTabActive === 'testnet' && (
                  <div style={{ backgroundColor: 'rgba(14,203,129,0.06)', border: '1px solid rgba(14,203,129,0.2)', padding: '9px 12px', borderRadius: '6px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#0ECB81', lineHeight: '1.5' }}>
                      Claves exclusivas de testnet.binance.vision
                    </p>
                  </div>
                )}

                {binanceApiTabActive === 'prod' ? (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#474D57', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>API Key</label>
                      <input type="password" value={binanceApiKey} onChange={e => setBinanceApiKey(e.target.value)} autoComplete="off" data-form-type="other" placeholder="Tu API Key"
                        style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1E2329', border: '1px solid #2B3139', color: '#EAECEF', borderRadius: '6px', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", boxSizing: 'border-box', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#474D57', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>API Secret</label>
                      <input type="password" value={binanceApiSecret} onChange={e => setBinanceApiSecret(e.target.value)} autoComplete="new-password" data-form-type="other" placeholder="Tu API Secret"
                        style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1E2329', border: '1px solid #2B3139', color: '#EAECEF', borderRadius: '6px', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", boxSizing: 'border-box', outline: 'none' }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#474D57', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>API Key</label>
                      <input type="password" value={binanceApiKeyTestnet} onChange={e => setBinanceApiKeyTestnet(e.target.value)} autoComplete="off" data-form-type="other" placeholder="Tu API Key (testnet)"
                        style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1E2329', border: '1px solid #2B3139', color: '#EAECEF', borderRadius: '6px', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", boxSizing: 'border-box', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#474D57', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>API Secret</label>
                      <input type="password" value={binanceApiSecretTestnet} onChange={e => setBinanceApiSecretTestnet(e.target.value)} autoComplete="new-password" data-form-type="other" placeholder="Tu API Secret (testnet)"
                        style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1E2329', border: '1px solid #2B3139', color: '#EAECEF', borderRadius: '6px', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace", boxSizing: 'border-box', outline: 'none' }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Save / Clear buttons */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); handleSaveBinance(); }}
                  onClick={handleSaveBinance}
                  style={{ flex: 1, padding: '13px', backgroundColor: binanceSaved ? 'rgba(14,203,129,0.1)' : '#0ECB81', color: binanceSaved ? '#0ECB81' : '#181A20', border: binanceSaved ? '1px solid rgba(14,203,129,0.3)' : 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', minHeight: '44px', fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  {binanceSaved ? '✓ Guardado' : 'Guardar'}
                </button>
                <button
                  onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); handleClearBinance(); }}
                  onClick={handleClearBinance}
                  style={{ flex: 1, padding: '13px', backgroundColor: 'transparent', color: binanceCleared ? '#0ECB81' : '#F6465D', border: `1px solid ${binanceCleared ? 'rgba(14,203,129,0.3)' : 'rgba(246,70,93,0.3)'}`, borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', minHeight: '44px', fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  {binanceCleared ? '✓ Borrado' : 'Borrar todo'}
                </button>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
