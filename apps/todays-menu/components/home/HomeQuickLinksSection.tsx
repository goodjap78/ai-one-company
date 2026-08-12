import { memo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getHankkiHomeDecisionMessages } from '../../constants/HankkiMessages';
import { theme } from '../../constants/theme';

type Props = {
  favoriteCount: number;
  recentMealSummary: string;
};

const labels = getHankkiHomeDecisionMessages();

export const HomeQuickLinksSection = memo(function HomeQuickLinksSection({
  favoriteCount,
  recentMealSummary,
}: Props) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{labels.quickLinksTitle}</Text>

      <QuickLinkRow
        emoji="❤️"
        title={labels.quickFavoritesLabel}
        subtitle={
          favoriteCount > 0
            ? `${favoriteCount}개 · ${labels.viewAllFavorites}`
            : labels.quickFavoritesEmpty
        }
        onPress={() => router.push('/favorites')}
      />

      <InfoRow emoji="🍽️" title={labels.quickRecentLabel} subtitle={recentMealSummary} />
    </View>
  );
});

type QuickLinkRowProps = {
  emoji: string;
  title: string;
  subtitle: string;
  onPress: () => void;
};

function QuickLinkRow({ emoji, title, subtitle, onPress }: QuickLinkRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

type InfoRowProps = {
  emoji: string;
  title: string;
  subtitle: string;
};

function InfoRow({ emoji, title, subtitle }: InfoRowProps) {
  return (
    <View style={styles.infoRow} accessibilityRole="text">
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.sectionEyebrow,
    color: theme.colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    minHeight: theme.sizes.touchTarget + 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    minHeight: theme.sizes.touchTarget + 8,
  },
  rowPressed: {
    ...theme.interaction.pressedLight,
    backgroundColor: theme.colors.primarySoft,
  },
  emoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...theme.typography.metaText,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  subtitle: {
    ...theme.typography.tipBody,
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  chevron: {
    fontSize: 20,
    color: theme.colors.textMuted,
  },
});
