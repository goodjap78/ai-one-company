import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CHILD_ALLERGY_OPTIONS,
  childSearchCopy,
  TODDLER_FORM_OPTIONS,
  TODDLER_MAIN_INGREDIENT_OPTIONS,
  TODDLER_TIME_OPTIONS,
} from '../../constants/childSearchCopy';
import { ds } from '../../constants/designSystem';
import type {
  ToddlerFormFilter,
  ToddlerMainIngredientFilter,
  ToddlerSearchFilterState,
} from '../../data/recipes/childSearchFilters';
import type { StandardAllergyTag } from '../../data/recipes/recipeStandardMetadataTypes';
import { ChildToggleFilterRow } from './ChildToggleFilterRow';

type Props = {
  filters: ToddlerSearchFilterState;
  onChange: (next: ToddlerSearchFilterState) => void;
};

export function ToddlerChildFilters({ filters, onChange }: Props) {
  const [showMore, setShowMore] = useState(false);

  const toggleTime = (id: string) => {
    const minutes = Number(id) as 10 | 15 | 20;
    onChange({
      ...filters,
      maxMinutes: filters.maxMinutes === minutes ? null : minutes,
    });
  };

  const toggleMain = (id: ToddlerMainIngredientFilter) => {
    onChange({
      ...filters,
      mainIngredient: filters.mainIngredient === id ? null : id,
    });
  };

  const toggleAllergy = (id: StandardAllergyTag) => {
    onChange({
      ...filters,
      excludeAllergy: filters.excludeAllergy === id ? null : id,
    });
  };

  const toggleForm = (id: ToddlerFormFilter) => {
    onChange({
      ...filters,
      form: filters.form === id ? null : id,
    });
  };

  const timeSelected = filters.maxMinutes ? String(filters.maxMinutes) : null;
  const moreCount =
    (filters.excludeAllergy ? 1 : 0) + (filters.form ? 1 : 0);

  return (
    <View style={styles.wrap}>
      <ChildToggleFilterRow
        label={childSearchCopy.filterSections.time}
        options={TODDLER_TIME_OPTIONS}
        selectedId={timeSelected}
        onToggle={toggleTime}
      />
      <ChildToggleFilterRow
        label={childSearchCopy.filterSections.mainIngredient}
        options={TODDLER_MAIN_INGREDIENT_OPTIONS}
        selectedId={filters.mainIngredient}
        onToggle={toggleMain}
      />
      <Pressable
        style={({ pressed }) => [styles.moreButton, pressed && styles.morePressed]}
        onPress={() => setShowMore((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: showMore }}
      >
        <Text style={styles.moreLabel}>
          {childSearchCopy.filterSections.more}
          {moreCount > 0 ? ` (${moreCount})` : ''}
        </Text>
      </Pressable>
      {showMore ? (
        <View style={styles.morePanel}>
          <ChildToggleFilterRow
            label={childSearchCopy.filterSections.allergy}
            options={CHILD_ALLERGY_OPTIONS}
            selectedId={filters.excludeAllergy}
            onToggle={toggleAllergy}
          />
          <ChildToggleFilterRow
            label={childSearchCopy.filterSections.form}
            options={TODDLER_FORM_OPTIONS}
            selectedId={filters.form}
            onToggle={toggleForm}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: ds.spacing.sm,
  },
  moreButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  morePressed: {
    opacity: 0.85,
  },
  moreLabel: {
    ...ds.typography.caption,
    fontWeight: '700',
    color: ds.colors.primary,
  },
  morePanel: {
    gap: ds.spacing.sm,
  },
});
