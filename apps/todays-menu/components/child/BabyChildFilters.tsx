import {
  BABY_MAIN_INGREDIENT_OPTIONS,
  BABY_TEXTURE_OPTIONS,
  CHILD_ALLERGY_OPTIONS,
  childSearchCopy,
} from '../../constants/childSearchCopy';
import type {
  BabyMainIngredientFilter,
  BabySearchFilterState,
  BabyTextureFilter,
} from '../../data/recipes/childSearchFilters';
import type { StandardAllergyTag } from '../../data/recipes/recipeStandardMetadataTypes';
import { ChildBooleanFilterRow, ChildToggleFilterRow } from './ChildToggleFilterRow';

type Props = {
  filters: BabySearchFilterState;
  onChange: (next: BabySearchFilterState) => void;
};

export function BabyChildFilters({ filters, onChange }: Props) {
  const toggleMain = (id: BabyMainIngredientFilter) => {
    onChange({
      ...filters,
      mainIngredient: filters.mainIngredient === id ? null : id,
    });
  };

  const toggleTexture = (id: BabyTextureFilter) => {
    onChange({
      ...filters,
      texture: filters.texture === id ? null : id,
    });
  };

  const toggleAllergy = (id: StandardAllergyTag) => {
    onChange({
      ...filters,
      excludeAllergy: filters.excludeAllergy === id ? null : id,
    });
  };

  const toggleBatch = () => {
    onChange({ ...filters, batchFriendly: !filters.batchFriendly });
  };

  const toggleScalable = () => {
    onChange({ ...filters, scalableOnly: !filters.scalableOnly });
  };

  const batchActive = new Set<string>(
    [
      filters.batchFriendly ? 'batch' : null,
      filters.scalableOnly ? 'scalable' : null,
    ].filter(Boolean) as string[],
  );

  return (
    <>
      <ChildToggleFilterRow
        label={childSearchCopy.filterSections.mainIngredient}
        options={BABY_MAIN_INGREDIENT_OPTIONS}
        selectedId={filters.mainIngredient}
        onToggle={toggleMain}
      />
      <ChildToggleFilterRow
        label={childSearchCopy.filterSections.texture}
        options={BABY_TEXTURE_OPTIONS}
        selectedId={filters.texture}
        onToggle={toggleTexture}
      />
      <ChildBooleanFilterRow
        label={childSearchCopy.filterSections.batch}
        options={[
          { id: 'batch', label: childSearchCopy.batchFriendly },
          { id: 'scalable', label: childSearchCopy.scalableOnly },
        ]}
        activeIds={batchActive}
        onToggle={(id) => {
          if (id === 'batch') toggleBatch();
          if (id === 'scalable') toggleScalable();
        }}
      />
      <ChildToggleFilterRow
        label={childSearchCopy.filterSections.allergy}
        options={CHILD_ALLERGY_OPTIONS}
        selectedId={filters.excludeAllergy}
        onToggle={toggleAllergy}
      />
    </>
  );
}
