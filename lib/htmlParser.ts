import { HTMLStructure } from './types'

export function parseHTMLStructure(html: string, url: string): HTMLStructure {
  const structure: HTMLStructure = {
    hasFooter: false,
    hasCompanyInfo: false,
    hasPolicyLinks: {
      privacy: false,
      terms: false,
      contact: false
    },
    hasEmbeddedForms: false,
    formActions: [],
    externalScripts: [],
    iframes: [],
    title: '',
    description: ''
  }

  try {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    if (titleMatch) {
      structure.title = titleMatch[1].trim()
    }

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
    if (descMatch) {
      structure.description = descMatch[1].trim()
    }

    // Check for footer
    structure.hasFooter = /<footer[\s>]/i.test(html) ||
                         /<div[^>]*\bclass=["'][^"']*\bfooter\b/i.test(html) ||
                         /<div[^>]*\bid=["'][^"']*\bfooter\b/i.test(html)

    // Check for company info patterns
    const companyPatterns = [
      /about\s+us/i,
      /company/i,
      /copyright/i,
      /©|&copy;/i,
      /\b(ltd|inc|pt|cv|corp)\b/i,
      /all\s+rights\s+reserved/i
    ]
    structure.hasCompanyInfo = companyPatterns.some(pattern => pattern.test(html))

    // Check for policy links (with Bahasa Indonesia support)
    structure.hasPolicyLinks.privacy = /privacy|privasi|kebijakan/i.test(html)
    structure.hasPolicyLinks.terms = /terms|ketentuan|syarat|toc|klausul/i.test(html) || /terms\s+of\s+service/i.test(html)
    structure.hasPolicyLinks.contact = /contact|kontak|hubungi/i.test(html) || /mailto:/i.test(html) || hasContactInfo(html)

    // Check for forms
    const formRegex = /<form[^>]*action=["']([^"']+)["'][^>]*>/gi
    const formMatches = html.match(formRegex)
    if (formMatches) {
      structure.hasEmbeddedForms = true
      for (const match of formMatches) {
        const actionMatch = match.match(/action=["']([^"']+)["']/i)
        if (actionMatch && actionMatch[1]) {
          structure.formActions.push(actionMatch[1])
        }
      }
    }

    // Check for iframes
    const iframeRegex = /<iframe[^>]*src=["']([^"']+)["'][^>]*>/gi
    const iframeMatches = html.match(iframeRegex)
    if (iframeMatches) {
      for (const match of iframeMatches) {
        const srcMatch = match.match(/src=["']([^"']+)["']/i)
        if (srcMatch && srcMatch[1]) {
          structure.iframes.push(srcMatch[1])
        }
      }
    }

    // Extract external scripts
    const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi
    const scriptMatches = html.match(scriptRegex)
    if (scriptMatches) {
      for (const match of scriptMatches) {
        const srcMatch = match.match(/src=["']([^"']+)["']/i)
        if (srcMatch && srcMatch[1]) {
          const scriptUrl = srcMatch[1]
          // Only include external scripts (not relative)
          if (scriptUrl.startsWith('http')) {
            structure.externalScripts.push(scriptUrl)
          }
        }
      }
    }
  } catch (error) {
    console.error('HTML parsing error:', error)
  }

  return structure
}

export function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return ''
  }
}

export function isExternalLink(link: string, baseUrl: string): boolean {
  try {
    const linkUrl = new URL(link, baseUrl)
    const baseDomain = extractDomainFromUrl(baseUrl)
    return linkUrl.hostname !== baseDomain
  } catch {
    return false
  }
}

/**
 * Detect contact information (email and phone numbers)
 * Supports Indonesian and international phone formats
 */
function hasContactInfo(html: string): boolean {
  const lowerHtml = html.toLowerCase()

  // Email detection
  const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i
  const hasEmail = emailPattern.test(html)

  // Phone number detection (Indonesian and international formats)
  // Matches: +62 858-1234-6593, 085812346593, (021) 1234-5678, +1 234 567 8900
  const phonePatterns = [
    /\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4,6}/, // International: +62 858-1234-6593
    /\+?\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{4,6}/, // Simplified: +62 858 1234 6593
    /0\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4,6}/, // Indonesian local: 021 1234 5678
    /08\d{2}[-.\s]?\d{4,8}[-.\s]?\d{2,6}/, // Indonesian mobile: 0858-1234-6593
    /62\d{2,3}[-.\s]?\d{4,8}[-.\s]?\d{2,6}/ // Indonesian without +: 62 858 1234 6593
  ]

  const hasPhone = phonePatterns.some(pattern => pattern.test(lowerHtml))

  // WhatsApp detection
  const hasWhatsApp = /wa\.me|whatsapp\.com|whatsapp:\/\//i.test(lowerHtml)

  return hasEmail || hasPhone || hasWhatsApp
}
