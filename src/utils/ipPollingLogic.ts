export type NotificationPermissionState = 'granted' | 'denied' | 'default';

export function shouldNotify(
  oldIp: string | null,
  newIp: string | null,
  permission: NotificationPermissionState
): boolean {
  if (oldIp === null || newIp === null) return false;
  if (typeof newIp !== 'string' || newIp.trim() === '') return false;
  if (permission !== 'granted') return false;
  return oldIp !== newIp;
}

export function parseIpResponse(response: unknown): string | null {
  if (response === null || response === undefined) return null;
  const data = response as Record<string, unknown>;
  const ip = data?.ip;
  if (typeof ip !== 'string' || ip.trim() === '') return null;
  return ip;
}
