import type { Router } from 'expo-router';
import { APP_HOME_HREF } from '../constants/appRoutes';

type RouterLike = Pick<Router, 'replace'>;

/** Replace stack with the canonical home tabs — never `app/index` bootstrap. */
export function navigateToHome(router: RouterLike): void {
  router.replace(APP_HOME_HREF);
}
