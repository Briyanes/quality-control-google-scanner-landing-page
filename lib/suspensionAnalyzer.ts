import { RedirectStep } from './types'
import { extractDomain } from './redirectChecker'

/**
 * Suspension Analyzer - Tier 1, 2, and 3 checks for Google Ads suspension risks
 *
 * Tier 1: Rule-based (always available)
 * Tier 2: Database-dependent (requires historical data)
 * Tier 3: AI-dependent (requires AI API)
 */

// ============================================================================
// Types
// ============================================================================

export interface HiddenUrlResult {
  imageUrl: string
  hiddenUrl: string
  type: 'onclick' | 'link' | 'data-url'
}

export interface AutoRedirectResult {
  hasRedirect: boolean
  type: string[]
  delay?: number
  targetUrl?: string
}

export interface MultipleAccountAbuseResult {
  hasPattern: boolean
  sameEmailDetected: boolean
  sameImagesDetected: boolean
  sameDomainDetected: boolean
  newToOldRedirect: boolean
  evidence?: string
}

export interface UnacceptableBusinessPracticeResult {
  bodyOrganImages: boolean
  homepageMismatch: boolean
  weaponsIllegalGoods: boolean
  medicalImagery: boolean
  religiousPromotion: boolean
  fakeBrandAffiliation: boolean
  insufficientCompanyInfo: boolean
  evidence?: string[]
}

export interface PublicFigureResult {
  detected: boolean
  publicFigures: string[]
  fakeEndorsements: boolean
  evidence?: string
}

export interface TechnicalCircumventionResult {
  cloaking: boolean
  hiddenUrls: boolean
  autoRedirects: boolean
  excessiveImages: boolean
  evidence?: string[]
}

export interface CounterfeitGoodsResult {
  brandProductPhotos: boolean
  brandLogos: boolean
  fakeOfficialStore: boolean
  detectedBrands: string[]
  evidence?: string[]
}

export interface SuspensionAnalysis {
  multipleAccountAbuse: MultipleAccountAbuseResult
  unacceptableBusinessPractice: UnacceptableBusinessPracticeResult
  publicFigureImpersonation: PublicFigureResult
  technicalCircumvention: TechnicalCircumventionResult
  counterfeitGoods: CounterfeitGoodsResult
}

// ============================================================================
// Main Analyzer Function
// ============================================================================

export async function analyzeSuspensionRisk(
  html: string,
  url: string,
  redirectChain: RedirectStep[],
  htmlStructure: any,
  contentAnalysis: any
): Promise<SuspensionAnalysis> {
  // Extract text content for analysis
  const textContent = extractTextContent(html)
  const imageUrls = extractImageUrls(html)

  // Tier 1: Rule-based checks (always available)
  const multipleAccountAbuse = await analyzeMultipleAccountAbuseTier1(
    redirectChain,
    url
  )

  const unacceptableBusinessPractice = await analyzeUnacceptableBusinessPracticeTier1(
    html,
    textContent,
    url
  )

  const publicFigureImpersonation = await analyzePublicFigureImpersonationTier1(
    html,
    textContent
  )

  const technicalCircumvention = await analyzeTechnicalCircumventionTier1(
    html,
    imageUrls
  )

  const counterfeitGoods = await analyzeCounterfeitGoodsTier1(
    html,
    textContent
  )

  return {
    multipleAccountAbuse,
    unacceptableBusinessPractice,
    publicFigureImpersonation,
    technicalCircumvention,
    counterfeitGoods
  }
}

// ============================================================================
// Tier 1: Rule-Based Checks
// ============================================================================

// 1. Multiple Account Abuse - Tier 1 (what we can detect without database)
async function analyzeMultipleAccountAbuseTier1(
  redirectChain: RedirectStep[],
  url: string
): Promise<MultipleAccountAbuseResult> {
  // Check for new domain redirecting to old domain
  const newToOldRedirect = await detectNewToOldRedirect(redirectChain)

  // Other checks require database (Tier 2)
  // For now, we mark them as false
  return {
    hasPattern: newToOldRedirect,
    sameEmailDetected: false, // Requires database
    sameImagesDetected: false, // Requires database
    sameDomainDetected: false, // Requires database
    newToOldRedirect,
    evidence: newToOldRedirect
      ? `Pattern redirect dari domain baru ke domain lama terdeteksi: ${redirectChain.map((r) => r.url).join(' → ')}`
      : undefined
  }
}

// 2. Unacceptable Business Practice - Tier 1
async function analyzeUnacceptableBusinessPracticeTier1(
  html: string,
  textContent: string,
  url: string
): Promise<UnacceptableBusinessPracticeResult> {
  const evidence: string[] = []

  // Check for weapons/illegal goods
  const weaponsIllegalGoods = detectWeaponsContent(html, textContent)
  if (weaponsIllegalGoods) {
    evidence.push('Konten terkait senjata/barang ilegal terdeteksi')
  }

  // Check for religious promotion
  const religiousPromotion = detectReligiousPromotion(html, textContent)
  if (religiousPromotion) {
    evidence.push('Promosi agama yang berlebihan pada produk komersial terdeteksi')
  }

  // Check for fake official store claims
  const fakeOfficialStore = detectFakeOfficialStore(html, textContent)
  if (fakeOfficialStore) {
    evidence.push('Klaim toko official tanpa verifikasi domain terdeteksi')
  }

  // Check for insufficient company info (using existing htmlStructure)
  // This will be passed from the main scanner

  // Homepage mismatch check
  const homepageMismatch = false // Will be checked separately

  // Other checks require AI (Tier 3)
  return {
    bodyOrganImages: false, // Requires AI
    homepageMismatch,
    weaponsIllegalGoods,
    medicalImagery: false, // Requires AI
    religiousPromotion,
    fakeBrandAffiliation: false, // Requires AI
    insufficientCompanyInfo: false, // Will be checked in main scanner
    evidence: evidence.length > 0 ? evidence : undefined
  }
}

// 3. Public Figure Impersonation - Tier 1
async function analyzePublicFigureImpersonationTier1(
  html: string,
  textContent: string
): Promise<PublicFigureResult> {
  // Text-based detection
  const publicFigures = extractCelebrityNames(textContent)
  const fakeEndorsements = detectEndorsementQuotes(textContent)

  if (publicFigures.length > 0 && fakeEndorsements) {
    return {
      detected: true,
      publicFigures,
      fakeEndorsements,
      evidence: `Potensi penggunaan figur publik: ${publicFigures.join(', ')}`
    }
  }

  return {
    detected: false,
    publicFigures: [],
    fakeEndorsements: false
  }
}

// 4. Technical Circumvention - Tier 1
async function analyzeTechnicalCircumventionTier1(
  html: string,
  imageUrls: string[]
): Promise<TechnicalCircumventionResult> {
  const evidence: string[] = []

  // Check for excessive images
  const excessiveImages = detectExcessiveImages(html, imageUrls)
  if (excessiveImages) {
    evidence.push(`Terlalu banyak gambar: ${imageUrls.length} gambar terdeteksi`)
  }

  // Check for hidden URLs in images
  const hiddenUrlsResult = detectHiddenUrlsInImages(html)
  if (hiddenUrlsResult.length > 0) {
    evidence.push(
      `URL tersembunyi dalam gambar: ${hiddenUrlsResult.map((r) => r.hiddenUrl).join(', ')}`
    )
  }

  // Check for auto-redirects
  const autoRedirectsResult = detectAutoRedirects(html)
  if (autoRedirectsResult.hasRedirect) {
    evidence.push(
      `Auto-redirect terdeteksi: ${autoRedirectsResult.type.join(', ')}`
    )
  }

  // Cloaking requires special handling
  const cloaking = false // Will be checked separately

  return {
    cloaking,
    hiddenUrls: hiddenUrlsResult.length > 0,
    autoRedirects: autoRedirectsResult.hasRedirect,
    excessiveImages,
    evidence: evidence.length > 0 ? evidence : undefined
  }
}

// 5. Counterfeit Goods - Tier 1
async function analyzeCounterfeitGoodsTier1(
  html: string,
  textContent: string
): Promise<CounterfeitGoodsResult> {
  const evidence: string[] = []
  const detectedBrands: string[] = []

  // Check for brand mentions in text
  const brandMentions = extractBrandMentions(textContent)
  detectedBrands.push(...brandMentions)

  // Check for fake official store
  const fakeOfficialStore = detectFakeOfficialStore(html, textContent)
  if (fakeOfficialStore) {
    evidence.push('Klaim toko official/resmi tanpa verifikasi')
  }

  // Other checks require AI
  return {
    brandProductPhotos: false, // Requires AI
    brandLogos: false, // Requires AI
    fakeOfficialStore,
    detectedBrands,
    evidence: evidence.length > 0 ? evidence : undefined
  }
}

// ============================================================================
// Tier 1 Detection Functions (Rule-Based)
// ============================================================================

/**
 * Detect excessive images
 * Threshold: More than 50 images or image/HTML ratio > 60%
 */
export function detectExcessiveImages(
  html: string,
  imageUrls: string[]
): boolean {
  const imageCount = imageUrls.length
  const htmlLength = html.length

  // Flag if more than 50 images
  if (imageCount > 50) {
    return true
  }

  // Calculate image-to-HTML ratio
  // Rough estimate: each img tag contributes to image density
  const imageDensity = imageCount / Math.max(htmlLength / 1000, 1)

  return imageDensity > 0.1 // More than 10% image density
}

/**
 * Detect hidden URLs in images
 * Checks for onclick handlers, links around images, data-url attributes
 */
export function detectHiddenUrlsInImages(html: string): HiddenUrlResult[] {
  const results: HiddenUrlResult[] = []

  // Check for onclick handlers on images
  const onclickRegex =
    /<img[^>]*\sonclick=["']([^"']*)["'][^>]*>/gi
  let match
  while ((match = onclickRegex.exec(html)) !== null) {
    const onclickCode = match[1]
    // Extract URLs from window.location, location.href, etc.
    const urlMatch =
      onclickCode.match(/(?:location\.href|window\.location)\s*=\s*["']([^"']+)["']/) ||
      onclickCode.match(/(?:location\.href|window\.location)\s*=\s*([^"'\s]+)/)

    if (urlMatch) {
      results.push({
        imageUrl: match[0],
        hiddenUrl: urlMatch[1],
        type: 'onclick'
      })
    }
  }

  // Check for anchor tags wrapping images with external links
  const anchorWithImageRegex =
    /<a[^>]*href=["']([^"']+)["'][^>]*>\s*<img[^>]*>/gi
  while ((match = anchorWithImageRegex.exec(html)) !== null) {
    const href = match[1]
    // Check if it's a suspicious external link
    if (href.startsWith('http') && !href.includes(match[0].substring(0, 100))) {
      results.push({
        imageUrl: 'image within anchor tag',
        hiddenUrl: href,
        type: 'link'
      })
    }
  }

  // Check for data-url attributes on images
  const dataUrlRegex = /<img[^>]*data-url=["']([^"']+)["'][^>]*>/gi
  while ((match = dataUrlRegex.exec(html)) !== null) {
    results.push({
      imageUrl: match[0],
      hiddenUrl: match[1],
      type: 'data-url'
    })
  }

  return results
}

/**
 * Detect auto-redirects
 * Checks for meta refresh, JavaScript redirects, setTimeout redirects
 */
export function detectAutoRedirects(html: string): AutoRedirectResult {
  const types: string[] = []
  let delay: number | undefined
  let targetUrl: string | undefined

  // Check for meta refresh redirect
  const metaRefreshRegex =
    /<meta\s+http-equiv=["']refresh["']\s+content=["'](\d+);\s*url=([^"']+)["']/gi
  const metaMatch = metaRefreshRegex.exec(html)
  if (metaMatch) {
    types.push('meta-refresh')
    delay = parseInt(metaMatch[1])
    targetUrl = metaMatch[2]
  }

  // Check for JavaScript redirect patterns
  const jsRedirectPatterns = [
    /window\.location\s*=\s*["']([^"']+)["']/gi,
    /window\.location\.href\s*=\s*["']([^"']+)["']/gi,
    /location\.href\s*=\s*["']([^"']+)["']/gi,
    /location\.replace\s*\(\s*["']([^"']+)["']\s*\)/gi
  ]

  for (const pattern of jsRedirectPatterns) {
    const matches = html.match(pattern)
    if (matches) {
      types.push('javascript-redirect')
      const urlMatch = pattern.exec(html)
      if (urlMatch && urlMatch[1]) {
        targetUrl = urlMatch[1]
      }
      break
    }
  }

  // Check for setTimeout redirects
  const setTimeoutRegex =
    /setTimeout\s*\(\s*[^,]+,\s*(\d+)\s*\)/gi
  const setTimeoutMatch = html.match(setTimeoutRegex)
  if (setTimeoutMatch) {
    types.push('delayed-redirect')
    const delayMatch = setTimeoutRegex.exec(html)
    if (delayMatch) {
      delay = parseInt(delayMatch[1])
    }
  }

  return {
    hasRedirect: types.length > 0,
    type: types,
    delay,
    targetUrl
  }
}

/**
 * Detect weapons or illegal goods content
 * Uses keyword matching
 */
export function detectWeaponsContent(
  html: string,
  textContent: string
): boolean {
  const lowerText = textContent.toLowerCase()
  const lowerHtml = html.toLowerCase()

  // Weapons-related keywords
  const weaponKeywords = [
    'gun for sale',
    'pistol for sale',
    'rifle for sale',
    'ammunition',
    'firearm',
    'weapon for sale',
    'jual senjata',
    'senjata api',
    'amunisi',
    'peluru',
    'revolver',
    'shotgun'
  ]

  // Illegal goods keywords
  const illegalKeywords = [
    'buy drugs online',
    'buy illegal',
    'jual obat terlarang',
    'jual narkoba',
    'barang curian',
    'stolen goods',
    'black market',
    'pasar gelap'
  ]

  const allKeywords = [...weaponKeywords, ...illegalKeywords]

  return allKeywords.some((keyword) =>
    lowerText.includes(keyword) || lowerHtml.includes(keyword)
  )
}

/**
 * Detect fake official store claims
 * Checks for text patterns claiming to be official without domain verification
 */
export function detectFakeOfficialStore(
  html: string,
  textContent: string
): boolean {
  const lowerText = textContent.toLowerCase()

  // Keywords indicating official store
  const officialStoreKeywords = [
    'official store',
    'toko official',
    'toko resmi',
    'authorized dealer',
    'distributor resmi',
    'agen resmi',
    'sole distributor',
    'authorized reseller'
  ]

  // Check if any official claim is present
  const hasOfficialClaim = officialStoreKeywords.some((keyword) =>
    lowerText.includes(keyword)
  )

  if (!hasOfficialClaim) {
    return false
  }

  // Check if domain matches the claim (basic check)
  // In real implementation, this would verify against official brand domains
  const hasBrandMismatch = officialStoreKeywords.some((keyword) => {
    const context = lowerText.substring(
      Math.max(0, lowerText.indexOf(keyword) - 50),
      Math.min(lowerText.length, lowerText.indexOf(keyword) + keyword.length + 50)
    )
    // If claiming to be official but using generic domain patterns
    return (
      context.includes('.blogspot.') ||
      context.includes('.wordpress.') ||
      context.includes('.github.io')
    )
  })

  return hasBrandMismatch
}

/**
 * Detect excessive religious promotion on commercial products
 */
export function detectReligiousPromotion(
  html: string,
  textContent: string
): boolean {
  const lowerText = textContent.toLowerCase()

  // Religious symbols/terms in commercial context
  const religiousKeywords = [
    'blessed',
    'miracle',
    'prayer',
    'doa',
    'berkah',
    'supernatural',
    'ilahi',
    'spiritual healing'
  ]

  // Commercial indicators
  const commercialKeywords = [
    'buy',
    'purchase',
    'order',
    'jual',
    'beli',
    'harga',
    'price',
    'shop',
    'toko',
    'rp.',
    'idr',
    '$'
  ]

  const hasReligiousContent = religiousKeywords.some((keyword) =>
    lowerText.includes(keyword)
  )

  const hasCommercialContent = commercialKeywords.some((keyword) =>
    lowerText.includes(keyword)
  )

  // Flag if both religious and commercial content are present
  return hasReligiousContent && hasCommercialContent
}

/**
 * Detect new domain redirecting to old domain
 */
export async function detectNewToOldRedirect(
  redirectChain: RedirectStep[]
): Promise<boolean> {
  if (redirectChain.length < 2) {
    return false
  }

  // Check if newer domain redirects to older/established domain
  // This is a simplified check - in production, you'd check domain age via DNS
  for (let i = 0; i < redirectChain.length - 1; i++) {
    const currentStep = redirectChain[i]
    const nextStep = redirectChain[i + 1]

    // If redirecting to a different domain
    if (currentStep.domain !== nextStep.domain) {
      // Check if next domain looks more established (longer, more specific)
      const currentLength = currentStep.domain.length
      const nextLength = nextStep.domain.length

      // Shorter/newer-looking domain redirecting to longer/established domain
      if (currentLength < nextLength - 5) {
        return true
      }
    }
  }

  return false
}

/**
 * Extract celebrity/public figure names from text
 */
export function extractCelebrityNames(textContent: string): string[] {
  const figures: string[] = []

  // Common Indonesian celebrities (examples)
  const indoCelebrities = [
    'raffi ahmad',
    'nagita slavina',
    'prilly latuconsina',
    'aliando',
    'jokowi',
    'ahok',
    'prabowo',
    'ganjar'
  ]

  // Common international celebrities (examples)
  const intCelebrities = [
    'elon musk',
    'bill gates',
    'jeff bezos',
    'mark zuckerberg',
    'taylor swift',
    'justin bieber',
    'kim kardashian',
    'kylie jenner'
  ]

  const lowerText = textContent.toLowerCase()

  const allCelebrities = [...indoCelebrities, ...intCelebrities]

  for (const celebrity of allCelebrities) {
    if (lowerText.includes(celebrity)) {
      figures.push(celebrity)
    }
  }

  return figures
}

/**
 * Detect endorsement quotes
 */
export function detectEndorsementQuotes(textContent: string): boolean {
  const lowerText = textContent.toLowerCase()

  // Endorsement patterns
  const endorsementPatterns = [
    /rekomendasi\s+\w+/gi,
    /direkomendasikan\s+oleh/gi,
    /dipakai\s+oleh/gi,
    /digunakan\s+oleh/gi,
    /testimoni/gi,
    /testimony/gi,
    /endorse\s+/gi,
    /endorsed\s+by/gi
  ]

  return endorsementPatterns.some((pattern) => pattern.test(lowerText))
}

/**
 * Extract brand mentions from text
 */
export function extractBrandMentions(textContent: string): string[] {
  const brands: string[] = []

  // Common brand keywords (examples)
  const brandPatterns = [
    /apple\s+(iphone|macbook|ipad)/gi,
    /samsung\s+(galaxy|smartphone)/gi,
    /nike/gi,
    /adidas/gi,
    /louis\s+vuitton/gi,
    /gucci/gi,
    /hermès/gi,
    /chanel/gi
  ]

  const lowerText = textContent.toLowerCase()

  for (const pattern of brandPatterns) {
    const matches = lowerText.match(pattern)
    if (matches) {
      brands.push(...matches)
    }
  }

  // Remove duplicates
  return Array.from(new Set(brands))
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract text content from HTML
 */
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
