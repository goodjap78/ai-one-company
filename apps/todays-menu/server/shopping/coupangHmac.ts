/**
 * HMAC-SHA256 auth for Coupang Partners Open API.
 * Official spec: signed-date (UTC yyMMdd'T'HHmmss'Z') + METHOD + path + query.
 */
import { createHmac } from 'node:crypto';

export function formatCoupangSignedDate(date: Date): string {
  const yy = String(date.getUTCFullYear()).slice(-2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const sec = String(date.getUTCSeconds()).padStart(2, '0');
  return `${yy}${mm}${dd}T${hh}${min}${sec}Z`;
}

export function buildCoupangAuthorization(
  method: string,
  requestPathWithQuery: string,
  accessKey: string,
  secretKey: string,
  signedDate = formatCoupangSignedDate(new Date()),
): string {
  const parts = requestPathWithQuery.split('?');
  if (parts.length > 2) {
    throw new Error('incorrect_uri_format');
  }

  const path = parts[0] ?? '';
  const query = parts.length === 2 ? parts[1] ?? '' : '';
  const normalizedMethod = method.toUpperCase();
  const message = signedDate + normalizedMethod + path + query;

  const signature = createHmac('sha256', secretKey)
    .update(message, 'utf8')
    .digest('hex');

  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${signedDate}, signature=${signature}`;
}
