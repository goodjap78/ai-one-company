export type HankkiMessageLocale = 'ko' | 'en';

export type HankkiMessageContext =
  | 'step_guide'
  | 'tip'
  | 'greeting'
  | 'completion'
  | 'confirmation'
  | 'celebration';

/**
 * Hankki voice line used across recipe content.
 * Keep copy warm, friendly, and non-technical.
 */
export type HankkiMessage = {
  id: string;
  locale: HankkiMessageLocale;
  context: HankkiMessageContext;
  text: string;
};

export function createHankkiMessage(
  id: string,
  text: string,
  context: HankkiMessageContext,
  locale: HankkiMessageLocale = 'ko',
): HankkiMessage {
  return { id, locale, context, text };
}
