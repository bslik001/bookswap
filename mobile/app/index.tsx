import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BookSwap</Text>
      <Text style={styles.subtitle}>Echange de livres scolaires</Text>
      <Text style={styles.hint}>
        Phase 1 OK — auth context et ecrans arrivent en phase 2-3.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.display,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
  },
});
