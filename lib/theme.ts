export type ThemeName = 'dark' | 'light';

export type Palette = {
  name: ThemeName;
  bg: string;
  bg2: string;
  card: string;
  card2: string;
  line: string;
  text: string;
  muted: string;
  faint: string;
  accent: string;
  accent2: string;
  accent3: string;
  danger: string;
  ok: string;
  warn: string;
  bubbleMe: string;
  bubbleThem: string;
  tab: string;
  overlay: string;
  glow: string;
};

export const dark: Palette = {
  name: 'dark',
  bg: '#070712',
  bg2: '#0C0C1A',
  card: '#141428',
  card2: '#1B1B36',
  line: 'rgba(139,108,255,0.18)',
  text: '#F4F1FF',
  muted: '#A39BC4',
  faint: '#6D6788',
  accent: '#8B6CFF',
  accent2: '#2EE6C7',
  accent3: '#FF5BA8',
  danger: '#FF5D7A',
  ok: '#3DDC97',
  warn: '#FFD166',
  bubbleMe: '#5B3FE8',
  bubbleThem: '#1C1C34',
  tab: '#0A0A16',
  overlay: 'rgba(4,4,12,0.72)',
  glow: 'rgba(139,108,255,0.45)',
};

export const light: Palette = {
  name: 'light',
  bg: '#F4F1FF',
  bg2: '#EAE6FF',
  card: '#FFFFFF',
  card2: '#F7F5FF',
  line: 'rgba(91,63,232,0.12)',
  text: '#16132A',
  muted: '#5E5878',
  faint: '#8B86A3',
  accent: '#5B3FE8',
  accent2: '#0FB9A4',
  accent3: '#E23D86',
  danger: '#E23B5B',
  ok: '#14996A',
  warn: '#C98A00',
  bubbleMe: '#5B3FE8',
  bubbleThem: '#EDE9FF',
  tab: '#FFFFFF',
  overlay: 'rgba(20,16,40,0.45)',
  glow: 'rgba(91,63,232,0.22)',
};

export const space = {
  void: '#04010D',
  nebula: '#2A1058',
  cyan: '#2EE6C7',
  violet: '#8B6CFF',
  pink: '#FF5BA8',
  gold: '#FFD166',
};

export const radii = { xs: 8, sm: 12, md: 16, lg: 22, xl: 28, pill: 999 };
export const spacePad = { xs: 6, sm: 10, md: 16, lg: 22, xl: 32 };
