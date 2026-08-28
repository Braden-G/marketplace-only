import { Platform } from 'react-native';

export type ClearWebsiteDataResult = {
  ok: boolean;
  usedNativeModule: boolean;
  detail?: string;
};

export async function clearFacebookWebsiteData(): Promise<ClearWebsiteDataResult> {
  try {
    const cookieModule = await import('@preeternal/react-native-cookie-manager');
    const CookieManager = cookieModule.default;
    if (typeof CookieManager.clearAllStores === 'function') {
      await CookieManager.clearAllStores();
    } else {
      await CookieManager.clearAll(true);
      if (Platform.OS === 'ios') {
        await CookieManager.clearAll(false);
      }
    }
    if (typeof CookieManager.flush === 'function') {
      await CookieManager.flush();
    }
    return { ok: true, usedNativeModule: true };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { ok: false, usedNativeModule: false, detail };
  }
}
