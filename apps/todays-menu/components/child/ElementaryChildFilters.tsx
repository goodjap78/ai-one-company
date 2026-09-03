import {
  childSearchCopy,
  ELEMENTARY_FORM_OPTIONS,
  ELEMENTARY_MAIN_INGREDIENT_OPTIONS,
  ELEMENTARY_MEAL_SLOT_OPTIONS,
  ELEMENTARY_TIME_OPTIONS,
} from '../../constants/childSearchCopy';
import type {
  ElementaryFormFilter,
  ElementaryMainIngredientFilter,
  ElementaryMealSlotFilter,
  ElementarySearchFilterState,
} from '../../data/recipes/childSearchFilters';
import { ChildToggleFilterRow } from './ChildToggleFilterRow';

type Props = {
  filters: ElementarySearchFilterState;
  onChange: (next: ElementarySearchFilterState) => void;
};

export function ElementaryChildFilters({ filters, onChange }: Props) {
  const toggleMealSlot = (id: ElementaryMealSlotFilter) => {
    onChange({
      ...filters,
      mealSlot: filters.mealSlot === id ? null : id,
    });
  };

  const toggleTime = (id: string) => {
    const minutes = Number(id) as 10 | 15 | 20;
    onChange({
      ...filters,
      maxMinutes: filters.maxMinutes === minutes ? null : minutes,
    });
  };

  const toggleMain = (id: ElementaryMainIngredientFilter) => {
    onChange({
      ...filters,
      mainIngredient: filters.mainIngredient === id ? null : id,
    });
  };

  const toggleForm = (id: ElementaryFormFilter) => {
    onChange({
      ...filters,
      form: filters.form === id ? null : id,
    });
  };

  const timeSelected = filters.maxMinutes ? String(filters.maxMinutes) : null;

  return (
    <>
      <ChildToggleFilterRow
        label={childSearchCopy.filterSections.mealSlot}
        options={ELEMENTARY_MEAL_SLOT_OPTIONS}
        selectedId={filters.mealSlot}
        onToggle={toggleMealSlot}
      />
      <ChildToggleFilterRow
        label={childSearchCopy.filterSections.time}
        options={ELEMENTARY_TIME_OPTIONS}
        selectedId={timeSelected}
        onToggle={toggleTime}
      />
      <ChildToggleFilterRow
        label={childSearchCopy.filterSections.mainIngredient}
        options={ELEMENTARY_MAIN_INGREDIENT_OPTIONS}
        selectedId={filters.mainIngredient}
        onToggle={toggleMain}
      />
      <ChildToggleFilterRow
        label={childSearchCopy.filterSections.form}
        options={ELEMENTARY_FORM_OPTIONS}
        selectedId={filters.form}
        onToggle={toggleForm}
      />
    </>
  );
}
