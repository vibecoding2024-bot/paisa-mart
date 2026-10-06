import { timingSafeEqual, createHmac } from 'node:crypto';

// Verify the customer token already issued by the OTP routes; never trust a supplied phone.
export function customerPhone(authorization?: string): string | null {
  try {
    const secret = process.env.AUTH_TOKEN_SECRET;
    const token = authorization?.match(/^Bearer ([^ ]+)$/i)?.[1];
    if (!secret || !token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts as [string, string, string];
    if (JSON.parse(Buffer.from(header, 'base64url').toString()).alg !== 'HS256') return null;
    const expected = createHmac('sha256', secret).update(header + '.' + payload).digest('base64url');
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof claims.exp !== 'number' || claims.exp <= Date.now() / 1000 || claims.role === 'admin') return null;
    return typeof claims.sub === 'string' && /^\+91[6-9]\d{9}$/.test(claims.sub) ? claims.sub.slice(3) : null;
  } catch { return null; }
}
