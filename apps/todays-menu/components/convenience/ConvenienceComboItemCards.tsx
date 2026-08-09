import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { MOBILE_MAX_WIDTH, MOBILE_SCREEN_PADDING } from '../../constants/mobileLayout';
import { convenienceCombosCopy } from '../../constants/convenienceCombosCopy';
import { ds } from '../../constants/designSystem';
import type { ComboItem } from '../../data/content/types/convenienceCombo';
import { resolveIngredientIcon } from '../../services/images/resolveIngredientIcon';
import { resolveConvenienceIllustrationIcon } from '../../services/images/resolveConvenienceIllustrationIcon';
import {
  COMBO_ITEM_CARD_GAP,
  resolveComboItemCardWidth,
  resolveComboItemLayoutMode,
  resolveConvenienceComboItems,
  type ConvenienceComboItemUi,
} from '../../services/convenience/resolveConvenienceComboItems';

const ICON_SIZE = 52;

type Props = {
  items: ComboItem[];
};

function ComboItemCard({
  item,
  width,
  flex,
}: {
  item: ConvenienceComboItemUi;
  width?: number;
  flex?: boolean;
}) {
  const illustrationSource = item.illustrationIconKey
    ? resolveConvenienceIllustrationIcon(item.illustrationIconKey)
    : null;
  const ingredientSource =
    !illustrationSource && item.iconKey
      ? resolveIngredientIcon({ iconKey: item.iconKey })
      : null;
  const imageSource = illustrationSource ?? ingredientSource;

  return (
    <View
      style={[
        styles.chip,
        width != null ? { width } : undefined,
        flex ? styles.chipFlex : undefined,
      ]}
    >
      {imageSource ? (
        <View style={styles.iconFrame}>
          <Image
            source={imageSource}
            style={styles.iconImage}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>
      ) : null}
      <Text style={styles.chipLabel} numberOfLines={2} ellipsizeMode="tail">
        {item.label}
      </Text>
      {item.quantity ? (
        <Text style={styles.chipQuantity} numberOfLines={1} ellipsizeMode="tail">
          {item.quantity}
        </Text>
      ) : null}
      {item.optional ? (
        <View style={styles.optionalBadge}>
          <Text style={styles.optionalBadgeText}>
            {convenienceCombosCopy.optionalItemBadge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function ConvenienceComboItemCards({ items }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const resolved = resolveConvenienceComboItems(items);
  if (resolved.length === 0) return null;

  const contentWidth =
    Math.min(windowWidth, MOBILE_MAX_WIDTH) - MOBILE_SCREEN_PADDING * 2;
  const layoutMode = resolveComboItemLayoutMode(resolved.length);
  const cardWidth = resolveComboItemCardWidth(
    resolved.length,
    contentWidth,
    layoutMode,
  );

  const renderItem = (item: ConvenienceComboItemUi, index: number) => (
    <View key={`${item.label}-${index}`} style={styles.rowItem}>
      {index > 0 ? <Text style={styles.plusSign}>+</Text> : null}
      <ComboItemCard
        item={item}
        width={layoutMode === 'wrap' ? undefined : cardWidth}
        flex={layoutMode === 'wrap'}
      />
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        layoutMode === 'wrap' ? styles.wrapContainer : styles.rowContainer,
      ]}
    >
      {resolved.map((item, index) => renderItem(item, index))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: COMBO_ITEM_CARD_GAP,
  },
  wrapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: COMBO_ITEM_CARD_GAP,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 4,
  },
  plusSign: {
    width: 14,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: ds.colors.textMuted,
  },
  chip: {
    backgroundColor: ds.colors.primarySoft,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    position: 'relative',
  },
  chipFlex: {
    minWidth: 108,
    maxWidth: 160,
    flexGrow: 1,
  },
  iconFrame: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 12,
    backgroundColor: ds.colors.convenienceComponentIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  iconImage: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  chipLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: '#3A2417',
    textAlign: 'center',
  },
  chipQuantity: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: ds.colors.textSecondary,
    textAlign: 'center',
  },
  optionalBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFF6EE',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ds.colors.borderLight,
  },
  optionalBadgeText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: ds.colors.primaryDark,
  },
});
