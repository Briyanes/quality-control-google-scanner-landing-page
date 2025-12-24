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
  }
  redirectChain: RedirectStep[]
  htmlStructure: HTMLStructure
  contentAnalysis: ContentAnalysis
  aiAnalysis?: AIAnalysisResult
  timestamp: string
}
