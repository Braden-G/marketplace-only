const GLOBAL_NAV_SEGMENTS = new Set([
  'watch',
  'groups',
  'reel',
  'reels',
  'friends',
  'notifications',
  'gaming',
  'stories',
  'feed',
  'live',
  'events',
  'pages',
  'bookmarks',
  'memories',
  'welcome',
  'menu',
  'video',
  'messages',
  'home.php',
  'index.php',
  'bookmarks.php',
]);

const APP_PROMO_TEXT =
  /open(\s+\w+){0,4}\s+app|use(\s+the)?(\s+facebook)?\s+app|get(\s+the)?(\s+facebook)?\s+app|try(\s+the)?(\s+facebook)?\s+app|continue in(\s+the)?(\s+facebook)?\s+app|see more in(\s+the)?(\s+facebook)?\s+app|download(\s+the)?(\s+facebook)?\s+app|install(\s+the)?(\s+facebook)?\s+app/i;

const APP_PROMO_DISMISS =
  /^(not now|no thanks|close|dismiss|use(\s+the)?(\s+mobile)?(\s+web|\s+website)|continue without(\s+the)?(\s+facebook)?\s+app|continue (to|on)(\s+the)?(\s+mobile)?(\s+web|\s+website))$/i;

export function normalizePath(path: string): string {
  if (!path) {
    return '/';
  }
  const trimmed = path.split('?')[0]?.split('#')[0] ?? path;
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (withSlash.length > 1 && withSlash.endsWith('/')) {
    return withSlash.slice(0, -1);
  }
  return withSlash || '/';
}

export function isFacebookGlobalNavPath(path: string): boolean {
  if (!path) {
    return false;
  }
  const normalized = normalizePath(path).toLowerCase();
  if (normalized === '/' || normalized === '/home.php' || normalized === '/index.php') {
    return true;
  }
  const segment = normalized.replace(/^\//, '').split('/')[0] ?? '';
  return GLOBAL_NAV_SEGMENTS.has(segment);
}

export function isHomeNavLabel(label: string): boolean {
  const text = label.replace(/\s+/g, ' ').trim().toLowerCase();
  return /^(home|news feed|feed)(?=,|\s|$)/.test(text);
}

export function isMessagesNavLabel(label: string): boolean {
  const text = label.replace(/\s+/g, ' ').trim().toLowerCase();
  if (/^message seller\b/.test(text) || /^inbox\b/.test(text)) {
    return false;
  }
  return /^(messages|messenger|chats)(?=,|\s|$)/.test(text);
}

export function isMessagesNavPath(path: string): boolean {
  if (!path) {
    return false;
  }
  const normalized = normalizePath(path).toLowerCase();
  return normalized === '/messages' || normalized.startsWith('/messages/');
}

export function isAppPromoText(text: string): boolean {
  return APP_PROMO_TEXT.test(text.replace(/\s+/g, ' ').trim());
}

export function isAppPromoDismissText(text: string): boolean {
  return APP_PROMO_DISMISS.test(text.replace(/\s+/g, ' ').trim());
}

export function isStandaloneOpenAppCta(text: string, href: string): boolean {
  return /^open$/i.test(text.replace(/\s+/g, ' ').trim()) && isAppStoreOrFacebookAppHref(href);
}

export function isAppStoreOrFacebookAppHref(href: string): boolean {
  const value = href.trim().toLowerCase();
  return (
    value.startsWith('fb:') ||
    value.startsWith('fb-messenger:') ||
    value.startsWith('intent:') ||
    value.startsWith('market:') ||
    value.includes('apps.apple.com') ||
    value.includes('itunes.apple.com') ||
    value.includes('play.google.com/store')
  );
}

export function shouldHideAsGlobalFacebookChrome(input: {
  hrefPaths: string[];
  ariaLabels?: string[];
}): boolean {
  const labels = input.ariaLabels ?? [];
  const hasHome =
    input.hrefPaths.some((path) => {
      const normalized = normalizePath(path).toLowerCase();
      return normalized === '/' || normalized === '/home.php' || normalized === '/index.php';
    }) || labels.some(isHomeNavLabel);
  const hasMessages = input.hrefPaths.some(isMessagesNavPath) || labels.some(isMessagesNavLabel);
  if (hasHome && hasMessages) {
    return true;
  }
  if (input.hrefPaths.some(isFacebookGlobalNavPath)) {
    return true;
  }
  return labels.some(isHomeNavLabel);
}

/**
 * Runs inside the Facebook WebView (not compiled by Metro). Keep this string valid for iOS 15+ WebKit.
 */
export const FACEBOOK_CHROME_ISOLATION_SCRIPT = `(function () {
  try {
    if (window.__mpOnlyChrome) {
      window.__mpOnlyChromeSweep && window.__mpOnlyChromeSweep();
      return;
    }
    window.__mpOnlyChrome = true;

    var GLOBAL_SEGMENTS = {
      watch: 1, groups: 1, reel: 1, reels: 1, friends: 1, notifications: 1, gaming: 1,
      stories: 1, feed: 1, live: 1, events: 1, pages: 1, bookmarks: 1, memories: 1,
      welcome: 1, menu: 1, video: 1, messages: 1, 'home.php': 1, 'index.php': 1, 'bookmarks.php': 1
    };
    var APP_PROMO = /open(\\s+\\w+){0,4}\\s+app|use(\\s+the)?(\\s+facebook)?\\s+app|get(\\s+the)?(\\s+facebook)?\\s+app|try(\\s+the)?(\\s+facebook)?\\s+app|continue in(\\s+the)?(\\s+facebook)?\\s+app|see more in(\\s+the)?(\\s+facebook)?\\s+app|download(\\s+the)?(\\s+facebook)?\\s+app|install(\\s+the)?(\\s+facebook)?\\s+app/i;
    var DISMISS = /^(not now|no thanks|close|dismiss|use(\\s+the)?(\\s+mobile)?(\\s+web|\\s+website)|continue without(\\s+the)?(\\s+facebook)?\\s+app|continue (to|on)(\\s+the)?(\\s+mobile)?(\\s+web|\\s+website))$/i;

    function visibleText(el) {
      return ((el && (el.innerText || el.textContent)) || '').replace(/\\s+/g, ' ').trim();
    }

    function pathOf(href) {
      if (!href) {
        return '';
      }
      try {
        var url = new URL(href, location.href);
        var path = url.pathname || '/';
        if (path.length > 1 && path.charAt(path.length - 1) === '/') {
          path = path.slice(0, -1);
        }
        return path;
      } catch (e) {
        return '';
      }
    }

    var RESERVED_MARKETPLACE = {
      search: 1, item: 1, create: 1, you: 1, inbox: 1, category: 1,
      notifications: 1, selling: 1, buying: 1, saved: 1, profile: 1
    };
    var lastHomeBounceAt = 0;
    var bounceTimer = null;

    function citySlugFromPath(path) {
      var match = String(path || '').toLowerCase().match(/^\\/marketplace\\/([^/]+)/);
      var slug = match && match[1];
      if (!slug || RESERVED_MARKETPLACE[slug] || /^\\d+$/.test(slug)) {
        return null;
      }
      return slug;
    }

    function rememberLanding() {
      var slug = citySlugFromPath(location.pathname);
      if (!slug) {
        return;
      }
      window.__mpOnlyLanding = location.origin + '/marketplace/' + slug + '/';
      if (window.__mpOnlySlug === slug) {
        return;
      }
      window.__mpOnlySlug = slug;
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mp-slug', slug: slug }));
        }
      } catch (e) {}
    }

    function isPhotoUrl(href) {
      try {
        var url = new URL(href, location.href);
        var path = (url.pathname || '/').toLowerCase();
        if (path.indexOf('/photo') === 0 || path.indexOf('/photos') === 0 || path.indexOf('/media') === 0) {
          return true;
        }
        var file = path.replace(/^\\//, '').split('/')[0] || '';
        if (file === 'photo.php' || file === 'photos.php' || file === 'permalink.php') {
          return true;
        }
        if (
          url.searchParams.has('fbid') ||
          url.searchParams.has('photo_id') ||
          url.searchParams.has('story_fbid') ||
          url.searchParams.has('theater')
        ) {
          return true;
        }
        var set = url.searchParams.get('set') || '';
        return set.indexOf('a.') === 0 || set.indexOf('pcb.') === 0 || set.indexOf('p.') === 0 || set.indexOf('gm.') === 0;
      } catch (e) {
        return false;
      }
    }

    function isPhotoTheaterOpen() {
      if (isPhotoUrl(location.href)) {
        return true;
      }
      var dialogs = document.querySelectorAll('[role="dialog"], [role="alertdialog"]');
      for (var i = 0; i < dialogs.length; i++) {
        var dialog = dialogs[i];
        var label = (dialog.getAttribute('aria-label') || '').toLowerCase();
        if (/photo|viewer|gallery|lightbox/.test(label)) {
          return true;
        }
        var img = dialog.querySelector('img');
        if (!img) {
          continue;
        }
        var rect = dialog.getBoundingClientRect();
        if (rect.width >= Math.min(window.innerWidth * 0.45, 220) && rect.height >= Math.min(window.innerHeight * 0.35, 180)) {
          return true;
        }
      }
      return false;
    }

    function isNewsFeedPath(path) {
      var normalized = (path || '/').toLowerCase();
      if (normalized.length > 1 && normalized.charAt(normalized.length - 1) === '/') {
        normalized = normalized.slice(0, -1);
      }
      return normalized === '/' || normalized === '/home.php' || normalized === '/index.php';
    }

    function looksLikeNewsFeed() {
      if ((location.pathname || '').toLowerCase().indexOf('/marketplace') === 0) {
        return false;
      }
      if (isPhotoTheaterOpen() || Date.now() < (window.__mpOnlyPhotoUntil || 0)) {
        return false;
      }
      if (!isNewsFeedPath(location.pathname)) {
        return false;
      }
      try {
        var sk = new URLSearchParams(location.search).get('sk') || '';
        if (sk.indexOf('h_') === 0) {
          return true;
        }
      } catch (e) {}
      if (document.querySelector('[aria-label="News Feed"], [aria-label="Stories"]')) {
        return true;
      }
      var text = document.body ? (document.body.innerText || '').slice(0, 2500) : '';
      if (/what.?s on your mind/i.test(text)) {
        return true;
      }
      return false;
    }

    function bounceIfNewsFeed() {
      rememberLanding();
      if (Date.now() < (window.__mpOnlySearchUntil || 0)) {
        return;
      }
      if (isPhotoTheaterOpen()) {
        window.__mpOnlyPhotoUntil = Date.now() + 4000;
        return;
      }
      if (!looksLikeNewsFeed()) {
        return;
      }
      var dest = window.__mpOnlyLanding || location.origin + '/marketplace/';
      var now = Date.now();
      if (now - lastHomeBounceAt < 2000) {
        return;
      }
      lastHomeBounceAt = now;
      location.replace(dest);
    }

    function markPhotoIntent() {
      window.__mpOnlyPhotoUntil = Date.now() + 10000;
    }

    function isGlobalPath(path) {
      if (!path) {
        return false;
      }
      var normalized = path.toLowerCase();
      if (normalized === '/' || normalized === '/home.php' || normalized === '/index.php') {
        return false;
      }
      var segment = normalized.replace(/^\\//, '').split('/')[0] || '';
      return !!GLOBAL_SEGMENTS[segment];
    }

    function isHomeName(name) {
      return /^(home|news feed|feed)(?=,|\\s|$)/.test(name);
    }

    function isMessagesName(name) {
      if (/^message seller\\b/.test(name) || /^inbox\\b/.test(name)) {
        return false;
      }
      return /^(messages|messenger|chats)(?=,|\\s|$)/.test(name);
    }

    function controlName(el) {
      var parts = [];
      var aria = (el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim();
      if (aria) {
        parts.push(aria);
      }
      var titles = el.querySelectorAll('title');
      for (var i = 0; i < titles.length; i++) {
        parts.push(titles[i].textContent || '');
      }
      var text = visibleText(el);
      if (text && text.length < 28) {
        parts.push(text);
      }
      return parts.join(' ').replace(/\\s+/g, ' ').trim().toLowerCase();
    }

    function isAppStoreHref(href) {
      var value = String(href || '').toLowerCase();
      return (
        value.indexOf('fb:') === 0 ||
        value.indexOf('fb-messenger:') === 0 ||
        value.indexOf('intent:') === 0 ||
        value.indexOf('market:') === 0 ||
        value.indexOf('apps.apple.com') !== -1 ||
        value.indexOf('itunes.apple.com') !== -1 ||
        value.indexOf('play.google.com/store') !== -1
      );
    }

    function hide(el) {
      if (!el || el.getAttribute('data-mp-only-hidden') === '1') {
        return;
      }
      el.setAttribute('data-mp-only-hidden', '1');
      el.style.setProperty('display', 'none', 'important');
    }

    function isTopChrome(el) {
      if (!el || el === document.body || el === document.documentElement) {
        return false;
      }
      var rect = el.getBoundingClientRect();
      if (!rect || rect.height <= 0 || rect.height > 320) {
        return false;
      }
      if (rect.height >= window.innerHeight * 0.4) {
        return false;
      }
      return rect.top < 120;
    }

    function hideKnownHeaders() {
      var known = document.querySelectorAll(
        '#header, [data-sigil="m-header"], [data-sigil="header"], nav[aria-label="Facebook"], [role="navigation"][aria-label="Facebook"]'
      );
      for (var i = 0; i < known.length; i++) {
        if (isTopChrome(known[i]) || known[i].id === 'header') {
          hide(known[i]);
        }
      }
    }

    function hideHomeMessagesHeader() {
      var nodes = document.querySelectorAll(
        'a, button, [role="button"], [role="tab"], [role="link"], [role="menuitem"]'
      );
      var homes = [];
      var messages = [];
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        var name = controlName(el);
        var href = (el.getAttribute && el.getAttribute('href')) || '';
        var path = pathOf(href);
        if (isHomeName(name) || path === '/' || path === '/home.php' || path === '/index.php') {
          homes.push(el);
        }
        if (isMessagesName(name) || path === '/messages' || path.indexOf('/messages/') === 0) {
          messages.push(el);
        }
      }
      if (!homes.length || !messages.length) {
        return;
      }
      for (var h = 0; h < homes.length; h++) {
        var node = homes[h].parentElement;
        while (node && node !== document.body) {
          var containsMessage = false;
          for (var m = 0; m < messages.length; m++) {
            if (node.contains(messages[m]) && !messages[m].contains(homes[h]) && !homes[h].contains(messages[m])) {
              containsMessage = true;
              break;
            }
          }
          if (containsMessage && isTopChrome(node)) {
            hide(node);
            break;
          }
          node = node.parentElement;
        }
      }
    }

    function hideStickyFacebookChrome() {
      var all = document.querySelectorAll('div, nav, header, section');
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        if (el.getAttribute('data-mp-only-hidden') === '1') {
          continue;
        }
        var style = window.getComputedStyle(el);
        var pos = style.position;
        if (pos !== 'sticky' && pos !== 'fixed' && pos !== '-webkit-sticky') {
          continue;
        }
        if (!isTopChrome(el)) {
          continue;
        }
        var text = visibleText(el).toLowerCase();
        var hasHome = /\\bhome\\b/.test(text);
        var hasMessages = /\\b(messages|messenger|chats)\\b/.test(text);
        if (hasHome && hasMessages) {
          hide(el);
        }
      }
    }

    function hideGlobalChrome() {
      hideKnownHeaders();
      hideHomeMessagesHeader();
      hideStickyFacebookChrome();
    }

    function stripItunesMeta() {
      var metas = document.querySelectorAll('meta[name="apple-itunes-app"]');
      for (var i = 0; i < metas.length; i++) {
        metas[i].parentNode && metas[i].parentNode.removeChild(metas[i]);
      }
    }

    function hideAppPromos() {
      stripItunesMeta();
      var clickable = document.querySelectorAll('a, button, div[role="button"], span[role="button"]');
      for (var i = 0; i < clickable.length; i++) {
        var el = clickable[i];
        var text = visibleText(el);
        if (!text || text.length > 80) {
          continue;
        }
        var href = el.tagName === 'A' ? (el.getAttribute('href') || el.href || '') : '';
        var root =
          el.closest('[role="dialog"], [role="alertdialog"], [role="banner"], header') ||
          el.parentElement;
        var rootText = root ? visibleText(root) : text;
        if (DISMISS.test(text) && APP_PROMO.test(rootText)) {
          try {
            el.click();
          } catch (e) {}
          if (root) {
            hide(root);
          }
          continue;
        }
        if (APP_PROMO.test(text) || (isAppStoreHref(href) && APP_PROMO.test(rootText))) {
          hide(root && root !== document.body ? root : el);
        }
        if (/^open$/i.test(text) && isAppStoreHref(href)) {
          hide(root && root !== document.body ? root : el);
        }
      }
    }

    function sweep() {
      if (!document.documentElement) {
        return;
      }
      hideAppPromos();
      hideGlobalChrome();
      rememberLanding();
      if (!bounceTimer) {
        bounceTimer = setTimeout(function () {
          bounceTimer = null;
          bounceIfNewsFeed();
        }, 350);
      }
    }

    window.__mpOnlyChromeSweep = sweep;

    document.addEventListener(
      'click',
      function (event) {
        var target = event.target;
        if (!target || !target.closest) {
          return;
        }
        var path = (location.pathname || '').toLowerCase();
        if (path.indexOf('/marketplace') === 0) {
          var photoHit = target.closest('img, picture, [role="img"]');
          if (!photoHit) {
            var photoLink = target.closest('a[href]');
            var hrefValue = photoLink ? (photoLink.getAttribute('href') || photoLink.href || '').toLowerCase() : '';
            if (hrefValue.indexOf('photo') !== -1 || hrefValue.indexOf('fbid') !== -1) {
              photoHit = photoLink;
            }
          }
          if (photoHit) {
            markPhotoIntent();
          }
        }
        var anchor = target.closest('a[href]');
        if (!anchor) {
          return;
        }
        var href = anchor.getAttribute('href') || anchor.href || '';
        if (isAppStoreHref(href) || isGlobalPath(pathOf(href))) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      true
    );

    var origPush = history.pushState;
    var origReplace = history.replaceState;
    history.pushState = function () {
      var result = origPush.apply(this, arguments);
      try {
        if (isPhotoUrl(location.href) || isPhotoTheaterOpen()) {
          markPhotoIntent();
        }
      } catch (e) {}
      return result;
    };
    history.replaceState = function () {
      var result = origReplace.apply(this, arguments);
      try {
        if (isPhotoUrl(location.href) || isPhotoTheaterOpen()) {
          markPhotoIntent();
        }
      } catch (e) {}
      return result;
    };

    var scheduled = null;
    function requestSweep() {
      if (scheduled) {
        return;
      }
      scheduled = setTimeout(function () {
        scheduled = null;
        sweep();
      }, 50);
    }

    var observer = new MutationObserver(requestSweep);
    observer.observe(document.documentElement || document, {
      childList: true,
      subtree: true,
    });
    sweep();
    setTimeout(sweep, 400);
    setTimeout(sweep, 1200);
    setTimeout(sweep, 3000);
  } catch (e) {}
})();
true;`;
