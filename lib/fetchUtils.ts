/**
 * Fetch Utilities with Timeout, Retry, and Error Classification
 * Designed to handle problematic URLs (BERDU hosting, slow servers, bot detection)
 */

export interface FetchConfig {
  timeout?: number        // Default: 30000ms (30 seconds)
  maxRetries?: number     // Default: 3 retries
  retryDelay?: number     // Default: 1000ms (1 second)
  method?: 'GET' | 'HEAD' // Default: GET
  redirect?: 'manual' | 'follow' // Default: follow
}

export interface FetchResult {
  success: boolean
  status?: number
  errorType?: 'timeout' | 'connection' | 'ssl' | 'blocked' | 'not_found' | 'server_error' | 'unknown'
  errorDetails?: string
  data?: string
  headers?: Record<string, string>
  attempts: number
  finalUrl?: string
}

/**
 * Enhanced browser headers to bypass bot detection
 * Mimics Chrome 120 on Windows
 */
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Cache-Control': 'max-age=0'
}

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

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const startTime = Date.now()

  try {
    console.log('[Fetch]', {
      url,
      method,
      timeout: `${timeout}ms`,
      userAgent: DEFAULT_HEADERS['User-Agent']?.substring(0, 50) + '...'
    })

    const response = await fetch(url, {
      method,
      headers: DEFAULT_HEADERS,
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
    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Get response data
    const data = await response.text()

    return {
      success: response.ok,
      status: response.status,
      errorType: response.ok ? undefined : classifyError(new Error(response.statusText), response.status),
      errorDetails: response.ok ? undefined : response.statusText,
      data,
      headers,
      attempts: 1,
      finalUrl: response.url
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
 */
export async function fetchWithRetry(
  url: string,
  config: FetchConfig = {}
): Promise<FetchResult> {
  const maxRetries = config.maxRetries !== undefined ? config.maxRetries : 3
  const initialDelay = config.retryDelay || 1000
  const timeout = config.timeout || 30000

  let lastError: FetchResult | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Calculate delay with exponential backoff
    const delay = attempt === 1 ? 0 : initialDelay * Math.pow(2, attempt - 2)

    if (delay > 0) {
      console.log('[Fetch Retry]', {
        url,
        attempt: `${attempt}/${maxRetries}`,
        delay: `${delay}ms`
      })

      await new Promise(resolve => setTimeout(resolve, delay))
    }

    const result = await fetchWithTimeout(url, {
      ...config,
      timeout
    })

    result.attempts = attempt

    // If successful, return immediately
    if (result.success) {
      return result
    }

    // Don't retry on certain errors
    if (result.errorType === 'not_found' ||
        result.errorType === 'ssl' ||
        result.errorType === 'blocked') {
      console.log('[Fetch No Retry]', {
        url,
        reason: `Non-retryable error: ${result.errorType}`
      })
      return result
    }

    lastError = result
  }

  console.error('[Fetch Failed]', {
    url,
    totalAttempts: maxRetries,
    finalError: lastError?.errorType
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
 */
export async function fetchWithHeadFallback(
  url: string,
  config: FetchConfig = {}
): Promise<FetchResult> {
  // Try HEAD first (faster, less bandwidth)
  const headResult = await fetchWithTimeout(url, {
    ...config,
    method: 'HEAD',
    timeout: config.timeout || 15000
  })

  // If HEAD succeeds, return
  if (headResult.success || headResult.status === 404) {
    return headResult
  }

  // If HEAD fails with 405, 403, 501, fall back to GET
  if (headResult.status === 405 ||
      headResult.status === 403 ||
      headResult.status === 501) {

    console.log('[Fetch Fallback]', {
      url,
      reason: `HEAD returned ${headResult.status}, falling back to GET`
    })

    return await fetchWithTimeout(url, {
      ...config,
      method: 'GET'
    })
  }

  // Otherwise return the HEAD result
  return headResult
}
