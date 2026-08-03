import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { convenienceCombosCopy } from '../../constants/convenienceCombosCopy';
import { ds } from '../../constants/designSystem';
import { NAV_BACK } from '../../constants/navigationCopy';
import { CONVENIENCE_COMBOS } from '../../data/content/combos';
import { ScreenBackButton } from '../ui/ScreenBackButton';
import { screenLayout } from '../ui/screenLayout';

export function ConvenienceCombosScreen() {
  const comboCount = CONVENIENCE_COMBOS.length;

  return (
    <SafeAreaView style={screenLayout.safeArea} edges={['top', 'bottom']}>
      <View style={screenLayout.page}>
        <ScrollView
          contentContainerStyle={[screenLayout.scrollContent, styles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <View style={screenLayout.frame}>
            <ScreenBackButton label={NAV_BACK.home} fallbackHref="/(tabs)" />

            <View style={styles.header}>
              <Text style={styles.title} accessibilityRole="header">
                {convenienceCombosCopy.title}
              </Text>
              <Text style={styles.description}>{convenienceCombosCopy.description}</Text>
              <Text style={styles.count}>
                {convenienceCombosCopy.countLabel(comboCount)}
              </Text>
            </View>

            <View style={styles.list}>
              {CONVENIENCE_COMBOS.map((combo) => (
                <View key={combo.id} style={styles.card}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {combo.title}
                  </Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {combo.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: ds.spacing.xl,
  },
  header: {
    gap: ds.spacing.sm,
  },
  title: {
    ...ds.typography.sectionTitle,
    color: '#3A2417',
  },
  description: {
    ...ds.typography.body,
    color: ds.colors.warmText,
    lineHeight: 22,
  },
  count: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.textSecondary,
  },
  list: {
    gap: ds.spacing.cardInner,
  },
  card: {
    backgroundColor: ds.colors.card,
    borderRadius: ds.radius.card,
    padding: ds.spacing.cardInner,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderLight,
    ...ds.shadow.card,
  },
  cardTitle: {
    ...ds.typography.body,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: '#3A2417',
  },
  cardDescription: {
    ...ds.typography.caption,
    color: ds.colors.warmText,
  },
});
