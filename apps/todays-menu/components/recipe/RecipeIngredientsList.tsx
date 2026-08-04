import { LinearGradient } from 'expo-linear-gradient';
import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { getHankkiRecipeMessages } from '../../constants/HankkiMessages';
import { ds } from '../../constants/designSystem';
import {
  isFuzzyAmount,
  scaleIngredientAmount,
} from '../../services/recipes/servingScaler';
import type { RecipeIngredient, RecipeIngredientGroup } from '../../types/recipe';
import { resolveIngredientIcon } from '../../services/images/resolveIngredientIcon';
import {
  resolveIngredientGroup,
  resolveIngredientIconKey,
} from '../../utils/resolveIngredientGroup';
import { recipeRef } from './recipePremiumStyles';

type Props = {
  ingredients: RecipeIngredient[];
  baseServings: number;
  targetServings: number;
};

type IngredientCardModel = {
  name: string;
  amount: string;
  iconKey: string;
  /** Original ingredient fields for automatic icon resolution (R5-2). */
  source: RecipeIngredient;
  group: RecipeIngredientGroup;
  optional?: boolean;
};

const labels = getHankkiRecipeMessages();

const GROUP_META: Record<
  RecipeIngredientGroup,
  { title: string; icon: string }
> = {
  main: { title: labels.mainIngredientsLabel, icon: '🥩' },
  sub: { title: labels.subIngredientsLabel, icon: '🥬' },
  seasoning: { title: labels.seasoningsTitle, icon: '🧂' },
};

const ITEM_MIN_HEIGHT = 96;
const ICON_SIZE = 40;
const ITEM_GAP = 8;
/** End pad so the last chip can scroll fully into view. */
const ROW_PADDING_RIGHT = 24;
const FADE_WIDTH = 24;

function toCardModel(item: RecipeIngredient): IngredientCardModel {
  return {
    name: item.name,
    amount: item.amount,
    iconKey: resolveIngredientIconKey(item),
    source: item,
    group: resolveIngredientGroup(item),
    optional: item.optional,
  };
}

/**
 * Sprint R3-5 — slightly narrower chips so 5+ groups show a ~16–24px next-card peek.
 */
export function RecipeIngredientsList({
  ingredients,
  baseServings,
  targetServings,
}: Props) {
  const { width } = useWindowDimensions();
  const itemWidth = width < 375 ? 72 : 76;
  const isAdjusted = targetServings !== baseServings;

  const cards = ingredients.map(toCardModel);
  const groups: RecipeIngredientGroup[] = ['main', 'sub', 'seasoning'];

  const sections = groups
    .map((key) => ({
      key,
      ...GROUP_META[key],
      items: cards.filter((card) => card.group === key),
    }))
    .filter((section) => section.items.length > 0);

  if (sections.length === 0) return null;

  return (
    <View style={styles.root}>
      <Text style={styles.sectionTitle}>{labels.ingredientsTitle}</Text>

      <View style={styles.groupStack}>
        {sections.map((section) => {
          const canScroll = section.items.length >= 5;

          return (
            <View key={section.key} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupIcon}>{section.icon}</Text>
                <Text style={styles.groupTitle}>{section.title}</Text>
              </View>

              <View style={styles.rowWrap}>
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  directionalLockEnabled
                  decelerationRate="fast"
                  scrollEnabled={canScroll}
                  bounces={canScroll}
                  alwaysBounceHorizontal={canScroll}
                  overScrollMode="never"
                  style={styles.rowScroll}
                  contentContainerStyle={[
                    styles.rowContent,
                    !canScroll && styles.rowContentFit,
                  ]}
                >
                  {section.items.map((item, index) => (
                    <IngredientChip
                      key={`${section.key}-${item.iconKey}-${item.name}-${index}`}
                      item={item}
                      width={itemWidth}
                      isLast={index === section.items.length - 1}
                      baseServings={baseServings}
                      targetServings={targetServings}
                    />
                  ))}
                </ScrollView>

                {canScroll ? (
                  <LinearGradient
                    colors={['rgba(255, 248, 239, 0)', 'rgba(255, 248, 239, 0.92)']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.edgeFade}
                    pointerEvents="none"
                  />
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      {isAdjusted ? (
        <View style={styles.footnoteStack}>
          <Text style={styles.footnote}>{labels.servingAdjustHint}</Text>
          <Text style={styles.footnote}>{labels.servingStepsAdjustHint}</Text>
        </View>
      ) : null}
    </View>
  );
}

function IngredientChip({
  item,
  width,
  isLast,
  baseServings,
  targetServings,
}: {
  item: IngredientCardModel;
  width: number;
  isLast: boolean;
  baseServings: number;
  targetServings: number;
}) {
  const iconSource = resolveIngredientIcon(item.source);
  const scaled = scaleIngredientAmount(item.amount, baseServings, targetServings);
  const displayAmount = scaled.scaledAmount;
  const isScaled = scaled.status === 'scaled';
  const showFuzzyHint =
    scaled.status === 'unchanged' && isFuzzyAmount(item.amount);

  return (
    <View
      style={[
        styles.chip,
        {
          width,
          marginRight: isLast ? 0 : ITEM_GAP,
        },
      ]}
    >
      <View style={styles.iconSlot} accessibilityElementsHidden>
        {iconSource ? (
          <Image source={iconSource} style={styles.iconImage} resizeMode="contain" />
        ) : (
          <View style={styles.iconFallback} />
        )}
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {item.name}
        </Text>
        <Text
          style={[styles.amount, isScaled && styles.amountScaled]}
          numberOfLines={1}
        >
          {displayAmount}
        </Text>
        {showFuzzyHint ? (
          <Text style={styles.fuzzyHint} numberOfLines={1}>
            {labels.servingFuzzyHint}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: recipeRef.colors.textDeep,
    letterSpacing: -0.2,
  },
  groupStack: {
    gap: 14,
  },
  group: {
    gap: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 20,
  },
  groupIcon: {
    fontSize: 14,
    lineHeight: 18,
    includeFontPadding: false,
  },
  groupTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: recipeRef.colors.textDeep,
    includeFontPadding: false,
  },
  rowWrap: {
    position: 'relative',
    width: '100%',
  },
  rowScroll: {
    width: '100%',
    flexGrow: 0,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 0,
    paddingRight: ROW_PADDING_RIGHT,
    paddingBottom: 4,
  },
  /** ≤4 items: no end pad that invents empty scroll room. */
  rowContentFit: {
    paddingRight: 0,
  },
  edgeFade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 4,
    width: FADE_WIDTH,
    zIndex: 2,
  },
  chip: {
    flexShrink: 0,
    minHeight: ITEM_MIN_HEIGHT,
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: recipeRef.colors.pastelCard,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8DFD4',
    alignItems: 'center',
    gap: 4,
  },
  iconSlot: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEFE0',
  },
  iconImage: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  iconFallback: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 140, 80, 0.28)',
  },
  textBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 2,
  },
  name: {
    width: '100%',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: recipeRef.colors.textDeep,
    textAlign: 'center',
    includeFontPadding: false,
  },
  amount: {
    width: '100%',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: recipeRef.colors.textWarm,
    textAlign: 'center',
    includeFontPadding: false,
  },
  amountScaled: {
    color: ds.colors.primary,
    fontWeight: '800',
  },
  fuzzyHint: {
    width: '100%',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    color: recipeRef.colors.textMuted,
    textAlign: 'center',
  },
  footnoteStack: {
    gap: 6,
    paddingTop: 4,
  },
  footnote: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    color: recipeRef.colors.textMuted,
  },
});
