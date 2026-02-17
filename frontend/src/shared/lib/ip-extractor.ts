import type { NextRequest } from 'next/server';

/**
 * Extract real client IP from request headers
 * Handles proxies (x-forwarded-for, x-real-ip)
 */
export function getClientIp(request: NextRequest): string {
  // Priority 1: x-forwarded-for (first IP = client, rest = proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map((ip) => ip.trim());
    return normalizeIp(ips[0]); // Leftmost = client IP
  }

  // Priority 2: x-real-ip
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return normalizeIp(realIp);
  }

  // Priority 3: Connection IP (fallback)
  return 'unknown';
}

/**
 * Normalize IP address (strip IPv6 wrapper)
 */
function normalizeIp(ip: string): string {
  // Remove IPv6 wrapper: ::ffff:192.168.1.1 → 192.168.1.1
  return ip.replace(/^::ffff:/, '');
}
