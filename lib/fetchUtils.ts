/**
 * Fetch Utilities with Timeout, Retry, and Error Classification
 * Designed to handle problematic URLs (BERDU hosting, slow servers, bot detection)
 * Enhanced with Cloudflare bypass and User-Agent rotation
 */

export interface FetchConfig {
  timeout?: number        // Default: 30000ms (30 seconds)
  maxRetries?: number     // Default: 3 retries
  retryDelay?: number     // Default: 1000ms (1 second)
  method?: 'GET' | 'HEAD' // Default: GET
  redirect?: 'manual' | 'follow' // Default: follow
  attempt?: number        // Current attempt number (for header rotation)
}

export interface FetchResult {
  success: boolean
  status?: number
  errorType?: 'timeout' | 'connection' | 'ssl' | 'blocked' | 'not_found' | 'server_error' | 'cloudflare_blocked' | 'unknown'
  errorDetails?: string
  data?: string
  headers?: Record<string, string>
  attempts: number
  finalUrl?: string
  isCloudflare?: boolean
}

/**
 * Pool of realistic User-Agent strings to rotate on retries
 * Mimics different real browsers to avoid fingerprint blocking
 */
const USER_AGENT_POOL = [
  // Chrome 122 on Windows 11
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  // Chrome 122 on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  // Firefox 123 on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  // Safari 17 on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  // Edge 122 on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
  // Chrome 121 on Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
]

/**
 * Get headers for a specific attempt, rotating User-Agent on each retry
 */
function getHeadersForAttempt(attempt: number = 0): Record<string, string> {
  const userAgent = USER_AGENT_POOL[attempt % USER_AGENT_POOL.length]
  const isFirefox = userAgent.includes('Firefox')
  const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome')

  const headers: Record<string, string> = {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0'
  }

  // Add Sec-Fetch headers (Chrome/Edge only, not Firefox/Safari)
  if (!isFirefox && !isSafari) {
    headers['Sec-Fetch-Dest'] = 'document'
    headers['Sec-Fetch-Mode'] = 'navigate'
    headers['Sec-Fetch-Site'] = 'none'
    headers['Sec-Fetch-User'] = '?1'
    headers['Sec-Ch-Ua'] = '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"'
    headers['Sec-Ch-Ua-Mobile'] = '?0'
    headers['Sec-Ch-Ua-Platform'] = '"Windows"'
  }

  return headers
}

/**
 * Detect if a response is from Cloudflare
 */
export function isCloudflareResponse(headers?: Record<string, string>): boolean {
  if (!headers) return false
  const server = (headers['server'] || headers['Server'] || '').toLowerCase()
  return server.includes('cloudflare') ||
    !!(headers['cf-ray'] || headers['CF-RAY']) ||
    !!(headers['cf-cache-status'] || headers['CF-Cache-Status'])
}

/**
 * Detect if HTML content is a Cloudflare challenge/block page
 */
export function isCloudflareChallengePage(html: string): boolean {
  const patterns = [
    /Attention Required.*Cloudflare/is,
    /cf-browser-verification/i,
    /cf-challenge-running/i,
    /Just a moment.*Enable JavaScript/is,
    /<title>Just a moment\.\.\.<\/title>/i,
    /challenges\.cloudflare\.com/i,
    /Checking if the site connection is secure/i,
    /cdn-cgi\/challenge-platform/i,
    /Verifying you are human/i,
    /ray ID/i,
  ]
  return patterns.some(p => p.test(html))
}

// Keep backward compatibility
const DEFAULT_HEADERS = getHeadersForAttempt(0)

/**
 * Classify fetch errors into specific types
 */
function classifyError(error: Error, statusCode?: number): FetchResult['errorType'] {
  const errorMessage = error.message.toLowerCase()
  const errorName = error.name.toLowerCase()

  // Timeout errors
  if (errorName.includes('abort') || errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
    return 'timeout'
  }

  // SSL/TLS certificate errors
  if (errorMessage.includes('certificate') || errorMessage.includes('ssl') || errorMessage.includes('tls')) {
    return 'ssl'
  }

  // Connection errors
  if (errorMessage.includes('econnrefused') ||
      errorMessage.includes('enotfound') ||
      errorMessage.includes('etimedout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('fetch failed')) {
    return 'connection'
  }

  // HTTP status codes
  if (statusCode) {
    if (statusCode === 404) return 'not_found'
    if (statusCode === 403 || statusCode === 429) return 'blocked'
    if (statusCode >= 500) return 'server_error'
  }

  return 'unknown'
}

/**
 * Fetch with timeout support
 */
export async function fetchWithTimeout(
  url: string,
  config: FetchConfig = {}
): Promise<FetchResult> {
  const timeout = config.timeout || 30000
  const method = config.method || 'GET'
  const redirect = config.redirect || 'follow'
  const attempt = config.attempt || 0

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const startTime = Date.now()
  const headers = getHeadersForAttempt(attempt)

  try {
    console.log('[Fetch]', {
      url,
      method,
      timeout: `${timeout}ms`,
      attempt,
      userAgent: headers['User-Agent']?.substring(0, 50) + '...'
    })

    const response = await fetch(url, {
      method,
      headers,
      signal: controller.signal,
      redirect: redirect
    })

    clearTimeout(timeoutId)

    const duration = Date.now() - startTime
    console.log('[Fetch Success]', {
      url,
      status: response.status,
      duration: `${duration}ms`
    })

    // Get response headers
    const respHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      respHeaders[key] = value
    })

    // Detect Cloudflare
    const cfDetected = isCloudflareResponse(respHeaders)

    // Get response data
    const data = method === 'HEAD' ? undefined : await response.text()

    // Check if Cloudflare is blocking us (403 from Cloudflare)
    if (cfDetected && !response.ok && (response.status === 403 || response.status === 503)) {
      console.warn('[Fetch Cloudflare Blocked]', {
        url,
        status: response.status,
        cfRay: respHeaders['cf-ray'] || respHeaders['CF-RAY'],
        duration: `${duration}ms`
      })
      return {
        success: false,
        status: response.status,
        errorType: 'cloudflare_blocked',
        errorDetails: `Cloudflare returned ${response.status}: ${response.statusText}`,
        data,
        headers: respHeaders,
        attempts: 1,
        finalUrl: response.url,
        isCloudflare: true
      }
    }

    // Check if response is a Cloudflare challenge page (200 but with challenge content)
    if (cfDetected && data && isCloudflareChallengePage(data)) {
      console.warn('[Fetch Cloudflare Challenge]', {
        url,
        status: response.status,
        duration: `${duration}ms`
      })
      return {
        success: false,
        status: response.status,
        errorType: 'cloudflare_blocked',
        errorDetails: 'Cloudflare challenge page detected instead of actual content',
        data: undefined, // Don't return challenge page as content
        headers: respHeaders,
        attempts: 1,
        finalUrl: response.url,
        isCloudflare: true
      }
    }

    return {
      success: response.ok,
      status: response.status,
      errorType: response.ok ? undefined : classifyError(new Error(response.statusText), response.status),
      errorDetails: response.ok ? undefined : response.statusText,
      data,
      headers: respHeaders,
      attempts: 1,
      finalUrl: response.url,
      isCloudflare: cfDetected
    }

  } catch (error: any) {
    clearTimeout(timeoutId)

    const duration = Date.now() - startTime
    const errorType = classifyError(error)

    console.error('[Fetch Error]', {
      url,
      errorType,
      errorMessage: error.message,
      duration: `${duration}ms`
    })

    return {
      success: false,
      errorType,
      errorDetails: error.message,
      attempts: 1
    }
  }
}

/**
 * Fetch with retry logic and exponential backoff
 * Enhanced: rotates User-Agent on each retry to bypass bot detection
 * Enhanced: retries on Cloudflare blocks with different browser fingerprints
 */
export async function fetchWithRetry(
  url: string,
  config: FetchConfig = {}
): Promise<FetchResult> {
  const maxRetries = config.maxRetries !== undefined ? config.maxRetries : 3
  const initialDelay = config.retryDelay || 1000
  const timeout = config.timeout || 30000

  let lastError: FetchResult | null = null
  let cloudflareDetected = false

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Calculate delay with exponential backoff
    const delay = attempt === 1 ? 0 : initialDelay * Math.pow(2, attempt - 2)

    if (delay > 0) {
      console.log('[Fetch Retry]', {
        url,
        attempt: `${attempt}/${maxRetries}`,
        delay: `${delay}ms`,
        strategy: cloudflareDetected ? 'cloudflare-bypass' : 'standard'
      })

      await new Promise(resolve => setTimeout(resolve, delay))
    }

    const result = await fetchWithTimeout(url, {
      ...config,
      timeout,
      attempt: attempt - 1  // Pass attempt index for User-Agent rotation
    })

    result.attempts = attempt

    // Track if Cloudflare is involved
    if (result.isCloudflare) {
      cloudflareDetected = true
    }

    // If successful, return immediately
    if (result.success) {
      return result
    }

    // For Cloudflare blocks, ALWAYS retry with a different User-Agent
    if (result.errorType === 'cloudflare_blocked') {
      console.log('[Fetch Cloudflare Retry]', {
        url,
        attempt: `${attempt}/${maxRetries}`,
        status: result.status,
        nextUA: USER_AGENT_POOL[attempt % USER_AGENT_POOL.length]?.substring(0, 40) + '...'
      })
      lastError = result
      continue
    }

    // Don't retry on certain definitive errors
    if (result.errorType === 'not_found' ||
        result.errorType === 'ssl') {
      console.log('[Fetch No Retry]', {
        url,
        reason: `Non-retryable error: ${result.errorType}`
      })
      return result
    }

    // For regular 'blocked' (non-Cloudflare 403/429), retry with different headers
    if (result.errorType === 'blocked') {
      console.log('[Fetch Blocked Retry]', {
        url,
        attempt: `${attempt}/${maxRetries}`,
        status: result.status
      })
      lastError = result
      continue
    }

    lastError = result
  }

  console.error('[Fetch Failed]', {
    url,
    totalAttempts: maxRetries,
    finalError: lastError?.errorType,
    cloudflare: cloudflareDetected
  })

  return lastError || {
    success: false,
    errorType: 'unknown',
    errorDetails: 'Max retries exceeded',
    attempts: maxRetries
  }
}

/**
 * Fetch with both HEAD and GET fallback
 * Some servers don't support HEAD requests
 * Enhanced: handles Cloudflare blocks with multiple retry strategies
 */
export async function fetchWithHeadFallback(
  url: string,
  config: FetchConfig = {}
): Promise<FetchResult> {
  // Try HEAD first (faster, less bandwidth)
  const headResult = await fetchWithTimeout(url, {
    ...config,
    method: 'HEAD',
    timeout: config.timeout || 15000,
    attempt: 0
  })

  // If HEAD succeeds, return
  if (headResult.success || headResult.status === 404) {
    return headResult
  }

  // If Cloudflare blocks HEAD, go straight to GET with different User-Agent
  if (headResult.errorType === 'cloudflare_blocked' || headResult.isCloudflare) {
    console.log('[Fetch Cloudflare Fallback]', {
      url,
      reason: `Cloudflare blocked HEAD (${headResult.status}), trying GET with different UA`
    })

    // Try GET with a different User-Agent
    const getResult = await fetchWithTimeout(url, {
      ...config,
      method: 'GET',
      redirect: 'follow',
      attempt: 1  // Use different User-Agent
    })

    if (getResult.success) return getResult

    // Try one more time with yet another User-Agent
    const getResult2 = await fetchWithTimeout(url, {
      ...config,
      method: 'GET',
      redirect: 'follow',
      attempt: 2  // Use yet another User-Agent
    })

    return getResult2
  }

  // If HEAD fails with 405, 403, 501, 503 fall back to GET
  if (headResult.status === 405 ||
      headResult.status === 403 ||
      headResult.status === 501 ||
      headResult.status === 503) {

    console.log('[Fetch Fallback]', {
      url,
      reason: `HEAD returned ${headResult.status}, falling back to GET`
    })

    return await fetchWithTimeout(url, {
      ...config,
      method: 'GET',
      attempt: 1  // Use different User-Agent on fallback
    })
  }

  // Otherwise return the HEAD result
  return headResult
}
