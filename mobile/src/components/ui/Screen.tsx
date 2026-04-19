import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

type ScreenProps = {
  children: React.ReactNode;
  scrollable?: boolean;
  contentStyle?: ViewStyle;
};

export function Screen({ children, scrollable = false, contentStyle }: ScreenProps) {
  const Inner = scrollable ? ScrollView : View;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Inner
          style={styles.flex}
          contentContainerStyle={scrollable ? [styles.content, contentStyle] : undefined}
        >
          {scrollable ? children : <View style={[styles.content, contentStyle]}>{children}</View>}
        </Inner>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
});
