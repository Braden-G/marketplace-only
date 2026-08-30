import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../theme';

type Props = {
  theme: Theme;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onHome: () => void;
  onSearch: () => void;
  onReload: () => void;
  onSettings: () => void;
};

function ToolButton({
  label,
  accessibilityLabel,
  disabled,
  theme,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  disabled?: boolean;
  theme: Theme;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { opacity: disabled ? 0.35 : pressed ? 0.6 : 1 },
      ]}
    >
      <Text style={[styles.glyph, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Toolbar({
  theme,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onHome,
  onSearch,
  onReload,
  onSettings,
}: Props) {
  return (
    <View style={[styles.bar, { backgroundColor: theme.chrome, borderTopColor: theme.border }]}>
      <ToolButton label="‹" accessibilityLabel="Back" disabled={!canGoBack} theme={theme} onPress={onBack} />
      <ToolButton label="›" accessibilityLabel="Forward" disabled={!canGoForward} theme={theme} onPress={onForward} />
      <ToolButton label="⌂" accessibilityLabel="Marketplace home" theme={theme} onPress={onHome} />
      <ToolButton label="⌕" accessibilityLabel="Search" theme={theme} onPress={onSearch} />
      <ToolButton label="↻" accessibilityLabel="Reload" theme={theme} onPress={onReload} />
      <ToolButton label="⚙" accessibilityLabel="Settings" theme={theme} onPress={onSettings} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 52,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  button: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 26,
    fontWeight: '500',
  },
});
