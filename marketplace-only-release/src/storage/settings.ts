import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppearanceSetting = 'system' | 'light' | 'dark';

export type AppSettings = {
  hasCompletedWelcome: boolean;
  appearance: AppearanceSetting;
  diagnosticsEnabled: boolean;
};

const KEY = 'marketplace-only.settings.v1';
const SETTINGS_VERSION = 2;

const DEFAULTS: AppSettings = {
  hasCompletedWelcome: false,
  appearance: 'system',
  diagnosticsEnabled: false,
};

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return { ...DEFAULTS };
    }
    const parsed = JSON.parse(raw) as Partial<AppSettings> & { v?: number };
    const resetDiagnostics = typeof parsed.v !== 'number' || parsed.v < SETTINGS_VERSION;
    return {
      hasCompletedWelcome: Boolean(parsed.hasCompletedWelcome),
      appearance:
        parsed.appearance === 'light' || parsed.appearance === 'dark' || parsed.appearance === 'system'
          ? parsed.appearance
          : 'system',
      diagnosticsEnabled: resetDiagnostics
        ? false
        : typeof parsed.diagnosticsEnabled === 'boolean'
          ? parsed.diagnosticsEnabled
          : false,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...settings, v: SETTINGS_VERSION }));
}
