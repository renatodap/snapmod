/**
 * Rate limiting for API routes
 * Prevents abuse and excessive API costs
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets on server restart, which is fine for Edge Runtime)
const rateLimits = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}

/**
 * Check rate limit for a given identifier
 *
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60 seconds)
 * @returns RateLimitResult
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 20,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimits.get(identifier);

  // No existing entry or window expired - create new entry
  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimits.set(identifier, newEntry);

    return {
      allowed: true,
      remaining: limit - 1,
      limit,
      resetAt: newEntry.resetAt,
    };
  }

  // Existing entry - check if limit exceeded
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;

  return {
    allowed: true,
    remaining: limit - entry.count,
    limit,
    resetAt: entry.resetAt,
  };
}

/**
 * Clean up expired entries (call periodically to prevent memory leaks)
 */
export function cleanupExpiredEntries() {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimits.forEach((entry, key) => {
    if (now > entry.resetAt) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => rateLimits.delete(key));

  console.log(`[RateLimit] Cleaned up ${keysToDelete.length} expired entries`);
}

/**
 * Get identifier from request (IP address or fallback)
 */
export function getIdentifierFromRequest(request: Request): string {
  // Try to get real IP from headers (Vercel, Cloudflare, etc.)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to user agent hash (not ideal but better than nothing)
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `ua-${hashString(userAgent)}`;
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Format time until reset (for error messages)
 */
export function formatResetTime(resetAt: number): string {
  const now = Date.now();
  const diff = Math.max(0, resetAt - now);

  const seconds = Math.ceil(diff / 1000);
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}
