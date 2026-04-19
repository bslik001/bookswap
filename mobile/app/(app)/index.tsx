import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/auth/AuthContext';
import { colors, radius, spacing, typography } from '@/theme';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BookSwap</Text>
      <Text style={styles.body}>
        Bienvenue {user?.firstName ?? ''}. Ecrans a venir en phase 4+.
      </Text>
      <Pressable style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Se deconnecter</Text>
      </Pressable>
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
  body: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  buttonText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
