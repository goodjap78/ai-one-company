/**
 * Dev / EAS preview QA tools. Production must stay hidden.
 * Preview builds set EXPO_PUBLIC_QA_TOOLS=1 (see eas.json).
 */
export function isQaToolsEnvEnabled(value: string | undefined | null): boolean {
  const flag = value?.trim();
  return flag === '1' || flag === 'true';
}

export function isInternalQaEnabled(): boolean {
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  return isQaToolsEnvEnabled(process.env.EXPO_PUBLIC_QA_TOOLS);
}
