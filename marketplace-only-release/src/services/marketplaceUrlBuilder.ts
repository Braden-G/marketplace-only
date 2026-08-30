import { MARKETPLACE_HOME } from '../constants';
import { classifyUrl } from '../navigation/urlValidator';

export type SearchUrlExtras = {
  minPrice?: string;
  maxPrice?: string;
  locationSlug?: string;
};

const RESERVED_MARKETPLACE_SEGMENTS = new Set([
  'search',
  'item',
  'create',
  'you',
  'inbox',
  'category',
  'notifications',
  'selling',
  'buying',
  'saved',
  'profile',
]);

export function locationSlugFromMarketplaceUrl(rawUrl: string): string | null {
  try {
    const path = new URL(rawUrl).pathname;
    const match = path.match(/^\/marketplace\/([^/]+)(?:\/|$)/i);
    const segment = match?.[1]?.toLowerCase();
    if (!segment || RESERVED_MARKETPLACE_SEGMENTS.has(segment) || /^\d+$/.test(segment)) {
      return null;
    }
    return segment;
  } catch {
    return null;
  }
}

export function buildMarketplaceSearchUrl(query: string, extras?: SearchUrlExtras): string {
  const slug = extras?.locationSlug;
  const url = new URL(
    slug
      ? `https://www.facebook.com/marketplace/${slug}/search/`
      : 'https://www.facebook.com/marketplace/search/',
  );
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

export function isMarketplaceItemUrl(rawUrl: string): boolean {
  try {
    const path = new URL(rawUrl).pathname.toLowerCase();
    return /\/marketplace\/item\/\d+/.test(path);
  } catch {
    return false;
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

export function marketplaceLandingUrl(fromUrl?: string, storedSlug?: string | null): string {
  const slug = storedSlug || (fromUrl ? locationSlugFromMarketplaceUrl(fromUrl) : null);
  if (slug) {
    return `https://www.facebook.com/marketplace/${slug}/`;
  }
  return MARKETPLACE_HOME;
}

export const SEARCH_NAVIGATION_GRACE_MS = 8000;

export function isBareFacebookRootUrl(rawUrl: string): boolean {
  try {
    const path = (new URL(rawUrl).pathname || '/').replace(/\/+$/, '') || '/';
    return path === '/';
  } catch {
    return false;
  }
}

export function shouldAllowTransientFacebookHomeHop(input: {
  currentUrl: string;
  targetUrl: string;
  now?: number;
  searchUntil?: number;
}): boolean {
  if (!isBareFacebookRootUrl(input.targetUrl)) {
    return false;
  }
  const now = input.now ?? Date.now();
  if (input.searchUntil && now < input.searchUntil) {
    return true;
  }
  return isMarketplaceItemUrl(input.currentUrl) || isMarketplaceSearchUrl(input.currentUrl);
}

export function webViewAssignScript(url: string): string {
  return `try{location.assign(${JSON.stringify(url)});}catch(e){location.href=${JSON.stringify(url)};}true;`;
}

export function isBareMarketplaceHome(rawUrl: string): boolean {
  try {
    const path = new URL(rawUrl).pathname.replace(/\/+$/, '') || '/';
    return path === '/marketplace';
  } catch {
    return false;
  }
}

export function marketplaceHomeUrl(): string {
  return MARKETPLACE_HOME;
}
