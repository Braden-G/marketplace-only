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

export const SEARCH_EXAMPLES: { name: string; query: string }[] = [
  { name: 'Mountain Bikes', query: 'mountain bikes' },
  { name: 'Tools', query: 'tools' },
  { name: 'Cedar City', query: 'Cedar City' },
];

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

export function marketplaceSearchNavigationScript(query: string, locationSlug: string | null): string {
  return `(function () {
    var query = ${JSON.stringify(query)};
    var slug = ${JSON.stringify(locationSlug)};
    var reserved = {search:1,item:1,create:1,you:1,inbox:1,category:1,notifications:1,selling:1,buying:1,saved:1,profile:1};
    window.__mpOnlySearchUntil = Date.now() + ${SEARCH_NAVIGATION_GRACE_MS};
    function slugFromPath(path) {
      var match = String(path || '').toLowerCase().match(/^\\/marketplace\\/([^/]+)/);
      var value = match && match[1];
      if (!value || reserved[value] || /^\\d+$/.test(value)) {
        return null;
      }
      return value;
    }
    function origin() {
      try {
        return location.origin || 'https://www.facebook.com';
      } catch (e) {
        return 'https://www.facebook.com';
      }
    }
    function searchUrl(city) {
      if (city) {
        return origin() + '/marketplace/' + city + '/search/?query=' + encodeURIComponent(query);
      }
      return origin() + '/marketplace/search/?query=' + encodeURIComponent(query);
    }
    function go(url) {
      try {
        location.assign(url);
      } catch (e) {
        location.href = url;
      }
    }
    if (!slug && window.__mpOnlySlug) {
      slug = window.__mpOnlySlug;
    }
    if (!slug) {
      slug = slugFromPath(location.pathname);
    }
    if (!slug) {
      var links = document.querySelectorAll('a[href]');
      for (var i = 0; i < links.length; i++) {
        try {
          slug = slugFromPath(new URL(links[i].href, location.href).pathname);
          if (slug) {
            break;
          }
        } catch (e) {}
      }
    }
    if (slug) {
      go(searchUrl(slug));
      return;
    }
    var selectors = [
      'input[placeholder*="Search Marketplace" i]',
      'input[aria-label*="Search Marketplace" i]',
      'input[placeholder*="Search marketplace" i]',
      'input[name="query"][type="search"]',
      'input[type="search"]'
    ];
    for (var s = 0; s < selectors.length; s++) {
      var input = document.querySelector(selectors[s]);
      if (!input) {
        continue;
      }
      try {
        var desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        if (desc && desc.set) {
          desc.set.call(input, query);
        } else {
          input.value = query;
        }
      } catch (e) {
        input.value = query;
      }
      try { input.focus(); } catch (e) {}
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      if (input.form) {
        try { input.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); } catch (e) {}
      }
      return;
    }
    go(searchUrl(null));
  })();
  true;`;
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
