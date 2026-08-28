export type LogEntry = {
  at: string;
  message: string;
  url?: string;
  kind?: string;
};

const MAX_ENTRIES = 80;
const entries: LogEntry[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function logNavigation(message: string, extra?: { url?: string; kind?: string }) {
  const entry: LogEntry = {
    at: new Date().toISOString(),
    message,
    url: extra?.url,
    kind: extra?.kind,
  };
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.pop();
  }
  if (__DEV__) {
    console.log(`[MarketplaceOnly] ${message}`, extra?.url ?? '', extra?.kind ?? '');
  }
  emit();
}

export function getLogEntries(): LogEntry[] {
  return [...entries];
}

export function subscribeToLogs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
