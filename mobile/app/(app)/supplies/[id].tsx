import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';
import { Button, ErrorBanner, Screen, TextField } from '@/components/ui';
import { useContactSupplier, useSupply } from '@/hooks/useSupplies';
import { colors, radius, spacing, typography } from '@/theme';
import type { SupplyType } from '@/types/supply';
import { apiErrorMessage } from '@/utils/apiErrorMessage';

const TYPE_LABEL: Record<SupplyType, string> = {
  NOTEBOOK: 'Cahier',
  PEN: 'Stylo',
  BAG: 'Sac',
  OTHER: 'Autre',
};

export default function SupplyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: supply, isLoading, error } = useSupply(id ?? '');
  const contact = useContactSupplier(id ?? '');
  const [message, setMessage] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      </Screen>
    );
  }

  if (error || !supply) {
    return (
      <Screen>
        <ErrorBanner message={apiErrorMessage(error, 'Fourniture introuvable.')} />
        <Button label="Retour" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const onContact = () => {
    setContactError(null);
    contact.mutate(message.trim(), {
      onSuccess: () => {
        setMessage('');
        Alert.alert('Demande envoyee', 'Le fournisseur a ete notifie.');
      },
      onError: (err) => setContactError(apiErrorMessage(err)),
    });
  };

  return (
    <Screen scrollable>
      {supply.imageUrl ? (
        <Image source={{ uri: supply.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>Sans image</Text>
        </View>
      )}

      <Text style={styles.title}>{supply.name}</Text>

      <View style={styles.metaRow}>
        <Chip label={TYPE_LABEL[supply.type]} />
        {supply.price ? (
          <Chip label={`${Number(supply.price).toLocaleString('fr-FR')} FCFA`} />
        ) : null}
      </View>

      {supply.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.body}>{supply.description}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fournisseur</Text>
        <Text style={styles.body}>
          {supply.supplier.firstName} {supply.supplier.lastName}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contacter le fournisseur</Text>
        <TextField
          label=""
          value={message}
          onChangeText={setMessage}
          placeholder="Bonjour, je suis interesse(e)..."
          multiline
          numberOfLines={4}
          style={styles.textarea}
        />
      </View>

      {contactError ? <ErrorBanner message={contactError} /> : null}

      <Button
        label="Envoyer la demande"
        loading={contact.isPending}
        disabled={message.trim().length === 0}
        onPress={onContact}
      />
    </Screen>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    marginBottom: spacing.lg,
  },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { ...typography.caption, color: colors.textMuted },
  title: { ...typography.title, color: colors.text },
  metaRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md, flexWrap: 'wrap' },
  chip: {
    backgroundColor: colors.chipBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  chipText: { ...typography.caption, color: colors.chipText, fontWeight: '600' },
  section: { marginTop: spacing.xl },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.text },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
});
