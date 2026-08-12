/**
 * Archive convenience component SVG pilot before deprecation.
 * Output: generated/archive/convenience-component-svg-pilot-deprecated/ (gitignored)
 */
import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '..');
const ARCHIVE_ROOT = path.join(
  APP_ROOT,
  'generated/archive/convenience-component-svg-pilot-deprecated',
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
      path.join(APP_ROOT, 'assets/convenience-component-icons'),
      path.join(ARCHIVE_ROOT, 'assets/convenience-component-icons'),
    )
  ) {
    entries.push('assets/convenience-component-icons');
  }

  if (
    copyDir(
      path.join(APP_ROOT, 'scripts/convenience-component-icon-factory'),
      path.join(ARCHIVE_ROOT, 'scripts/convenience-component-icon-factory'),
    )
  ) {
    entries.push('scripts/convenience-component-icon-factory');
  }

  if (
    copyDir(
      path.join(APP_ROOT, 'generated/convenience-component-icon-factory'),
      path.join(ARCHIVE_ROOT, 'generated/convenience-component-icon-factory'),
    )
  ) {
    entries.push('generated/convenience-component-icon-factory');
  }

  const files = [
    'services/images/convenienceComponentIconAssets.ts',
    'services/images/resolveConvenienceComponentIcon.ts',
    'types/convenienceComponentIcon.ts',
    'scripts/test-convenience-component-icons.ts',
  ];

  for (const rel of files) {
    const src = path.join(APP_ROOT, rel);
    const dest = path.join(ARCHIVE_ROOT, rel);
    if (copyFile(src, dest)) entries.push(rel);
  }

  fs.writeFileSync(
    path.join(ARCHIVE_ROOT, 'ARCHIVE_MANIFEST.json'),
    JSON.stringify(
      {
        reason:
          'Convenience component SVG pilot deprecated — design quality insufficient for product icons',
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
