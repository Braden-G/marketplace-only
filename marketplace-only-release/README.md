# Marketplace Only

Personal iPhone (and Android) app that opens **Facebook Marketplace** and keeps the rest of Facebook out of the way. It is a native Expo shell around Facebook’s own website — not a Marketplace API, scraper, or backend.

You do **not** need a Mac. Cloud builds run on [EAS Build](https://docs.expo.dev/build/introduction/).

## What you get

- Marketplace at `https://www.facebook.com/marketplace/`
- Facebook login inside the WebView (session stays on this device)
- Back, Forward, Reload, Marketplace Home
- Conservative isolation: Feed / Groups / Reels / Friends are blocked; unknown Facebook URLs are allowed and logged
- External links open in Safari (or the system browser)
- Settings: appearance, Log Out, Clear Website Data, diagnostics
- Saved searches, recents (20), and example shortcuts (mountain bikes, tools, Cedar City)

## Try it today with Expo Go

This path needs no Apple Developer account and no custom binary:

```bash
cd MarketplaceOnly
npm install
npx expo start
```

Scan the QR code with the Expo Go app. Login cookies persist inside Expo Go. **Log Out / Clear Website Data need a development or preview build** because Expo Go cannot wipe WebKit website data.

## Downloadable iOS build (no Mac)

EAS compiles iOS in the cloud. Installing that build on a physical iPhone still requires a **paid Apple Developer Program** account so the IPA can be signed. Apple does not allow unsigned sideloading. Do not put a Team ID in this repo; EAS asks for it at build time.

Profiles in [`eas.json`](eas.json):

- **development** — `developmentClient: true`, internal distribution, device IPA (not Simulator). Install once, then load JS from Metro.
- **preview** — internal distribution, JS baked in. Download and use without a computer running.
- **production** — store-style binary if you ever need it. Not required for personal use.

### 1. Create the EAS project

```bash
npx eas-cli login
npx eas-cli init
```

`eas init` writes `extra.eas.projectId` into `app.json`. Leave `DEVELOPMENT_TEAM` out of source.

### 2. Development build you can install and iterate on

```bash
npx eas-cli build --platform ios --profile development
```

The first iOS device build registers your iPhone (QR / UDID) and lets EAS manage certificates. When it finishes, open the Expo build page on the phone and tap **Install**. Enable Developer Mode if iOS asks.

Then start Metro and open the installed app:

```bash
npx expo start --dev-client
```

Rebuild the native app only after adding native modules or changing `app.json`. JavaScript-only changes hot-reload.

### 3. Standalone preview IPA (no Metro)

```bash
npx eas-cli build --platform ios --profile preview
```

### Android APK (optional, no Apple account)

```bash
npx eas-cli build --platform android --profile preview
```

## Device checklist

After install: fresh Facebook login, relaunch (session persists), listing, search shortcuts, seller contact if Facebook allows it, block Feed/Groups/Reels, external link → Safari, Log Out / Clear Website Data, offline retry. Use **Settings → WebView diagnostics** to record unexpected Facebook hosts and search URL parameters.

## Tests

```bash
npm test
npm run typecheck
```

## Privacy

- No analytics, no developer server, no password fields in native UI
- Facebook authentication happens on Facebook’s website
- The Facebook iOS app is not opened (`fb://` and Messenger schemes are ignored)
- Saved searches stay in AsyncStorage on device
