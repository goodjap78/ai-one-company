import type { PipelineArgs } from './types';

export function parsePipelineArgs(argv: string[]): PipelineArgs {
  let dryRun = false;
  let since: string | null = null;
  let ids: string[] | null = null;
  let fullCatalog = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--full-catalog') {
      fullCatalog = true;
      continue;
    }
    if (arg === '--since' && argv[i + 1]) {
      since = argv[++i]!;
      continue;
    }
    if (arg === '--ids' && argv[i + 1]) {
      ids = argv[++i]!
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      continue;
    }
    if (arg.startsWith('--since=')) {
      since = arg.slice('--since='.length);
      continue;
    }
    if (arg.startsWith('--ids=')) {
      ids = arg
        .slice('--ids='.length)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  return { dryRun, since, ids, fullCatalog };
}
