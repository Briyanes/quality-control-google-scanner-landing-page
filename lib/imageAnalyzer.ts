/**
 * Image Analyzer - Perceptual hashing and image analysis for detecting duplicate images
 *
 * This module provides functions for:
 * - Generating perceptual hashes for images
 * - Comparing image hashes to detect duplicates
 * - Text-based image analysis as fallback
 */

// ============================================================================
// Types
// ============================================================================

export interface ImageHashResult {
  url: string
  hash: string
  error?: string
}

export interface ImageDuplicateResult {
  url: string
  duplicateCount: number
  duplicateUrls: string[]
  isNew: boolean
}

// ============================================================================
// Perceptual Hashing
// ============================================================================

/**
 * Generate a perceptual hash for an image URL
 * Note: This is a simplified version using URL hash. For production, you'd want to:
 * 1. Download the image
 * 2. Resize to standard dimensions (e.g., 8x8)
 * 3. Convert to grayscale
 * 4. Calculate average pixel value
 * 5. Generate hash based on comparison with average
 *
 * For now, we'll use a simpler URL-based hash as placeholder
 */
export async function generateImageHash(imageUrl: string): Promise<ImageHashResult> {
  try {
    // Simple hash based on URL (for demonstration)
    // In production, this should analyze actual image content
    const hash = stringToHash(imageUrl)

    return {
      url: imageUrl,
      hash
    }
  } catch (error) {
    return {
      url: imageUrl,
      hash: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Generate hashes for multiple image URLs
 */
export async function generateImageHashes(imageUrls: string[]): Promise<ImageHashResult[]> {
  const results = await Promise.all(
    imageUrls.map(url => generateImageHash(url))
  )
  return results
}

/**
 * Compare image hashes to find duplicates
 * Returns a map of hash to array of URLs that have that hash
 */
export function compareImageHashes(hashResults: ImageHashResult[]): Map<string, string[]> {
  const hashMap = new Map<string, string[]>()

  for (const result of hashResults) {
    if (result.hash) {
      const existing = hashMap.get(result.hash) || []
      existing.push(result.url)
      hashMap.set(result.hash, existing)
    }
  }

  return hashMap
}

/**
 * Find duplicate images based on hashes
 */
export function findDuplicateImages(
  hashResults: ImageHashResult[],
  existingHashes: Map<string, string>
): ImageDuplicateResult[] {
  const hashMap = compareImageHashes(hashResults)
  const duplicates: ImageDuplicateResult[] = []

  const entries = Array.from(hashMap.entries())
  for (const [hash, urls] of entries) {
    // Check if this hash exists in previous scans
    const hasExisting = existingHashes.has(hash)

    if (urls.length > 1 || hasExisting) {
      // Find all URLs with this hash (current + existing)
      const currentUrls = urls
      const existingUrls = hasExisting ? [existingHashes.get(hash)!] : []

      duplicates.push({
        url: urls[0], // Primary URL
        duplicateCount: currentUrls.length + existingUrls.length - 1,
        duplicateUrls: [...currentUrls.slice(1), ...existingUrls],
        isNew: !hasExisting
      })
    }
  }

  return duplicates
}

// ============================================================================
// Text-Based Image Analysis (Fallback)
// ============================================================================

/**
 * Extract image metadata from HTML without actual image processing
 * This is a fallback when AI analysis is not available
 */
export function analyzeImageByText(html: string, imageUrl: string): {
  type: string
  confidence: number
  labels: string[]
} {
  const labels: string[] = []
  let type = 'unknown'
  let confidence = 0.5

  // Extract from src attribute
  const src = imageUrl.toLowerCase()

  // Detect image type from filename/path
  if (src.includes('logo') || src.includes('brand')) {
    type = 'logo'
    labels.push('logo', 'branding')
    confidence = 0.7
  } else if (src.includes('product') || src.includes('item')) {
    type = 'product'
    labels.push('product', ' merchandise')
    confidence = 0.6
  } else if (src.includes('banner') || src.includes('hero')) {
    type = 'banner'
    labels.push('banner', 'promotional')
    confidence = 0.7
  } else if (src.includes('avatar') || src.includes('profile') || src.includes('person')) {
    type = 'person'
    labels.push('person', 'portrait')
    confidence = 0.6
  } else if (src.includes('doctor') || src.includes('medical') || src.includes('hospital')) {
    type = 'medical'
    labels.push('medical', 'healthcare')
    confidence = 0.8
  }

  // Extract from alt text if available
  const altRegex = new RegExp(`<img[^>]*src=["']${escapeRegex(imageUrl)}["'][^>]*alt=["']([^"']+)["']`, 'i')
  const altMatch = html.match(altRegex)

  if (altMatch && altMatch[1]) {
    const altText = altMatch[1].toLowerCase()
    labels.push(...altText.split(/\s+/))

    // Enhance confidence based on alt text
    if (altText.includes('logo')) {
      type = 'logo'
      confidence = 0.8
    } else if (altText.includes('product')) {
      type = 'product'
      confidence = 0.7
    } else if (altText.includes('before') || altText.includes('after')) {
      type = 'transformation'
      labels.push('before-after', 'transformation')
      confidence = 0.75
    }
  }

  return {
    type,
    confidence,
    labels: Array.from(new Set(labels)) // Remove duplicates
  }
}

/**
 * Detect if images are potentially suspicious (e.g., stock photos, templates)
 */
export function detectSuspiciousImages(
  imageUrls: string[],
  html: string
): {
  suspicious: string[]
  reasons: Map<string, string>
} {
  const suspicious: string[] = []
  const reasons = new Map<string, string>()

  for (const url of imageUrls) {
    const lowerUrl = url.toLowerCase()

    // Check for stock photo indicators
    if (lowerUrl.includes('stock') ||
        lowerUrl.includes('shutterstock') ||
        lowerUrl.includes('istock') ||
        lowerUrl.includes('depositphotos') ||
        lowerUrl.includes('getty')) {
      suspicious.push(url)
      reasons.set(url, 'Stock photo detected')
    }

    // Check for placeholder services
    if (lowerUrl.includes('placeholder') ||
        lowerUrl.includes('via.placeholder') ||
        lowerUrl.includes('placehold.co')) {
      suspicious.push(url)
      reasons.set(url, 'Placeholder image detected')
    }

    // Check for template patterns
    if (lowerUrl.includes('template') ||
        lowerUrl.includes('default-image') ||
        lowerUrl.includes('sample')) {
      suspicious.push(url)
      reasons.set(url, 'Template image detected')
    }

    // Check for low-quality hosting
    if (lowerUrl.includes('blogspot.') ||
        lowerUrl.includes('wordpress.')) {
      suspicious.push(url)
      reasons.set(url, 'Image hosted on free platform')
    }
  }

  return { suspicious, reasons }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Simple string hash function
 * This is a basic hash - in production you'd want to use perceptual image hashing
 */
function stringToHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Calculate hamming distance between two hashes
 * Useful for comparing similar images (not exact duplicates)
 */
export function calculateHammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    return -1 // Invalid comparison
  }

  let distance = 0
  for (let i = 0; i < hash1.length; i++) {
    const bin1 = parseInt(hash1[i], 16)
    const bin2 = parseInt(hash2[i], 16)
    const xor = bin1 ^ bin2

    // Count set bits
    distance += xor.toString(2).split('1').length - 1
  }

  return distance
}

/**
 * Find similar images (not exact duplicates) using hamming distance
 */
export function findSimilarImages(
  targetHash: string,
  hashResults: ImageHashResult[],
  threshold: number = 5
): ImageHashResult[] {
  const similar: ImageHashResult[] = []

  for (const result of hashResults) {
    if (result.hash && result.hash !== targetHash) {
      const distance = calculateHammingDistance(targetHash, result.hash)
      if (distance >= 0 && distance <= threshold) {
        similar.push(result)
      }
    }
  }

  return similar
}
