import { MARKETPLACE_HOME } from '../constants';
import { classifyUrl } from '../navigation/urlValidator';

export type SearchUrlExtras = {
  minPrice?: string;
  maxPrice?: string;
};

const SEARCH_ORIGIN = 'https://www.facebook.com/marketplace/search/';

export const SEARCH_EXAMPLES: { name: string; query: string }[] = [
  { name: 'Mountain Bikes', query: 'mountain bikes' },
  { name: 'Tools', query: 'tools' },
  { name: 'Cedar City', query: 'Cedar City' },
];

export function buildMarketplaceSearchUrl(query: string, extras?: SearchUrlExtras): string {
  const url = new URL(SEARCH_ORIGIN);
  const trimmed = query.trim();
  if (trimmed) {
    url.searchParams.set('query', trimmed);
  }
  // Price params are passed through only when the caller has observed them on Facebook.
  if (extras?.minPrice) {
    url.searchParams.set('minPrice', extras.minPrice);
  }
  if (extras?.maxPrice) {
    url.searchParams.set('maxPrice', extras.maxPrice);
  }
  return url.toString();
}

export function queryFromMarketplaceUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    return url.searchParams.get('query') ?? url.searchParams.get('q') ?? '';
  } catch {
    return '';
  }
}

export function isMarketplaceSearchUrl(rawUrl: string): boolean {
  if (classifyUrl(rawUrl).kind !== 'marketplace') {
    return false;
  }
  try {
    const url = new URL(rawUrl);
    const path = url.pathname.toLowerCase();
    return path.includes('/search') || Boolean(queryFromMarketplaceUrl(rawUrl));
  } catch {
    return false;
  }
}

export function marketplaceHomeUrl(): string {
  return MARKETPLACE_HOME;
}
