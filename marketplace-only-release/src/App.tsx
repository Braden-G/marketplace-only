import { StatusBar } from 'expo-status-bar';
import * as Network from 'expo-network';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type {
  ShouldStartLoadRequest,
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
  WebViewMessageEvent,
  WebViewNavigation,
  WebViewOpenWindowEvent,
} from 'react-native-webview/lib/WebViewTypes';
import { DiagnosticsOverlay, MessageOverlay } from './components/Overlays';
import { MarketplaceWebView } from './components/MarketplaceWebView';
import { SearchSheet } from './components/SearchSheet';
import { SettingsScreen } from './components/SettingsScreen';
import { Toolbar } from './components/Toolbar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MARKETPLACE_HOME } from './constants';
import { createMarketplaceSearch, MarketplaceSearch } from './models/MarketplaceSearch';
import { classifyUrl, isExplicitNewsFeedUrl, isFacebookPhotoViewer, shouldAllowInWebView } from './navigation/urlValidator';
import { getLogEntries, logNavigation, subscribeToLogs } from './services/logger';
import {
  buildMarketplaceSearchUrl,
  isBareMarketplaceHome,
  isMarketplaceItemUrl,
  isMarketplaceSearchUrl,
  locationSlugFromMarketplaceUrl,
  marketplaceLandingUrl,
  marketplaceSearchNavigationScript,
  queryFromMarketplaceUrl,
} from './services/marketplaceUrlBuilder';
import { clearFacebookWebsiteData } from './services/websiteData';
import {
  addRecentSearch,
  loadRecentSearches,
  loadSavedSearches,
  removeSavedSearch,
  saveSearch,
} from './storage/searchStore';
import { loadLocationSlug, saveLocationSlug } from './storage/locationSlug';
import { AppearanceSetting, AppSettings, loadSettings, saveSettings } from './storage/settings';
import { getTheme, resolveScheme } from './theme';

type ErrorKind = 'offline' | 'load' | 'process' | 'auth' | null;

export default function App() {
  const systemScheme = useColorScheme();
  const webViewRef = useRef<WebView>(null);
  const lastMarketplaceUrl = useRef(MARKETPLACE_HOME);
  const marketplaceStack = useRef<string[]>([MARKETPLACE_HOME]);
  const currentUrlRef = useRef(MARKETPLACE_HOME);
  const locationSlugRef = useRef<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [sourceUri, setSourceUri] = useState(MARKETPLACE_HOME);
  const [webKey, setWebKey] = useState(0);
  const [currentUrl, setCurrentUrl] = useState(MARKETPLACE_HOME);
  const [currentKind, setCurrentKind] = useState('marketplace');
  const [nav, setNav] = useState({ canGoBack: false, canGoForward: false, loading: true, progress: 0 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [discoveredHosts, setDiscoveredHosts] = useState<string[]>([]);
  const [logs, setLogs] = useState(getLogEntries());
  const [online, setOnline] = useState(true);
  const [savedSearches, setSavedSearches] = useState<MarketplaceSearch[]>([]);
  const [recentSearches, setRecentSearches] = useState<MarketplaceSearch[]>([]);

  useEffect(() => {
    loadSettings().then(setSettings);
    loadSavedSearches().then(setSavedSearches);
    loadRecentSearches().then(setRecentSearches);
    loadLocationSlug().then((slug) => {
      if (slug) {
        locationSlugRef.current = slug;
      }
    });
  }, []);

  useEffect(() => subscribeToLogs(() => setLogs(getLogEntries())), []);

  useEffect(() => {
    if (!settings) {
      return;
    }
    saveSettings(settings).catch(() => undefined);
  }, [settings]);

  useEffect(() => {
    const update = (state: { isConnected?: boolean | null; isInternetReachable?: boolean | null }) => {
      const next = state.isConnected !== false && state.isInternetReachable !== false;
      setOnline(next);
      if (!next) {
        setErrorKind('offline');
      } else {
        setErrorKind((kind) => (kind === 'offline' ? null : kind));
      }
    };
    Network.getNetworkStateAsync().then(update).catch(() => undefined);
    const sub = Network.addNetworkStateListener(update);
    return () => sub.remove();
  }, []);

  const theme = useMemo(() => {
    const appearance = settings?.appearance ?? 'system';
    return getTheme(resolveScheme(appearance, systemScheme));
  }, [settings?.appearance, systemScheme]);

  const rememberSlug = useCallback((url: string) => {
    const slug = locationSlugFromMarketplaceUrl(url);
    if (!slug || slug === locationSlugRef.current) {
      return;
    }
    locationSlugRef.current = slug;
    saveLocationSlug(slug).catch(() => undefined);
  }, []);

  const cityLandingUrl = useCallback((fromUrl?: string) => {
    return marketplaceLandingUrl(fromUrl, locationSlugRef.current);
  }, []);

  const rememberHost = useCallback((host: string | null) => {
    if (!host) {
      return;
    }
    setDiscoveredHosts((existing) => (existing.includes(host) ? existing : [...existing, host].slice(0, 40)));
  }, []);

  const loadUrl = useCallback((url: string, remount = false) => {
    setBlocked(false);
    setErrorKind(null);
    if (remount) {
      setWebKey((value) => value + 1);
    }
    setSourceUri(url);
  }, []);

  const setMarketplaceStack = useCallback((stack: string[]) => {
    marketplaceStack.current = stack;
    lastMarketplaceUrl.current = stack[stack.length - 1] ?? MARKETPLACE_HOME;
    setNav((prev) => ({ ...prev, canGoBack: stack.length > 1 }));
  }, []);

  const pushMarketplaceHistory = useCallback(
    (url: string) => {
      if (classifyUrl(url).kind !== 'marketplace') {
        return;
      }
      const stack = marketplaceStack.current;
      const last = stack[stack.length - 1];
      if (last === url) {
        return;
      }
      // Bare /marketplace/ is an unstable hop: Facebook often SPA-routes it to the news feed.
      if (isBareMarketplaceHome(url)) {
        return;
      }
      if (last && isMarketplaceSearchUrl(last) && isMarketplaceSearchUrl(url)) {
        setMarketplaceStack([...stack.slice(0, -1), url]);
        return;
      }
      setMarketplaceStack([...stack, url].slice(-40));
    },
    [setMarketplaceStack],
  );

  const loadMarketplaceHome = useCallback(() => {
    const url = cityLandingUrl(lastMarketplaceUrl.current);
    setMarketplaceStack([url]);
    loadUrl(url, true);
    logNavigation('Load Marketplace home', { url, kind: 'marketplace' });
  }, [cityLandingUrl, loadUrl, setMarketplaceStack]);

  const goBackMarketplace = useCallback(() => {
    const current = currentUrlRef.current;
    const stack = marketplaceStack.current;
    const top = stack[stack.length - 1] ?? '';
    if (isMarketplaceSearchUrl(current) || isMarketplaceSearchUrl(top)) {
      const landing = cityLandingUrl(current || top);
      setMarketplaceStack([landing]);
      loadUrl(landing, false);
      logNavigation('Back from search to Marketplace', { url: landing, kind: 'marketplace' });
      return;
    }
    if (stack.length > 1) {
      const next = stack.slice(0, -1);
      const previous = next[next.length - 1] ?? cityLandingUrl(current);
      const safePrevious = isBareMarketplaceHome(previous) ? cityLandingUrl(current) : previous;
      setMarketplaceStack([...next.slice(0, -1), safePrevious]);
      loadUrl(safePrevious, false);
      logNavigation('Back within Marketplace', { url: safePrevious, kind: 'marketplace' });
      return;
    }
    loadMarketplaceHome();
  }, [cityLandingUrl, loadMarketplaceHome, loadUrl, setMarketplaceStack]);

  const recordMarketplaceUrl = useCallback(
    async (url: string) => {
      const result = classifyUrl(url);
      if (result.kind !== 'marketplace') {
        return;
      }
      if (isBareMarketplaceHome(url)) {
        return;
      }
      rememberSlug(url);
      lastMarketplaceUrl.current = url;
      pushMarketplaceHistory(url);
      if (!isMarketplaceSearchUrl(url)) {
        return;
      }
      const query = queryFromMarketplaceUrl(url);
      const search = createMarketplaceSearch({
        name: query || 'Marketplace search',
        query,
        url,
      });
      setRecentSearches(await addRecentSearch(search));
    },
    [pushMarketplaceHistory, rememberSlug],
  );

  const handleClassification = useCallback(
    (rawUrl: string, isTopFrame: boolean): boolean => {
      const result = classifyUrl(rawUrl);
      rememberHost(result.host);
      logNavigation(`Navigate ${isTopFrame ? 'top' : 'frame'}`, { url: rawUrl, kind: result.kind });

      if (!isTopFrame) {
        return result.kind !== 'customScheme';
      }

      if (shouldAllowInWebView(result.kind, true)) {
        setCurrentKind(result.kind);
        setBlocked(false);
        return true;
      }

      if (result.kind === 'facebookHome') {
        if (isFacebookPhotoViewer(rawUrl)) {
          setCurrentKind('facebookRelated');
          setBlocked(false);
          return true;
        }
        if (isExplicitNewsFeedUrl(rawUrl)) {
          logNavigation('Stay in Marketplace (Facebook home blocked)', { url: rawUrl, kind: result.kind });
          return false;
        }
        // Bare `/` from a listing or search is usually the photo theater's first hop.
        if (isMarketplaceItemUrl(currentUrlRef.current) || isMarketplaceSearchUrl(currentUrlRef.current)) {
          setCurrentKind('facebookRelated');
          setBlocked(false);
          return true;
        }
        logNavigation('Stay in Marketplace (Facebook home blocked)', { url: rawUrl, kind: result.kind });
        return false;
      }

      if (result.kind === 'facebookBlocked') {
        setBlocked(true);
        setCurrentKind(result.kind);
        return false;
      }

      if (result.kind === 'external') {
        WebBrowser.openBrowserAsync(rawUrl).catch(() => Linking.openURL(rawUrl));
        return false;
      }

      if (result.kind === 'system') {
        Linking.openURL(rawUrl).catch(() => undefined);
        return false;
      }

      logNavigation('Ignored custom scheme (Facebook app not opened)', { url: rawUrl, kind: result.kind });
      return false;
    },
    [rememberHost],
  );

  const onShouldStartLoadWithRequest = useCallback(
    (request: ShouldStartLoadRequest) => handleClassification(request.url, request.isTopFrame !== false),
    [handleClassification],
  );

  const onOpenWindow = useCallback(
    (event: WebViewOpenWindowEvent) => {
      const url = event.nativeEvent.targetUrl;
      const allowed = handleClassification(url, true);
      if (allowed) {
        loadUrl(url);
      }
    },
    [handleClassification, loadUrl],
  );

  const onNavigationStateChange = useCallback(
    (state: WebViewNavigation) => {
      currentUrlRef.current = state.url;
      setCurrentUrl(state.url);
      setNav((prev) => ({
        ...prev,
        canGoForward: false,
        loading: state.loading,
        canGoBack: marketplaceStack.current.length > 1 || isMarketplaceSearchUrl(state.url),
      }));
      const result = classifyUrl(state.url);
      setCurrentKind(result.kind);
      rememberHost(result.host);
      rememberSlug(state.url);
      if (!state.loading) {
        recordMarketplaceUrl(state.url).catch(() => undefined);
      }
    },
    [recordMarketplaceUrl, rememberHost, rememberSlug],
  );

  const onWebMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as { type?: string; slug?: string };
        if (data?.type === 'mp-slug' && data.slug) {
          rememberSlug(`https://www.facebook.com/marketplace/${data.slug}/`);
        }
      } catch {
        return;
      }
    },
    [rememberSlug],
  );

  const injectLandingHint = useCallback(() => {
    const dest = cityLandingUrl(lastMarketplaceUrl.current);
    webViewRef.current?.injectJavaScript(`window.__mpOnlyLanding=${JSON.stringify(dest)}; true;`);
  }, [cityLandingUrl]);

  const onError = useCallback((event: WebViewErrorEvent) => {
    const description = event.nativeEvent.description || 'Marketplace could not be loaded.';
    const kind = classifyUrl(event.nativeEvent.url).kind;
    setLastError(description);
    setErrorKind(kind === 'authentication' ? 'auth' : 'load');
    logNavigation('Load error', { url: event.nativeEvent.url, kind: description });
  }, []);

  const onHttpError = useCallback((event: WebViewHttpErrorEvent) => {
    const status = event.nativeEvent.statusCode;
    const kind = classifyUrl(event.nativeEvent.url).kind;
    logNavigation(`HTTP ${status}`, { url: event.nativeEvent.url, kind });
    if (kind === 'authentication' && status >= 400) {
      setLastError(`HTTP ${status}`);
      setErrorKind('auth');
      return;
    }
    if (status >= 500) {
      setLastError(`HTTP ${status}`);
      setErrorKind('load');
    }
  }, []);

  const onProcessGone = useCallback(() => {
    setErrorKind('process');
    setLastError('Marketplace temporarily stopped.');
    logNavigation('Web content process terminated');
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const resetSession = useCallback(async (title: string, confirmLabel: string, message: string) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
      ]);
    });
    if (!confirmed) {
      return;
    }
    const result = await clearFacebookWebsiteData();
    setSettingsOpen(false);
    setBlocked(false);
    setErrorKind(null);
    lastMarketplaceUrl.current = MARKETPLACE_HOME;
    loadUrl(MARKETPLACE_HOME, true);
    if (!result.ok) {
      Alert.alert(
        'Use a development build to fully sign out',
        'Expo Go cannot wipe WebKit website data. Install the EAS development or preview build, then try Log Out again.',
      );
    }
    logNavigation(title, { kind: result.usedNativeModule ? 'native' : 'fallback' });
  }, [loadUrl]);

  const openSearch = useCallback((search: MarketplaceSearch) => {
    setSearchOpen(false);
    const slug =
      locationSlugFromMarketplaceUrl(search.url) ??
      locationSlugFromMarketplaceUrl(currentUrl) ??
      locationSlugFromMarketplaceUrl(lastMarketplaceUrl.current) ??
      locationSlugRef.current;
    if (search.query && slug) {
      const url = buildMarketplaceSearchUrl(search.query, { locationSlug: slug });
      pushMarketplaceHistory(url);
      loadUrl(url, false);
      addRecentSearch({ ...search, url }).then(setRecentSearches);
      logNavigation('Open Marketplace search', { url, kind: 'marketplace' });
      return;
    }
    if (search.query) {
      webViewRef.current?.injectJavaScript(marketplaceSearchNavigationScript(search.query, slug));
      addRecentSearch(search).then(setRecentSearches);
      logNavigation('Open Marketplace search in page', { kind: 'marketplace' });
      return;
    }
    pushMarketplaceHistory(search.url);
    loadUrl(search.url, false);
    addRecentSearch(search).then(setRecentSearches);
    logNavigation('Open search shortcut', { url: search.url, kind: 'marketplace' });
  }, [currentUrl, loadUrl, pushMarketplaceHistory]);

  const submitQuery = useCallback(
    (query: string) => {
      const url = buildMarketplaceSearchUrl(query);
      const search = createMarketplaceSearch({ name: query, query, url });
      openSearch(search);
    },
    [openSearch],
  );

  const saveCurrentPage = useCallback(
    async (name: string) => {
      if (classifyUrl(currentUrl).kind !== 'marketplace') {
        return;
      }
      const search = createMarketplaceSearch({
        name,
        query: queryFromMarketplaceUrl(currentUrl),
        url: currentUrl,
      });
      setSavedSearches(await saveSearch(search));
    },
    [currentUrl],
  );

  if (!settings) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (!settings.hasCompletedWelcome) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
        <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
        <WelcomeScreen theme={theme} onContinue={() => updateSettings({ hasCompletedWelcome: true })} />
      </SafeAreaView>
    );
  }

  const canSaveCurrent = classifyUrl(currentUrl).kind === 'marketplace';

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.chrome }]} edges={['top', 'bottom']}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.flex}>
        <MarketplaceWebView
          ref={webViewRef}
          webKey={webKey}
          sourceUri={sourceUri}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          onOpenWindow={onOpenWindow}
          onNavigationStateChange={onNavigationStateChange}
          onLoadProgress={(progress) => {
            setNav((prev) => ({
              ...prev,
              loading: progress < 1,
              progress,
            }));
          }}
          onLoadEnd={() => {
            setNav((prev) => ({ ...prev, loading: false, progress: 1 }));
            injectLandingHint();
          }}
          onMessage={onWebMessage}
          onError={onError}
          onHttpError={onHttpError}
          onProcessGone={onProcessGone}
          onFileDownload={(downloadUrl) => {
            WebBrowser.openBrowserAsync(downloadUrl).catch(() => Linking.openURL(downloadUrl));
          }}
        />

        {nav.loading ? (
          <View pointerEvents="none" style={[styles.progressTrack, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.max(8, nav.progress * 100)}%`, backgroundColor: theme.accent },
              ]}
            />
          </View>
        ) : null}

        {blocked ? (
          <MessageOverlay
            theme={theme}
            title="Facebook content outside Marketplace is disabled."
            body="Feed, Groups, Reels, and similar Facebook areas stay out of this app."
            actionLabel="Back to Marketplace"
            onAction={() => {
              setBlocked(false);
              if (classifyUrl(currentUrl).kind !== 'marketplace') {
                loadUrl(lastMarketplaceUrl.current);
              }
            }}
          />
        ) : null}

        {errorKind === 'offline' || !online ? (
          <MessageOverlay
            theme={theme}
            title="No Internet Connection"
            body="Marketplace requires an internet connection."
            actionLabel="Retry"
            onAction={() => {
              setErrorKind(null);
              webViewRef.current?.reload();
            }}
          />
        ) : null}

        {errorKind === 'load' ? (
          <MessageOverlay
            theme={theme}
            title="Marketplace couldn't be loaded."
            body={lastError || 'The page failed to load. Try again.'}
            actionLabel="Retry"
            onAction={() => {
              setErrorKind(null);
              webViewRef.current?.reload();
            }}
          />
        ) : null}

        {errorKind === 'auth' ? (
          <MessageOverlay
            theme={theme}
            title="Facebook couldn't complete the login."
            body="Try again, or check that you can reach Facebook from this device."
            actionLabel="Try Again"
            onAction={() => {
              setErrorKind(null);
              webViewRef.current?.reload();
            }}
          />
        ) : null}

        {errorKind === 'process' ? (
          <MessageOverlay
            theme={theme}
            title="Marketplace temporarily stopped."
            body="The web page crashed. Reload to continue."
            actionLabel="Reload"
            onAction={() => {
              setErrorKind(null);
              webViewRef.current?.reload();
            }}
          />
        ) : null}

        {settings.diagnosticsEnabled ? (
          <DiagnosticsOverlay
            theme={theme}
            url={currentUrl}
            kind={currentKind}
            isLoading={nav.loading}
            lastError={lastError}
            discoveredHosts={discoveredHosts}
            logs={logs}
          />
        ) : null}
      </View>

      <Toolbar
        theme={theme}
        canGoBack={nav.canGoBack || isMarketplaceSearchUrl(currentUrl)}
        canGoForward={false}
        onBack={goBackMarketplace}
        onForward={() => webViewRef.current?.goForward()}
        onHome={loadMarketplaceHome}
        onSearch={() => setSearchOpen(true)}
        onReload={() => webViewRef.current?.reload()}
        onSettings={() => setSettingsOpen(true)}
      />

      <SearchSheet
        visible={searchOpen}
        theme={theme}
        currentUrl={currentUrl}
        saved={savedSearches}
        recents={recentSearches}
        canSaveCurrent={canSaveCurrent}
        onClose={() => setSearchOpen(false)}
        onOpenSearch={openSearch}
        onSaveCurrent={saveCurrentPage}
        onSubmitQuery={submitQuery}
        onDeleteSaved={(id) => {
          removeSavedSearch(id).then(setSavedSearches);
        }}
      />

      <SettingsScreen
        visible={settingsOpen}
        theme={theme}
        appearance={settings.appearance}
        diagnosticsEnabled={settings.diagnosticsEnabled}
        onChangeAppearance={(appearance: AppearanceSetting) => updateSettings({ appearance })}
        onToggleDiagnostics={() => updateSettings({ diagnosticsEnabled: !settings.diagnosticsEnabled })}
        onLogout={() =>
          resetSession('Log Out', 'Log Out', 'This signs you out of Facebook inside Marketplace Only.')
        }
        onClearData={() =>
          resetSession(
            'Clear Facebook Session?',
            'Clear',
            'This will sign you out of Facebook inside Marketplace Only.',
          )
        }
        onClose={() => setSettingsOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  progressBar: {
    height: 2,
  },
});
