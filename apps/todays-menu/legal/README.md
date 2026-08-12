# HANKKI Legal Pages (TestFlight)

Static privacy policy and terms for App Store / in-app settings links.

## Deploy (Vercel)

```bash
cd apps/todays-menu/legal
npx vercel deploy --prod --yes --name hankki-legal
```

After deploy, update `constants/legalUrls.ts` if the production URL differs from:

- `https://hankki-legal.vercel.app/hankki/privacy`
- `https://hankki-legal.vercel.app/hankki/terms`

## Verify

```bash
npm run smoke:rc
```
