import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppearanceSetting = 'system' | 'light' | 'dark';

export type AppSettings = {
  hasCompletedWelcome: boolean;
  appearance: AppearanceSetting;
  diagnosticsEnabled: boolean;
};

const KEY = 'marketplace-only.settings.v1';

const DEFAULTS: AppSettings = {
  hasCompletedWelcome: false,
  appearance: 'system',
  diagnosticsEnabled: __DEV__,
};

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return { ...DEFAULTS };
    }
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      hasCompletedWelcome: Boolean(parsed.hasCompletedWelcome),
      appearance:
        parsed.appearance === 'light' || parsed.appearance === 'dark' || parsed.appearance === 'system'
          ? parsed.appearance
          : 'system',
      diagnosticsEnabled:
        typeof parsed.diagnosticsEnabled === 'boolean' ? parsed.diagnosticsEnabled : __DEV__,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}
