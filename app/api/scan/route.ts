import { NextRequest, NextResponse } from 'next/server'
import { scanLandingPage } from '@/lib/lpScanner'
import { supabase } from '@/lib/supabase'
import { checkRedirectChain } from '@/lib/redirectChecker'
import { validateUrl, checkUrlAccessible } from '@/lib/urlValidator'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { ScanError, FetchErrorType, AccessibilityResult } from '@/lib/types'

/**
 * Get user-friendly error message based on error type
 */
function getUserFriendlyErrorMessage(errorType: FetchErrorType | undefined, statusCode?: number): string {
  switch (errorType) {
    case 'timeout':
      return 'The URL took too long to respond. This may be due to a slow server or network issues. Please try again.'
    case 'connection':
      return 'Could not connect to the website. Please check if the URL is correct and the site is online.'
    case 'ssl':
      return 'The website has an invalid SSL certificate. The site owner needs to fix their security certificate.'
    case 'blocked':
      return 'Access to this website is blocked. The site may be blocking automated requests or detecting bots.'
    case 'not_found':
      return 'The URL does not exist (404 error). Please check the URL and try again.'
    case 'server_error':
      return `The website server returned an error (${statusCode || '5xx'}). Please try again later.`
    default:
      return 'Unable to access the URL. Please check if the URL is valid and accessible.'
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 requests per minute per IP
    const clientIp = getClientIp(request)
    const rateLimitResult = checkRateLimit(clientIp, 10, 60 * 1000)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Strict URL validation to prevent SSRF
    const validationResult = validateUrl(url)
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error || 'Invalid URL' },
        { status: 400 }
      )
    }

    // Check if URL is accessible (with timeout and detailed error reporting)
    const accessibilityResult: AccessibilityResult = await checkUrlAccessible(url, 15000)
    if (!accessibilityResult.accessible) {
      return NextResponse.json(
        {
          error: getUserFriendlyErrorMessage(accessibilityResult.errorType, accessibilityResult.statusCode),
          errorType: accessibilityResult.errorType,
          statusCode: accessibilityResult.statusCode,
          details: accessibilityResult.errorDetails
        },
        { status: 400 }
      )
    }

    // Perform the scan
    const scanResult = await scanLandingPage(url)

    // Get redirect chain data
    const redirectChain = await checkRedirectChain(url)

    // Store scan in database
    const { data: scanData, error: scanError } = await supabase
      .from('scans')
      .insert({
        url: scanResult.url,
        final_url: scanResult.finalUrl,
        scan_results: scanResult,
        score: scanResult.score,
        grade: scanResult.grade,
        status: 'completed'
      })
      .select()
      .single()

    if (scanError) {
      console.error('Error storing scan:', scanError)
    }

    // Store redirect chain
    if (scanData && redirectChain.length > 0) {
      await supabase
        .from('redirect_chains')
        .insert({
          scan_id: scanData.id,
          chain: redirectChain,
          total_redirects: redirectChain.filter(r => r.isRedirect).length,
          final_domain: redirectChain[redirectChain.length - 1]?.domain,
          has_third_party_redirect: redirectChain.some(r => r.isThirdParty === true)
        })
    }

    return NextResponse.json({
      success: true,
      scan: scanResult,
      scanId: scanData?.id
    }, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
      }
    })

  } catch (error) {
    console.error('Scan error:', error)

    // Handle ScanError specifically
    if (error instanceof ScanError) {
      return NextResponse.json(
        {
          error: getUserFriendlyErrorMessage(error.errorType),
          errorType: error.errorType,
          details: error.details
        },
        { status: 400 }
      )
    }

    // Handle generic errors
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to scan landing page',
        errorType: 'unknown'
      },
      { status: 500 }
    )
  }
}
