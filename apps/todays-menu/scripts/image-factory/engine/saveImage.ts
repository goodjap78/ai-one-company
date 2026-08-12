/**
 * Save generated image bytes — never overwrite unless force=true.
 */
import fs from 'node:fs';
import path from 'node:path';

export type SaveImageResult =
  | { status: 'written'; absolutePath: string }
  | { status: 'skipped_exists'; absolutePath: string }
  | { status: 'error'; error: string };

export function saveImageFile(input: {
  bytes: Buffer;
  absolutePath: string;
  force?: boolean;
}): SaveImageResult {
  const dir = path.dirname(input.absolutePath);
  fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(input.absolutePath) && !input.force) {
    return { status: 'skipped_exists', absolutePath: input.absolutePath };
  }

  try {
    fs.writeFileSync(input.absolutePath, input.bytes);
    return { status: 'written', absolutePath: input.absolutePath };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
