export type NavigationKind =
  | 'marketplace'
  | 'authentication'
  | 'facebookRelated'
  | 'facebookHome'
  | 'facebookBlocked'
  | 'external'
  | 'customScheme'
  | 'system'
  | 'ignore';

export type Classification = {
  kind: NavigationKind;
  url: string;
  host: string | null;
  path: string;
};

const FACEBOOK_APP_SCHEMES = new Set([
  'fb',
  'fbapi',
  'fb-messenger',
  'fb-messenger-public',
  'fb-messenger-share-api',
  'fbauth2',
  'fb-work-chat',
  'messenger',
  'instagram',
]);

const SYSTEM_SCHEMES = new Set(['tel', 'mailto', 'sms', 'geo']);

const AUTH_PATH_PREFIXES = [
  '/login',
  '/checkpoint',
  '/recover',
  '/password',
  '/two_factor',
  '/two_step',
  '/auth',
  '/oauth',
  '/dialog',
  '/confirmemail',
  '/captcha',
  '/security',
  '/device',
  '/cookie',
  '/consent',
  '/intern/cookie',
];

const BLOCKED_PATH_PREFIXES = [
  '/friends',
  '/groups',
  '/reel',
  '/reels',
  '/watch',
  '/notifications',
  '/stories',
  '/gaming',
  '/bookmarks',
  '/pages',
  '/events',
  '/feed',
  '/live',
  '/memories',
  '/welcome',
];

function normalizeHost(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, '');
}

function hostMatches(host: string, root: string): boolean {
  return host === root || host.endsWith(`.${root}`);
}

export function isFacebookHost(hostname: string | null | undefined): boolean {
  if (!hostname) {
    return false;
  }
  const host = normalizeHost(hostname);
  return (
    hostMatches(host, 'facebook.com') ||
    hostMatches(host, 'fb.com') ||
    hostMatches(host, 'fbcdn.net') ||
    hostMatches(host, 'facebook.net') ||
    hostMatches(host, 'messenger.com') ||
    hostMatches(host, 'accountkit.com')
  );
}

function pathStartsWith(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}.`);
}

function firstPathSegment(path: string): string {
  const trimmed = path.startsWith('/') ? path.slice(1) : path;
  return trimmed.split('/')[0]?.split('?')[0] ?? '';
}

export function isMarketplacePath(path: string): boolean {
  return pathStartsWith(path, '/marketplace');
}

export function isAuthenticationPath(path: string): boolean {
  const file = firstPathSegment(path).toLowerCase();
  if (file === 'login.php' || file === 'checkpoint.php' || file === 'recover.php') {
    return true;
  }
  return AUTH_PATH_PREFIXES.some((prefix) => pathStartsWith(path, prefix));
}

export function isBlockedFacebookPath(path: string): boolean {
  return BLOCKED_PATH_PREFIXES.some((prefix) => pathStartsWith(path, prefix));
}

export function isFacebookHomePath(path: string): boolean {
  return path === '/' || path === '' || path === '/home.php' || path === '/index.php';
}

/**
 * True only for unambiguous news-feed destinations.
 * Bare `/` is not included: Marketplace listing photos often open there first.
 */
export function isExplicitNewsFeedUrl(rawUrl: string): boolean {
  if (isFacebookPhotoViewer(rawUrl)) {
    return false;
  }
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  const path = (parsed.pathname || '/').toLowerCase();
  if (path === '/home.php' || path === '/index.php') {
    return true;
  }
  const sk = parsed.searchParams.get('sk') ?? '';
  return sk === 'h_chr' || sk === 'h_nor' || sk === 'h_eng';
}

export function isFacebookPhotoViewer(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  const path = (parsed.pathname || '/').toLowerCase();
  if (
    pathStartsWith(path, '/photo') ||
    pathStartsWith(path, '/photos') ||
    pathStartsWith(path, '/media')
  ) {
    return true;
  }
  const file = firstPathSegment(path);
  if (file === 'photo.php' || file === 'photos.php' || file === 'permalink.php') {
    return true;
  }
  const params = parsed.searchParams;
  if (
    params.has('fbid') ||
    params.has('photo_id') ||
    params.has('story_fbid') ||
    params.has('theater')
  ) {
    return true;
  }
  const set = params.get('set') ?? '';
  return (
    set.startsWith('a.') ||
    set.startsWith('pcb.') ||
    set.startsWith('p.') ||
    set.startsWith('gm.')
  );
}

export function classifyUrl(rawUrl: string): Classification {
  const empty: Classification = {
    kind: 'ignore',
    url: rawUrl,
    host: null,
    path: '',
  };

  if (!rawUrl || rawUrl === 'about:blank' || rawUrl.startsWith('about:srcdoc')) {
    return empty;
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ...empty, kind: 'ignore' };
  }

  const scheme = parsed.protocol.replace(':', '').toLowerCase();
  const host = parsed.hostname ? normalizeHost(parsed.hostname) : null;
  const path = parsed.pathname || '/';

  if (scheme === 'about' || scheme === 'data' || scheme === 'blob') {
    return { kind: 'ignore', url: rawUrl, host, path };
  }

  if (SYSTEM_SCHEMES.has(scheme)) {
    return { kind: 'system', url: rawUrl, host, path };
  }

  if (FACEBOOK_APP_SCHEMES.has(scheme)) {
    return { kind: 'customScheme', url: rawUrl, host, path };
  }

  if (scheme !== 'http' && scheme !== 'https') {
    return { kind: 'customScheme', url: rawUrl, host, path };
  }

  if (!isFacebookHost(host)) {
    return { kind: 'external', url: rawUrl, host, path };
  }

  if (isMarketplacePath(path)) {
    return { kind: 'marketplace', url: rawUrl, host, path };
  }

  if (isAuthenticationPath(path)) {
    return { kind: 'authentication', url: rawUrl, host, path };
  }

  if (hostMatches(host ?? '', 'fbcdn.net') || hostMatches(host ?? '', 'facebook.net')) {
    return { kind: 'facebookRelated', url: rawUrl, host, path };
  }

  if (hostMatches(host ?? '', 'messenger.com')) {
    return { kind: 'facebookRelated', url: rawUrl, host, path };
  }

  if (isBlockedFacebookPath(path)) {
    return { kind: 'facebookBlocked', url: rawUrl, host, path };
  }

  if (isFacebookPhotoViewer(rawUrl)) {
    return { kind: 'facebookRelated', url: rawUrl, host, path };
  }

  if (isFacebookHomePath(path) || pathStartsWith(path, '/search')) {
    return { kind: 'facebookHome', url: rawUrl, host, path };
  }

  // Unknown Facebook routes are allowed and should be logged (spec rule 9).
  return { kind: 'facebookRelated', url: rawUrl, host, path };
}

export function shouldAllowInWebView(kind: NavigationKind, isTopFrame: boolean): boolean {
  if (!isTopFrame) {
    return kind !== 'external' && kind !== 'customScheme';
  }
  return (
    kind === 'marketplace' ||
    kind === 'authentication' ||
    kind === 'facebookRelated' ||
    kind === 'ignore'
  );
}
