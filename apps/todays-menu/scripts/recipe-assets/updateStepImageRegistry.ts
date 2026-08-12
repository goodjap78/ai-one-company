import fs from 'node:fs';
import { PATHS } from './config';

/**
 * Sync on-disk step JPGs into static require() registry.
 * Sorted alphabetically. Never uses dynamic require.
 */
export function updateStepImageRegistry(keysWithFiles: string[]): {
  updated: boolean;
  path: string;
  registeredKeys: string[];
} {
  const registryPath = PATHS.stepRegistry;
  const source = fs.readFileSync(registryPath, 'utf8');

  const existing = parseRequireKeys(source, 'RECIPE_STEP_IMAGE_ASSETS');
  const nextKeys = new Set([...existing, ...keysWithFiles].sort());

  const registerable = [...nextKeys].filter((key) => {
    const filePath = `${PATHS.stepAssetsDir}/${key}.jpg`;
    return fs.existsSync(filePath);
  });

  const body =
    registerable.length === 0
      ? `{\n  // Register with static require() when files exist.\n}`
      : `{\n${registerable
          .map(
            (key) =>
              `  ${key}: require('../../assets/recipe-steps/${key}.jpg'),`,
          )
          .join('\n')}\n}`;

  const replaced = replaceConstObject(source, 'RECIPE_STEP_IMAGE_ASSETS', body);
  if (replaced === source) {
    return { updated: false, path: registryPath, registeredKeys: registerable };
  }

  fs.writeFileSync(registryPath, replaced, 'utf8');
  return { updated: true, path: registryPath, registeredKeys: registerable };
}

function parseRequireKeys(source: string, constName: string): string[] {
  const blockMatch = source.match(
    new RegExp(`export const ${constName}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`),
  );
  if (!blockMatch) return [];
  const keys: string[] = [];
  const re = /^\s*([a-z][a-z0-9_]*)\s*:\s*require\(/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(blockMatch[1]))) {
    keys.push(m[1]);
  }
  return keys;
}

function replaceConstObject(
  source: string,
  constName: string,
  newObjectLiteral: string,
): string {
  const pattern = new RegExp(
    `(export const ${constName}[^=]*=\\s*)\\{[\\s\\S]*?\\n\\};`,
  );
  if (!pattern.test(source)) {
    throw new Error(`Could not locate ${constName} object in registry file`);
  }
  return source.replace(pattern, `$1${newObjectLiteral};`);
}
