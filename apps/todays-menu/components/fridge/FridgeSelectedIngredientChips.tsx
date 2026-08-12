import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ds } from '../../constants/designSystem';
import { FRIDGE_RAID_COPY } from '../../constants/fridgeRaidCopy';

type Props = {
  names: string[];
};

export function FridgeSelectedIngredientChips({ names }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (names.length === 0) return null;

  const showCollapse = names.length > 4;
  const visibleNames = showCollapse && !expanded ? names.slice(0, 4) : names;

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {visibleNames.map((name) => (
          <View key={name} style={styles.chip}>
            <Text style={styles.chipLabel} numberOfLines={1}>{name}</Text>
          </View>
        ))}
        {showCollapse && !expanded ? (
          <Pressable
            style={({ pressed }) => [styles.chip, styles.moreChip, pressed && styles.chipPressed]}
            onPress={() => setExpanded(true)}
            accessibilityRole="button"
            accessibilityLabel={`선택 재료 ${names.length}개 전체 보기`}
          >
            <Text style={styles.moreLabel}>+{names.length - 4}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      {showCollapse && expanded ? (
        <Pressable
          style={({ pressed }) => [styles.collapse, pressed && styles.chipPressed]}
          onPress={() => setExpanded(false)}
          accessibilityRole="button"
          accessibilityLabel="선택 재료 접기"
        >
          <Text style={styles.collapseLabel}>{FRIDGE_RAID_COPY.chipsCollapse}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: ds.spacing.xs,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: ds.spacing.xs,
    paddingRight: ds.spacing.sm,
  },
  chip: {
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: 6,
    borderRadius: ds.radius.pill,
    backgroundColor: ds.colors.borderLight,
    maxWidth: 120,
  },
  moreChip: {
    minWidth: 40,
    alignItems: 'center',
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipLabel: {
    ...ds.typography.caption,
    color: ds.colors.textPrimary,
    fontWeight: '700',
  },
  moreLabel: {
    ...ds.typography.caption,
    color: ds.colors.primary,
    fontWeight: '800',
  },
  collapse: {
    alignSelf: 'flex-start',
  },
  collapseLabel: {
    ...ds.typography.caption,
    color: ds.colors.primary,
    fontWeight: '700',
  },
});
