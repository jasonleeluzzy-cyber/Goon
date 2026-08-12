import AsyncStorage from '@react-native-async-storage/async-storage';

const mem = new Map<string, string>();

function canSecure(): boolean {
  try {
    return typeof window === 'undefined';
  } catch {
    return true;
  }
}

export async function secureSet(key: string, value: string) {
  mem.set(key, value);
  try {
    if (canSecure()) {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
      return;
    }
  } catch { /* web fallback */ }
  try { await AsyncStorage.setItem('sec:' + key, value); } catch { /* ignore */ }
}

export async function secureGet(key: string): Promise<string | null> {
  if (mem.has(key)) return mem.get(key) || null;
  try {
    if (canSecure()) {
      const SecureStore = await import('expo-secure-store');
      const v = await SecureStore.getItemAsync(key);
      if (v) mem.set(key, v);
      return v;
    }
  } catch { /* web */ }
  try {
    const v = await AsyncStorage.getItem('sec:' + key);
    if (v) mem.set(key, v);
    return v;
  } catch {
    return null;
  }
}

export async function secureDel(key: string) {
  mem.delete(key);
  try {
    if (canSecure()) {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    }
  } catch { /* web */ }
  try { await AsyncStorage.removeItem('sec:' + key); } catch { /* ignore */ }
}

export async function storeSet(key: string, value: any) {
  const raw = JSON.stringify(value);
  try { await AsyncStorage.setItem(key, raw); } catch { /* ignore */ }
}

export async function storeGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function storeDel(key: string) {
  try { await AsyncStorage.removeItem(key); } catch { /* ignore */ }
}
