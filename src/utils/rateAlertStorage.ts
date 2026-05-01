const LS_KEY = 'rate_alert_config';

export interface RateAlertThresholds {
  upper?: number;
  lower?: number;
}

export interface RateAlertConfig {
  eurArs: RateAlertThresholds;
  eurUsdc: RateAlertThresholds;
}

const DEFAULT_CONFIG: RateAlertConfig = { eurArs: {}, eurUsdc: {} };

export function getRateAlertConfig(): RateAlertConfig {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return JSON.parse(raw) as RateAlertConfig;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function setRateAlertConfig(config: RateAlertConfig): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(config));
  } catch {
    // silent fail — localStorage unavailable
  }
}
