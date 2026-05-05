import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { uploadToDrive, downloadFromDrive, setUserHint } from '../googleDrive';
import { API_URL } from '../config';
import { getRateAlertConfig, setRateAlertConfig } from '../utils/rateAlertStorage';
import { STORAGE_KEYS } from '../utils/storageKeys';

export default function Settings({ onClose, user, initialTab }: { onClose: () => void; user: User; initialTab?: 'sync' | 'binance' | 'alerts' | 'notif' }) {
  const [activeTab, setActiveTab] = useState<'sync' | 'binance' | 'alerts' | 'notif'>(() => {
    return initialTab ?? 'sync';
  });
  const [syncStatus, setSyncStatus] = useState<'none' | 'loading' | 'success' | 'error' | 'uploading' | 'downloading'>('none');
  const [syncMessage, setSyncMessage] = useState('');
  const [binanceEurIban, setBinanceEurIban] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.BINANCE_EUR_IBAN) || '');
  const [binanceEurName, setBinanceEurName] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.BINANCE_EUR_NAME) || '');
  const [binanceEurBic, setBinanceEurBic] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.BINANCE_EUR_BIC) || '');
  const [binanceBankName, setBinanceBankName] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.BINANCE_BANK_NAME) || '');
  const [binanceBankAddress, setBinanceBankAddress] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.BINANCE_BANK_ADDRESS) || '');
  const [binanceApiKey, setBinanceApiKey] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.BINANCE_KEY) || '');
  const [binanceApiSecret, setBinanceApiSecret] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.BINANCE_SECRET) || '');
  const [binanceApiTabActive, setBinanceApiTabActive] = useState<'prod' | 'testnet'>(() =>
    localStorage.getItem(STORAGE_KEYS.ARGBOT_TESTNET) === 'true' ? 'testnet' : 'prod'
  );
  const [binanceApiKeyTestnet, setBinanceApiKeyTestnet] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.BINANCE_KEY_TESTNET) || '');
  const [binanceApiSecretTestnet, setBinanceApiSecretTestnet] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.BINANCE_SECRET_TESTNET) || '');
  const [serverIp, setServerIp] = useState<string>('Cargando...');
  const [binanceSaved, setBinanceSaved] = useState(false);
  const [binanceCleared, setBinanceCleared] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Notif tab state
  const [notifBannerEnabled, setNotifBannerEnabled] = useState<boolean>(() =>
    localStorage.getItem(STORAGE_KEYS.ARGBOT_NOTIF_BANNER_ENABLED) !== 'false'
  );

  // Alerts tab state
  const [eurArsUpper, setEurArsUpper] = useState<string>(() => String(getRateAlertConfig().eurArs.upper ?? ''));
  const [eurArsLower, setEurArsLower] = useState<string>(() => String(getRateAlertConfig().eurArs.lower ?? ''));
  const [eurUsdcUpper, setEurUsdcUpper] = useState<string>(() => String(getRateAlertConfig().eurUsdc.upper ?? ''));
  const [eurUsdcLower, setEurUsdcLower] = useState<string>(() => String(getRateAlertConfig().eurUsdc.lower ?? ''));
  const [alertsSaved, setAlertsSaved] = useState(false);
  const [alertsValidationError, setAlertsValidationError] = useState<string | null>(null);

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
    setSyncMessage('Conectando con Google Drive...');

    try {
      if (action === 'upload') {
        const dataToSync = {
          version: 1,
          timestamp: new Date().toISOString(),
          apiKey: localStorage.getItem(STORAGE_KEYS.BINANCE_KEY) || '',
          apiSecret: localStorage.getItem(STORAGE_KEYS.BINANCE_SECRET) || '',
          apiKeyTestnet: localStorage.getItem(STORAGE_KEYS.BINANCE_KEY_TESTNET) || '',
          apiSecretTestnet: localStorage.getItem(STORAGE_KEYS.BINANCE_SECRET_TESTNET) || '',
          addressBook: localStorage.getItem(STORAGE_KEYS.ADDRESS_BOOK) || '[]',
          tradeHistory: localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY) || '[]',
          usdcWallet: localStorage.getItem(STORAGE_KEYS.USDC_WALLET) || '',
          binanceEurIban: localStorage.getItem(STORAGE_KEYS.BINANCE_EUR_IBAN) || '',
          binanceEurName: localStorage.getItem(STORAGE_KEYS.BINANCE_EUR_NAME) || '',
          binanceEurBic: localStorage.getItem(STORAGE_KEYS.BINANCE_EUR_BIC) || '',
          binanceBankName: localStorage.getItem(STORAGE_KEYS.BINANCE_BANK_NAME) || '',
          binanceBankAddress: localStorage.getItem(STORAGE_KEYS.BINANCE_BANK_ADDRESS) || '',
          rateAlertConfig: localStorage.getItem(STORAGE_KEYS.RATE_ALERT_CONFIG) || '',
        };

        const success = await uploadToDrive(dataToSync);

        if (success) {
          setSyncStatus('success');
          setSyncMessage('✅ Datos subidos a tu Google Drive correctamente. Ya podés descargarlos desde cualquier dispositivo.');
        } else {
          setSyncStatus('error');
          setSyncMessage('❌ No se pudo subir. Cancelaste el permiso o hubo un error de conexión.');
        }
      } else {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Drive sync timeout')), 10000)
        );
        const data = await Promise.race([downloadFromDrive(), timeout]);

        if (data) {
          // Restore data
          if (data.apiKey) localStorage.setItem(STORAGE_KEYS.BINANCE_KEY, data.apiKey);
          if (data.apiSecret) localStorage.setItem(STORAGE_KEYS.BINANCE_SECRET, data.apiSecret);
          if (data.apiKeyTestnet) localStorage.setItem(STORAGE_KEYS.BINANCE_KEY_TESTNET, data.apiKeyTestnet);
          if (data.apiSecretTestnet) localStorage.setItem(STORAGE_KEYS.BINANCE_SECRET_TESTNET, data.apiSecretTestnet);
          if (data.addressBook) localStorage.setItem(STORAGE_KEYS.ADDRESS_BOOK, data.addressBook);
          if (data.tradeHistory) localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, data.tradeHistory);
          if (data.usdcWallet) localStorage.setItem(STORAGE_KEYS.USDC_WALLET, data.usdcWallet);
          if (data.binanceEurIban) localStorage.setItem(STORAGE_KEYS.BINANCE_EUR_IBAN, data.binanceEurIban);
          if (data.binanceEurName) localStorage.setItem(STORAGE_KEYS.BINANCE_EUR_NAME, data.binanceEurName);
          if (data.binanceEurBic) localStorage.setItem(STORAGE_KEYS.BINANCE_EUR_BIC, data.binanceEurBic);
          if (data.binanceBankName) localStorage.setItem(STORAGE_KEYS.BINANCE_BANK_NAME, data.binanceBankName);
          if (data.binanceBankAddress) localStorage.setItem(STORAGE_KEYS.BINANCE_BANK_ADDRESS, data.binanceBankAddress);
          if (data.rateAlertConfig) {
            localStorage.setItem(STORAGE_KEYS.RATE_ALERT_CONFIG, data.rateAlertConfig);
            try {
              const alertCfg = JSON.parse(data.rateAlertConfig);
              setEurArsUpper(String(alertCfg.eurArs?.upper ?? ''));
              setEurArsLower(String(alertCfg.eurArs?.lower ?? ''));
              setEurUsdcUpper(String(alertCfg.eurUsdc?.upper ?? ''));
              setEurUsdcLower(String(alertCfg.eurUsdc?.lower ?? ''));
            } catch { /* ignore */ }
          }

          setBinanceEurIban(data.binanceEurIban || '');
          setBinanceEurName(data.binanceEurName || '');
          setBinanceEurBic(data.binanceEurBic || '');
          setBinanceBankName(data.binanceBankName || '');
          setBinanceBankAddress(data.binanceBankAddress || '');
          if (data.apiKey) setBinanceApiKey(data.apiKey);
          if (data.apiSecret) setBinanceApiSecret(data.apiSecret);
          if (data.apiKeyTestnet) setBinanceApiKeyTestnet(data.apiKeyTestnet);
          if (data.apiSecretTestnet) setBinanceApiSecretTestnet(data.apiSecretTestnet);

          setSyncStatus('success');
          setSyncMessage(`✅ Datos restaurados desde Google Drive (${data.timestamp || 'fecha desconocida'}). Cambios aplicados — recargá para actualizar balances.`);
        } else {
          setSyncStatus('error');
          setSyncMessage('⚠️ No se encontró un respaldo en tu Google Drive. Primero necesitás subir tus datos desde otro dispositivo.');
        }
      }
    } catch (err) {
      console.error('[Settings] Sync error:', err);
      setSyncStatus('error');
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setSyncMessage(`❌ Error: ${msg}`);
    }
  };

  // Save Binance config
  const handleSaveBinance = () => {
    localStorage.setItem(STORAGE_KEYS.BINANCE_EUR_IBAN, binanceEurIban.trim());
    localStorage.setItem(STORAGE_KEYS.BINANCE_EUR_NAME, binanceEurName.trim());
    localStorage.setItem(STORAGE_KEYS.BINANCE_EUR_BIC, binanceEurBic.trim());
    localStorage.setItem(STORAGE_KEYS.BINANCE_BANK_NAME, binanceBankName.trim());
    localStorage.setItem(STORAGE_KEYS.BINANCE_BANK_ADDRESS, binanceBankAddress.trim());
    if (binanceApiTabActive === 'testnet') {
      if (binanceApiKeyTestnet.trim()) localStorage.setItem(STORAGE_KEYS.BINANCE_KEY_TESTNET, binanceApiKeyTestnet.trim());
      if (binanceApiSecretTestnet.trim()) localStorage.setItem(STORAGE_KEYS.BINANCE_SECRET_TESTNET, binanceApiSecretTestnet.trim());
    } else {
      if (binanceApiKey.trim()) localStorage.setItem(STORAGE_KEYS.BINANCE_KEY, binanceApiKey.trim());
      if (binanceApiSecret.trim()) localStorage.setItem(STORAGE_KEYS.BINANCE_SECRET, binanceApiSecret.trim());
    }
    setBinanceSaved(true);
    setBinanceCleared(false);
    setTimeout(() => setBinanceSaved(false), 3000);
  };

  // Clear Binance config
  const handleClearBinance = () => {
    if (!confirm('¿Estás seguro de que querés borrar todos los datos de Binance? Esta acción no se puede deshacer.')) return;
    localStorage.removeItem(STORAGE_KEYS.BINANCE_EUR_IBAN);
    localStorage.removeItem(STORAGE_KEYS.BINANCE_EUR_NAME);
    localStorage.removeItem(STORAGE_KEYS.BINANCE_EUR_BIC);
    localStorage.removeItem(STORAGE_KEYS.BINANCE_BANK_NAME);
    localStorage.removeItem(STORAGE_KEYS.BINANCE_BANK_ADDRESS);
    localStorage.removeItem(STORAGE_KEYS.BINANCE_KEY);
    localStorage.removeItem(STORAGE_KEYS.BINANCE_SECRET);
    localStorage.removeItem(STORAGE_KEYS.BINANCE_KEY_TESTNET);
    localStorage.removeItem(STORAGE_KEYS.BINANCE_SECRET_TESTNET);
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

  // Save alerts config
  const handleSaveAlerts = () => {
    // Validation: if both upper and lower defined for a pair, upper must be > lower
    if (eurArsUpper && eurArsLower) {
      if (parseFloat(eurArsUpper) <= parseFloat(eurArsLower)) {
        setAlertsValidationError('EUR/ARS: el umbral superior debe ser mayor que el inferior');
        return;
      }
    }
    if (eurUsdcUpper && eurUsdcLower) {
      if (parseFloat(eurUsdcUpper) <= parseFloat(eurUsdcLower)) {
        setAlertsValidationError('EUR/USDC: el umbral superior debe ser mayor que el inferior');
        return;
      }
    }
    setAlertsValidationError(null);
    setRateAlertConfig({
      eurArs: {
        upper: eurArsUpper ? parseFloat(eurArsUpper) : undefined,
        lower: eurArsLower ? parseFloat(eurArsLower) : undefined,
      },
      eurUsdc: {
        upper: eurUsdcUpper ? parseFloat(eurUsdcUpper) : undefined,
        lower: eurUsdcLower ? parseFloat(eurUsdcLower) : undefined,
      },
    });
    setAlertsSaved(true);
    setTimeout(() => setAlertsSaved(false), 3000);
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
          <button style={tabStyle('alerts')} onClick={() => setActiveTab('alerts')}>Alertas</button>
          <button style={tabStyle('notif')} onClick={() => setActiveTab('notif')}>Notif</button>
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

          {/* ALERTS TAB */}
          {activeTab === 'alerts' && (
            <div>
              <h4 style={{ color: '#EAECEF', margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Alertas de tasa</h4>
              <p style={{ color: '#848E9C', fontSize: '13px', lineHeight: '1.6', marginBottom: '16px' }}>
                Configurá umbrales de precio para EUR/ARS y EUR/USDC. El dashboard mostrará un banner cuando la tasa cruce el umbral configurado.
              </p>

              {alertsValidationError && (
                <div style={{ padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px', backgroundColor: 'rgba(246,70,93,0.08)', color: '#F6465D', border: '1px solid rgba(246,70,93,0.2)' }}>
                  {alertsValidationError}
                </div>
              )}

              {/* EUR/ARS section */}
              <div style={{ backgroundColor: '#181A20', borderRadius: '8px', padding: '14px', marginBottom: '14px', border: '1px solid #2B3139', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ color: '#848E9C', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, margin: '0 0 4px' }}>EUR/ARS</p>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#474D57', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Umbral superior (≥)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={eurArsUpper}
                    onChange={e => setEurArsUpper(e.target.value)}
                    placeholder="Umbral superior EUR/ARS"
                    style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1E2329', border: '1px solid #2B3139', color: '#EAECEF', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', fontFamily: "'IBM Plex Mono', monospace", outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#474D57', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Umbral inferior (≤)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={eurArsLower}
                    onChange={e => setEurArsLower(e.target.value)}
                    placeholder="Umbral inferior EUR/ARS"
                    style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1E2329', border: '1px solid #2B3139', color: '#EAECEF', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', fontFamily: "'IBM Plex Mono', monospace", outline: 'none' }}
                  />
                </div>
              </div>

              {/* EUR/USDC section */}
              <div style={{ backgroundColor: '#181A20', borderRadius: '8px', padding: '14px', marginBottom: '14px', border: '1px solid #2B3139', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ color: '#848E9C', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, margin: '0 0 4px' }}>EUR/USDC</p>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#474D57', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Umbral superior (≥)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={eurUsdcUpper}
                    onChange={e => setEurUsdcUpper(e.target.value)}
                    placeholder="Umbral superior EUR/USDC"
                    style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1E2329', border: '1px solid #2B3139', color: '#EAECEF', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', fontFamily: "'IBM Plex Mono', monospace", outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#474D57', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Umbral inferior (≤)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={eurUsdcLower}
                    onChange={e => setEurUsdcLower(e.target.value)}
                    placeholder="Umbral inferior EUR/USDC"
                    style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1E2329', border: '1px solid #2B3139', color: '#EAECEF', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', fontFamily: "'IBM Plex Mono', monospace", outline: 'none' }}
                  />
                </div>
              </div>

              {/* Save button */}
              <button
                onClick={handleSaveAlerts}
                disabled={!!alertsValidationError}
                style={{ width: '100%', padding: '13px', backgroundColor: alertsSaved ? 'rgba(14,203,129,0.1)' : '#0ECB81', color: alertsSaved ? '#0ECB81' : '#181A20', border: alertsSaved ? '1px solid rgba(14,203,129,0.3)' : 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', minHeight: '44px', fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                {alertsSaved ? '✓ Guardado' : 'Guardar alertas'}
              </button>
            </div>
          )}

          {/* NOTIF TAB */}
          {activeTab === 'notif' && (
            <div>
              <h4 style={{ color: '#EAECEF', margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Notificaciones</h4>
              <div style={{ backgroundColor: '#181A20', borderRadius: '8px', padding: '14px', border: '1px solid #2B3139' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '12px' }}>
                  <span style={{ color: '#EAECEF', fontSize: '13px', fontWeight: 600 }}>Mostrar banner de notificaciones</span>
                  <div
                    onClick={() => {
                      const next = !notifBannerEnabled;
                      setNotifBannerEnabled(next);
                      localStorage.setItem(STORAGE_KEYS.ARGBOT_NOTIF_BANNER_ENABLED, next ? 'true' : 'false');
                    }}
                    style={{
                      width: '42px', height: '24px', borderRadius: '12px', flexShrink: 0,
                      backgroundColor: notifBannerEnabled ? '#F0B90B' : '#2B3139',
                      position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '3px',
                      left: notifBannerEnabled ? '21px' : '3px',
                      width: '18px', height: '18px', borderRadius: '50%',
                      backgroundColor: notifBannerEnabled ? '#181A20' : '#474D57',
                      transition: 'left 0.2s',
                    }} />
                  </div>
                </label>
                <p style={{ color: '#848E9C', fontSize: '12px', lineHeight: '1.5', margin: '10px 0 0' }}>
                  Cuando está activo, verás el aviso para activar notificaciones en segundo plano.
                </p>
              </div>
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
                  Binance › Gestión de API › Restricciones de IP
                </div>
              </div>

              {/* EUR Deposit Details */}
              <p style={{ color: '#848E9C', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600, margin: '0 0 8px' }}>Datos de Depósito EUR</p>
              <p style={{ color: '#474D57', fontSize: '12px', lineHeight: '1.5', marginBottom: '12px' }}>
                Binance › Billetera › Depósito › EUR › Datos SEPA
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
                Binance › Gestión de API › Nueva clave. Permisos: lectura, trade, retiro.
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
