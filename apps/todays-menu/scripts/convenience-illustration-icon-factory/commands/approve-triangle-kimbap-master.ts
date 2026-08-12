import { approveTriangleKimbapV12Master } from '../approveTriangleKimbapV12Master';

const result = approveTriangleKimbapV12Master();
if (!result.ok) {
  console.error('Approve triangle_kimbap v1.2 master failed:', result.error ?? 'unknown');
  process.exit(1);
}
