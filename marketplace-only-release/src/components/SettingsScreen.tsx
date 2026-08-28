import { AppearanceSetting } from '../storage/settings';
import { Theme } from '../theme';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  theme: Theme;
  appearance: AppearanceSetting;
  diagnosticsEnabled: boolean;
  onChangeAppearance: (value: AppearanceSetting) => void;
  onToggleDiagnostics: () => void;
  onLogout: () => void;
  onClearData: () => void;
  onClose: () => void;
};

const APPEARANCE_OPTIONS: { value: AppearanceSetting; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function SettingsScreen({
  visible,
  theme,
  appearance,
  diagnosticsEnabled,
  onChangeAppearance,
  onToggleDiagnostics,
  onLogout,
  onClearData,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close settings"
            onPress={onClose}
            style={styles.closeHit}
          >
            <Text style={[styles.close, { color: theme.accent }]}>Done</Text>
          </Pressable>
        </View>

        <Text style={[styles.section, { color: theme.muted }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: theme.chrome, borderColor: theme.border }]}>
          {APPEARANCE_OPTIONS.map((option, index) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: appearance === option.value }}
              onPress={() => onChangeAppearance(option.value)}
              style={[
                styles.row,
                index < APPEARANCE_OPTIONS.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
              ]}
            >
              <Text style={[styles.rowLabel, { color: theme.text }]}>{option.label}</Text>
              {appearance === option.value ? (
                <Text style={{ color: theme.accent, fontSize: 18 }}>✓</Text>
              ) : null}
            </Pressable>
          ))}
        </View>

        <Text style={[styles.section, { color: theme.muted }]}>Facebook session</Text>
        <View style={[styles.card, { backgroundColor: theme.chrome, borderColor: theme.border }]}>
          <Pressable accessibilityRole="button" onPress={onLogout} style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Log Out</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onClearData}
            style={[styles.row, { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}
          >
            <Text style={[styles.rowLabel, { color: theme.danger }]}>Clear Website Data</Text>
          </Pressable>
        </View>

        <Text style={[styles.section, { color: theme.muted }]}>Developer</Text>
        <View style={[styles.card, { backgroundColor: theme.chrome, borderColor: theme.border }]}>
          <Pressable accessibilityRole="switch" accessibilityState={{ checked: diagnosticsEnabled }} onPress={onToggleDiagnostics} style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>WebView diagnostics</Text>
            <Text style={{ color: diagnosticsEnabled ? theme.accent : theme.muted }}>
              {diagnosticsEnabled ? 'On' : 'Off'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  close: {
    fontSize: 17,
    fontWeight: '600',
  },
  closeHit: {
    minHeight: 44,
    justifyContent: 'center',
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 20,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    minHeight: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: 16,
  },
});
