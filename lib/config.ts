import Constants from 'expo-constants';

function resolveApi(): string {
  const extra = (Constants.expoConfig?.extra || {}) as { apiUrl?: string };
  if (extra.apiUrl) return extra.apiUrl.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return '';
}

export const APP_NAME = 'GOONIVERSITY';
export const APP_OWNER = 'Luzzi';
export const APP_VERSION = '1.0.0';
export const APP_ID = 'com.luzzi.gooniversity';
export const API_URL = resolveApi();

export function apiUrl(action: string) {
  const base = API_URL || '';
  return `${base}/api/gooni?action=${encodeURIComponent(action)}`;
}
