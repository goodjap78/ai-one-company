/**
 * Coupang Partners Dynamic Banner — user-provisioned widget only.
 * Do not invent widget IDs or tracking codes.
 */
export const COUPANG_DYNAMIC_BANNER = {
  widgetId: '1016733',
  template: 'carousel',
  trackingCode: 'AF7656335',
  width: 328,
  height: 50,
} as const;

export const COUPANG_DYNAMIC_BANNER_URL =
  `https://ads-partners.coupang.com/widgets.html?id=${COUPANG_DYNAMIC_BANNER.widgetId}` +
  `&template=${COUPANG_DYNAMIC_BANNER.template}` +
  `&trackingCode=${COUPANG_DYNAMIC_BANNER.trackingCode}` +
  `&subId=&width=${COUPANG_DYNAMIC_BANNER.width}&height=${COUPANG_DYNAMIC_BANNER.height}&tsource=`;

export const COUPANG_DYNAMIC_BANNER_WIDGET_HOST = 'ads-partners.coupang.com';
