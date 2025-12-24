import { NextRequest, NextResponse } from 'next/server'
import { scanLandingPage } from '@/lib/lpScanner'
import { supabase } from '@/lib/supabase'
import { checkRedirectChain } from '@/lib/redirectChecker'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Check if URL is accessible
    const testResponse = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }).catch(() => null)

    if (!testResponse || !testResponse.ok) {
      return NextResponse.json(
        { error: 'Unable to access the URL. Please check if the URL is valid and accessible.' },
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
    })

  } catch (error) {
    console.error('Scan error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to scan landing page' },
      { status: 500 }
    )
  }
}
