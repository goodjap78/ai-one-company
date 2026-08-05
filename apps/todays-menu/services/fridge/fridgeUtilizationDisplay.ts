import { FRIDGE_RAID_COPY } from '../../constants/fridgeRaidCopy';
import type { FridgeRaidCandidate } from './fridgeRaidTypes';

export type FridgeUtilizationSection = {
  title: string;
  items: FridgeRaidCandidate[];
};

export function buildFridgeUtilizationSections(
  candidates: FridgeRaidCandidate[],
  selectedIngredientCount: number,
): FridgeUtilizationSection[] {
  if (selectedIngredientCount < 3 || candidates.length === 0) return [];

  const sections: FridgeUtilizationSection[] = [];

  const band3 = candidates.filter((item) => item.matchedSelectedCount >= 3);
  const band2 = candidates.filter((item) => item.matchedSelectedCount === 2);
  const band1 = candidates.filter((item) => item.matchedSelectedCount === 1);

  if (band3.length > 0) {
    sections.push({
      title: FRIDGE_RAID_COPY.utilizationAll(selectedIngredientCount),
      items: band3,
    });
  }
  if (band2.length > 0) {
    sections.push({
      title: FRIDGE_RAID_COPY.utilizationPartial(selectedIngredientCount, 2),
      items: band2,
    });
  }
  if (band1.length > 0) {
    sections.push({
      title: FRIDGE_RAID_COPY.utilizationSingle(selectedIngredientCount),
      items: band1,
    });
  }

  return sections;
}

export function hasMultiIngredientUtilizationGap(
  candidates: FridgeRaidCandidate[],
  selectedIngredientCount: number,
): boolean {
  if (selectedIngredientCount < 2 || candidates.length === 0) return false;
  const maxUtilization = Math.max(...candidates.map((item) => item.matchedSelectedCount));
  return maxUtilization < selectedIngredientCount;
}
