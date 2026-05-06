import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { uploadToDrive, downloadFromDrive, setUserHint } from '../googleDrive';
import { API_URL } from '../config';
import { getRateAlertConfig, setRateAlertConfig } from '../utils/rateAlertStorage';
import { STORAGE_KEYS } from '../utils/storageKeys';
import styles from './Settings.module.css';

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
  const [usdcArsOverride, setUsdcArsOverride] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.USDC_ARS_OVERRIDE) || '');

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

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>

        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles['header-title']}>Configuración</h2>
          <button onClick={onClose} aria-label="Cerrar configuración" className={styles['close-btn']}>✖</button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={activeTab === 'sync' ? styles['tab-btn-active'] : styles['tab-btn-inactive']} onClick={() => setActiveTab('sync')}>Sync</button>
          <button className={activeTab === 'binance' ? styles['tab-btn-active'] : styles['tab-btn-inactive']} onClick={() => setActiveTab('binance')}>Binance</button>
          <button className={activeTab === 'alerts' ? styles['tab-btn-active'] : styles['tab-btn-inactive']} onClick={() => setActiveTab('alerts')}>Alertas</button>
          <button className={activeTab === 'notif' ? styles['tab-btn-active'] : styles['tab-btn-inactive']} onClick={() => setActiveTab('notif')}>Notif</button>
        </div>

        {/* Content */}
        <div className={styles.content}>

          {/* SYNC TAB */}
          {activeTab === 'sync' && (
            <div>
              <h4 className={styles['sync-title']}>Sincronización con Google Drive</h4>
              <p className={styles['sync-desc']}>
                Guardá tus claves API, libreta de direcciones e historial en Google Drive. Los datos se encriptan antes de subirse.
              </p>

              <div className={styles['sync-feature-box']}>
                {[['🔒', 'Encriptado AES-256', 'Tus datos se cifran antes de subirse'], ['📱', 'Multi-dispositivo', 'Usá la app desde cualquier celular o PC']].map(([icon, title, sub]) => (
                  <div key={title} className={title === 'Encriptado AES-256' ? styles['sync-feature-row'] : styles['sync-feature-row-last']}>
                    <span>{icon}</span>
                    <div>
                      <div className={styles['sync-feature-label']}>{title}</div>
                      <div className={styles['sync-feature-sub']}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles['sync-buttons']}>
                <button
                  onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); handleDriveSync('upload'); }}
                  onClick={() => handleDriveSync('upload')}
                  disabled={syncStatus === 'uploading' || syncStatus === 'downloading'}
                  className={`${styles['upload-btn']} ${syncStatus === 'uploading' ? styles['upload-btn-waiting'] : ''}`}
                >
                  {syncStatus === 'uploading' ? 'Subiendo...' : '↑ Subir a Drive'}
                </button>
                <button
                  onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); handleDriveSync('download'); }}
                  onClick={() => handleDriveSync('download')}
                  disabled={syncStatus === 'uploading' || syncStatus === 'downloading'}
                  className={`${styles['download-btn']} ${syncStatus === 'downloading' ? styles['download-btn-waiting'] : ''}`}
                >
                  {syncStatus === 'downloading' ? 'Bajando...' : '↓ Descargar de Drive'}
                </button>
              </div>

              {syncMessage && (
                <div className={
                  syncStatus === 'success' ? styles['sync-message-success']
                  : syncStatus === 'error' ? styles['sync-message-error']
                  : styles['sync-message-neutral']
                }>
                  {syncMessage}
                </div>
              )}
            </div>
          )}

          {/* ALERTS TAB */}
          {activeTab === 'alerts' && (
            <div>
              <h4 className={styles['alerts-title']}>Alertas de tasa</h4>
              <p className={styles['alerts-desc']}>
                Configurá umbrales de precio para EUR/ARS y EUR/USDC. El dashboard mostrará un banner cuando la tasa cruce el umbral configurado.
              </p>

              {alertsValidationError && (
                <div className={styles['alerts-error']}>
                  {alertsValidationError}
                </div>
              )}

              {/* EUR/ARS section */}
              <div className={styles['alerts-section']}>
                <p className={styles['alerts-section-label']}>EUR/ARS</p>
                <div>
                  <label className={styles['alerts-field-label']}>Umbral superior (≥)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={eurArsUpper}
                    onChange={e => setEurArsUpper(e.target.value)}
                    placeholder="Umbral superior EUR/ARS"
                    className={styles['alerts-input']}
                  />
                </div>
                <div>
                  <label className={styles['alerts-field-label']}>Umbral inferior (≤)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={eurArsLower}
                    onChange={e => setEurArsLower(e.target.value)}
                    placeholder="Umbral inferior EUR/ARS"
                    className={styles['alerts-input']}
                  />
                </div>
              </div>

              {/* EUR/USDC section */}
              <div className={styles['alerts-section']}>
                <p className={styles['alerts-section-label']}>EUR/USDC</p>
                <div>
                  <label className={styles['alerts-field-label']}>Umbral superior (≥)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={eurUsdcUpper}
                    onChange={e => setEurUsdcUpper(e.target.value)}
                    placeholder="Umbral superior EUR/USDC"
                    className={styles['alerts-input']}
                  />
                </div>
                <div>
                  <label className={styles['alerts-field-label']}>Umbral inferior (≤)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={eurUsdcLower}
                    onChange={e => setEurUsdcLower(e.target.value)}
                    placeholder="Umbral inferior EUR/USDC"
                    className={styles['alerts-input']}
                  />
                </div>
              </div>

              {/* USDC/ARS manual override */}
              <div className={styles['alerts-section']}>
                <p className={styles['alerts-section-label']}>Tasa USDC/ARS manual (override)</p>
                <div>
                  <label className={styles['alerts-field-label']}>Tasa USDC/ARS manual (override)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={usdcArsOverride}
                    onChange={e => {
                      const val = e.target.value;
                      setUsdcArsOverride(val);
                      if (val) {
                        localStorage.setItem(STORAGE_KEYS.USDC_ARS_OVERRIDE, val);
                      } else {
                        localStorage.removeItem(STORAGE_KEYS.USDC_ARS_OVERRIDE);
                      }
                    }}
                    placeholder="Ej: 1464.67 — deja vacío para usar tasa de mercado"
                    className={styles['alerts-input']}
                  />
                </div>
              </div>

              {/* Save button */}
              <button
                onClick={handleSaveAlerts}
                disabled={!!alertsValidationError}
                className={alertsSaved ? styles['alerts-save-btn-saved'] : styles['alerts-save-btn-idle']}
              >
                {alertsSaved ? '✓ Guardado' : 'Guardar alertas'}
              </button>
            </div>
          )}

          {/* NOTIF TAB */}
          {activeTab === 'notif' && (
            <div>
              <h4 className={styles['notif-title']}>Notificaciones</h4>
              <div className={styles['notif-box']}>
                <label className={styles['notif-toggle-row']}>
                  <span className={styles['notif-toggle-label']}>Mostrar banner de notificaciones</span>
                  <div
                    onClick={() => {
                      const next = !notifBannerEnabled;
                      setNotifBannerEnabled(next);
                      localStorage.setItem(STORAGE_KEYS.ARGBOT_NOTIF_BANNER_ENABLED, next ? 'true' : 'false');
                    }}
                    className={notifBannerEnabled ? styles['notif-toggle-track-on'] : styles['notif-toggle-track-off']}
                  >
                    <div className={notifBannerEnabled ? styles['notif-toggle-thumb-on'] : styles['notif-toggle-thumb-off']} />
                  </div>
                </label>
                <p className={styles['notif-desc']}>
                  Cuando está activo, verás el aviso para activar notificaciones en segundo plano.
                </p>
              </div>
            </div>
          )}

          {/* BINANCE TAB */}
          {activeTab === 'binance' && (
            <div>
              <h4 className={styles['binance-title']}>Configuración de Binance</h4>

              {/* IP Whitelist */}
              <div className={styles['ip-box']}>
                <div className={styles['ip-label']}>IP para Whitelist de Binance</div>
                <div className={styles['ip-row']}>
                  <span className={styles['ip-value']}>{serverIp}</span>
                  <button
                    onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); copyToClipboard(serverIp, 'serverip'); }}
                    onClick={() => copyToClipboard(serverIp, 'serverip')}
                    className={copiedField === 'serverip' ? styles['ip-copy-btn-copied'] : styles['ip-copy-btn-idle']}
                  >
                    {copiedField === 'serverip' ? '✓ Copiada' : 'Copiar'}
                  </button>
                </div>
                <div className={styles['ip-hint']}>
                  Binance › Gestión de API › Restricciones de IP
                </div>
              </div>

              {/* EUR Deposit Details */}
              <p className={styles['section-heading']}>Datos de Depósito EUR</p>
              <p className={styles['section-hint']}>
                Binance › Billetera › Depósito › EUR › Datos SEPA
              </p>

              <div className={styles['field-group']}>
                {[
                  { label: 'Beneficiario', val: binanceEurName, set: setBinanceEurName, ph: 'Tu nombre en Binance', mono: false },
                  { label: 'IBAN', val: binanceEurIban, set: setBinanceEurIban, ph: 'LT12 3456 7890 1234 5678', mono: true },
                  { label: 'BIC / SWIFT', val: binanceEurBic, set: setBinanceEurBic, ph: 'REVOLT21XXX', mono: true },
                  { label: 'Banco', val: binanceBankName, set: setBinanceBankName, ph: 'Revolut Bank UAB', mono: false },
                  { label: 'Dirección del banco', val: binanceBankAddress, set: setBinanceBankAddress, ph: 'Konstitucijos pr. 21B, Vilnius', mono: false },
                ].map(({ label, val, set, ph, mono }) => (
                  <div key={label}>
                    <label className={styles['field-label']}>{label}</label>
                    <input type="text" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                      className={`${styles['field-input']} ${mono ? styles['field-input-mono'] : styles['field-input-sans']}`}
                    />
                  </div>
                ))}
              </div>

              {/* API Keys */}
              <p className={styles['section-heading']}>Claves API de Binance</p>
              <p className={styles['section-hint']}>
                Binance › Gestión de API › Nueva clave. Permisos: lectura, trade, retiro.
              </p>

              <div className={styles['field-group']}>
                {/* Producción / Testnet tab bar */}
                <div className={styles['api-tabs']}>
                  {(['prod', 'testnet'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setBinanceApiTabActive(tab)}
                      className={binanceApiTabActive === tab ? styles['api-tab-btn-active'] : styles['api-tab-btn-inactive']}
                    >
                      {tab === 'prod' ? 'Producción' : 'Testnet'}
                    </button>
                  ))}
                </div>

                {binanceApiTabActive === 'testnet' && (
                  <div className={styles['testnet-notice']}>
                    <p className={styles['testnet-notice-text']}>
                      Claves exclusivas de testnet.binance.vision
                    </p>
                  </div>
                )}

                {binanceApiTabActive === 'prod' ? (
                  <>
                    <div>
                      <label className={styles['field-label']}>API Key</label>
                      <input type="password" value={binanceApiKey} onChange={e => setBinanceApiKey(e.target.value)} autoComplete="off" data-form-type="other" placeholder="Tu API Key"
                        className={`${styles['field-input']} ${styles['field-input-mono']}`}
                      />
                    </div>
                    <div>
                      <label className={styles['field-label']}>API Secret</label>
                      <input type="password" value={binanceApiSecret} onChange={e => setBinanceApiSecret(e.target.value)} autoComplete="new-password" data-form-type="other" placeholder="Tu API Secret"
                        className={`${styles['field-input']} ${styles['field-input-mono']}`}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className={styles['field-label']}>API Key</label>
                      <input type="password" value={binanceApiKeyTestnet} onChange={e => setBinanceApiKeyTestnet(e.target.value)} autoComplete="off" data-form-type="other" placeholder="Tu API Key (testnet)"
                        className={`${styles['field-input']} ${styles['field-input-mono']}`}
                      />
                    </div>
                    <div>
                      <label className={styles['field-label']}>API Secret</label>
                      <input type="password" value={binanceApiSecretTestnet} onChange={e => setBinanceApiSecretTestnet(e.target.value)} autoComplete="new-password" data-form-type="other" placeholder="Tu API Secret (testnet)"
                        className={`${styles['field-input']} ${styles['field-input-mono']}`}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Save / Clear buttons */}
              <div className={styles['binance-action-buttons']}>
                <button
                  onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); handleSaveBinance(); }}
                  onClick={handleSaveBinance}
                  className={binanceSaved ? styles['save-btn-saved'] : styles['save-btn-idle']}
                >
                  {binanceSaved ? '✓ Guardado' : 'Guardar'}
                </button>
                <button
                  onTouchEnd={/* v8 ignore next */ (e) => { e.preventDefault(); handleClearBinance(); }}
                  onClick={handleClearBinance}
                  className={binanceCleared ? styles['clear-btn-cleared'] : styles['clear-btn-idle']}
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
