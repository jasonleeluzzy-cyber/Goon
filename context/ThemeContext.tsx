import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Palette, dark, light, ThemeName } from '../lib/theme';
import { storeGet, storeSet } from '../lib/storage';

type Pref = 'system' | 'dark' | 'light';

type Ctx = {
  palette: Palette;
  pref: Pref;
  setPref: (p: Pref) => void;
  name: ThemeName;
};

const ThemeCtx = createContext<Ctx>({ palette: dark, pref: 'system', setPref: () => {}, name: 'dark' });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const sys = useColorScheme();
  const [pref, setPrefState] = useState<Pref>('system');

  useEffect(() => {
    storeGet<Pref>('gv.theme', 'system').then(setPrefState);
  }, []);

  const setPref = (p: Pref) => {
    setPrefState(p);
    storeSet('gv.theme', p);
  };

  const name: ThemeName = pref === 'system' ? (sys === 'light' ? 'light' : 'dark') : pref;
  const palette = name === 'light' ? light : dark;

  const value = useMemo(() => ({ palette, pref, setPref, name }), [palette, pref, name]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}
