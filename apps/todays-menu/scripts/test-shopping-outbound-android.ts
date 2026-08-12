/**
 * Sprint 64 — Android outbound Linking behavior QA (no secrets / no full URLs).
 * Run: npx tsx scripts/test-shopping-outbound-android.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '..');
let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error(`❌ ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ ${msg}`);
}

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(APP_ROOT, rel), 'utf8');
}

console.log('Sprint 64 shopping outbound Android QA — start\n');

run('openShoppingProduct skips canOpenURL gate for https', () => {
  const src = read('services/shopping/openShoppingProduct.ts');
  assert(src.includes('isHttpOrHttpsUrl'), 'https detector present');
  assert(src.includes('canAttemptOpen'), 'canAttemptOpen helper');
  assert(src.includes("await Linking.openURL(url)"), 'still calls openURL');
  // Must not hard-block all opens on canOpenURL alone for https
  assert(
    /if \(isHttpOrHttpsUrl\(url\)\) return true/.test(src) ||
      /if \(isHttpOrHttpsUrl\(url\)\) \{\s*return true/.test(src),
    'https returns true without canOpenURL',
  );
  assert(!src.includes('COUPANG_PARTNERS'), 'no partners env in outbound');
  assert(!src.includes('console.log(url)'), 'does not log raw url');
});

run('Product card remains Pressable and wires onPress', () => {
  const card = read('components/shopping/ShoppingProductCard.tsx');
  const results = read('components/shopping/ShoppingProductResults.tsx');
  assert(card.includes('Pressable'), 'Pressable card');
  assert(card.includes('onPress={handlePress}'), 'handlePress wired');
  assert(results.includes('openShoppingProduct'), 'results call openShoppingProduct');
  assert(results.includes('onOpen={(item) =>'), 'onOpen handler');
});

run('Affiliate-first resolve unchanged', () => {
  const src = read('services/shopping/resolveOutboundProductUrl.ts');
  assert(src.includes('affiliate'), 'affiliate preferred');
  assert(src.includes('affiliateOnly'), 'affiliateOnly policy kept');
});

run('Ingredients CTA is compact button not underline link', () => {
  const src = read('components/shopping/IngredientsShoppingCta.tsx');
  assert(src.includes('ds.colors.primary'), 'primary accent');
  assert(src.includes("color: '#FFFFFF'"), 'white text on orange');
  assert(!src.includes("textDecorationLine: 'underline'"), 'not underline-only');
  assert(src.includes("router.push(`/shopping/${recipeId}`)"), 'same shopping route');
});

run('Shopping hero is compact thumb not full-bleed hero', () => {
  const src = read('components/shopping/ShoppingScreen.tsx');
  assert(src.includes('heroThumb'), 'compact thumb style');
  assert(src.includes("variant=\"thumb\""), 'thumb variant');
  assert(!src.includes('aspectRatio: 2.2'), 'old large aspect removed');
  assert(src.includes('disclosure'), 'disclosure still present');
});

run('Coming soon cards use full-card + peek sizing', () => {
  const src = read('components/home/HomeComingSoonSection.tsx');
  assert(src.includes('FULL_VISIBLE_CARDS'), 'full visible cards');
  assert(src.includes('PEEK_PX'), 'peek px');
  assert(!src.includes('PEEK_VISIBLE_CARDS = 3.5'), 'aggressive 3.5 peek removed');
  assert(!src.includes("card.id === 'kids' ? baseCardWidth - 8"), 'kids width hack removed');
});

console.log('\nSprint 64 shopping outbound Android QA — done');
if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nPASS — shopping outbound android');
