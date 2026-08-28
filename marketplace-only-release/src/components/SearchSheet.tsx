import { MarketplaceSearch } from '../models/MarketplaceSearch';
import { SEARCH_EXAMPLES } from '../services/marketplaceUrlBuilder';
import { Theme } from '../theme';
import { useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  theme: Theme;
  currentUrl: string;
  saved: MarketplaceSearch[];
  recents: MarketplaceSearch[];
  onClose: () => void;
  onOpenSearch: (search: MarketplaceSearch) => void;
  onSaveCurrent: (name: string) => void;
  onSubmitQuery: (query: string) => void;
  onDeleteSaved: (id: string) => void;
  canSaveCurrent: boolean;
};

function Section({
  title,
  theme,
  children,
}: {
  title: string;
  theme: Theme;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.muted }]}>{title}</Text>
      {children}
    </View>
  );
}

function Row({
  theme,
  title,
  subtitle,
  onPress,
  onDelete,
}: {
  theme: Theme;
  title: string;
  subtitle?: string;
  onPress: () => void;
  onDelete?: () => void;
}) {
  return (
    <View style={[styles.row, { borderColor: theme.border, backgroundColor: theme.chrome }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        style={styles.rowMain}
      >
        <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.rowSubtitle, { color: theme.muted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </Pressable>
      {onDelete ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${title}`} onPress={onDelete} style={styles.deleteHit}>
          <Text style={{ color: theme.danger, fontSize: 15 }}>Delete</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SearchSheet({
  visible,
  theme,
  currentUrl,
  saved,
  recents,
  onClose,
  onOpenSearch,
  onSaveCurrent,
  onSubmitQuery,
  onDeleteSaved,
  canSaveCurrent,
}: Props) {
  const [query, setQuery] = useState('');
  const [saveName, setSaveName] = useState('');

  const submit = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    onSubmitQuery(trimmed);
    setQuery('');
  };

  const saveCurrent = () => {
    onSaveCurrent(saveName.trim() || 'Saved Marketplace page');
    setSaveName('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Searches</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close searches" onPress={onClose} style={styles.doneHit}>
            <Text style={[styles.done, { color: theme.accent }]}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Section title="Search Marketplace" theme={theme}>
            <View style={styles.searchRow}>
              <TextInput
                accessibilityLabel="Marketplace search query"
                value={query}
                onChangeText={setQuery}
                placeholder="Search Marketplace"
                placeholderTextColor={theme.muted}
                onSubmitEditing={submit}
                returnKeyType="search"
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.chrome },
                ]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Run search"
                onPress={submit}
                style={[styles.go, { backgroundColor: theme.accent }]}
              >
                <Text style={styles.goLabel}>Go</Text>
              </Pressable>
            </View>
            <TextInput
              accessibilityLabel="Name for saved Marketplace page"
              value={saveName}
              onChangeText={setSaveName}
              placeholder="Name for this page"
              placeholderTextColor={theme.muted}
              style={[
                styles.nameInput,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.chrome },
              ]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSaveCurrent }}
              disabled={!canSaveCurrent}
              onPress={saveCurrent}
              style={[styles.saveCurrent, { opacity: canSaveCurrent ? 1 : 0.45 }]}
            >
              <Text style={{ color: theme.accent, fontSize: 16 }}>Save current Marketplace page</Text>
            </Pressable>
            <Text style={[styles.hint, { color: theme.muted }]} numberOfLines={2}>
              {currentUrl}
            </Text>
          </Section>

          <Section title="Examples" theme={theme}>
            {SEARCH_EXAMPLES.map((example) => (
              <Row
                key={example.name}
                theme={theme}
                title={example.name}
                subtitle={example.query}
                onPress={() => onSubmitQuery(example.query)}
              />
            ))}
          </Section>

          <Section title="Saved" theme={theme}>
            {saved.length === 0 ? (
              <Text style={[styles.empty, { color: theme.muted }]}>No saved searches yet.</Text>
            ) : (
              saved.map((item) => (
                <Row
                  key={item.id}
                  theme={theme}
                  title={item.name}
                  subtitle={item.query || item.url}
                  onPress={() => onOpenSearch(item)}
                  onDelete={() => onDeleteSaved(item.id)}
                />
              ))
            )}
          </Section>

          <Section title="Recent" theme={theme}>
            {recents.length === 0 ? (
              <Text style={[styles.empty, { color: theme.muted }]}>No recent searches yet.</Text>
            ) : (
              recents.map((item) => (
                <Row
                  key={item.id}
                  theme={theme}
                  title={item.name}
                  subtitle={item.query || item.url}
                  onPress={() => onOpenSearch(item)}
                />
              ))
            )}
          </Section>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    minHeight: 52,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  done: {
    fontSize: 17,
    fontWeight: '600',
  },
  doneHit: {
    minHeight: 44,
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  nameInput: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  go: {
    minHeight: 44,
    minWidth: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  goLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  saveCurrent: {
    minHeight: 44,
    justifyContent: 'center',
  },
  hint: {
    fontSize: 12,
  },
  row: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  rowMain: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  deleteHit: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  empty: {
    fontSize: 15,
  },
});
