import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import type { BookCondition } from '@/types/book';
import { GRADE_OPTIONS, OTHER_GRADE_VALUE } from '@/utils/grades';

type BookFiltersProps = {
  grade?: string;
  condition?: BookCondition;
  onChange: (next: { grade?: string; condition?: BookCondition }) => void;
};

const CONDITION_OPTIONS: { value: BookCondition; label: string }[] = [
  { value: 'NEW', label: 'Neuf' },
  { value: 'USED', label: 'Occasion' },
];

export function BookFilters({ grade, condition, onChange }: BookFiltersProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <FilterChip
          label="Tous niveaux"
          active={!grade}
          onPress={() => onChange({ grade: undefined, condition })}
        />
        {GRADE_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            active={grade === opt.value}
            onPress={() => onChange({ grade: grade === opt.value ? undefined : opt.value, condition })}
          />
        ))}
        <FilterChip
          label="Autres"
          active={grade === OTHER_GRADE_VALUE}
          onPress={() =>
            onChange({
              grade: grade === OTHER_GRADE_VALUE ? undefined : OTHER_GRADE_VALUE,
              condition,
            })
          }
        />
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <FilterChip
          label="Tous etats"
          active={!condition}
          onPress={() => onChange({ grade, condition: undefined })}
        />
        {CONDITION_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            active={condition === opt.value}
            onPress={() => onChange({ grade, condition: condition === opt.value ? undefined : opt.value })}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md, gap: spacing.sm },
  row: { gap: spacing.sm, paddingRight: spacing.md },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.chipBg, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.text },
  chipTextActive: { color: colors.chipText, fontWeight: '600' },
});
