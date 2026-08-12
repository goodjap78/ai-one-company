/**
 * Client-safe shopping API base URL (no secrets).
 * Set EXPO_PUBLIC_SHOPPING_API_BASE_URL in .env for device/simulator access.
 */
export function getShoppingApiBaseUrl(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_SHOPPING_API_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  return null;
}

export function isShoppingApiConfigured(): boolean {
  return getShoppingApiBaseUrl() !== null;
}
