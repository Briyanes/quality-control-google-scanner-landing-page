import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

// GET - Fetch scan history
export async function GET(request: NextRequest) {
  try {
    // Rate limiting: 60 requests per minute per IP for GET
    const clientIp = getClientIp(request)
    const rateLimitResult = checkRateLimit(clientIp, 60, 60 * 1000)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')

    // Validate limit parameter
    const limit = limitParam ? parseInt(limitParam) : 20
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      scans: data
    })

  } catch (error) {
    console.error('History fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scan history' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a scan
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting: 20 requests per minute per IP for DELETE
    const clientIp = getClientIp(request)
    const rateLimitResult = checkRateLimit(clientIp, 20, 60 * 1000)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many delete requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const body = await request.json()
    const { scanId } = body

    if (!scanId) {
      return NextResponse.json(
        { error: 'scanId is required' },
        { status: 400 }
      )
    }

    // Validate scanId format (UUID)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidPattern.test(scanId)) {
      return NextResponse.json(
        { error: 'Invalid scanId format' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('scans')
      .delete()
      .eq('id', scanId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Scan deleted successfully'
    })

  } catch (error) {
    console.error('Delete scan error:', error)
    return NextResponse.json(
      { error: 'Failed to delete scan' },
      { status: 500 }
    )
  }
}
