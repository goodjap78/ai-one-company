import { memo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';
import { northStarHomeCopy } from '../../constants/northStarHomeCopy';

type Props = {
  favoriteCount: number;
  recentViewedCount: number;
};

/**
 * Sprint 61-C — compact personal summary (no food image galleries).
 */
export const HomePersonalSection = memo(function HomePersonalSection({
  favoriteCount,
  recentViewedCount,
}: Props) {
  const router = useRouter();
  const copy = northStarHomeCopy.personal;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {copy.sectionTitle}
      </Text>

      <PersonalRow
        emoji="❤️"
        title={copy.savedMenus}
        trailing={favoriteCount > 0 ? `${favoriteCount}개` : null}
        onPress={() => router.push('/favorites')}
      />

      <PersonalRow
        emoji="🕘"
        title={copy.recentMenus}
        trailing={recentViewedCount > 0 ? `${recentViewedCount}개` : null}
        onPress={() => router.push('/recently-viewed')}
      />
    </View>
  );
});

type PersonalRowProps = {
  emoji: string;
  title: string;
  trailing: string | null;
  onPress: () => void;
};

function PersonalRow({ emoji, title, trailing, onPress }: PersonalRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={trailing ? `${title} ${trailing}` : title}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.trailingWrap}>
        {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    gap: 6,
  },
  sectionTitle: {
    ...ds.typography.sectionTitle,
    fontSize: 15,
    lineHeight: 20,
    color: '#3A2417',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: ds.colors.card,
    borderRadius: ds.radius.card,
    paddingVertical: 12,
    paddingHorizontal: ds.spacing.cardInner,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderLight,
    minHeight: 48,
  },
  rowPressed: {
    opacity: 0.92,
    backgroundColor: ds.colors.canvas,
  },
  emoji: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  title: {
    flex: 1,
    minWidth: 0,
    ...ds.typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: '#3A2417',
  },
  trailingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  trailing: {
    ...ds.typography.caption,
    color: ds.colors.warmText,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 18,
    color: ds.colors.warmText,
    lineHeight: 20,
  },
});
