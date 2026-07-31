import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AI_RECOMMENDATION_SETTINGS_COPY,
  AVOIDED_FOOD_LABELS,
  AVOIDED_FOOD_OPTIONS,
  COOK_TIME_OPTIONS,
  CUISINE_OPTIONS,
  DISH_TYPE_OPTIONS,
  HOUSEHOLD_OPTIONS,
  SITUATION_OPTIONS,
  SPICY_OPTIONS,
} from '../../constants/aiRecommendationSettingsCopy';
import { NAV_BACK } from '../../constants/navigationCopy';
import { ds } from '../../constants/designSystem';
import {
  getAiRecommendationSettings,
  resetAiRecommendationSettings,
  saveAiRecommendationSettings,
} from '../../services/aiRecommendationSettings';
import { clearRecommendationSession } from '../../services/recommendationSession';
import { tokensConflict } from '../../services/recommendation/mealIntelligence/aiRecommendationIngredientMatch';
import type {
  AiRecommendationSettings,
  AvoidedFoodPreset,
  HouseholdSize,
  MaxCookTimePreference,
  PreferredCuisine,
  PreferredDishType,
  PreferredSituation,
  SpicyTolerance,
} from '../../types/aiRecommendationSettings';
import {
  addIngredientTag,
  parseIngredientTagList,
  removeIngredientTag,
  serializeIngredientTagList,
} from '../../utils/aiRecommendationIngredientTags';
import { appChrome } from '../ui/appChrome';
import { ScreenBackButton } from '../ui/ScreenBackButton';
import { ScreenLoading } from '../ui/ScreenLoading';
import { screenLayout } from '../ui/screenLayout';
import { IngredientTagEditor } from './IngredientTagEditor';

const copy = AI_RECOMMENDATION_SETTINGS_COPY;

type ChipOption<T extends string> = {
  value: T;
  label: string;
};

type ChipGroupProps<T extends string> = {
  options: ChipOption<T>[];
  selected: T | T[] | null;
  multiple?: boolean;
  onChange: (value: T) => void;
};

function ChipGroup<T extends string>({
  options,
  selected,
  multiple = false,
  onChange,
}: ChipGroupProps<T>) {
  const isSelected = (value: T) => {
    if (multiple && Array.isArray(selected)) return selected.includes(value);
    return selected === value;
  };

  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const active = isSelected(option.value);
        return (
          <Pressable
            key={option.value}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
          >
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function settingsSignature(settings: AiRecommendationSettings): string {
  return JSON.stringify({
    spicyLevel: settings.spicyLevel,
    preferredCuisines: [...settings.preferredCuisines].sort(),
    preferredDishTypes: [...settings.preferredDishTypes].sort(),
    preferredSituations: [...settings.preferredSituations].sort(),
    avoidedFoods: [...settings.avoidedFoods].sort(),
    customAvoidedFood: settings.customAvoidedFood,
    customFavoriteFood: settings.customFavoriteFood,
    householdSize: settings.householdSize,
    maxCookTime: settings.maxCookTime,
  });
}

export function AiRecommendationSettingsScreen() {
  const [savedSettings, setSavedSettings] = useState<AiRecommendationSettings | null>(null);
  const [draft, setDraft] = useState<AiRecommendationSettings | null>(null);
  const [favoriteTags, setFavoriteTags] = useState<string[]>([]);
  const [avoidedTags, setAvoidedTags] = useState<string[]>([]);
  const [favoriteDraft, setFavoriteDraft] = useState('');
  const [avoidedDraft, setAvoidedDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    const next = await getAiRecommendationSettings();
    setSavedSettings(next);
    setDraft(next);
    setFavoriteTags(parseIngredientTagList(next.customFavoriteFood));
    setAvoidedTags(parseIngredientTagList(next.customAvoidedFood));
    setFavoriteDraft('');
    setAvoidedDraft('');
    setStatusMessage(null);
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const draftWithTags = useMemo((): AiRecommendationSettings | null => {
    if (!draft) return null;
    return {
      ...draft,
      customFavoriteFood: serializeIngredientTagList(favoriteTags),
      customAvoidedFood: serializeIngredientTagList(avoidedTags),
    };
  }, [draft, favoriteTags, avoidedTags]);

  const isDirty = useMemo(() => {
    if (!savedSettings || !draftWithTags) return false;
    return settingsSignature(savedSettings) !== settingsSignature(draftWithTags);
  }, [draftWithTags, savedSettings]);

  const toggleMulti = <T extends string>(current: T[], value: T): T[] => {
    const selected = new Set(current);
    if (selected.has(value)) selected.delete(value);
    else selected.add(value);
    return [...selected];
  };

  const toggleSingle = <T extends string>(current: T | null, value: T): T | null => {
    return current === value ? null : value;
  };

  const showTagError = (reason: 'empty' | 'duplicate' | 'max') => {
    if (reason === 'empty') setStatusMessage(copy.emptyTag);
    else if (reason === 'duplicate') setStatusMessage(copy.duplicateTag);
    else setStatusMessage(copy.maxTagsReached);
  };

  const avoidedTokensForDraft = useMemo(() => {
    if (!draft) return [] as string[];
    const presetTokens = draft.avoidedFoods.map((key) => AVOIDED_FOOD_LABELS[key]);
    return [...presetTokens, ...avoidedTags];
  }, [draft, avoidedTags]);

  const handleAddFavoriteTag = () => {
    const result = addIngredientTag(favoriteTags, favoriteDraft);
    if (!result.ok) {
      showTagError(result.reason);
      return;
    }

    const newTag = result.tags[result.tags.length - 1];
    const conflictsWithAvoided = avoidedTokensForDraft.some((avoided) =>
      tokensConflict(newTag, avoided),
    );
    if (conflictsWithAvoided) {
      Alert.alert(copy.conflictTitle, copy.conflictFavoriteToAvoided);
      setStatusMessage(copy.conflictFavoriteToAvoided);
      return;
    }

    setFavoriteTags(result.tags);
    setFavoriteDraft('');
    setStatusMessage(null);
  };

  const handleAddAvoidedTag = () => {
    const result = addIngredientTag(avoidedTags, avoidedDraft);
    if (!result.ok) {
      showTagError(result.reason);
      return;
    }

    const newTag = result.tags[result.tags.length - 1];
    const favoriteConflict = favoriteTags.find((tag) => tokensConflict(tag, newTag));
    if (favoriteConflict) {
      Alert.alert(copy.conflictTitle, copy.conflictAvoidedToFavorite);
      setStatusMessage(copy.conflictAvoidedToFavorite);
      return;
    }

    setAvoidedTags(result.tags);
    setAvoidedDraft('');
    setStatusMessage(null);
  };

  const handleSave = async () => {
    if (!draftWithTags || saving || resetting) return;

    if (!isDirty) {
      setStatusMessage(copy.saveNoChanges);
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      const next = await saveAiRecommendationSettings(draftWithTags);
      setSavedSettings(next);
      setDraft(next);
      setFavoriteTags(parseIngredientTagList(next.customFavoriteFood));
      setAvoidedTags(parseIngredientTagList(next.customAvoidedFood));
      clearRecommendationSession();
      setStatusMessage(copy.saveSuccess);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setStatusMessage('저장에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const applyResetState = (next: AiRecommendationSettings) => {
    setSavedSettings(next);
    setDraft(next);
    setFavoriteTags(parseIngredientTagList(next.customFavoriteFood));
    setAvoidedTags(parseIngredientTagList(next.customAvoidedFood));
    setFavoriteDraft('');
    setAvoidedDraft('');
  };

  const handleResetConfirm = async () => {
    if (saving || resetting) return;

    setResetting(true);
    setStatusMessage(null);

    try {
      const next = await resetAiRecommendationSettings();
      applyResetState(next);
      clearRecommendationSession();
      setStatusMessage(copy.resetSuccess);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setStatusMessage(copy.resetFailure);
    } finally {
      setResetting(false);
    }
  };

  const handleResetPress = () => {
    if (saving || resetting) return;

    Alert.alert(
      copy.resetConfirmTitle,
      copy.resetConfirmBody,
      [
        {
          text: copy.resetCancel,
          style: 'cancel',
        },
        {
          text: copy.resetConfirm,
          onPress: () => void handleResetConfirm(),
        },
      ],
      { cancelable: true },
    );
  };

  if (!draft || !draftWithTags) {
    return (
      <SafeAreaView style={screenLayout.safeArea} edges={['top', 'bottom']}>
        <ScreenLoading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenLayout.safeArea} edges={['top', 'bottom']}>
      <View style={screenLayout.page}>
        <ScrollView
          contentContainerStyle={screenLayout.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={screenLayout.frame}>
            <ScreenBackButton label={NAV_BACK.myPage} fallbackHref="/(tabs)/my" />

            <View style={styles.headerBlock}>
              <Text style={screenLayout.title}>{copy.screenTitle}</Text>
              <Text style={screenLayout.subtitle}>{copy.screenSubtitle}</Text>
              <Text style={styles.optionalHint}>{copy.optionalHint}</Text>
            </View>

            <View style={appChrome.card}>
              <Text style={styles.sectionLabel}>{copy.sections.cuisine}</Text>
              <ChipGroup
                options={CUISINE_OPTIONS}
                selected={draft.preferredCuisines}
                multiple
                onChange={(value) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          preferredCuisines: toggleMulti(prev.preferredCuisines, value),
                        }
                      : prev,
                  )
                }
              />
            </View>

            <View style={appChrome.card}>
              <Text style={styles.sectionLabel}>{copy.sections.dishType}</Text>
              <ChipGroup
                options={DISH_TYPE_OPTIONS}
                selected={draft.preferredDishTypes}
                multiple
                onChange={(value) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          preferredDishTypes: toggleMulti(prev.preferredDishTypes, value),
                        }
                      : prev,
                  )
                }
              />
            </View>

            <View style={appChrome.card}>
              <Text style={styles.sectionLabel}>{copy.sections.favoriteIngredients}</Text>
              <IngredientTagEditor
                tags={favoriteTags}
                draft={favoriteDraft}
                placeholder={copy.favoritePlaceholder}
                addLabel={copy.addTag}
                onDraftChange={setFavoriteDraft}
                onAdd={handleAddFavoriteTag}
                onRemove={(tag) => setFavoriteTags((prev) => removeIngredientTag(prev, tag))}
              />
            </View>

            <View style={appChrome.card}>
              <Text style={styles.sectionLabel}>{copy.sections.avoided}</Text>
              <Text style={styles.subsectionLabel}>{copy.sections.avoidedPresets}</Text>
              <ChipGroup
                options={AVOIDED_FOOD_OPTIONS}
                selected={draft.avoidedFoods}
                multiple
                onChange={(value) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          avoidedFoods: toggleMulti(prev.avoidedFoods, value),
                        }
                      : prev,
                  )
                }
              />
              <Text style={styles.subsectionLabel}>{copy.sections.customAvoided}</Text>
              <IngredientTagEditor
                tags={avoidedTags}
                draft={avoidedDraft}
                placeholder={copy.avoidedPlaceholder}
                addLabel={copy.addTag}
                onDraftChange={setAvoidedDraft}
                onAdd={handleAddAvoidedTag}
                onRemove={(tag) => setAvoidedTags((prev) => removeIngredientTag(prev, tag))}
              />
            </View>

            <View style={appChrome.card}>
              <Text style={styles.sectionLabel}>{copy.sections.spicy}</Text>
              <ChipGroup
                options={SPICY_OPTIONS}
                selected={draft.spicyLevel}
                onChange={(value) =>
                  setDraft((prev) =>
                    prev ? { ...prev, spicyLevel: toggleSingle(prev.spicyLevel, value) } : prev,
                  )
                }
              />
            </View>

            <View style={appChrome.card}>
              <Text style={styles.sectionLabel}>{copy.sections.cookTime}</Text>
              <ChipGroup
                options={COOK_TIME_OPTIONS}
                selected={draft.maxCookTime}
                onChange={(value) =>
                  setDraft((prev) =>
                    prev ? { ...prev, maxCookTime: toggleSingle(prev.maxCookTime, value) } : prev,
                  )
                }
              />
            </View>

            <View style={appChrome.card}>
              <Text style={styles.sectionLabel}>{copy.sections.household}</Text>
              <ChipGroup
                options={HOUSEHOLD_OPTIONS}
                selected={draft.householdSize}
                onChange={(value) =>
                  setDraft((prev) =>
                    prev
                      ? { ...prev, householdSize: toggleSingle(prev.householdSize, value) }
                      : prev,
                  )
                }
              />
            </View>

            <View style={appChrome.card}>
              <Text style={styles.sectionLabel}>{copy.sections.situation}</Text>
              <ChipGroup
                options={SITUATION_OPTIONS}
                selected={draft.preferredSituations}
                multiple
                onChange={(value) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          preferredSituations: toggleMulti(prev.preferredSituations, value),
                        }
                      : prev,
                  )
                }
              />
            </View>

            {statusMessage ? (
              <Text
                style={styles.statusMessage}
                accessibilityRole="text"
                accessibilityLiveRegion="polite"
              >
                {statusMessage}
              </Text>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                appChrome.primaryButton,
                pressed && appChrome.primaryButtonPressed,
                (!isDirty || saving || resetting) && styles.actionDisabled,
              ]}
              onPress={() => void handleSave()}
              disabled={!isDirty || saving || resetting}
              accessibilityRole="button"
              accessibilityLabel={copy.saveButton}
              accessibilityState={{ disabled: !isDirty || saving || resetting }}
            >
              <Text style={appChrome.primaryButtonText}>
                {saving ? copy.saving : copy.saveButton}
              </Text>
            </Pressable>

            <View style={styles.resetSection}>
              <Text style={styles.resetHint}>{copy.resetHint}</Text>
              <Pressable
                style={({ pressed }) => [
                  appChrome.secondaryButton,
                  pressed && appChrome.pressed,
                  (saving || resetting) && styles.actionDisabled,
                ]}
                onPress={handleResetPress}
                disabled={saving || resetting}
                accessibilityRole="button"
                accessibilityLabel={copy.resetButton}
                accessibilityHint={copy.resetHint}
                accessibilityState={{ disabled: saving || resetting }}
              >
                <Text style={appChrome.secondaryButtonText}>
                  {resetting ? copy.resetting : copy.resetButton}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: ds.spacing.md,
  },
  optionalHint: {
    ...ds.typography.caption,
    color: ds.colors.textMuted,
  },
  sectionLabel: {
    ...ds.typography.sectionTitle,
    color: ds.colors.textPrimary,
  },
  subsectionLabel: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    marginTop: ds.spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing.md,
  },
  chip: {
    height: ds.sizes.chipHeight,
    paddingHorizontal: ds.spacing.md,
    borderRadius: ds.radius.chip,
    borderWidth: 1,
    borderColor: ds.colors.border,
    backgroundColor: ds.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: ds.colors.textSecondary,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: ds.colors.primary,
  },
  statusMessage: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    textAlign: 'center',
  },
  actionDisabled: {
    opacity: 0.55,
  },
  resetSection: {
    gap: ds.spacing.sm,
    marginTop: ds.spacing.md,
    alignItems: 'stretch',
  },
  resetHint: {
    ...ds.typography.caption,
    color: ds.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
