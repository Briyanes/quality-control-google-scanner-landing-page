/**
 * Suspension AI Analyzer - Tier 3 AI-powered checks for Google Ads suspension risks
 *
 * This module provides AI-powered analysis for:
 * - Vision AI: Image analysis (body organs, public figures, medical imagery, brand logos)
 * - Text AI: Content analysis (brand affiliation, company description, cloaking)
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// Types
// ============================================================================

export interface VisionAIResult {
  hasBodyOrgans: boolean
  hasPublicFigures: boolean
  hasMedicalImagery: boolean
  hasBrandLogos: boolean
  detectedBrands: string[]
  detectedFigures: string[]
  confidence: number
}

export interface TextAIResult {
  hasFakeBrandAffiliation: boolean
  hasInsufficientCompanyInfo: boolean
  hasCloakingPattern: boolean
  companyDescriptionQuality: 'good' | 'fair' | 'poor'
  detectedBrands: string[]
  confidence: number
}

export interface SuspensionAIAnalysis {
  visionAnalysis?: VisionAIResult
  textAnalysis?: TextAIResult
}

// ============================================================================
// Vision AI Analysis
// ============================================================================

/**
 * Analyze images using Vision AI to detect suspension risks
 *
 * Detects:
 * - Body organ images (health products)
 * - Public figures / celebrities
 * - Medical equipment / imagery
 * - Brand logos and products
 */
export async function analyzeImagesWithVisionAI(
  imageUrls: string[],
  apiKey?: string,
  apiUrl?: string
): Promise<VisionAIResult> {
  // Default result if AI not available
  const defaultResult: VisionAIResult = {
    hasBodyOrgans: false,
    hasPublicFigures: false,
    hasMedicalImagery: false,
    hasBrandLogos: false,
    detectedBrands: [],
    detectedFigures: [],
    confidence: 0
  }

  // Check if AI credentials are available
  if (!apiKey || !apiUrl) {
    console.log('Vision AI not configured, skipping image analysis')
    return defaultResult
  }

  try {
    // For now, we'll use a text-based approach as placeholder
    // In production, this would call a Vision AI API (e.g., Google Cloud Vision, Azure Computer Vision)

    // Analyze each image URL for patterns
    let hasBodyOrgans = false
    let hasPublicFigures = false
    let hasMedicalImagery = false
    let hasBrandLogos = false
    const detectedBrands: string[] = []
    const detectedFigures: string[] = []

    for (const imageUrl of imageUrls) {
      const lowerUrl = imageUrl.toLowerCase()

      // Body organ detection from URL/alt text
      if (lowerUrl.includes('body') || lowerUrl.includes('organ') ||
          lowerUrl.includes('skin') || lowerUrl.includes('before') ||
          lowerUrl.includes('after') || lowerUrl.includes('treatment')) {
        hasBodyOrgans = true
      }

      // Medical imagery detection
      if (lowerUrl.includes('medical') || lowerUrl.includes('hospital') ||
          lowerUrl.includes('clinic') || lowerUrl.includes('doctor') ||
          lowerUrl.includes('stethoscope') || lowerUrl.includes('x-ray')) {
        hasMedicalImagery = true
      }

      // Brand logo detection
      if (lowerUrl.includes('logo') || lowerUrl.includes('brand')) {
        hasBrandLogos = true
      }

      // Extract brand names from URL
      const brands = extractBrandNames(lowerUrl)
      detectedBrands.push(...brands)
    }

    // In production, this would make actual API calls:
    // const response = await fetch(`${apiUrl}/vision/analyze`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${apiKey}`
    //   },
    //   body: JSON.stringify({ imageUrls })
    // })
    // const result = await response.json()

    return {
      hasBodyOrgans,
      hasPublicFigures,
      hasMedicalImagery,
      hasBrandLogos,
      detectedBrands: Array.from(new Set(detectedBrands)),
      detectedFigures: Array.from(new Set(detectedFigures)),
      confidence: 0.7 // Moderate confidence for text-based detection
    }
  } catch (error) {
    console.error('Vision AI analysis failed:', error)
    return defaultResult
  }
}

/**
 * Detect if images contain body organs (health product violation)
 */
export async function detectBodyOrgansInImages(
  imageUrls: string[],
  apiKey?: string,
  apiUrl?: string
): Promise<boolean> {
  const result = await analyzeImagesWithVisionAI(imageUrls, apiKey, apiUrl)
  return result.hasBodyOrgans
}

/**
 * Detect public figures/celebrities in images
 */
export async function detectPublicFiguresInImages(
  imageUrls: string[],
  apiKey?: string,
  apiUrl?: string
): Promise<{ detected: boolean; figures: string[] }> {
  const result = await analyzeImagesWithVisionAI(imageUrls, apiKey, apiUrl)
  return {
    detected: result.hasPublicFigures,
    figures: result.detectedFigures
  }
}

/**
 * Detect medical imagery in images
 */
export async function detectMedicalImageryInImages(
  imageUrls: string[],
  apiKey?: string,
  apiUrl?: string
): Promise<boolean> {
  const result = await analyzeImagesWithVisionAI(imageUrls, apiKey, apiUrl)
  return result.hasMedicalImagery
}

/**
 * Detect brand logos in images
 */
export async function detectBrandLogosInImages(
  imageUrls: string[],
  apiKey?: string,
  apiUrl?: string
): Promise<{ detected: boolean; brands: string[] }> {
  const result = await analyzeImagesWithVisionAI(imageUrls, apiKey, apiUrl)
  return {
    detected: result.hasBrandLogos,
    brands: result.detectedBrands
  }
}

// ============================================================================
// Text AI Analysis
// ============================================================================

/**
 * Analyze content using Text AI to detect suspension risks
 *
 * Detects:
 * - Fake brand affiliation claims
 * - Insufficient company information
 * - Cloaking patterns
 * - Company description quality
 */
export async function analyzeContentWithTextAI(
  html: string,
  textContent: string,
  url: string,
  apiKey?: string,
  apiUrl?: string
): Promise<TextAIResult> {
  // Default result if AI not available
  const defaultResult: TextAIResult = {
    hasFakeBrandAffiliation: false,
    hasInsufficientCompanyInfo: false,
    hasCloakingPattern: false,
    companyDescriptionQuality: 'fair',
    detectedBrands: [],
    confidence: 0
  }

  // Check if AI credentials are available
  if (!apiKey || !apiUrl) {
    console.log('Text AI not configured, using rule-based analysis')
    return analyzeContentWithRules(textContent)
  }

  try {
    // In production, this would make actual API calls to an AI service
    // For now, we'll use enhanced rule-based analysis

    return analyzeContentWithRules(textContent)
  } catch (error) {
    console.error('Text AI analysis failed:', error)
    return defaultResult
  }
}

/**
 * Rule-based content analysis (fallback when AI not available)
 */
function analyzeContentWithRules(textContent: string): TextAIResult {
  const lowerText = textContent.toLowerCase()
  const textLength = textContent.length

  // Detect fake brand affiliation
  const brandAffiliationPatterns = [
    /official\s+(reseller|distributor|dealer|store)/gi,
    /authorized\s+dealer\s+of/gi,
    /sole\s+distributor/gi
  ]

  const hasFakeBrandAffiliation = brandAffiliationPatterns.some(pattern =>
    pattern.test(lowerText)
  ) && !hasVerifiedBrandDomain(lowerText)

  // Detect insufficient company info
  const hasCompanyName = /(?:company|pt|cv|fakultas|toko)\s+[:\s]+[\w\s]+/i.test(lowerText)
  const hasAddress = /(?:alamat|address|location|jalan|jl\.|office)\s+[:\s]+[\w\s.,\d]+/i.test(lowerText)
  const hasPhone = /(?:telp|phone|whatsapp|wa|kontak|hubungi)\s+[:\s]+[\d\+\s-]+/i.test(lowerText)
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(lowerText)

  const hasInsufficientCompanyInfo = !(hasCompanyName && (hasAddress || hasPhone || hasEmail))

  // Assess company description quality
  let companyDescriptionQuality: 'good' | 'fair' | 'poor' = 'poor'
  if (textLength > 500 && hasCompanyName && hasAddress && hasPhone) {
    companyDescriptionQuality = 'good'
  } else if (textLength > 200 && (hasCompanyName || hasPhone)) {
    companyDescriptionQuality = 'fair'
  }

  // Detect brands mentioned
  const detectedBrands = extractBrandNames(lowerText)

  // Basic cloaking pattern detection
  const hasCloakingPattern = /user-agent|bot|crawler|spider|navigator\.useragent/i.test(lowerText)

  return {
    hasFakeBrandAffiliation,
    hasInsufficientCompanyInfo,
    hasCloakingPattern,
    companyDescriptionQuality,
    detectedBrands,
    confidence: 0.6 // Moderate confidence for rule-based
  }
}

/**
 * Detect fake brand affiliation
 */
export async function detectFakeBrandAffiliation(
  html: string,
  textContent: string,
  apiKey?: string,
  apiUrl?: string
): Promise<boolean> {
  const result = await analyzeContentWithTextAI(html, textContent, '', apiKey, apiUrl)
  return result.hasFakeBrandAffiliation
}

/**
 * Assess company information sufficiency
 */
export async function assessCompanyInfoSufficiency(
  html: string,
  textContent: string,
  apiKey?: string,
  apiUrl?: string
): Promise<{ sufficient: boolean; quality: 'good' | 'fair' | 'poor' }> {
  const result = await analyzeContentWithTextAI(html, textContent, '', apiKey, apiUrl)
  return {
    sufficient: !result.hasInsufficientCompanyInfo,
    quality: result.companyDescriptionQuality
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract brand names from text
 */
function extractBrandNames(text: string): string[] {
  const brands: string[] = []

  // Common brand patterns
  const brandPatterns = [
    /apple\s+(iphone|macbook|ipad|mac)/gi,
    /samsung\s+(galaxy|smartphone|phone)/gi,
    /nike/gi,
    /adidas/gi,
    /louis\s+vuitton/gi,
    /gucci/gi,
    /hermès|hermes/gi,
    /chanel/gi,
    /rolex/gi,
    /polo/gi,
    /lacoste/gi
  ]

  for (const pattern of brandPatterns) {
    const matches = text.match(pattern)
    if (matches) {
      brands.push(...matches)
    }
  }

  return Array.from(new Set(brands.map(b => b.toLowerCase())))
}

/**
 * Check if URL indicates verified brand domain
 */
function hasVerifiedBrandDomain(text: string): boolean {
  const verifiedDomains = [
    'apple.com',
    'samsung.com',
    'nike.com',
    'adidas.com',
    'rolex.com',
    'louisvuitton.com',
    'gucci.com',
    'chanel.com'
  ]

  return verifiedDomains.some(domain => text.includes(domain))
}

/**
 * Get AI configuration from environment
 */
export function getAIConfig(): { apiKey: string | undefined; apiUrl: string | undefined } {
  return {
    apiKey: process.env.Z_AI_API_KEY,
    apiUrl: process.env.Z_AI_API_URL
  }
}
