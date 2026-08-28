import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildMarketplaceSearchUrl,
  isMarketplaceSearchUrl,
  queryFromMarketplaceUrl,
} from './marketplaceUrlBuilder.ts';

describe('buildMarketplaceSearchUrl', () => {
  it('builds a Marketplace search URL from a query without scraping results', () => {
    const url = new URL(buildMarketplaceSearchUrl('mountain bikes'));
    assert.equal(url.origin, 'https://www.facebook.com');
    assert.equal(url.pathname, '/marketplace/search/');
    assert.equal(url.searchParams.get('query'), 'mountain bikes');
  });

  it('omits empty queries and only adds observed price params when provided', () => {
    const empty = new URL(buildMarketplaceSearchUrl('  '));
    assert.equal(empty.searchParams.get('query'), null);

    const priced = new URL(buildMarketplaceSearchUrl('tools', { minPrice: '10', maxPrice: '200' }));
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

describe('isMarketplaceSearchUrl', () => {
  it('detects search pages and rejects Feed or listing-only pages', () => {
    assert.equal(
      isMarketplaceSearchUrl('https://www.facebook.com/marketplace/search/?query=bike'),
      true,
    );
    assert.equal(
      isMarketplaceSearchUrl('https://www.facebook.com/marketplace/item/123/'),
      false,
    );
    assert.equal(isMarketplaceSearchUrl('https://www.facebook.com/groups/1'), false);
  });
});
