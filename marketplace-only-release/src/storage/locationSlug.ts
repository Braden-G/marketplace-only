import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'marketplace-only.location-slug.v1';

export async function loadLocationSlug(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(KEY);
    if (!value || !/^[a-z0-9-]+$/i.test(value)) {
      return null;
    }
    return value.toLowerCase();
  } catch {
    return null;
  }
}

export async function saveLocationSlug(slug: string): Promise<void> {
  await AsyncStorage.setItem(KEY, slug.toLowerCase());
}
