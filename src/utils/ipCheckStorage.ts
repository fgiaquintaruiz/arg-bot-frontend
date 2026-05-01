export const STORAGE_KEY = 'argbot_last_known_ip';

export function getLastKnownIp(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setLastKnownIp(ip: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, ip);
  } catch {
    // silent fail on QuotaExceededError or similar
  }
}

export function clearLastKnownIp(): void {
  localStorage.removeItem(STORAGE_KEY);
}
