import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { api, ApiError } from '../lib/api';
import { secureDel, secureGet, secureSet, storeDel, storeGet, storeSet } from '../lib/storage';
import { Settings, User } from '../lib/types';

type AuthState = {
  ready: boolean;
  token: string | null;
  user: User | null;
  settings: Settings;
  online: boolean;
};

type Ctx = AuthState & {
  register: (username: string, displayName: string, avatar: string, avatarColor: string) => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<User> & { settings?: Settings }) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  setOnline: (v: boolean) => void;
};

const AuthCtx = createContext<Ctx>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings>({});
  const [online, setOnline] = useState(true);
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = token;

  const hydrate = useCallback(async () => {
    try {
      const t = await secureGet('gv.token');
      if (!t) {
        setReady(true);
        return;
      }
      setToken(t);
      const cached = await storeGet<User | null>('gv.user', null);
      if (cached) setUser(cached);
      try {
        const data = await api<{ user: User; settings: Settings }>('session', { token: t });
        setUser(data.user);
        setSettings(data.settings || {});
        await storeSet('gv.user', data.user);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          await secureDel('gv.token');
          await storeDel('gv.user');
          setToken(null);
          setUser(null);
        }
      }
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!token) return;
    const beat = async () => {
      try { await api('heartbeat', { method: 'POST', token, body: {} }); setOnline(true); }
      catch { setOnline(false); }
    };
    beat();
    const id = setInterval(beat, 25_000);
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') beat(); });
    return () => { clearInterval(id); sub.remove(); };
  }, [token]);

  const register = useCallback(async (username: string, displayName: string, avatar: string, avatarColor: string) => {
    const data = await api<{ token: string; user: User }>('register', {
      method: 'POST',
      body: { username, displayName, avatar, avatarColor },
    });
    await secureSet('gv.token', data.token);
    await storeSet('gv.user', data.user);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const refresh = useCallback(async () => {
    if (!tokenRef.current) return;
    const data = await api<{ user: User; settings: Settings }>('session', { token: tokenRef.current });
    setUser(data.user);
    setSettings(data.settings || {});
    await storeSet('gv.user', data.user);
  }, []);

  const updateProfile = useCallback(async (patch: Partial<User> & { settings?: Settings }) => {
    if (!tokenRef.current) return;
    const data = await api<{ user: User; settings: Settings }>('profile.update', {
      method: 'POST',
      token: tokenRef.current,
      body: patch,
    });
    setUser(data.user);
    setSettings(data.settings || {});
    await storeSet('gv.user', data.user);
  }, []);

  const logout = useCallback(async () => {
    await secureDel('gv.token');
    await storeDel('gv.user');
    setToken(null);
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    if (tokenRef.current) {
      try { await api('delete_account', { method: 'POST', token: tokenRef.current, body: {} }); } catch { /* still wipe local */ }
    }
    await logout();
  }, [logout]);

  const value = useMemo(() => ({
    ready, token, user, settings, online,
    register, refresh, updateProfile, logout, deleteAccount, setOnline,
  }), [ready, token, user, settings, online, register, refresh, updateProfile, logout, deleteAccount]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
