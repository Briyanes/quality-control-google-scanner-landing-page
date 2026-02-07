import { RedirectStep } from './types'
import { fetchWithTimeout } from './fetchUtils'

export async function checkRedirectChain(url: string): Promise<RedirectStep[]> {
  const chain: RedirectStep[] = []
  let currentUrl = url
  let redirectCount = 0
  const maxRedirects = 10

  try {
    while (redirectCount < maxRedirects) {
      const fetchResult = await fetchWithTimeout(currentUrl, {
        method: 'HEAD',
        timeout: 10000,      // 10 seconds per redirect
        redirect: 'manual',
        attempt: redirectCount  // Rotate User-Agent per redirect step
      })

      // Check if fetch failed
      if (!fetchResult.success || fetchResult.status === undefined) {
        // Failed to fetch, add last step and break
        chain.push({
          url: currentUrl,
          statusCode: 0,
          domain: extractDomain(currentUrl),
          isRedirect: false
        })
        console.error('[Redirect Checker] Failed to fetch redirect step:', {
          url: currentUrl,
          errorType: fetchResult.errorType,
          errorDetails: fetchResult.errorDetails
        })
        break
      }

      const step: RedirectStep = {
        url: currentUrl,
        statusCode: fetchResult.status,
        domain: extractDomain(currentUrl),
        isRedirect: fetchResult.status >= 300 && fetchResult.status < 400
      }

      chain.push(step)

      if (step.isRedirect) {
        // Extract Location header from fetchResult.headers
        const location = fetchResult.headers?.['Location'] || fetchResult.headers?.['location']
        if (!location) break

        // Check if redirect is to third-party domain
        const originalDomain = extractDomain(url)
        const newDomain = extractDomain(location)
        step.isThirdParty = originalDomain !== newDomain

        // Handle relative URLs
        currentUrl = location.startsWith('http')
          ? location
          : new URL(location, currentUrl).href

        redirectCount++
      } else {
        break
      }
    }
  } catch (error) {
    console.error('[Redirect Checker] Unexpected error:', error)
  }

  return chain
}

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return url
  }
}

export function hasThirdPartyRedirect(chain: RedirectStep[], originalDomain: string): boolean {
  return chain.some(step => step.isThirdParty === true)
}

export function getFinalUrl(chain: RedirectStep[]): string {
  if (chain.length === 0) return ''
  return chain[chain.length - 1].url
}
