/**
 * Sprint IMG-3 — recipe ID range helpers (numeric padded IDs like 001).
 */

export function parseRecipeIdNum(id: string): number | null {
  const trimmed = id.trim();
  const prefixed = trimmed.match(/^recipe_(\d+)$/i);
  const numStr = prefixed ? prefixed[1] : trimmed;
  if (!/^\d{1,4}$/.test(numStr)) return null;
  return Number(numStr);
}

export function formatRecipeId(n: number): string {
  return String(n).padStart(3, '0');
}

export function expandRecipeIdRange(fromId: string, toId: string): string[] {
  const from = parseRecipeIdNum(fromId);
  const to = parseRecipeIdNum(toId);
  if (from == null || to == null) {
    throw new Error(`Invalid recipe range: --from=${fromId} --to=${toId}`);
  }
  if (from > to) {
    throw new Error(`Invalid recipe range: from (${fromId}) > to (${toId})`);
  }
  const ids: string[] = [];
  for (let n = from; n <= to; n++) ids.push(formatRecipeId(n));
  return ids;
}

export function inRecipeIdRange(
  recipeId: string,
  fromId?: string,
  toId?: string,
): boolean {
  if (!fromId && !toId) return true;
  const n = parseRecipeIdNum(recipeId);
  if (n == null) return false;
  const from = fromId ? parseRecipeIdNum(fromId) : null;
  const to = toId ? parseRecipeIdNum(toId) : null;
  if (from != null && n < from) return false;
  if (to != null && n > to) return false;
  return true;
}

/** Chunk array into batches of `size`. */
export function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

/**
 * Run async work with limited concurrency. Failures are isolated per item.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const limit = Math.max(1, concurrency);

  async function runWorker(): Promise<void> {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runWorker()));
  return results;
}
