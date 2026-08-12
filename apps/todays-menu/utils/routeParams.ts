/** Normalize expo-router search params to a single string. */
export function parseRouteParam(
  value: string | string[] | undefined,
): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] ?? '';
  return '';
}
