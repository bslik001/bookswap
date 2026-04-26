import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/theme';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOffline = state.isConnected === false || state.isInternetReachable === false;
      setOffline(isOffline);
    });
    return unsubscribe;
  }, []);

  if (!offline) return null;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={styles.banner}
      >
        <Text style={styles.text}>Hors ligne — certaines fonctionnalites peuvent etre indisponibles.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.danger },
  banner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  text: { ...typography.caption, color: colors.textInverse, fontWeight: '600' },
});
