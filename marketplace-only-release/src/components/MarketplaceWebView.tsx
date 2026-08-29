import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import type {
  ShouldStartLoadRequest,
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
  WebViewMessageEvent,
  WebViewNavigation,
  WebViewOpenWindowEvent,
} from 'react-native-webview/lib/WebViewTypes';
import { CHROME_USER_AGENT_ANDROID, SAFARI_USER_AGENT_IOS } from '../constants';
import { FACEBOOK_CHROME_ISOLATION_SCRIPT } from '../services/facebookChrome';
import { forwardRef } from 'react';

type Props = {
  sourceUri: string;
  webKey: number;
  onShouldStartLoadWithRequest: (request: ShouldStartLoadRequest) => boolean;
  onOpenWindow: (event: WebViewOpenWindowEvent) => void;
  onNavigationStateChange: (state: WebViewNavigation) => void;
  onLoadProgress: (progress: number) => void;
  onLoadEnd: () => void;
  onMessage?: (event: WebViewMessageEvent) => void;
  onError: (event: WebViewErrorEvent) => void;
  onHttpError: (event: WebViewHttpErrorEvent) => void;
  onProcessGone: () => void;
  onFileDownload?: (downloadUrl: string) => void;
};

export const MarketplaceWebView = forwardRef<WebView, Props>(function MarketplaceWebView(
  {
    sourceUri,
    webKey,
    onShouldStartLoadWithRequest,
    onOpenWindow,
    onNavigationStateChange,
    onLoadProgress,
    onLoadEnd,
    onMessage,
    onError,
    onHttpError,
    onProcessGone,
    onFileDownload,
  },
  ref,
) {
  return (
    <WebView
      key={webKey}
      ref={ref}
      source={{ uri: sourceUri }}
      style={{ flex: 1 }}
      userAgent={Platform.OS === 'ios' ? SAFARI_USER_AGENT_IOS : CHROME_USER_AGENT_ANDROID}
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      cacheEnabled
      incognito={false}
      javaScriptEnabled
      domStorageEnabled
      injectedJavaScriptBeforeContentLoaded={FACEBOOK_CHROME_ISOLATION_SCRIPT}
      injectedJavaScript={FACEBOOK_CHROME_ISOLATION_SCRIPT}
      setSupportMultipleWindows
      allowsBackForwardNavigationGestures={false}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      startInLoadingState={false}
      onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
      onOpenWindow={onOpenWindow}
      onNavigationStateChange={onNavigationStateChange}
      onLoadProgress={(event) => onLoadProgress(event.nativeEvent.progress)}
      onLoadEnd={onLoadEnd}
      onMessage={onMessage}
      onError={onError}
      onHttpError={onHttpError}
      onContentProcessDidTerminate={onProcessGone}
      onRenderProcessGone={onProcessGone}
      onFileDownload={
        onFileDownload
          ? (event) => {
              onFileDownload(event.nativeEvent.downloadUrl);
            }
          : undefined
      }
    />
  );
});
