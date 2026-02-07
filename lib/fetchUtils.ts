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
    /Attention Required[\s\S]*Cloudflare/i,
    /cf-browser-verification/i,
    /cf-challenge-running/i,
    /Just a moment[\s\S]*Enable JavaScript/i,
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
 * Strategy headers: try with Google Referer to mimic search result click
 * Many Cloudflare configs whitelist traffic from Google search
 */
function getGoogleRefererHeaders(attempt: number = 0): Record<string, string> {
  const headers = getHeadersForAttempt(attempt)
  headers['Referer'] = 'https://www.google.com/'
  headers['Sec-Fetch-Site'] = 'cross-site'
  return headers
}

/**
 * Fetch URL content from Google Web Cache as fallback
 * Google Cache stores crawled versions of pages, bypassing Cloudflare
 */
export async function fetchFromGoogleCache(url: string, timeout: number = 20000): Promise<FetchResult> {
  const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}&num=1&strip=0`

  console.log('[Google Cache]', { url, cacheUrl: cacheUrl.substring(0, 80) + '...' })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(cacheUrl, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT_POOL[0],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
      },
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      console.log('[Google Cache] Not available:', response.status)
      return { success: false, status: response.status, errorType: 'not_found', attempts: 1 }
    }

    const html = await response.text()

    // Google Cache wraps content - extract the actual page content
    // Remove Google's cache banner/header
    let cleanHtml = html
    // Google inserts a div at the top; try to find original content
    const bodyMatch = html.match(/<div id="google-cache-hdr">[\s\S]*?<\/div>\s*([\s\S]*)/i)
    if (bodyMatch) {
      cleanHtml = bodyMatch[1]
    }

    // Verify we got substantial content (not just Google's 404)
    if (cleanHtml.length < 500) {
      console.log('[Google Cache] Content too short:', cleanHtml.length)
      return { success: false, errorType: 'not_found', errorDetails: 'Google Cache content too short', attempts: 1 }
    }

    console.log('[Google Cache] Success, content length:', cleanHtml.length)
    return {
      success: true,
      status: 200,
      data: cleanHtml,
      attempts: 1,
      finalUrl: url
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    console.error('[Google Cache] Error:', error.message)
    return { success: false, errorType: 'unknown', errorDetails: error.message, attempts: 1 }
  }
}

/**
 * Fetch URL content from Wayback Machine (archive.org) as fallback
 * Uses the latest available snapshot
 */
export async function fetchFromArchive(url: string, timeout: number = 20000): Promise<FetchResult> {
  // First, check if there's a recent snapshot
  const apiUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`

  console.log('[Archive.org]', { url })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const apiResponse = await fetch(apiUrl, {
      headers: { 'User-Agent': USER_AGENT_POOL[0] },
      signal: controller.signal,
    })

    if (!apiResponse.ok) {
      clearTimeout(timeoutId)
      console.log('[Archive.org] API error:', apiResponse.status)
      return { success: false, errorType: 'not_found', attempts: 1 }
    }

    const apiData = await apiResponse.json()
    const snapshot = apiData?.archived_snapshots?.closest

    if (!snapshot || !snapshot.available) {
      clearTimeout(timeoutId)
      console.log('[Archive.org] No snapshot available')
      return { success: false, errorType: 'not_found', errorDetails: 'No archive snapshot available', attempts: 1 }
    }

    // Check if snapshot is recent (within 90 days)
    const snapshotDate = snapshot.timestamp // Format: YYYYMMDDHHmmss
    const snapshotYear = parseInt(snapshotDate.substring(0, 4))
    const snapshotMonth = parseInt(snapshotDate.substring(4, 6))
    const now = new Date()
    const monthsDiff = (now.getFullYear() - snapshotYear) * 12 + (now.getMonth() + 1 - snapshotMonth)

    if (monthsDiff > 3) {
      clearTimeout(timeoutId)
      console.log('[Archive.org] Snapshot too old:', snapshotDate)
      return { success: false, errorType: 'not_found', errorDetails: `Archive snapshot too old: ${snapshotDate}`, attempts: 1 }
    }

    // Fetch the actual archived page - use raw (id_) version for clean HTML
    const archiveUrl = snapshot.url.replace('/web/', '/web/id_/')

    console.log('[Archive.org] Fetching snapshot:', archiveUrl.substring(0, 80) + '...')

    const pageResponse = await fetch(archiveUrl, {
      headers: {
        'User-Agent': USER_AGENT_POOL[0],
        'Accept': 'text/html,*/*',
      },
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timeoutId)

    if (!pageResponse.ok) {
      console.log('[Archive.org] Page fetch error:', pageResponse.status)
      return { success: false, status: pageResponse.status, errorType: 'server_error', attempts: 1 }
    }

    const html = await pageResponse.text()

    if (html.length < 500) {
      console.log('[Archive.org] Content too short:', html.length)
      return { success: false, errorType: 'not_found', errorDetails: 'Archive content too short', attempts: 1 }
    }

    console.log('[Archive.org] Success, content length:', html.length, 'snapshot:', snapshotDate)
    return {
      success: true,
      status: 200,
      data: html,
      attempts: 1,
      finalUrl: url
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    console.error('[Archive.org] Error:', error.message)
    return { success: false, errorType: 'unknown', errorDetails: error.message, attempts: 1 }
  }
}

/**
 * Enhanced fetch with Cloudflare bypass cascade:
 * 1. Direct fetch with User-Agent rotation (standard)
 * 2. Direct fetch with Google Referer (mimics Google search click)
 * 3. Google Web Cache (cached version, bypasses CF entirely)
 * 4. Archive.org Wayback Machine (last resort fallback)
 */
export async function fetchWithCloudflareFallback(
  url: string,
  config: FetchConfig = {}
): Promise<FetchResult> {
  const timeout = config.timeout || 30000

  // Strategy 1: Direct fetch with standard headers
  console.log('[CF Bypass] Strategy 1: Direct fetch')
  const directResult = await fetchWithRetry(url, {
    ...config,
    timeout,
    maxRetries: 2,       // Quick first try (2 attempts only)
    retryDelay: 1000
  })

  if (directResult.success && directResult.data) {
    return directResult
  }

  const isCloudflareIssue = directResult.errorType === 'cloudflare_blocked' ||
    directResult.errorType === 'blocked' ||
    directResult.isCloudflare

  if (!isCloudflareIssue) {
    // Not a Cloudflare issue, return the original error
    return directResult
  }

  // Strategy 2: Fetch with Google Referer header
  console.log('[CF Bypass] Strategy 2: Google Referer')
  const googleRefController = new AbortController()
  const googleRefTimeout = setTimeout(() => googleRefController.abort(), 15000)
  try {
    const googleRefHeaders = getGoogleRefererHeaders(2)
    const response = await fetch(url, {
      method: 'GET',
      headers: googleRefHeaders,
      signal: googleRefController.signal,
      redirect: 'follow'
    })
    clearTimeout(googleRefTimeout)

    if (response.ok) {
      const data = await response.text()
      if (data && data.length > 500 && !isCloudflareChallengePage(data)) {
        console.log('[CF Bypass] Google Referer worked! Content length:', data.length)
        return {
          success: true,
          status: response.status,
          data,
          attempts: directResult.attempts + 1,
          finalUrl: response.url
        }
      }
    }
    console.log('[CF Bypass] Google Referer failed:', response.status)
  } catch (e: any) {
    clearTimeout(googleRefTimeout)
    console.log('[CF Bypass] Google Referer error:', e.message)
  }

  // Strategy 3: Google Web Cache
  console.log('[CF Bypass] Strategy 3: Google Cache')
  const cacheResult = await fetchFromGoogleCache(url, 20000)
  if (cacheResult.success && cacheResult.data) {
    cacheResult.attempts = directResult.attempts + 2
    return cacheResult
  }

  // Strategy 4: Archive.org Wayback Machine
  console.log('[CF Bypass] Strategy 4: Archive.org')
  const archiveResult = await fetchFromArchive(url, 20000)
  if (archiveResult.success && archiveResult.data) {
    archiveResult.attempts = directResult.attempts + 3
    return archiveResult
  }

  // All strategies failed
  console.error('[CF Bypass] All strategies failed for:', url)
  return {
    ...directResult,
    errorDetails: `Cloudflare memblokir akses langsung (403). Google Cache dan Archive.org juga tidak tersedia untuk URL ini.`,
    attempts: directResult.attempts + 3
  }
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
