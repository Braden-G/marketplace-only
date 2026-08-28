export type MarketplaceSearch = {
  id: string;
  name: string;
  query: string;
  url: string;
};

export function createSearchId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createMarketplaceSearch(input: {
  name: string;
  query: string;
  url: string;
}): MarketplaceSearch {
  return {
    id: createSearchId(),
    name: input.name.trim() || input.query || 'Saved search',
    query: input.query.trim(),
    url: input.url,
  };
}
