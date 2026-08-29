import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isAppPromoDismissText,
  isAppPromoText,
  isAppStoreOrFacebookAppHref,
  isFacebookGlobalNavPath,
  isHomeNavLabel,
  isMessagesNavLabel,
  isMessagesNavPath,
  isStandaloneOpenAppCta,
  shouldHideAsGlobalFacebookChrome,
} from './facebookChrome.ts';

describe('isFacebookGlobalNavPath', () => {
  it('treats Facebook product destinations as global chrome', () => {
    assert.equal(isFacebookGlobalNavPath('/'), true);
    assert.equal(isFacebookGlobalNavPath('/watch'), true);
    assert.equal(isFacebookGlobalNavPath('/watch/'), true);
    assert.equal(isFacebookGlobalNavPath('/groups/123'), true);
    assert.equal(isFacebookGlobalNavPath('/reels'), true);
    assert.equal(isFacebookGlobalNavPath('/friends'), true);
    assert.equal(isFacebookGlobalNavPath('/gaming'), true);
    assert.equal(isFacebookGlobalNavPath('/feed'), true);
    assert.equal(isFacebookGlobalNavPath('/messages'), true);
  });

  it('does not treat Marketplace surfaces as global chrome', () => {
    assert.equal(isFacebookGlobalNavPath('/marketplace'), false);
    assert.equal(isFacebookGlobalNavPath('/marketplace/'), false);
    assert.equal(isFacebookGlobalNavPath('/marketplace/inbox'), false);
    assert.equal(isFacebookGlobalNavPath('/marketplace/you'), false);
    assert.equal(isFacebookGlobalNavPath('/marketplace/create'), false);
    assert.equal(isFacebookGlobalNavPath('/marketplace/item/123'), false);
  });
});

describe('shouldHideAsGlobalFacebookChrome', () => {
  it('hides the Facebook Home/Watch/Groups tab bar', () => {
    assert.equal(
      shouldHideAsGlobalFacebookChrome({
        hrefPaths: ['/', '/watch', '/marketplace', '/groups'],
        ariaLabels: ['Home', 'Watch', 'Marketplace', 'Groups'],
      }),
      true,
    );
  });

  it('keeps Marketplace Browse/Inbox/Selling tabs', () => {
    assert.equal(
      shouldHideAsGlobalFacebookChrome({
        hrefPaths: ['/marketplace', '/marketplace/inbox', '/marketplace/you'],
        ariaLabels: ['Browse', 'Inbox', 'Selling'],
      }),
      false,
    );
  });

  it('hides a Home + Messages header', () => {
    assert.equal(
      shouldHideAsGlobalFacebookChrome({
        hrefPaths: ['/', '/messages'],
        ariaLabels: ['Home, selected', 'Messenger'],
      }),
      true,
    );
    assert.equal(isHomeNavLabel('Home, selected'), true);
    assert.equal(isHomeNavLabel('hometown'), false);
    assert.equal(isMessagesNavLabel('Messenger, 3 unread'), true);
    assert.equal(isMessagesNavLabel('Message seller'), false);
    assert.equal(isMessagesNavPath('/messages/t/1'), true);
  });
});

describe('app promo copy', () => {
  it('detects Open app / Use the app prompts', () => {
    assert.equal(isAppPromoText('Open app'), true);
    assert.equal(isAppPromoText('Open in the Facebook app'), true);
    assert.equal(isAppPromoText('Use the app'), true);
    assert.equal(isAppPromoText('Continue in the app'), true);
    assert.equal(isAppPromoText('Message seller'), false);
    assert.equal(isAppPromoText('Open'), false);
  });

  it('detects dismiss actions on those prompts', () => {
    assert.equal(isAppPromoDismissText('Not now'), true);
    assert.equal(isAppPromoDismissText('Continue without the app'), true);
    assert.equal(isAppPromoDismissText('Log in'), false);
  });

  it('detects Facebook app and store links', () => {
    assert.equal(isAppStoreOrFacebookAppHref('fb://profile/1'), true);
    assert.equal(isAppStoreOrFacebookAppHref('https://apps.apple.com/app/facebook/id284882215'), true);
    assert.equal(isAppStoreOrFacebookAppHref('https://www.facebook.com/marketplace/'), false);
  });

  it('treats a lone Open button as an app CTA when it points at the Facebook app', () => {
    assert.equal(isStandaloneOpenAppCta('Open', 'fb://feed'), true);
    assert.equal(isStandaloneOpenAppCta('Open', 'https://www.facebook.com/marketplace/'), false);
  });
});
