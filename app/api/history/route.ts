import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Fetch scan history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

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
    const body = await request.json()
    const { scanId } = body

    if (!scanId) {
      return NextResponse.json(
        { error: 'scanId is required' },
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
