import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import type { RequestStatus } from '@/types/request';

const STATUS_STYLES: Record<RequestStatus, { bg: string; fg: string; label: string }> = {
  PENDING: { bg: colors.warningBg, fg: colors.warning, label: 'En attente' },
  IN_PROGRESS: { bg: colors.chipBg, fg: colors.chipText, label: 'En cours' },
  ACCEPTED: { bg: colors.successBg, fg: colors.success, label: 'Acceptee' },
  REFUSED: { bg: colors.dangerBg, fg: colors.danger, label: 'Refusee' },
  COMPLETED: { bg: colors.successBg, fg: colors.success, label: 'Terminee' },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.fg }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  text: { ...typography.caption, fontWeight: '600' },
});
