import { LogEntry } from '../services/logger';
import { Theme } from '../theme';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type OverlayProps = {
  theme: Theme;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
};

export function MessageOverlay({ theme, title, body, actionLabel, onAction }: OverlayProps) {
  return (
    <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
      <View style={[styles.card, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.body, { color: theme.muted }]}>{body}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => [styles.action, { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

type DiagnosticsProps = {
  theme: Theme;
  url: string;
  kind: string;
  isLoading: boolean;
  lastError: string | null;
  discoveredHosts: string[];
  logs: LogEntry[];
};

export function DiagnosticsOverlay({
  theme,
  url,
  kind,
  isLoading,
  lastError,
  discoveredHosts,
  logs,
}: DiagnosticsProps) {
  return (
    <View pointerEvents="none" style={styles.diagnostics}>
      <View style={[styles.diagnosticsCard, { backgroundColor: theme.overlay }]}>
        <Text style={styles.diagnosticsTitle}>WebView diagnostics</Text>
        <Text style={styles.diagnosticsLine} numberOfLines={3}>
          URL: {url || '(none)'}
        </Text>
        <Text style={styles.diagnosticsLine}>State: {kind} {isLoading ? '(loading)' : ''}</Text>
        {lastError ? <Text style={styles.diagnosticsLine}>Error: {lastError}</Text> : null}
        <Text style={styles.diagnosticsLine}>Hosts: {discoveredHosts.join(', ') || '(none yet)'}</Text>
        <ScrollView style={styles.log} pointerEvents="none">
          {logs.slice(0, 8).map((entry) => (
            <Text key={entry.at + entry.message} style={styles.diagnosticsLine} numberOfLines={2}>
              {entry.message} {entry.kind ?? ''} {entry.url ?? ''}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  action: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  diagnostics: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 64,
  },
  diagnosticsCard: {
    borderRadius: 10,
    padding: 10,
    maxHeight: 180,
  },
  diagnosticsTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  diagnosticsLine: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  log: {
    marginTop: 6,
    maxHeight: 70,
  },
});
