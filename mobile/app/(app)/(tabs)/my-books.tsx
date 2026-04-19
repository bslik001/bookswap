import { Screen } from '@/components/ui';
import { StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '@/theme';

export default function MyBooksScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Mes livres</Text>
      <Text style={styles.subtitle}>Ecran a venir en phase 6.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textMuted },
});
