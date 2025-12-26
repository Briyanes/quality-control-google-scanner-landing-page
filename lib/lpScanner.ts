import { checkRedirectChain, hasThirdPartyRedirect, getFinalUrl, extractDomain } from './redirectChecker'
import { parseHTMLStructure } from './htmlParser'
import { analyzeContent } from './contentAnalyzer'
import { analyzeWithAI } from './aiAnalyzer'
import { ScanResult, Requirement, RequirementCategory, AIAnalysisResult } from './types'

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
  let aiAnalysis: AIAnalysisResult | undefined
  try {
    const apiKey = process.env.Z_AI_API_KEY
    const apiUrl = process.env.Z_AI_API_URL
    const result = await analyzeWithAI(html, url, apiKey, apiUrl)
    aiAnalysis = result || undefined
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
    name: 'URL Tujuan Cocok',
    status: url === finalUrl ? 'pass' : 'warning',
    description: url === finalUrl
      ? 'URL tampilan cocok dengan URL final'
      : `Redirect dari ${url} ke ${finalUrl}`,
    recommendation: url !== finalUrl
      ? 'Pertimbangkan untuk menggunakan URL final secara langsung untuk meningkatkan pengalaman pengguna'
      : undefined,
    points: url === finalUrl ? 10 : 5
  })

  // Check 2: No third-party redirects
  const hasThirdParty = hasThirdPartyRedirect(redirectChain, originalDomain)
  requirements.push({
    name: 'Tidak Ada Redirect Pihak Ketiga',
    status: hasThirdParty ? 'fail' : 'pass',
    description: hasThirdParty
      ? 'Rantai redirect mencakup domain pihak ketiga'
      : 'Semua redirect berada dalam domain yang sama',
    evidence: hasThirdParty
      ? redirectChain.map(r => r.url).join(' → ')
      : undefined,
    recommendation: hasThirdParty
      ? 'Hapus redirect pihak ketiga untuk mematuhi kebijakan Google Ads'
      : undefined,
    points: hasThirdParty ? 0 : 10
  })

  // Check 3: Redirect count
  const redirectCount = redirectChain.filter(r => r.isRedirect).length
  requirements.push({
    name: 'Jumlah Redirect Wajar',
    status: redirectCount <= 2 ? 'pass' : redirectCount <= 5 ? 'warning' : 'fail',
    description: `${redirectCount} redirect terdeteksi`,
    recommendation: redirectCount > 2
      ? 'Kurangi jumlah redirect untuk meningkatkan kecepatan load halaman'
      : undefined,
    points: redirectCount <= 2 ? 5 : redirectCount <= 5 ? 3 : 0
  })

  const passed = requirements.filter(r => r.status === 'pass').length
  const failed = requirements.filter(r => r.status === 'fail').length
  const warnings = requirements.filter(r => r.status === 'warning').length
  const totalPoints = requirements.reduce((sum, r) => sum + r.points, 0)

  return {
    categoryName: 'Kebijakan Domain & Redirect',
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
    name: 'Konten Substansial',
    status: contentAnalysis.hasSubstantialContent ? 'pass' : 'fail',
    description: `${contentAnalysis.textLength} karakter teks terlihat`,
    recommendation: !contentAnalysis.hasSubstantialContent
      ? 'Tambahkan konten yang lebih bermakna untuk memberikan nilai kepada pengunjung'
      : undefined,
    points: contentAnalysis.hasSubstantialContent ? 8 : 0
  })

  // Check 2: No arbitrage
  requirements.push({
    name: 'Tidak Ada Arbitrase Iklan',
    status: !contentAnalysis.hasArbitragePattern ? 'pass' : 'fail',
    description: contentAnalysis.hasArbitragePattern
      ? 'Halaman tampak memiliki lebih banyak iklan daripada konten'
      : 'Keseimbangan yang baik antara konten dan iklan',
    recommendation: contentAnalysis.hasArbitragePattern
      ? 'Kurangi iklan dan tambahkan lebih banyak konten orisinal'
      : undefined,
    points: !contentAnalysis.hasArbitragePattern ? 8 : 0
  })

  // Check 3: Text to HTML ratio
  requirements.push({
    name: 'Kepadatan Konten',
    status: contentAnalysis.textToHTMLRatio > 0.15 ? 'pass' : 'warning',
    description: `Rasio teks ke HTML: ${(contentAnalysis.textToHTMLRatio * 100).toFixed(1)}%`,
    recommendation: contentAnalysis.textToHTMLRatio <= 0.15
      ? 'Tingkatkan rasio konten-ke-kode untuk SEO yang lebih baik'
      : undefined,
    points: contentAnalysis.textToHTMLRatio > 0.15 ? 7 : 3
  })

  // Check 4: Unique content (from AI if available)
  if (aiAnalysis?.contentOriginality) {
    requirements.push({
      name: 'Orisinalitas Konten',
      status: aiAnalysis.contentOriginality.isUnique ? 'pass' : 'fail',
      description: `Skor keunikan AI: ${aiAnalysis.contentOriginality.score}/100`,
      recommendation: !aiAnalysis.contentOriginality.isUnique
      ? 'Pastikan konten orisinal dan tidak diambil dari sumber lain'
      : undefined,
      points: aiAnalysis.contentOriginality.isUnique ? 7 : 0
    })
  } else {
    // Fallback: check duplicate pattern
    requirements.push({
      name: 'Keunikan Konten',
      status: !contentAnalysis.hasDuplicatePattern ? 'pass' : 'warning',
      description: 'Konten tampak unik berdasarkan analisis teks',
      recommendation: contentAnalysis.hasDuplicatePattern
        ? 'Pertimbangkan untuk menambahkan lebih banyak konten unik dan berharga'
        : undefined,
      points: !contentAnalysis.hasDuplicatePattern ? 7 : 3
    })
  }

  const passed = requirements.filter(r => r.status === 'pass').length
  const failed = requirements.filter(r => r.status === 'fail').length
  const warnings = requirements.filter(r => r.status === 'warning').length
  const totalPoints = requirements.reduce((sum, r) => sum + r.points, 0)

  return {
    categoryName: 'Orisinalitas & Kualitas Konten',
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
    name: 'Formulir Tersemat',
    status: !hasExternalFormAction ? 'pass' : htmlStructure.hasEmbeddedForms ? 'warning' : 'pass',
    description: htmlStructure.hasEmbeddedForms
      ? hasExternalFormAction
        ? 'Formulir mengarah ke domain eksternal'
        : 'Formulir tersemat di halaman'
      : 'Tidak ada formulir yang terdeteksi di halaman ini',
    evidence: htmlStructure.formActions.length > 0
      ? htmlStructure.formActions.join(', ')
      : undefined,
    recommendation: hasExternalFormAction
      ? 'Sematkan formulir langsung di landing page alih-alih melakukan redirect'
      : undefined,
    points: !hasExternalFormAction ? 10 : htmlStructure.hasEmbeddedForms ? 5 : 10
  })

  // Check 2: No excessive iframes
  requirements.push({
    name: 'Penggunaan Iframe Minimal',
    status: htmlStructure.iframes.length <= 2 ? 'pass' : 'warning',
    description: `${htmlStructure.iframes.length} iframe terdeteksi`,
    recommendation: htmlStructure.iframes.length > 2
      ? 'Kurangi penggunaan iframe untuk performa dan pengalaman pengguna yang lebih baik'
      : undefined,
    points: htmlStructure.iframes.length <= 2 ? 5 : 2
  })

  // Check 3: No excessive external scripts
  requirements.push({
    name: 'Optimasi Script',
    status: htmlStructure.externalScripts.length <= 10 ? 'pass' : 'warning',
    description: `${htmlStructure.externalScripts.length} script eksternal`,
    recommendation: htmlStructure.externalScripts.length > 10
      ? 'Pertimbangkan untuk mengurangi script eksternal untuk performa yang lebih baik'
      : undefined,
    points: htmlStructure.externalScripts.length <= 10 ? 5 : 2
  })

  const passed = requirements.filter(r => r.status === 'pass').length
  const failed = requirements.filter(r => r.status === 'fail').length
  const warnings = requirements.filter(r => r.status === 'warning').length
  const totalPoints = requirements.reduce((sum, r) => sum + r.points, 0)

  return {
    categoryName: 'Formulir & Integrasi Pihak Ketiga',
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
    name: 'Footer Ada',
    status: htmlStructure.hasFooter ? 'pass' : 'warning',
    description: htmlStructure.hasFooter
      ? 'Halaman memiliki bagian footer'
      : 'Tidak ada footer yang jelas terdeteksi',
    recommendation: !htmlStructure.hasFooter
      ? 'Tambahkan footer dengan informasi perusahaan dan link kebijakan'
      : undefined,
    points: htmlStructure.hasFooter ? 5 : 2
  })

  // Check 2: Company information
  requirements.push({
    name: 'Informasi Perusahaan',
    status: htmlStructure.hasCompanyInfo ? 'pass' : 'fail',
    description: htmlStructure.hasCompanyInfo
      ? 'Informasi perusahaan ditemukan di halaman'
      : 'Tidak ada informasi perusahaan yang jelas terdeteksi',
    recommendation: !htmlStructure.hasCompanyInfo
      ? 'Tambahkan nama perusahaan, detail kontak, dan informasi bisnis'
      : undefined,
    points: htmlStructure.hasCompanyInfo ? 7 : 0
  })

  // Check 3: Privacy policy link
  requirements.push({
    name: 'Link Kebijakan Privasi',
    status: htmlStructure.hasPolicyLinks.privacy ? 'pass' : 'fail',
    description: htmlStructure.hasPolicyLinks.privacy
      ? 'Link kebijakan privasi ditemukan'
      : 'Tidak ada link kebijakan privasi terdeteksi',
    recommendation: !htmlStructure.hasPolicyLinks.privacy
      ? 'Tambahkan link ke kebijakan privasi Anda'
      : undefined,
    points: htmlStructure.hasPolicyLinks.privacy ? 5 : 0
  })

  // Check 4: Terms of service link
  requirements.push({
    name: 'Link Syarat Ketentuan',
    status: htmlStructure.hasPolicyLinks.terms ? 'pass' : 'warning',
    description: htmlStructure.hasPolicyLinks.terms
      ? 'Link syarat ketentuan ditemukan'
      : 'Tidak ada link syarat ketentuan terdeteksi',
    recommendation: !htmlStructure.hasPolicyLinks.terms
      ? 'Tambahkan link ke syarat ketentuan'
      : undefined,
    points: htmlStructure.hasPolicyLinks.terms ? 4 : 1
  })

  // Check 5: Contact information
  requirements.push({
    name: 'Informasi Kontak',
    status: htmlStructure.hasPolicyLinks.contact ? 'pass' : 'warning',
    description: htmlStructure.hasPolicyLinks.contact
      ? 'Informasi/link kontak ditemukan'
      : 'Tidak ada informasi kontak yang jelas terdeteksi',
    recommendation: !htmlStructure.hasPolicyLinks.contact
      ? 'Tambahkan informasi kontak atau link ke halaman kontak'
      : undefined,
    points: htmlStructure.hasPolicyLinks.contact ? 4 : 1
  })

  const passed = requirements.filter(r => r.status === 'pass').length
  const failed = requirements.filter(r => r.status === 'fail').length
  const warnings = requirements.filter(r => r.status === 'warning').length
  const totalPoints = requirements.reduce((sum, r) => sum + r.points, 0)

  return {
    categoryName: 'Footer & Informasi Perusahaan',
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
