import { AppearanceSetting } from './storage/settings';

export type ColorSchemeName = 'light' | 'dark';

export type Theme = {
  scheme: ColorSchemeName;
  background: string;
  chrome: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  overlay: string;
  danger: string;
};

const light: Theme = {
  scheme: 'light',
  background: '#FFFFFF',
  chrome: '#F2F2F7',
  border: '#D1D1D6',
  text: '#1C1C1E',
  muted: '#6C6C70',
  accent: '#1877F2',
  overlay: 'rgba(15, 15, 16, 0.54)',
  danger: '#C62828',
};

const dark: Theme = {
  scheme: 'dark',
  background: '#000000',
  chrome: '#1C1C1E',
  border: '#3A3A3C',
  text: '#F2F2F7',
  muted: '#8E8E93',
  accent: '#4C9AFF',
  overlay: 'rgba(0, 0, 0, 0.64)',
  danger: '#FF6B6B',
};

export function resolveScheme(
  appearance: AppearanceSetting,
  system: string | null | undefined,
): ColorSchemeName {
  if (appearance === 'system') {
    return system === 'dark' ? 'dark' : 'light';
  }
  return appearance;
}

export function getTheme(scheme: ColorSchemeName): Theme {
  return scheme === 'dark' ? dark : light;
}
