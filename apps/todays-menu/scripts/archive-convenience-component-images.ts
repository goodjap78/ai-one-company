/**
 * Archive convenience component image pipeline before deprecation.
 * Output: generated/archive/convenience-component-images-deprecated/ (gitignored)
 */
import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '..');
const ARCHIVE_ROOT = path.join(
  APP_ROOT,
  'generated/archive/convenience-component-images-deprecated',
);

function copyDir(src: string, dest: string): boolean {
  if (!fs.existsSync(src)) return false;
  fs.cpSync(src, dest, { recursive: true });
  return true;
}

function copyFile(src: string, dest: string): boolean {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}

function main(): void {
  const backedUpAt = new Date().toISOString();
  fs.mkdirSync(ARCHIVE_ROOT, { recursive: true });

  const entries: string[] = [];

  if (
    copyDir(
      path.join(APP_ROOT, 'assets/convenience-components'),
      path.join(ARCHIVE_ROOT, 'assets/convenience-components'),
    )
  ) {
    entries.push('assets/convenience-components');
  }

  if (
    copyDir(
      path.join(APP_ROOT, 'scripts/convenience-component-factory'),
      path.join(ARCHIVE_ROOT, 'scripts/convenience-component-factory'),
    )
  ) {
    entries.push('scripts/convenience-component-factory');
  }

  if (
    copyDir(
      path.join(APP_ROOT, 'generated/convenience-component-factory'),
      path.join(ARCHIVE_ROOT, 'generated/convenience-component-factory'),
    )
  ) {
    entries.push('generated/convenience-component-factory');
  }

  const serviceFiles = [
    'services/images/convenienceComponentImageAssets.ts',
    'services/images/resolveConvenienceComponentImage.ts',
    'services/images/resolveConvenienceComponentImageSource.ts',
    'services/convenience/resolveConvenienceComboItemImage.ts',
    'data/content/combos/convenienceComponentLabelColors.ts',
  ];

  for (const rel of serviceFiles) {
    const src = path.join(APP_ROOT, rel);
    const dest = path.join(ARCHIVE_ROOT, rel);
    if (copyFile(src, dest)) entries.push(rel);
  }

  fs.writeFileSync(
    path.join(ARCHIVE_ROOT, 'ARCHIVE_MANIFEST.json'),
    JSON.stringify(
      {
        reason: 'Convenience component image pipeline deprecated — text UI rollback',
        backedUpAt,
        entries,
        note: 'generated/** archive is not a git commit target',
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`Archived ${entries.length} paths → ${ARCHIVE_ROOT}`);
  for (const e of entries) console.log(`  - ${e}`);
}

main();
