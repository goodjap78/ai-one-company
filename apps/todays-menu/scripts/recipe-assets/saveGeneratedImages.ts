import fs from 'node:fs';
import path from 'node:path';

export type SaveResult = {
  status: 'created' | 'skipped' | 'failed';
  path?: string;
  error?: string;
};

/**
 * Persist a generated image to the assets folder.
 * Never overwrites unless force=true. Never deletes.
 */
export function saveGeneratedImage(input: {
  sourcePath: string;
  destinationPath: string;
  force: boolean;
}): SaveResult {
  const { sourcePath, destinationPath, force } = input;

  try {
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });

    if (fs.existsSync(destinationPath) && !force) {
      return { status: 'skipped', path: destinationPath };
    }

    if (path.resolve(sourcePath) === path.resolve(destinationPath)) {
      // Provider wrote directly to destination
      if (!fs.existsSync(destinationPath)) {
        return {
          status: 'failed',
          error: `Expected file missing: ${destinationPath}`,
        };
      }
      return { status: 'created', path: destinationPath };
    }

    fs.copyFileSync(sourcePath, destinationPath);
    return { status: 'created', path: destinationPath };
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
