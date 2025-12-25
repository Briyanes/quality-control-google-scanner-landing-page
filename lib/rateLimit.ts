/**
 * Rate Limiter - In-memory rate limiting for API routes
 * Note: For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

/**
 * Clean up expired entries from the rate limit map
 */
function cleanupExpiredEntries() {
  const now = Date.now()
  const entries = Array.from(rateLimitMap.entries())
  for (const [key, entry] of entries) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000)
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Object with allowed status and retry info if not allowed
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): {
  allowed: boolean
  remaining: number
  resetTime: number
} {
  const now = Date.now()

  // Get or create entry for this identifier
  let entry = rateLimitMap.get(identifier)

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired one
    entry = {
      count: 1,
      resetTime: now + windowMs
    }
    rateLimitMap.set(identifier, entry)
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: entry.resetTime
    }
  }

  // Increment counter
  entry.count++

  if (entry.count > limit) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    }
  }

  // Update entry
  rateLimitMap.set(identifier, entry)

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime
  }
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
  // Check various headers for the real IP
  const headers = request.headers

  // Try common headers (in order of preference)
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  const cfConnectingIp = headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Fallback to a default (this shouldn't happen in production)
  return 'unknown'
}

/**
 * Express/Next.js middleware helper for rate limiting
 */
export function createRateLimitMiddleware(options: {
  limit?: number
  windowMs?: number
  identifier?: (request: Request) => string
}) {
  const {
    limit = 10,
    windowMs = 60 * 1000,
    identifier = getClientIp
  } = options

  return function rateLimitMiddleware(request: Request) {
    const clientId = identifier(request)
    return checkRateLimit(clientId, limit, windowMs)
  }
}
