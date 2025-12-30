import { checkRedirectChain, hasThirdPartyRedirect, getFinalUrl, extractDomain } from './redirectChecker'
import { parseHTMLStructure } from './htmlParser'
import { analyzeContent } from './contentAnalyzer'
import { analyzeWithAI } from './aiAnalyzer'
import { analyzeSuspensionRisk } from './suspensionAnalyzer'
import { ScanResult, Requirement, RequirementCategory, AIAnalysisResult, SuspensionAnalysis, ScanError } from './types'
import { fetchWithRetry } from './fetchUtils'

export async function scanLandingPage(url: string): Promise<ScanResult> {
  const startTime = Date.now()

  // Step 1: Fetch landing page with retry and timeout
  const fetchResult = await fetchWithRetry(url, {
    timeout: 30000,      // 30 seconds
    maxRetries: 3,       // Retry up to 3 times
    retryDelay: 1000     // Start with 1 second delay
  })

  if (!fetchResult.success || !fetchResult.data) {
    // Throw ScanError with specific error type
    throw new ScanError(
      `Failed to fetch URL: ${fetchResult.errorDetails || 'Unknown error'}`,
      fetchResult.errorType || 'unknown',
      fetchResult.errorDetails
    )
  }

  const html = fetchResult.data
  const finalUrl = fetchResult.finalUrl || url

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

  // Step 5.5: Suspension Risk Analysis
  const suspensionAnalysis = await analyzeSuspensionRisk(
    html,
    url,
    redirectChain,
    htmlStructure,
    contentAnalysis
  )

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
    footerAndCompany: evaluateFooterAndCompany(htmlStructure),
    suspensionRisk: evaluateSuspensionRisk(suspensionAnalysis)
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
    suspensionAnalysis,
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
      ? 'URL sesuai, tidak ada redirect'
      : `URL redirect ke ${finalUrl}`,
    recommendation: url !== finalUrl
      ? 'Pakai URL final langsung, jangan redirect'
      : undefined,
    points: url === finalUrl ? 10 : 5
  })

  // Check 2: No third-party redirects
  const hasThirdParty = hasThirdPartyRedirect(redirectChain, originalDomain)
  requirements.push({
    name: 'Tidak Ada Redirect Pihak Ketiga',
    status: hasThirdParty ? 'fail' : 'pass',
    description: hasThirdParty
      ? 'Redirect ke domain lain'
      : 'Tidak redirect ke domain lain',
    evidence: hasThirdParty
      ? redirectChain.map(r => r.url).join(' → ')
      : undefined,
    recommendation: hasThirdParty
      ? 'Hapus redirect ke domain lain, ini langgar Google Ads'
      : undefined,
    points: hasThirdParty ? 0 : 10
  })

  // Check 3: Redirect count
  const redirectCount = redirectChain.filter(r => r.isRedirect).length
  requirements.push({
    name: 'Jumlah Redirect Wajar',
    status: redirectCount <= 2 ? 'pass' : redirectCount <= 5 ? 'warning' : 'fail',
    description: `${redirectCount} kali redirect`,
    recommendation: redirectCount > 2
      ? 'Kurangi redirect, max 2 kali saja'
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
    description: `${contentAnalysis.textLength} karakter teks`,
    recommendation: !contentAnalysis.hasSubstantialContent
      ? 'Tulis minimal 500 karakter teks penjelasan'
      : undefined,
    points: contentAnalysis.hasSubstantialContent ? 8 : 0
  })

  // Check 2: No arbitrage
  requirements.push({
    name: 'Keseimbangan Konten & Iklan',
    status: !contentAnalysis.hasArbitragePattern ? 'pass' : 'fail',
    description: contentAnalysis.hasArbitragePattern
      ? 'Iklan terlalu banyak, konten kurang'
      : 'Konten lebih banyak dari iklan',
    recommendation: contentAnalysis.hasArbitragePattern
      ? 'Kurangi iklan, tambah teks produk'
      : undefined,
    points: !contentAnalysis.hasArbitragePattern ? 8 : 0
  })

  // Check 3: Text to HTML ratio
  requirements.push({
    name: 'Kepadatan Konten',
    status: contentAnalysis.textToHTMLRatio > 0.15 ? 'pass' : 'warning',
    description: `Rasio teks: ${(contentAnalysis.textToHTMLRatio * 100).toFixed(0)}%`,
    recommendation: contentAnalysis.textToHTMLRatio <= 0.15
      ? 'Tambah teks, kurangi kode HTML'
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
        ? 'Form mengarah ke website lain'
        : 'Form ada di halaman ini'
      : 'Tidak ada form',
    evidence: htmlStructure.formActions.length > 0
      ? htmlStructure.formActions.join(', ')
      : undefined,
    recommendation: hasExternalFormAction
      ? 'Taruh form langsung di halaman, jangan redirect ke lain'
      : undefined,
    points: !hasExternalFormAction ? 10 : htmlStructure.hasEmbeddedForms ? 5 : 10
  })

  // Check 2: No excessive iframes
  requirements.push({
    name: 'Penggunaan Iframe Minimal',
    status: htmlStructure.iframes.length <= 2 ? 'pass' : 'warning',
    description: `${htmlStructure.iframes.length} iframe`,
    recommendation: htmlStructure.iframes.length > 2
      ? 'Kurangi iframe, max 2 saja'
      : undefined,
    points: htmlStructure.iframes.length <= 2 ? 5 : 2
  })

  // Check 3: No excessive external scripts
  requirements.push({
    name: 'Optimasi Script',
    status: htmlStructure.externalScripts.length <= 10 ? 'pass' : 'warning',
    description: `${htmlStructure.externalScripts.length} script luar`,
    recommendation: htmlStructure.externalScripts.length > 10
      ? 'Kurangi script eksternal, biar cepat'
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
      ? 'Footer ada'
      : 'Footer tidak ditemukan',
    recommendation: !htmlStructure.hasFooter
      ? 'Tambah footer di bawah halaman'
      : undefined,
    points: htmlStructure.hasFooter ? 5 : 2
  })

  // Check 2: Company information
  requirements.push({
    name: 'Informasi Perusahaan',
    status: htmlStructure.hasCompanyInfo ? 'pass' : 'fail',
    description: htmlStructure.hasCompanyInfo
      ? 'Info perusahaan lengkap'
      : 'Info perusahaan kurang',
    recommendation: !htmlStructure.hasCompanyInfo
      ? 'Tambah nama toko, alamat, dan kontak'
      : undefined,
    points: htmlStructure.hasCompanyInfo ? 7 : 0
  })

  // Check 3: Privacy policy link
  requirements.push({
    name: 'Link Kebijakan Privasi',
    status: htmlStructure.hasPolicyLinks.privacy ? 'pass' : 'fail',
    description: htmlStructure.hasPolicyLinks.privacy
      ? 'Link privacy policy ada'
      : 'Link privacy policy tidak ada',
    recommendation: !htmlStructure.hasPolicyLinks.privacy
      ? 'Tambah link "Privacy Policy" di footer'
      : undefined,
    points: htmlStructure.hasPolicyLinks.privacy ? 5 : 0
  })

  // Check 4: Terms of service link
  requirements.push({
    name: 'Link Syarat Ketentuan',
    status: htmlStructure.hasPolicyLinks.terms ? 'pass' : 'warning',
    description: htmlStructure.hasPolicyLinks.terms
      ? 'Link terms & conditions ada'
      : 'Link terms & conditions tidak ada',
    recommendation: !htmlStructure.hasPolicyLinks.terms
      ? 'Tambah link "Terms & Conditions" di footer'
      : undefined,
    points: htmlStructure.hasPolicyLinks.terms ? 4 : 1
  })

  // Check 5: Contact information
  requirements.push({
    name: 'Informasi Kontak',
    status: htmlStructure.hasPolicyLinks.contact ? 'pass' : 'warning',
    description: htmlStructure.hasPolicyLinks.contact
      ? 'Info kontak ada'
      : 'Info kontak tidak jelas',
    recommendation: !htmlStructure.hasPolicyLinks.contact
      ? 'Tambah link "Contact" atau halaman kontak'
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

function evaluateSuspensionRisk(suspensionAnalysis: SuspensionAnalysis): RequirementCategory {
  const requirements: Requirement[] = []

  // 1. Multiple Account Abuse (10 points)
  requirements.push({
    name: 'Pola Multi-Account',
    status: !suspensionAnalysis.multipleAccountAbuse.hasPattern ? 'pass' : 'fail',
    description: suspensionAnalysis.multipleAccountAbuse.hasPattern
      ? 'Domain baru redirect ke domain lama'
      : 'Akun aman, tidak ada pola multi-account',
    evidence: suspensionAnalysis.multipleAccountAbuse.evidence,
    recommendation: suspensionAnalysis.multipleAccountAbuse.hasPattern
      ? 'Gunakan domain langsung, jangan redirect ke domain lama'
      : undefined,
    points: !suspensionAnalysis.multipleAccountAbuse.hasPattern ? 10 : 0
  })

  // 2. Unacceptable Business Practice (12 points)
  // Check for weapons/illegal goods
  requirements.push({
    name: 'Tidak Ada Barang Ilegal',
    status: !suspensionAnalysis.unacceptableBusinessPractice.weaponsIllegalGoods ? 'pass' : 'fail',
    description: suspensionAnalysis.unacceptableBusinessPractice.weaponsIllegalGoods
      ? 'Ditemukan kata kunci senjata/barang ilegal'
      : 'Tidak menjual barang ilegal',
    recommendation: suspensionAnalysis.unacceptableBusinessPractice.weaponsIllegalGoods
      ? 'Hapus semua konten tentang senjata atau barang ilegal'
      : undefined,
    points: !suspensionAnalysis.unacceptableBusinessPractice.weaponsIllegalGoods ? 2 : 0
  })

  // Check for religious promotion
  requirements.push({
    name: 'Promosi Agama Wajar',
    status: !suspensionAnalysis.unacceptableBusinessPractice.religiousPromotion ? 'pass' : 'warning',
    description: suspensionAnalysis.unacceptableBusinessPractice.religiousPromotion
      ? 'Terlalu banyak kata-kata agama di produk'
      : 'Promosi agama masih wajar',
    recommendation: suspensionAnalysis.unacceptableBusinessPractice.religiousPromotion
      ? 'Kurangi kata-kata agama, fokus ke manfaat produk'
      : undefined,
    points: !suspensionAnalysis.unacceptableBusinessPractice.religiousPromotion ? 2 : 1
  })

  // Check for fake official store
  requirements.push({
    name: 'Klaim Toko Resmi Valid',
    status: !suspensionAnalysis.counterfeitGoods.fakeOfficialStore ? 'pass' : 'warning',
    description: suspensionAnalysis.counterfeitGoods.fakeOfficialStore
      ? 'Klaim "toko resmi" tapi domain tidak resmi'
      : 'Tidak ada klaim toko resmi palsu',
    recommendation: suspensionAnalysis.counterfeitGoods.fakeOfficialStore
      ? 'Hapus kata "official" atau gunakan domain resmi brand'
      : undefined,
    points: !suspensionAnalysis.counterfeitGoods.fakeOfficialStore ? 2 : 1
  })

  // Other business practice checks (AI-dependent)
  const businessPracticeIssues = [
    suspensionAnalysis.unacceptableBusinessPractice.bodyOrganImages,
    suspensionAnalysis.unacceptableBusinessPractice.homepageMismatch,
    suspensionAnalysis.unacceptableBusinessPractice.medicalImagery,
    suspensionAnalysis.unacceptableBusinessPractice.fakeBrandAffiliation,
    suspensionAnalysis.unacceptableBusinessPractice.insufficientCompanyInfo
  ].filter(Boolean).length

  requirements.push({
    name: 'Praktik Bisnis Dapat Diterima',
    status: businessPracticeIssues === 0 ? 'pass' : businessPracticeIssues <= 2 ? 'warning' : 'fail',
    description: businessPracticeIssues === 0
      ? 'Praktik bisnis aman dan sesuai aturan'
      : 'Ada beberapa hal perlu dicek manual',
    evidence: suspensionAnalysis.unacceptableBusinessPractice.evidence?.join('; '),
    recommendation: businessPracticeIssues > 0
      ? 'Cek: tidak ada gambar organ tubuh, foto medis, atau klaim brand tanpa izin'
      : undefined,
    points: businessPracticeIssues === 0 ? 6 : businessPracticeIssues <= 2 ? 3 : 0
  })

  // 3. Public Figure Impersonation (5 points)
  requirements.push({
    name: 'Tidak Ada Impersonasi Figur Publik',
    status: !suspensionAnalysis.publicFigureImpersonation.detected ? 'pass' : 'fail',
    description: suspensionAnalysis.publicFigureImpersonation.detected
      ? `Ada nama figur publik: ${suspensionAnalysis.publicFigureImpersonation.publicFigures.join(', ')}`
      : 'Tidak pakai nama figur publik',
    evidence: suspensionAnalysis.publicFigureImpersonation.evidence,
    recommendation: suspensionAnalysis.publicFigureImpersonation.detected
      ? 'Hapus foto dan kata-kata tentang artis/figur publik'
      : undefined,
    points: !suspensionAnalysis.publicFigureImpersonation.detected ? 5 : 0
  })

  // 4. Technical Circumvention (13 points)
  // Check for cloaking
  requirements.push({
    name: 'Tidak Ada Cloaking',
    status: !suspensionAnalysis.technicalCircumvention.cloaking ? 'pass' : 'fail',
    description: suspensionAnalysis.technicalCircumvention.cloaking
      ? 'Halaman berbeda saat dibuka bot vs manusia'
      : 'Halaman sama untuk semua pengunjung',
    recommendation: suspensionAnalysis.technicalCircumvention.cloaking
      ? 'Hapus script yang bedain konten untuk bot'
      : undefined,
    points: !suspensionAnalysis.technicalCircumvention.cloaking ? 4 : 0
  })

  // Check for hidden URLs
  requirements.push({
    name: 'Tidak Ada URL Tersembunyi',
    status: !suspensionAnalysis.technicalCircumvention.hiddenUrls ? 'pass' : 'fail',
    description: suspensionAnalysis.technicalCircumvention.hiddenUrls
      ? 'Ada link tersembunyi di gambar'
      : 'Tidak ada link tersembunyi',
    evidence: suspensionAnalysis.technicalCircumvention.evidence?.find(e => e.includes('URL tersembunyi')),
    recommendation: suspensionAnalysis.technicalCircumvention.hiddenUrls
      ? 'Hapus link yang tersembunyi di dalam gambar'
      : undefined,
    points: !suspensionAnalysis.technicalCircumvention.hiddenUrls ? 2 : 0
  })

  // Check for auto-redirects
  requirements.push({
    name: 'Tidak Ada Auto-Redirect',
    status: !suspensionAnalysis.technicalCircumvention.autoRedirects ? 'pass' : 'fail',
    description: suspensionAnalysis.technicalCircumvention.autoRedirects
      ? 'Halaman otomatis pindah ke website lain'
      : 'Halaman tidak redirect otomatis',
    evidence: suspensionAnalysis.technicalCircumvention.evidence?.find(e => e.includes('Auto-redirect')),
    recommendation: suspensionAnalysis.technicalCircumvention.autoRedirects
      ? 'Hapus script auto-redirect, biarkan pengunjung stay di halaman'
      : undefined,
    points: !suspensionAnalysis.technicalCircumvention.autoRedirects ? 3 : 0
  })

  // Check for excessive images
  requirements.push({
    name: 'Jumlah Gambar Wajar',
    status: !suspensionAnalysis.technicalCircumvention.excessiveImages ? 'pass' : 'warning',
    description: suspensionAnalysis.technicalCircumvention.excessiveImages
      ? 'Gambar terlalu banyak (lebih dari 50)'
      : 'Jumlah gambar wajar',
    evidence: suspensionAnalysis.technicalCircumvention.evidence?.find(e => e.includes('Terlalu banyak gambar')),
    recommendation: suspensionAnalysis.technicalCircumvention.excessiveImages
      ? 'Kurangi jumlah gambar, tambah teks penjelasan'
      : undefined,
    points: !suspensionAnalysis.technicalCircumvention.excessiveImages ? 2 : 1
  })

  // Company info (referenced from existing category)
  requirements.push({
    name: 'Informasi Perusahaan (Technical)',
    status: 'pass',
    description: 'Sudah dicek di bagian Footer',
    points: 2
  })

  // 5. Counterfeit Goods (10 points)
  const counterfeitIssues = [
    suspensionAnalysis.counterfeitGoods.brandProductPhotos,
    suspensionAnalysis.counterfeitGoods.brandLogos
  ].filter(Boolean).length

  requirements.push({
    name: 'Tidak Ada Barang Palsu',
    status: counterfeitIssues === 0 && !suspensionAnalysis.counterfeitGoods.fakeOfficialStore ? 'pass' : 'fail',
    description: counterfeitIssues === 0 && !suspensionAnalysis.counterfeitGoods.fakeOfficialStore
      ? 'Tidak menjual barang palsu/kw'
      : `Kelihatan jual barang brand: ${suspensionAnalysis.counterfeitGoods.detectedBrands.join(', ')}`,
    evidence: suspensionAnalysis.counterfeitGoods.detectedBrands.length > 0
      ? suspensionAnalysis.counterfeitGoods.detectedBrands.join(', ')
      : undefined,
    recommendation: counterfeitIssues > 0 || suspensionAnalysis.counterfeitGoods.fakeOfficialStore
      ? 'Hapus logo/foto brand atau ganti dengan foto produk asli'
      : undefined,
    points: counterfeitIssues === 0 && !suspensionAnalysis.counterfeitGoods.fakeOfficialStore ? 10 : 0
  })

  const passed = requirements.filter(r => r.status === 'pass').length
  const failed = requirements.filter(r => r.status === 'fail').length
  const warnings = requirements.filter(r => r.status === 'warning').length
  const totalPoints = requirements.reduce((sum, r) => sum + r.points, 0)

  return {
    categoryName: 'Kepatuhan Kebijakan Google Ads',
    passed,
    failed,
    warnings,
    totalPoints,
    maxPoints: 50,
    requirements
  }
}

function calculateScore(requirements: {
  domainAndRedirect: RequirementCategory
  contentOriginality: RequirementCategory
  formAndIntegration: RequirementCategory
  footerAndCompany: RequirementCategory
  suspensionRisk: RequirementCategory
}): number {
  const totalPoints =
    requirements.domainAndRedirect.totalPoints +
    requirements.contentOriginality.totalPoints +
    requirements.formAndIntegration.totalPoints +
    requirements.footerAndCompany.totalPoints +
    requirements.suspensionRisk.totalPoints

  const maxPoints =
    requirements.domainAndRedirect.maxPoints +
    requirements.contentOriginality.maxPoints +
    requirements.formAndIntegration.maxPoints +
    requirements.footerAndCompany.maxPoints +
    requirements.suspensionRisk.maxPoints

  return Math.round((totalPoints / maxPoints) * 100)
}

function assignGrade(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}
