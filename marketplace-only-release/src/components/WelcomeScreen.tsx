import { Pressable, StyleSheet, Text, View } from 'react-native';
import { APP_NAME } from '../constants';
import { Theme } from '../theme';

type Props = {
  theme: Theme;
  onContinue: () => void;
};

export function WelcomeScreen({ theme, onContinue }: Props) {
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Text style={[styles.wordmark, { color: theme.accent }]}>{APP_NAME}</Text>
      <Text style={[styles.title, { color: theme.text }]}>
        Create a Facebook account or log in to access Facebook Marketplace.
      </Text>
      <Text style={[styles.body, { color: theme.muted }]}>
        This app opens Marketplace in a private browser and keeps the rest of Facebook out of the
        way. Your login stays on this device.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue to login"
        onPress={onContinue}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={styles.buttonLabel}>Continue to Login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 16,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  button: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
