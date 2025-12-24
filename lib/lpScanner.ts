import { checkRedirectChain, hasThirdPartyRedirect, getFinalUrl, extractDomain } from './redirectChecker'
import { parseHTMLStructure } from './htmlParser'
import { analyzeContent } from './contentAnalyzer'
import { analyzeWithAI } from './aiAnalyzer'
import { ScanResult, Requirement, RequirementCategory } from './types'

export async function scanLandingPage(url: string): Promise<ScanResult> {
  const startTime = Date.now()

  // Step 1: Fetch landing page
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
  }

  const html = await response.text()
  const finalUrl = response.url

  // Step 2: Check redirect chain
  const redirectChain = await checkRedirectChain(url)
  const originalDomain = extractDomain(url)
  const finalDomain = extractDomain(finalUrl)

  // Step 3: Parse HTML structure
  const htmlStructure = parseHTMLStructure(html, url)

  // Step 4: Analyze content
  const contentAnalysis = analyzeContent(html, url)

  // Step 5: AI Analysis (optional, can fail gracefully)
  let aiAnalysis
  try {
    const apiKey = process.env.Z_AI_API_KEY!
    const apiUrl = process.env.Z_AI_API_URL!
    aiAnalysis = await analyzeWithAI(html, url, apiKey, apiUrl)
  } catch (error) {
    console.error('AI analysis failed, continuing without it:', error)
  }

  // Step 6: Evaluate requirements
  const requirements = {
    domainAndRedirect: evaluateDomainAndRedirect(
      url,
      finalUrl,
      redirectChain,
      originalDomain,
      finalDomain
    ),
    contentOriginality: evaluateContentOriginality(contentAnalysis, aiAnalysis),
    formAndIntegration: evaluateFormAndIntegration(htmlStructure),
    footerAndCompany: evaluateFooterAndCompany(htmlStructure)
  }

  // Step 7: Calculate score
  const score = calculateScore(requirements)

  // Step 8: Assign grade
  const grade = assignGrade(score)

  return {
    url,
    finalUrl,
    score,
    grade,
    requirements,
    redirectChain,
    htmlStructure,
    contentAnalysis,
    aiAnalysis,
    timestamp: new Date().toISOString()
  }
}

function evaluateDomainAndRedirect(
  url: string,
  finalUrl: string,
  redirectChain: any[],
  originalDomain: string,
  finalDomain: string
): RequirementCategory {
  const requirements: Requirement[] = []

  // Check 1: URL consistency
  requirements.push({
    name: 'Destination URL Match',
    status: url === finalUrl ? 'pass' : 'warning',
    description: url === finalUrl
      ? 'Display URL matches final URL'
      : `Redirects from ${url} to ${finalUrl}`,
    recommendation: url !== finalUrl
      ? 'Consider using the final URL directly to improve user experience'
      : undefined,
    points: url === finalUrl ? 10 : 5
  })

  // Check 2: No third-party redirects
  const hasThirdParty = hasThirdPartyRedirect(redirectChain, originalDomain)
  requirements.push({
    name: 'No Third-Party Redirects',
    status: hasThirdParty ? 'fail' : 'pass',
    description: hasThirdParty
      ? 'Redirect chain includes third-party domains'
      : 'All redirects stay within the same domain',
    evidence: hasThirdParty
      ? redirectChain.map(r => r.url).join(' → ')
      : undefined,
    recommendation: hasThirdParty
      ? 'Remove third-party redirects to comply with Google Ads policies'
      : undefined,
    points: hasThirdParty ? 0 : 10
  })

  // Check 3: Redirect count
  const redirectCount = redirectChain.filter(r => r.isRedirect).length
  requirements.push({
    name: 'Reasonable Redirect Count',
    status: redirectCount <= 2 ? 'pass' : redirectCount <= 5 ? 'warning' : 'fail',
    description: `${redirectCount} redirect(s) detected`,
    recommendation: redirectCount > 2
      ? 'Reduce redirect count to improve page load speed'
      : undefined,
    points: redirectCount <= 2 ? 5 : redirectCount <= 5 ? 3 : 0
  })

  const passed = requirements.filter(r => r.status === 'pass').length
  const failed = requirements.filter(r => r.status === 'fail').length
  const warnings = requirements.filter(r => r.status === 'warning').length
  const totalPoints = requirements.reduce((sum, r) => sum + r.points, 0)

  return {
    categoryName: 'Domain & Redirect Policy',
    passed,
    failed,
    warnings,
    totalPoints,
    maxPoints: 25,
    requirements
  }
}

function evaluateContentOriginality(contentAnalysis: any, aiAnalysis: any): RequirementCategory {
  const requirements: Requirement[] = []

  // Check 1: Substantial content
  requirements.push({
    name: 'Substantial Content',
    status: contentAnalysis.hasSubstantialContent ? 'pass' : 'fail',
    description: `${contentAnalysis.textLength} characters of visible text`,
    recommendation: !contentAnalysis.hasSubstantialContent
      ? 'Add more meaningful content to provide value to visitors'
      : undefined,
    points: contentAnalysis.hasSubstantialContent ? 8 : 0
  })

  // Check 2: No arbitrage
  requirements.push({
    name: 'No Ad Arbitrage',
    status: !contentAnalysis.hasArbitragePattern ? 'pass' : 'fail',
    description: contentAnalysis.hasArbitragePattern
      ? 'Page appears to have more ads than content'
      : 'Good balance of content and advertisements',
    recommendation: contentAnalysis.hasArbitragePattern
      ? 'Reduce advertisements and add more original content'
      : undefined,
    points: !contentAnalysis.hasArbitragePattern ? 8 : 0
  })

  // Check 3: Text to HTML ratio
  requirements.push({
    name: 'Content Density',
    status: contentAnalysis.textToHTMLRatio > 0.15 ? 'pass' : 'warning',
    description: `Text to HTML ratio: ${(contentAnalysis.textToHTMLRatio * 100).toFixed(1)}%`,
    recommendation: contentAnalysis.textToHTMLRatio <= 0.15
      ? 'Improve content-to-code ratio for better SEO'
      : undefined,
    points: contentAnalysis.textToHTMLRatio > 0.15 ? 7 : 3
  })

  // Check 4: Unique content (from AI if available)
  if (aiAnalysis?.contentOriginality) {
    requirements.push({
      name: 'Content Originality',
      status: aiAnalysis.contentOriginality.isUnique ? 'pass' : 'fail',
      description: `AI uniqueness score: ${aiAnalysis.contentOriginality.score}/100`,
      recommendation: !aiAnalysis.contentOriginality.isUnique
      ? 'Ensure content is original and not scraped from other sources'
      : undefined,
      points: aiAnalysis.contentOriginality.isUnique ? 7 : 0
    })
  } else {
    // Fallback: check duplicate pattern
    requirements.push({
      name: 'Content Uniqueness',
      status: !contentAnalysis.hasDuplicatePattern ? 'pass' : 'warning',
      description: 'Content appears to be unique based on text analysis',
      recommendation: contentAnalysis.hasDuplicatePattern
        ? 'Consider adding more unique, valuable content'
        : undefined,
      points: !contentAnalysis.hasDuplicatePattern ? 7 : 3
    })
  }

  const passed = requirements.filter(r => r.status === 'pass').length
  const failed = requirements.filter(r => r.status === 'fail').length
  const warnings = requirements.filter(r => r.status === 'warning').length
  const totalPoints = requirements.reduce((sum, r) => sum + r.points, 0)

  return {
    categoryName: 'Content Originality & Quality',
    passed,
    failed,
    warnings,
    totalPoints,
    maxPoints: 30,
    requirements
  }
}

function evaluateFormAndIntegration(htmlStructure: any): RequirementCategory {
  const requirements: Requirement[] = []

  // Check 1: Forms are embedded (no external form redirects)
  const hasExternalFormAction = htmlStructure.formActions.some((action: string) => {
    if (action.startsWith('http')) {
      const formDomain = extractDomain(action)
      return !htmlStructure.formActions.some((a: string) => a.includes(formDomain))
    }
    return false
  })

  requirements.push({
    name: 'Embedded Forms',
    status: !hasExternalFormAction ? 'pass' : htmlStructure.hasEmbeddedForms ? 'warning' : 'pass',
    description: htmlStructure.hasEmbeddedForms
      ? hasExternalFormAction
        ? 'Forms redirect to external domains'
        : 'Forms are embedded on the page'
      : 'No forms detected on this page',
    evidence: htmlStructure.formActions.length > 0
      ? htmlStructure.formActions.join(', ')
      : undefined,
    recommendation: hasExternalFormAction
      ? 'Embed forms directly on the landing page instead of redirecting'
      : undefined,
    points: !hasExternalFormAction ? 10 : htmlStructure.hasEmbeddedForms ? 5 : 10
  })

  // Check 2: No excessive iframes
  requirements.push({
    name: 'Minimal Iframe Usage',
    status: htmlStructure.iframes.length <= 2 ? 'pass' : 'warning',
    description: `${htmlStructure.iframes.length} iframe(s) detected`,
    recommendation: htmlStructure.iframes.length > 2
      ? 'Reduce iframe usage for better performance and user experience'
      : undefined,
    points: htmlStructure.iframes.length <= 2 ? 5 : 2
  })

  // Check 3: No excessive external scripts
  requirements.push({
    name: 'Script Optimization',
    status: htmlStructure.externalScripts.length <= 10 ? 'pass' : 'warning',
    description: `${htmlStructure.externalScripts.length} external script(s)`,
    recommendation: htmlStructure.externalScripts.length > 10
      ? 'Consider reducing external scripts for better performance'
      : undefined,
    points: htmlStructure.externalScripts.length <= 10 ? 5 : 2
  })

  const passed = requirements.filter(r => r.status === 'pass').length
  const failed = requirements.filter(r => r.status === 'fail').length
  const warnings = requirements.filter(r => r.status === 'warning').length
  const totalPoints = requirements.reduce((sum, r) => sum + r.points, 0)

  return {
    categoryName: 'Form & Third-Party Integration',
    passed,
    failed,
    warnings,
    totalPoints,
    maxPoints: 20,
    requirements
  }
}

function evaluateFooterAndCompany(htmlStructure: any): RequirementCategory {
  const requirements: Requirement[] = []

  // Check 1: Has footer
  requirements.push({
    name: 'Footer Present',
    status: htmlStructure.hasFooter ? 'pass' : 'warning',
    description: htmlStructure.hasFooter
      ? 'Page has a footer section'
      : 'No clear footer detected',
    recommendation: !htmlStructure.hasFooter
      ? 'Add a footer with company information and policy links'
      : undefined,
    points: htmlStructure.hasFooter ? 5 : 2
  })

  // Check 2: Company information
  requirements.push({
    name: 'Company Information',
    status: htmlStructure.hasCompanyInfo ? 'pass' : 'fail',
    description: htmlStructure.hasCompanyInfo
      ? 'Company information found on page'
      : 'No clear company information detected',
    recommendation: !htmlStructure.hasCompanyInfo
      ? 'Add company name, contact details, and business information'
      : undefined,
    points: htmlStructure.hasCompanyInfo ? 7 : 0
  })

  // Check 3: Privacy policy link
  requirements.push({
    name: 'Privacy Policy Link',
    status: htmlStructure.hasPolicyLinks.privacy ? 'pass' : 'fail',
    description: htmlStructure.hasPolicyLinks.privacy
      ? 'Privacy policy link found'
      : 'No privacy policy link detected',
    recommendation: !htmlStructure.hasPolicyLinks.privacy
      ? 'Add a link to your privacy policy'
      : undefined,
    points: htmlStructure.hasPolicyLinks.privacy ? 5 : 0
  })

  // Check 4: Terms of service link
  requirements.push({
    name: 'Terms of Service Link',
    status: htmlStructure.hasPolicyLinks.terms ? 'pass' : 'warning',
    description: htmlStructure.hasPolicyLinks.terms
      ? 'Terms of service link found'
      : 'No terms of service link detected',
    recommendation: !htmlStructure.hasPolicyLinks.terms
      ? 'Add a link to your terms of service'
      : undefined,
    points: htmlStructure.hasPolicyLinks.terms ? 4 : 1
  })

  // Check 5: Contact information
  requirements.push({
    name: 'Contact Information',
    status: htmlStructure.hasPolicyLinks.contact ? 'pass' : 'warning',
    description: htmlStructure.hasPolicyLinks.contact
      ? 'Contact information/link found'
      : 'No clear contact information detected',
    recommendation: !htmlStructure.hasPolicyLinks.contact
      ? 'Add contact information or a contact page link'
      : undefined,
    points: htmlStructure.hasPolicyLinks.contact ? 4 : 1
  })

  const passed = requirements.filter(r => r.status === 'pass').length
  const failed = requirements.filter(r => r.status === 'fail').length
  const warnings = requirements.filter(r => r.status === 'warning').length
  const totalPoints = requirements.reduce((sum, r) => sum + r.points, 0)

  return {
    categoryName: 'Footer & Company Information',
    passed,
    failed,
    warnings,
    totalPoints,
    maxPoints: 25,
    requirements
  }
}

function calculateScore(requirements: {
  domainAndRedirect: RequirementCategory
  contentOriginality: RequirementCategory
  formAndIntegration: RequirementCategory
  footerAndCompany: RequirementCategory
}): number {
  const totalPoints =
    requirements.domainAndRedirect.totalPoints +
    requirements.contentOriginality.totalPoints +
    requirements.formAndIntegration.totalPoints +
    requirements.footerAndCompany.totalPoints

  const maxPoints =
    requirements.domainAndRedirect.maxPoints +
    requirements.contentOriginality.maxPoints +
    requirements.formAndIntegration.maxPoints +
    requirements.footerAndCompany.maxPoints

  return Math.round((totalPoints / maxPoints) * 100)
}

function assignGrade(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}
