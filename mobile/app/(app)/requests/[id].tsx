import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { Button, ErrorBanner, Screen, StatusBadge } from '@/components/ui';
import { useCancelRequest, useRequest } from '@/hooks/useRequests';
import { colors, radius, spacing, typography } from '@/theme';
import { apiErrorMessage } from '@/utils/apiErrorMessage';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: request, isLoading, error } = useRequest(id ?? '');
  const cancelRequest = useCancelRequest();
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      </Screen>
    );
  }

  if (error || !request) {
    return (
      <Screen>
        <ErrorBanner message={apiErrorMessage(error, 'Demande introuvable.')} />
        <Button label="Retour" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const isRequester = user?.id === request.requester.id;
  const canCancel = isRequester && request.status === 'PENDING';

  const onCancel = () => {
    Alert.alert('Annuler la demande', 'Cette action est irreversible.', [
      { text: 'Garder', style: 'cancel' },
      {
        text: 'Annuler la demande',
        style: 'destructive',
        onPress: () => {
          setActionError(null);
          cancelRequest.mutate(request.id, {
            onSuccess: () => router.back(),
            onError: (err) => setActionError(apiErrorMessage(err)),
          });
        },
      },
    ]);
  };

  return (
    <Screen scrollable>
      <View style={styles.statusRow}>
        <StatusBadge status={request.status} />
        <Text style={styles.date}>
          Cree le {new Date(request.createdAt).toLocaleDateString('fr-FR')}
        </Text>
      </View>

      <View style={styles.bookCard}>
        {request.book.imageUrl ? (
          <Image
            source={request.book.imageUrl}
            style={styles.thumb}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}
        <View style={styles.bookBody}>
          <Text style={styles.bookTitle}>{request.book.title}</Text>
          <Text style={styles.bookGrade}>{request.book.grade}</Text>
        </View>
      </View>

      <Section title={isRequester ? 'Proprietaire' : 'Demandeur'}>
        {isRequester
          ? `${request.book.owner.firstName} ${request.book.owner.lastName}`
          : `${request.requester.firstName} ${request.requester.lastName}`}
      </Section>

      {actionError ? <ErrorBanner message={actionError} /> : null}

      {canCancel ? (
        <View style={styles.actions}>
          <Button
            label="Annuler ma demande"
            variant="secondary"
            loading={cancelRequest.isPending}
            onPress={onCancel}
          />
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          label="Voir le livre"
          variant="ghost"
          onPress={() => router.push(`/books/${request.book.id}`)}
        />
      </View>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  date: { ...typography.caption, color: colors.textMuted },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  thumb: {
    width: 80,
    height: 110,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    marginRight: spacing.md,
  },
  thumbPlaceholder: { backgroundColor: colors.border },
  bookBody: { flex: 1, justifyContent: 'center' },
  bookTitle: { ...typography.subtitle, color: colors.text },
  bookGrade: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.xs },
  body: { ...typography.body, color: colors.text },
  actions: { marginTop: spacing.md },
});
