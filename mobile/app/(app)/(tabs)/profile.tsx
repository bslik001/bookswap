import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { Button, Screen } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}
          </Text>
        </View>
        <Text style={styles.name}>
          {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
        </Text>
        <Text style={styles.role}>{user?.role}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coordonnees</Text>
        <Row label="Email" value={user?.email ?? '—'} />
        <Row label="Telephone" value={user?.phone ?? '—'} />
      </View>

      <View style={styles.actions}>
        <Button label="Mes demandes" onPress={() => router.push('/requests/me')} />
      </View>

      <View style={styles.actions}>
        <Button
          label="Fournitures scolaires"
          variant="secondary"
          onPress={() => router.push('/supplies')}
        />
      </View>

      <View style={styles.actions}>
        <Button label="Se deconnecter" variant="ghost" onPress={logout} />
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { ...typography.title, color: colors.primary },
  name: { ...typography.subtitle, color: colors.text },
  role: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  rowLabel: { ...typography.body, color: colors.textMuted },
  rowValue: { ...typography.body, color: colors.text },
  actions: { marginTop: spacing.lg },
});
