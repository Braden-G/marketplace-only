import AsyncStorage from '@react-native-async-storage/async-storage';
import { MarketplaceSearch } from '../models/MarketplaceSearch';

const SAVED_KEY = 'marketplace-only.saved-searches.v1';
const RECENTS_KEY = 'marketplace-only.recent-searches.v1';
const MAX_RECENTS = 20;

async function readList(key: string): Promise<MarketplaceSearch[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as MarketplaceSearch[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item) => item && typeof item.url === 'string' && typeof item.id === 'string');
  } catch {
    return [];
  }
}

async function writeList(key: string, items: MarketplaceSearch[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

export async function loadSavedSearches(): Promise<MarketplaceSearch[]> {
  return readList(SAVED_KEY);
}

export async function saveSearch(search: MarketplaceSearch): Promise<MarketplaceSearch[]> {
  const existing = await loadSavedSearches();
  const withoutDuplicate = existing.filter((item) => item.url !== search.url && item.id !== search.id);
  const next = [search, ...withoutDuplicate];
  await writeList(SAVED_KEY, next);
  return next;
}

export async function removeSavedSearch(id: string): Promise<MarketplaceSearch[]> {
  const next = (await loadSavedSearches()).filter((item) => item.id !== id);
  await writeList(SAVED_KEY, next);
  return next;
}

export async function loadRecentSearches(): Promise<MarketplaceSearch[]> {
  return readList(RECENTS_KEY);
}

export async function addRecentSearch(search: MarketplaceSearch): Promise<MarketplaceSearch[]> {
  const existing = await loadRecentSearches();
  const withoutDuplicate = existing.filter((item) => item.url !== search.url);
  const next = [{ ...search, id: search.id }, ...withoutDuplicate].slice(0, MAX_RECENTS);
  await writeList(RECENTS_KEY, next);
  return next;
}

export const RECENT_SEARCH_LIMIT = MAX_RECENTS;
