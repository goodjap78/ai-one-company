import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FRIDGE_POPULAR_CHIPS,
  FRIDGE_RAID_COPY,
} from '../../constants/fridgeRaidCopy';
import { NAV_BACK } from '../../constants/navigationCopy';
import { ds } from '../../constants/designSystem';
import {
  FRIDGE_CHIP_GAP,
  FRIDGE_CHIP_MIN_HEIGHT,
  resolveFridgeChipItemWidth,
} from '../../constants/fridgeRaidChipLayout';
import { getPantry, removePantryIngredient, registerPantryIngredient, clearPantry } from '../../services/pantry/pantryService';
import {
  resolvePantryItemMatchKey,
  resolveFridgeIngredientInput,
} from '../../services/fridge/fridgeIngredientMatch';
import type { PantryItem } from '../../types/pantry';
import { IngredientTagEditor } from '../my/IngredientTagEditor';
import { appChrome } from '../ui/appChrome';
import { ScreenBackButton } from '../ui/ScreenBackButton';
import { ScreenLoading } from '../ui/ScreenLoading';
import { screenLayout } from '../ui/screenLayout';

const MAX_SELECTION = 40;

export function FridgeRaidScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const chipWidth = useMemo(
    () => resolveFridgeChipItemWidth(windowWidth, FRIDGE_CHIP_GAP),
    [windowWidth],
  );
  const [items, setItems] = useState<PantryItem[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  const loadPantry = useCallback(async () => {
    const pantry = await getPantry();
    setItems(pantry.items);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPantry();
  }, [loadPantry]);

  const ownedMatchKeys = useMemo(
    () => new Set(items.map((item) => resolvePantryItemMatchKey(item.iconKey, item.name))),
    [items],
  );

  const handleToggleChip = async (label: string, iconKey: string) => {
    const matchKey = resolvePantryItemMatchKey(iconKey, label);
    const existing = items.find(
      (item) => resolvePantryItemMatchKey(item.iconKey, item.name) === matchKey,
    );

    if (existing) {
      await removePantryIngredient(existing.id);
    } else {
      if (items.length >= MAX_SELECTION) {
        Alert.alert(FRIDGE_RAID_COPY.maxReached);
        return;
      }
      await registerPantryIngredient({ name: label, iconKey });
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadPantry();
  };

  const handleAddCustom = async () => {
    const resolved = resolveFridgeIngredientInput(draft);
    if (!resolved) {
      Alert.alert(FRIDGE_RAID_COPY.customFail);
      return;
    }

    if (ownedMatchKeys.has(resolved.matchKey)) {
      setDraft('');
      return;
    }

    if (items.length >= MAX_SELECTION) {
      Alert.alert(FRIDGE_RAID_COPY.maxReached);
      return;
    }

    await registerPantryIngredient({ name: resolved.name, iconKey: resolved.iconKey });
    setDraft('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadPantry();
  };

  const handleRemoveTag = async (name: string) => {
    const target = items.find((item) => item.name === name);
    if (!target) return;
    await removePantryIngredient(target.id);
    await loadPantry();
  };

  const handleClearAll = async () => {
    await clearPantry();
    await loadPantry();
  };

  const handleRecommend = () => {
    if (navigating) return;
    setNavigating(true);
    router.push('/fridge-raid/results');
  };

  const tagLabels = items.map((item) => item.name);

  if (loading) {
    return <ScreenLoading />;
  }

  return (
    <SafeAreaView style={screenLayout.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.flex}>
          <ScrollView
            contentContainerStyle={[screenLayout.scrollContent, styles.scrollContent]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={screenLayout.frame}>
              <ScreenBackButton label={NAV_BACK.home} fallbackHref="/" />

              <View style={styles.header}>
                <Text style={screenLayout.title} accessibilityRole="header">
                  {FRIDGE_RAID_COPY.screenTitle}
                </Text>
                <Text style={screenLayout.subtitle}>{FRIDGE_RAID_COPY.screenDescription}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{FRIDGE_RAID_COPY.popularTitle}</Text>
                <View style={[styles.chipRow, { gap: FRIDGE_CHIP_GAP }]}>
                  {FRIDGE_POPULAR_CHIPS.map((chip) => {
                    const matchKey = resolvePantryItemMatchKey(chip.iconKey, chip.label);
                    const active = ownedMatchKeys.has(matchKey);
                    return (
                      <Pressable
                        key={`${chip.label}_${chip.iconKey}`}
                        style={({ pressed }) => [
                          styles.chip,
                          {
                            width: chipWidth,
                            height: FRIDGE_CHIP_MIN_HEIGHT,
                          },
                          active && styles.chipActive,
                          pressed && styles.chipPressed,
                        ]}
                        onPress={() => handleToggleChip(chip.label, chip.iconKey)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={chip.label}
                      >
                        <Text
                          style={[styles.chipLabel, active && styles.chipLabelActive]}
                          numberOfLines={2}
                          adjustsFontSizeToFit
                          minimumFontScale={0.8}
                        >
                          {chip.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <IngredientTagEditor
                  tags={tagLabels}
                  draft={draft}
                  placeholder={FRIDGE_RAID_COPY.customPlaceholder}
                  addLabel={FRIDGE_RAID_COPY.customAdd}
                  onDraftChange={setDraft}
                  onAdd={() => void handleAddCustom()}
                  onRemove={(tag) => void handleRemoveTag(tag)}
                  editable={!loading}
                />
              </View>

              <View style={styles.selectedHeader}>
                <Text style={styles.sectionTitle}>
                  {FRIDGE_RAID_COPY.selectedTitle} · {FRIDGE_RAID_COPY.selectedCount(items.length)}
                </Text>
                {items.length > 0 ? (
                  <Pressable
                    onPress={() => void handleClearAll()}
                    accessibilityRole="button"
                    accessibilityLabel={FRIDGE_RAID_COPY.clearAll}
                  >
                    <Text style={styles.clearLabel}>{FRIDGE_RAID_COPY.clearAll}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </ScrollView>

          <View style={screenLayout.footer}>
            <Pressable
              style={({ pressed }) => [
                screenLayout.primaryButton,
                (pressed || navigating) && screenLayout.pressedPrimary,
                navigating && styles.buttonDisabled,
              ]}
              onPress={handleRecommend}
              disabled={navigating}
              accessibilityRole="button"
              accessibilityLabel={FRIDGE_RAID_COPY.recommendCta}
              accessibilityState={{ disabled: navigating }}
            >
              <Text style={screenLayout.primaryText}>{FRIDGE_RAID_COPY.recommendCta}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: ds.spacing.xl,
  },
  header: {
    gap: ds.spacing.sm,
  },
  section: {
    gap: ds.spacing.md,
  },
  sectionTitle: {
    ...ds.typography.sectionTitle,
    fontSize: 18,
    lineHeight: 24,
    color: ds.colors.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    borderRadius: ds.radius.chip,
    borderWidth: 1,
    borderColor: ds.colors.border,
    backgroundColor: ds.colors.card,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    borderColor: ds.colors.primary,
    backgroundColor: ds.colors.primarySoft,
  },
  chipPressed: {
    opacity: 0.92,
  },
  chipLabel: {
    ...ds.typography.caption,
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
    color: ds.colors.textPrimary,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: ds.colors.primary,
    fontWeight: '700',
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ds.spacing.sm,
  },
  clearLabel: {
    ...ds.typography.caption,
    color: ds.colors.primary,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
