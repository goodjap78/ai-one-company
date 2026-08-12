async function main(): Promise<void> {
  const r = await fetch('http://127.0.0.1:4730/api/shopping/coupang/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword: '대파', limit: 3 }),
  });
  const j = (await r.json()) as { products?: unknown[]; error?: string };
  console.log('status', r.status);
  console.log('productCount', Array.isArray(j.products) ? j.products.length : 0);
  console.log('error', j.error ?? null);
}

void main();
