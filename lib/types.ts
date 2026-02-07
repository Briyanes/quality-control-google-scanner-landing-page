// Error Types for Fetch Failures
export type FetchErrorType =
  | 'timeout'
  | 'connection'
  | 'ssl'
  | 'blocked'
  | 'cloudflare_blocked'
  | 'not_found'
  | 'server_error'
  | 'unknown'

// Custom Scan Error Class
export class ScanError extends Error {
  constructor(
    message: string,
    public errorType: FetchErrorType,
    public details?: string
  ) {
    super(message)
    this.name = 'ScanError'
  }
}

// Enhanced Accessibility Result
export interface AccessibilityResult {
  accessible: boolean
  errorType?: FetchErrorType
  errorDetails?: string
  statusCode?: number
  attempts: number
  finalUrl?: string
}

// Scanner Types

export interface RedirectStep {
  url: string
  statusCode: number
  domain: string
  isRedirect: boolean
  isThirdParty?: boolean
}

export interface HTMLStructure {
  hasFooter: boolean
  hasCompanyInfo: boolean
  hasPolicyLinks: {
    privacy: boolean
    terms: boolean
    contact: boolean
  }
  hasEmbeddedForms: boolean
  formActions: string[]
  externalScripts: string[]
  iframes: string[]
  title: string
  description: string
}

export interface ContentAnalysis {
  textLength: number
  textToHTMLRatio: number
  hasSubstantialContent: boolean
  adDensity: number
  hasArbitragePattern: boolean
  hasDuplicatePattern: boolean
  hasAffiliateLinks: boolean
  externalLinkCount: number
  contentHash: string
  imageAnalysis?: ImageAnalysis
}

export interface ImageAnalysis {
  totalImages: number
  uniqueImages: number
  duplicateCount: number
  duplicateRatio: number
  hasExcessiveDuplicates: boolean
  duplicateImageUrls: string[] // URLs that appear more than once
}

export interface AIAnalysisResult {
  contentOriginality: {
    score: number
    isUnique: boolean
    similarityScore: number
  }
  contentQuality: {
    score: number
    hasValue: boolean
    isArbitrage: boolean
  }
  structureAnalysis: {
    hasFooter: boolean
    hasCompanyInfo: boolean
    hasPolicyLinks: boolean
    hasEmbeddedForms: boolean
  }
  recommendations: string[]
}

// Suspension Analysis Types
export interface SuspensionAnalysis {
  multipleAccountAbuse: {
    hasPattern: boolean
    sameEmailDetected: boolean
    sameImagesDetected: boolean
    sameDomainDetected: boolean
    newToOldRedirect: boolean
    evidence?: string
  }
  unacceptableBusinessPractice: {
    bodyOrganImages: boolean
    homepageMismatch: boolean
    weaponsIllegalGoods: boolean
    medicalImagery: boolean
    religiousPromotion: boolean
    fakeBrandAffiliation: boolean
    insufficientCompanyInfo: boolean
    evidence?: string[]
  }
  publicFigureImpersonation: {
    detected: boolean
    publicFigures: string[]
    fakeEndorsements: boolean
    evidence?: string
  }
  technicalCircumvention: {
    cloaking: boolean
    hiddenUrls: boolean
    autoRedirects: boolean
    excessiveImages: boolean
    evidence?: string[]
  }
  counterfeitGoods: {
    brandProductPhotos: boolean
    brandLogos: boolean
    fakeOfficialStore: boolean
    detectedBrands: string[]
    evidence?: string[]
  }
}

export interface Requirement {
  name: string
  status: 'pass' | 'fail' | 'warning'
  description: string
  recommendation?: string
  evidence?: string
  points: number
}

export interface RequirementCategory {
  categoryName: string
  passed: number
  failed: number
  warnings: number
  totalPoints: number
  maxPoints: number
  requirements: Requirement[]
}

export interface ScanResult {
  url: string
  finalUrl: string
  score: number
  grade: string
  requirements: {
    domainAndRedirect: RequirementCategory
    contentOriginality: RequirementCategory
    formAndIntegration: RequirementCategory
    footerAndCompany: RequirementCategory
    suspensionRisk: RequirementCategory
  }
  redirectChain: RedirectStep[]
  htmlStructure: HTMLStructure
  contentAnalysis: ContentAnalysis
  aiAnalysis?: AIAnalysisResult
  suspensionAnalysis: SuspensionAnalysis
  timestamp: string
}
