import { ContentAnalysis, ImageAnalysis } from './types'
import { isExternalLink } from './htmlParser'

export function analyzeContent(html: string, url: string): ContentAnalysis {
  const text = extractTextContent(html)
  const imageUrls = extractImageUrls(html)

  return {
    textLength: text.length,
    textToHTMLRatio: html.length > 0 ? text.length / html.length : 0,
    hasSubstantialContent: text.length > 500,
    adDensity: calculateAdDensity(html),
    hasArbitragePattern: detectArbitrage(html),
    hasDuplicatePattern: detectDuplicateContent(text),
    hasAffiliateLinks: detectAffiliateLinks(html),
    externalLinkCount: countExternalLinks(html, url),
    contentHash: generateHash(text),
    imageAnalysis: analyzeImagePatterns(imageUrls)
  }
}

function extractTextContent(html: string): string {
  // Remove script and style tags
  let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // Remove HTML tags
  content = content.replace(/<[^>]+>/g, ' ')

  // Decode HTML entities
  content = content.replace(/&nbsp;/g, ' ')
  content = content.replace(/&amp;/g, '&')
  content = content.replace(/&lt;/g, '<')
  content = content.replace(/&gt;/g, '>')
  content = content.replace(/&quot;/g, '"')
  content = content.replace(/&#39;/g, "'")

  // Remove extra whitespace
  content = content.replace(/\s+/g, ' ').trim()

  return content
}

function calculateAdDensity(html: string): number {
  const scriptCount = (html.match(/<script/gi) || []).length
  const iframeCount = (html.match(/<iframe/gi) || []).length

  const adKeywords = [
    'adsense',
    'adserver',
    'advertising',
    'doubleclick',
    'taboola',
    'outbrain',
    'ad-block'
  ]

  let adKeywordCount = 0
  const lowerHtml = html.toLowerCase()
  for (const keyword of adKeywords) {
    if (lowerHtml.includes(keyword)) {
      adKeywordCount++
    }
  }

  // Simple score: more scripts/iframes/ad keywords = higher ad density
  return Math.min((scriptCount * 0.3) + (iframeCount * 2) + (adKeywordCount * 5), 100)
}

function detectArbitrage(html: string): boolean {
  const scriptCount = (html.match(/<script/gi) || []).length
  const iframeCount = (html.match(/<iframe/gi) || []).length

  const adKeywords = ['adsense', 'adserver', 'advertising', 'doubleclick', 'taboola']
  const lowerHtml = html.toLowerCase()
  const adKeywordCount = adKeywords.filter(k => lowerHtml.includes(k)).length

  const textLength = extractTextContent(html).length
  const htmlLength = html.length
  const textRatio = textLength / htmlLength

  // High arbitrage suspicion: many ads, little content
  return ((scriptCount > 10 || iframeCount > 3) && adKeywordCount >= 2) || textRatio < 0.1
}

function detectDuplicateContent(text: string): boolean {
  // Simple heuristic: check for repetitive patterns
  if (text.length < 100) return false

  const words = text.toLowerCase().split(/\s+/)
  const uniqueWords = new Set(words)

  // If less than 30% unique words, likely duplicate/low-quality content
  const uniqueRatio = uniqueWords.size / words.length
  return uniqueRatio < 0.3
}

function detectAffiliateLinks(html: string): boolean {
  const affiliatePatterns = [
    /amazon\.com\/.*\/dp\//i,
    /amazon\.com\/.*\/gp\//i,
    /shareasale\.com/i,
    /clickbank\.net/i,
    /commission\.junction/i,
    /affiliate/i,
    /ref=/i,
    /\?ref=[a-z0-9_-]+/i
  ]

  return affiliatePatterns.some(pattern => pattern.test(html))
}

function countExternalLinks(html: string, baseUrl: string): number {
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>/gi
  const matches = html.match(linkRegex)

  if (!matches) return 0

  let externalCount = 0
  for (const match of matches) {
    const hrefMatch = match.match(/href=["']([^"']+)["']/i)
    if (hrefMatch && hrefMatch[1]) {
      const href = hrefMatch[1]
      // Skip anchors, javascript, and mailto
      if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
        continue
      }
      if (isExternalLink(href, baseUrl)) {
        externalCount++
      }
    }
  }

  return externalCount
}

function generateHash(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(16)
}

/**
 * Extract image URLs from HTML
 */
function extractImageUrls(html: string): string[] {
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi
  const urls: string[] = []
  let match

  while ((match = imgRegex.exec(html)) !== null) {
    if (match[1]) {
      urls.push(match[1])
    }
  }

  return urls
}

/**
 * Analyze image patterns for duplicates
 * Useful for detecting suspicious patterns like fake testimonials with same photos
 */
function analyzeImagePatterns(imageUrls: string[]): ImageAnalysis {
  if (imageUrls.length === 0) {
    return {
      totalImages: 0,
      uniqueImages: 0,
      duplicateCount: 0,
      duplicateRatio: 0,
      hasExcessiveDuplicates: false,
      duplicateImageUrls: []
    }
  }

  // Count occurrences of each image URL
  const imageCountMap = new Map<string, number>()
  for (const url of imageUrls) {
    // Normalize URL by removing query parameters (they might be the same image)
    const normalizedUrl = url.split('?')[0]
    imageCountMap.set(normalizedUrl, (imageCountMap.get(normalizedUrl) || 0) + 1)
  }

  const totalImages = imageUrls.length
  const uniqueImages = imageCountMap.size

  // Find duplicates (images that appear more than once)
  const duplicateImageUrls: string[] = []
  let duplicateCount = 0

  const entries = Array.from(imageCountMap.entries())
  for (const [url, count] of entries) {
    if (count > 1) {
      duplicateCount += (count - 1) // Count extra occurrences
      duplicateImageUrls.push(`${url} (${count}x)`)
    }
  }

  // Calculate duplicate ratio (extra images / total images)
  const duplicateRatio = totalImages > 0 ? duplicateCount / totalImages : 0

  // Flag as excessive if more than 30% duplicates OR more than 3 duplicate images
  const hasExcessiveDuplicates = duplicateRatio > 0.3 || duplicateCount >= 3

  return {
    totalImages,
    uniqueImages,
    duplicateCount,
    duplicateRatio,
    hasExcessiveDuplicates,
    duplicateImageUrls
  }
}
