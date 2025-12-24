import { RedirectStep } from './types'

export async function checkRedirectChain(url: string): Promise<RedirectStep[]> {
  const chain: RedirectStep[] = []
  let currentUrl = url
  let redirectCount = 0
  const maxRedirects = 10

  try {
    while (redirectCount < maxRedirects) {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }).catch(() => null)

      if (!response) {
        // Failed to fetch, add last step and break
        chain.push({
          url: currentUrl,
          statusCode: 0,
          domain: extractDomain(currentUrl),
          isRedirect: false
        })
        break
      }

      const step: RedirectStep = {
        url: currentUrl,
        statusCode: response.status,
        domain: extractDomain(currentUrl),
        isRedirect: response.status >= 300 && response.status < 400
      }

      chain.push(step)

      if (step.isRedirect) {
        const location = response.headers.get('Location')
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
    console.error('Redirect check error:', error)
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
