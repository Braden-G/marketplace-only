import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  classifyUrl,
  isFacebookHost,
  shouldAllowInWebView,
} from './urlValidator.ts';

describe('isFacebookHost', () => {
  it('accepts real Facebook hosts and rejects lookalikes', () => {
    assert.equal(isFacebookHost('www.facebook.com'), true);
    assert.equal(isFacebookHost('m.facebook.com'), true);
    assert.equal(isFacebookHost('mbasic.facebook.com'), true);
    assert.equal(isFacebookHost('l.facebook.com'), true);
    assert.equal(isFacebookHost('business.facebook.com'), true);
    assert.equal(isFacebookHost('scontent.xx.fbcdn.net'), true);
    assert.equal(isFacebookHost('facebook.com'), true);
    assert.equal(isFacebookHost('evilfacebook.com'), false);
    assert.equal(isFacebookHost('facebook.com.attacker.com'), false);
    assert.equal(isFacebookHost('example.com'), false);
  });
});

describe('classifyUrl', () => {
  it('allows Marketplace listings, create, and search', () => {
    assert.equal(classifyUrl('https://www.facebook.com/marketplace/').kind, 'marketplace');
    assert.equal(classifyUrl('https://www.facebook.com/marketplace/item/123456/').kind, 'marketplace');
    assert.equal(
      classifyUrl('https://www.facebook.com/marketplace/nyc/search/?query=bike').kind,
      'marketplace',
    );
    assert.equal(classifyUrl('https://www.facebook.com/marketplace/create').kind, 'marketplace');
    assert.equal(
      classifyUrl('https://www.facebook.com/marketplace/search/?query=mountain%20bikes').kind,
      'marketplace',
    );
  });

  it('allows Facebook authentication and checkpoint routes', () => {
    assert.equal(classifyUrl('https://www.facebook.com/login/').kind, 'authentication');
    assert.equal(
      classifyUrl('https://www.facebook.com/login.php?next=%2Fmarketplace%2F').kind,
      'authentication',
    );
    assert.equal(classifyUrl('https://www.facebook.com/checkpoint/').kind, 'authentication');
    assert.equal(classifyUrl('https://m.facebook.com/recover/initiate/').kind, 'authentication');
    assert.equal(classifyUrl('https://mbasic.facebook.com/login/').kind, 'authentication');
  });

  it('treats Facebook home as a redirect-to-Marketplace case', () => {
    assert.equal(classifyUrl('https://www.facebook.com/').kind, 'facebookHome');
    assert.equal(classifyUrl('https://www.facebook.com/?sk=h_chr').kind, 'facebookHome');
    assert.equal(classifyUrl('https://m.facebook.com/home.php').kind, 'facebookHome');
  });

  it('blocks Feed destinations without using substring host checks', () => {
    assert.equal(classifyUrl('https://www.facebook.com/groups/123').kind, 'facebookBlocked');
    assert.equal(classifyUrl('https://www.facebook.com/reels/').kind, 'facebookBlocked');
    assert.equal(classifyUrl('https://www.facebook.com/watch/').kind, 'facebookBlocked');
    assert.equal(classifyUrl('https://www.facebook.com/friends/').kind, 'facebookBlocked');
    assert.equal(classifyUrl('https://www.facebook.com/notifications').kind, 'facebookBlocked');
    assert.equal(classifyUrl('https://www.facebook.com/stories/').kind, 'facebookBlocked');
  });

  it('opens non-Facebook https in Safari and does not treat lookalike hosts as Facebook', () => {
    assert.equal(classifyUrl('https://example.com/listing').kind, 'external');
    assert.equal(classifyUrl('https://evilfacebook.com/marketplace/').kind, 'external');
    assert.equal(classifyUrl('http://maps.google.com/').kind, 'external');
  });

  it('does not hand off Facebook app URL schemes', () => {
    assert.equal(classifyUrl('fb://profile/123').kind, 'customScheme');
    assert.equal(classifyUrl('fb-messenger://user-thread/1').kind, 'customScheme');
    assert.equal(classifyUrl('instagram://user?username=x').kind, 'customScheme');
  });

  it('allows system handlers and ignores blank documents', () => {
    assert.equal(classifyUrl('mailto:seller@example.com').kind, 'system');
    assert.equal(classifyUrl('tel:+15555550100').kind, 'system');
    assert.equal(classifyUrl('about:blank').kind, 'ignore');
  });

  it('allows unknown Facebook paths and link-shim hosts so dependencies are not guessed', () => {
    assert.equal(
      classifyUrl('https://www.facebook.com/some_undocumented_route/abc').kind,
      'facebookRelated',
    );
    assert.equal(classifyUrl('https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.com').kind, 'facebookRelated');
    assert.equal(classifyUrl('https://static.xx.fbcdn.net/rsrc.php/v3/img.png').kind, 'facebookRelated');
  });

  it('allows messenger.com for seller contact', () => {
    assert.equal(classifyUrl('https://www.messenger.com/t/123').kind, 'facebookRelated');
  });
});

describe('shouldAllowInWebView', () => {
  it('allows Marketplace and auth at the top level', () => {
    assert.equal(shouldAllowInWebView('marketplace', true), true);
    assert.equal(shouldAllowInWebView('authentication', true), true);
    assert.equal(shouldAllowInWebView('facebookRelated', true), true);
    assert.equal(shouldAllowInWebView('facebookBlocked', true), false);
    assert.equal(shouldAllowInWebView('external', true), false);
    assert.equal(shouldAllowInWebView('facebookHome', true), false);
  });

  it('allows Facebook subframes but not custom schemes in frames', () => {
    assert.equal(shouldAllowInWebView('facebookRelated', false), true);
    assert.equal(shouldAllowInWebView('customScheme', false), false);
  });
});
