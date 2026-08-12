import { rollbackTriangleKimbapMaster } from '../rollbackTriangleKimbapMaster';

const result = rollbackTriangleKimbapMaster();
if (!result.ok) {
  console.error('Rollback triangle_kimbap master failed:', result.error ?? 'unknown');
  process.exit(1);
}
