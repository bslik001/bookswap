import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { Button, Screen, TextField } from '@/components/ui';
import { useDeleteAccount } from '@/hooks/useUser';
import { colors, radius, spacing, typography } from '@/theme';
import { apiErrorMessage } from '@/utils/apiErrorMessage';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const deleteAccount = useDeleteAccount();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const onConfirmDelete = () => {
    if (!password) {
      setDeleteError('Mot de passe requis.');
      return;
    }
    setDeleteError(null);
    deleteAccount.mutate(password, {
      onSuccess: async () => {
        setDeleteOpen(false);
        setPassword('');
        await logout();
      },
      onError: (err) => setDeleteError(apiErrorMessage(err)),
    });
  };

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
        {user?.address ? <Row label="Adresse" value={user.address} /> : null}
        {user?.gradeInterests?.length ? (
          <Row label="Niveaux" value={user.gradeInterests.join(' · ')} />
        ) : null}
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <Button label="Modifier mon profil" variant="ghost" onPress={() => router.push('/profile/edit')} />
        <View style={{ height: spacing.sm }} />
        <Button
          label="Changer mon mot de passe"
          variant="ghost"
          onPress={() => router.push('/profile/password')}
        />
        <View style={{ height: spacing.sm }} />
        <Button
          label="Supprimer mon compte"
          variant="ghost"
          onPress={() => {
            setDeleteOpen(true);
            setDeleteError(null);
          }}
        />
      </View>

      {deleteOpen ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confirmer la suppression</Text>
          <Text style={styles.warning}>
            Cette action est irreversible. Tous vos livres et demandes seront supprimes.
          </Text>
          <TextField
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={deleteError ?? undefined}
          />
          <Button
            label="Supprimer definitivement"
            loading={deleteAccount.isPending}
            onPress={() =>
              Alert.alert('Supprimer le compte ?', 'Cette action est irreversible.', [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Supprimer',
                  style: 'destructive',
                  onPress: onConfirmDelete,
                },
              ])
            }
          />
          <View style={{ height: spacing.sm }} />
          <Button
            label="Annuler"
            variant="ghost"
            onPress={() => {
              setDeleteOpen(false);
              setPassword('');
              setDeleteError(null);
            }}
          />
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button label="Se deconnecter" variant="secondary" onPress={logout} />
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
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
  warning: { ...typography.caption, color: colors.danger, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  rowLabel: { ...typography.body, color: colors.textMuted },
  rowValue: { ...typography.body, color: colors.text, flexShrink: 1, textAlign: 'right' },
  actions: { marginTop: spacing.lg },
});
