import type { Router } from 'expo-router';
import {
  CONVENIENCE_ALL_HREF,
  CONVENIENCE_RECOMMENDATION_HREF,
  convenienceComboDetailHref,
} from '../../constants/appRoutes';
import { navigateToHome } from '../../utils/navigateToHome';

type RouterLike = Pick<Router, 'push' | 'replace'>;

export function navigateToAppHome(router: RouterLike): void {
  navigateToHome(router);
}

export function navigateToConvenienceRecommendation(router: RouterLike): void {
  router.replace(CONVENIENCE_RECOMMENDATION_HREF);
}

export function navigateToConvenienceAll(router: RouterLike): void {
  router.push(CONVENIENCE_ALL_HREF);
}

export function navigateToConvenienceDetail(
  router: RouterLike,
  comboId: string,
  options?: { replace?: boolean },
): void {
  const href = convenienceComboDetailHref(comboId);
  if (options?.replace) {
    router.replace(href);
  } else {
    router.push(href);
  }
}

export function navigateToConvenienceDetailFromDetail(router: RouterLike, comboId: string): void {
  navigateToConvenienceDetail(router, comboId, { replace: true });
}
