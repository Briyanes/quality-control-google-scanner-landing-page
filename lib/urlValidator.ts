/**
 * URL Validator - Prevents SSRF and other URL-based attacks
 */

import { fetchWithHeadFallback } from './fetchUtils'
import { AccessibilityResult } from './types'

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate URL to prevent SSRF attacks
 */
export function validateUrl(url: string): ValidationResult {
  // Basic format validation
  try {
    new URL(url)
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format'
    }
  }

  const parsedUrl = new URL(url)

  // Protocol validation - only allow http and https
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return {
      valid: false,
      error: 'Only HTTP and HTTPS protocols are allowed'
    }
  }

  // Block private/local IP addresses
  const hostname = parsedUrl.hostname.toLowerCase()

  // Block localhost and local variants
  const localPatterns = [
    'localhost',
    '127.',
    '0.0.0.0',
    '::1',
    '[::1]',
    '0:0:0:0:0:0:0:1'
  ]

  if (localPatterns.some(pattern => hostname.includes(pattern))) {
    return {
      valid: false,
      error: 'Local addresses are not allowed'
    }
  }

  // Block private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
  const privateIpPattern = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/
  if (privateIpPattern.test(hostname)) {
    return {
      valid: false,
      error: 'Private IP addresses are not allowed'
    }
  }

  // Block internal network ranges
  const internalPatterns = [
    /^169\.254\./, // Link-local
    /^192\.0\.0\./, // IETF Protocol Assignments
    /^192\.0\.2\./, // TEST-NET-1
    /^198\.51\.100\./, // TEST-NET-2
    /^203\.0\.113\./, // TEST-NET-3
    /^224\.0\.0\./, // Multicast
    /^240\.0\.0\./, // Reserved
    /^255\.255\.255\./ // Broadcast
  ]

  if (internalPatterns.some(pattern => pattern.test(hostname))) {
    return {
      valid: false,
      error: 'Internal network addresses are not allowed'
    }
  }

  // Block metadata endpoints (AWS, GCP, Azure)
  const metadataPatterns = [
    'metadata',
    '169.254.169.254',
    'metadata.google.internal',
    'instance-data'
  ]

  if (metadataPatterns.some(pattern => hostname.includes(pattern))) {
    return {
      valid: false,
      error: 'Metadata endpoints are not allowed'
    }
  }

  // URL length limit (prevent DoS with extremely long URLs)
  if (url.length > 2048) {
    return {
      valid: false,
      error: 'URL is too long (max 2048 characters)'
    }
  }

  // Block suspicious TLDs if needed
  const suspiciousTLDs = ['.onion', '.i2p', '.bit']
  if (suspiciousTLDs.some(tld => hostname.endsWith(tld))) {
    return {
      valid: false,
      error: 'This TLD is not allowed'
    }
  }

  return {
    valid: true
  }
}

/**
 * Sanitize URL for display
 */
export function sanitizeUrl(url: string): string {
  const parsed = new URL(url)
  // Remove credentials and fragments
  return `${parsed.protocol}//${parsed.host}${parsed.pathname}${parsed.search}`
}

/**
 * Check if URL is accessible (with timeout and HEAD→GET fallback)
 * Returns detailed accessibility result with error classification
 * Enhanced: recognizes Cloudflare blocks and passes them through for
 * the main scanner to handle with more aggressive retry strategies
 */
export async function checkUrlAccessible(url: string, timeout: number = 15000): Promise<AccessibilityResult> {
  const result = await fetchWithHeadFallback(url, {
    timeout,
    redirect: 'manual'
  })

  // Accept 2xx and 3xx responses (including redirects)
  const accessible = result.success || (result.status !== undefined && result.status >= 200 && result.status < 400)

  // Cloudflare-specific: propagate the cloudflare_blocked error type
  // so the API route can decide to still attempt a full scan
  const errorType = result.errorType === 'cloudflare_blocked'
    ? 'cloudflare_blocked'
    : result.errorType

  return {
    accessible,
    errorType,
    errorDetails: result.errorDetails,
    statusCode: result.status,
    attempts: result.attempts,
    finalUrl: result.finalUrl
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use checkUrlAccessible() instead for detailed error information
 */
export async function checkUrlAccessibleLegacy(url: string, timeout: number = 10000): Promise<boolean> {
  const result = await checkUrlAccessible(url, timeout)
  return result.accessible
}
