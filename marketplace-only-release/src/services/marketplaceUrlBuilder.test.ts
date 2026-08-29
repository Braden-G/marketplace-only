import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildMarketplaceSearchUrl,
  isBareMarketplaceHome,
  isMarketplaceItemUrl,
  isMarketplaceSearchUrl,
  locationSlugFromMarketplaceUrl,
  marketplaceLandingUrl,
  marketplaceSearchNavigationScript,
  queryFromMarketplaceUrl,
} from './marketplaceUrlBuilder.ts';

describe('buildMarketplaceSearchUrl', () => {
  it('builds a city Marketplace search URL when a location slug is known', () => {
    const url = new URL(buildMarketplaceSearchUrl('mountain bikes', { locationSlug: 'cedar-city' }));
    assert.equal(url.origin, 'https://www.facebook.com');
    assert.equal(url.pathname, '/marketplace/cedar-city/search/');
    assert.equal(url.searchParams.get('query'), 'mountain bikes');
  });

  it('does not fall back to the category Marketplace when no city is known', () => {
    const url = new URL(buildMarketplaceSearchUrl('tools'));
    assert.equal(url.pathname, '/marketplace/search/');
    assert.equal(url.searchParams.get('query'), 'tools');
  });

  it('omits empty queries and only adds observed price params when provided', () => {
    const empty = new URL(buildMarketplaceSearchUrl('  ', { locationSlug: 'austin' }));
    assert.equal(empty.searchParams.get('query'), null);

    const priced = new URL(buildMarketplaceSearchUrl('tools', { locationSlug: 'austin', minPrice: '10', maxPrice: '200' }));
    assert.equal(priced.searchParams.get('query'), 'tools');
    assert.equal(priced.searchParams.get('minPrice'), '10');
    assert.equal(priced.searchParams.get('maxPrice'), '200');
  });
});

describe('queryFromMarketplaceUrl', () => {
  it('reads query or q from a Marketplace URL', () => {
    assert.equal(
      queryFromMarketplaceUrl('https://www.facebook.com/marketplace/search/?query=tools'),
      'tools',
    );
    assert.equal(
      queryFromMarketplaceUrl('https://www.facebook.com/marketplace/search/?q=bikes'),
      'bikes',
    );
  });
});

describe('isMarketplaceItemUrl', () => {
  it('detects listing item URLs', () => {
    assert.equal(isMarketplaceItemUrl('https://www.facebook.com/marketplace/item/123456/'), true);
    assert.equal(isMarketplaceItemUrl('https://www.facebook.com/marketplace/item/123456/?ref=search'), true);
    assert.equal(isMarketplaceItemUrl('https://www.facebook.com/marketplace/austin/search/?query=bike'), false);
    assert.equal(isMarketplaceItemUrl('https://www.facebook.com/'), false);
  });
});

describe('isMarketplaceSearchUrl', () => {
  it('detects search pages and rejects Feed or listing-only pages', () => {
    assert.equal(
      isMarketplaceSearchUrl('https://www.facebook.com/marketplace/search/?query=bike'),
      true,
    );
    assert.equal(
      isMarketplaceSearchUrl('https://www.facebook.com/marketplace/category/search/?query=bike'),
      true,
    );
    assert.equal(
      isMarketplaceSearchUrl('https://www.facebook.com/marketplace/austin/search/?query=bike'),
      true,
    );
    assert.equal(
      isMarketplaceSearchUrl('https://www.facebook.com/marketplace/item/123/'),
      false,
    );
    assert.equal(isMarketplaceSearchUrl('https://www.facebook.com/groups/1'), false);
  });
});

describe('locationSlugFromMarketplaceUrl', () => {
  it('reads a city slug and ignores reserved Marketplace segments', () => {
    assert.equal(locationSlugFromMarketplaceUrl('https://www.facebook.com/marketplace/austin/'), 'austin');
    assert.equal(
      locationSlugFromMarketplaceUrl('https://www.facebook.com/marketplace/cedar-city/search/?query=tools'),
      'cedar-city',
    );
    assert.equal(locationSlugFromMarketplaceUrl('https://www.facebook.com/marketplace/search/?query=tools'), null);
    assert.equal(locationSlugFromMarketplaceUrl('https://www.facebook.com/marketplace/item/123/'), null);
    assert.equal(locationSlugFromMarketplaceUrl('https://www.facebook.com/marketplace/category/search/'), null);
    assert.equal(locationSlugFromMarketplaceUrl('https://www.facebook.com/marketplace/'), null);
  });
});

describe('marketplaceLandingUrl', () => {
  it('returns a city browse URL when a slug is known, otherwise Facebook Marketplace home', () => {
    assert.equal(
      marketplaceLandingUrl('https://www.facebook.com/marketplace/austin/search/?query=tools'),
      'https://www.facebook.com/marketplace/austin/',
    );
    assert.equal(
      marketplaceLandingUrl('https://www.facebook.com/marketplace/item/123/', 'cedar-city'),
      'https://www.facebook.com/marketplace/cedar-city/',
    );
    assert.equal(
      marketplaceLandingUrl('https://www.facebook.com/marketplace/category/search/?query=tools'),
      'https://www.facebook.com/marketplace/',
    );
    assert.equal(marketplaceLandingUrl(), 'https://www.facebook.com/marketplace/');
  });
});

describe('marketplaceSearchNavigationScript', () => {
  it('navigates to the city search URL when a slug is already known', () => {
    const script = marketplaceSearchNavigationScript('mountain bikes', 'austin');
    assert.match(script, /marketplace\/' \+ slug \+ '\/search\//);
    assert.match(script, /"mountain bikes"/);
    assert.match(script, /"austin"/);
  });
});

describe('isBareMarketplaceHome', () => {
  it('detects /marketplace/ without a city or search path', () => {
    assert.equal(isBareMarketplaceHome('https://www.facebook.com/marketplace/'), true);
    assert.equal(isBareMarketplaceHome('https://www.facebook.com/marketplace'), true);
    assert.equal(isBareMarketplaceHome('https://www.facebook.com/marketplace/austin/'), false);
    assert.equal(isBareMarketplaceHome('https://www.facebook.com/marketplace/category/search/?query=x'), false);
  });
});
