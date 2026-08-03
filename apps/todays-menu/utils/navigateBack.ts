import type { Href } from 'expo-router';

type RouterLike = {
  back: () => void;
  canGoBack: () => boolean;
  replace: (href: Href) => void;
};

export function navigateBack(router: RouterLike, fallbackHref: Href = '/') {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallbackHref);
}
