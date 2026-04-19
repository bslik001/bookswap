import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

export default function NotificationsScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Ecran a venir en phase 8.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textMuted },
});
