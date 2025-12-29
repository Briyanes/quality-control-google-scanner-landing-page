/**
 * Suspension Database - Tracking and cross-scan analysis for suspension risks
 *
 * This module provides database functions for:
 * - Tracking image hashes across scans
 * - Tracking domain usage across scans
 * - Tracking email usage across scans
 * - Cross-referencing to detect patterns
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// Types
// ============================================================================

export interface ReuseResult {
  type: 'image' | 'domain' | 'email'
  item: string
  reuseCount: number
  firstSeen: string
  lastSeen: string
  scanIds: string[]
}

export interface DomainResult {
  domain: string
  businessContexts: string[]
  scanCount: number
  firstSeen: string
  lastSeen: string
}

export interface EmailResult {
  email: string
  sourceLocations: string[]
  scanCount: number
  firstSeen: string
  lastSeen: string
  scanIds: string[]
}

// ============================================================================
// Database Client
// ============================================================================

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// ============================================================================
// Image Hash Tracking
// ============================================================================

/**
 * Track image hashes for a scan
 */
export async function trackImageHashes(
  scanId: string,
  imageHashes: { url: string; hash: string }[]
): Promise<void> {
  try {
    const supabase = getSupabaseClient()

    const records = imageHashes.map(({ url, hash }) => ({
      scan_id: scanId,
      image_url: url,
      perceptual_hash: hash
    }))

    const { error } = await supabase
      .from('image_hashes')
      .insert(records)

    if (error) {
      console.error('Error tracking image hashes:', error)
    }
  } catch (error) {
    console.error('Error in trackImageHashes:', error)
  }
}

/**
 * Check for image reuse across scans
 * Returns images that have been seen in previous scans
 */
export async function checkImageReuse(
  imageHashes: string[]
): Promise<ReuseResult[]> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('image_hashes')
      .select('image_url, perceptual_hash, scan_id, created_at')
      .in('perceptual_hash', imageHashes)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      console.error('Error checking image reuse:', error)
      return []
    }

    // Group by hash to find duplicates
    const hashGroups = new Map<string, ReuseResult>()

    for (const row of data || []) {
      const existing = hashGroups.get(row.perceptual_hash)

      if (existing) {
        existing.reuseCount++
        existing.lastSeen = row.created_at
        existing.scanIds.push(row.scan_id)
      } else {
        hashGroups.set(row.perceptual_hash, {
          type: 'image',
          item: row.image_url,
          reuseCount: 1,
          firstSeen: row.created_at,
          lastSeen: row.created_at,
          scanIds: [row.scan_id]
        })
      }
    }

    // Return only items with reuse (seen in multiple scans)
    return Array.from(hashGroups.values())
      .filter(result => result.reuseCount > 1)
  } catch (error) {
    console.error('Error in checkImageReuse:', error)
    return []
  }
}

/**
 * Get all image hashes for comparison
 */
export async function getAllImageHashes(): Promise<Map<string, string>> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('image_hashes')
      .select('perceptual_hash, image_url')
      .order('created_at', { ascending: false })
      .limit(10000)

    if (error) {
      console.error('Error getting all image hashes:', error)
      return new Map()
    }

    const hashMap = new Map<string, string>()

    for (const row of data || []) {
      // Store unique hash -> URL mapping (keep most recent)
      if (!hashMap.has(row.perceptual_hash)) {
        hashMap.set(row.perceptual_hash, row.image_url)
      }
    }

    return hashMap
  } catch (error) {
    console.error('Error in getAllImageHashes:', error)
    return new Map()
  }
}

// ============================================================================
// Domain Usage Tracking
// ============================================================================

/**
 * Track domain usage for a scan
 */
export async function trackDomainUsage(
  scanId: string,
  domain: string,
  businessContext: string
): Promise<void> {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('domain_usage')
      .insert({
        scan_id: scanId,
        domain: domain.toLowerCase(),
        business_context: businessContext
      })

    if (error) {
      console.error('Error tracking domain usage:', error)
    }
  } catch (error) {
    console.error('Error in trackDomainUsage:', error)
  }
}

/**
 * Check for duplicate domain usage across scans
 */
export async function checkDuplicateDomain(domain: string): Promise<DomainResult[]> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('domain_usage')
      .select('domain, business_context, scan_id, created_at')
      .eq('domain', domain.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error checking duplicate domain:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Group by domain
    const result: DomainResult = {
      domain,
      businessContexts: data.map(d => d.business_context).filter(Boolean),
      scanCount: data.length,
      firstSeen: data[data.length - 1]?.created_at || new Date().toISOString(),
      lastSeen: data[0]?.created_at || new Date().toISOString()
    }

    return [result]
  } catch (error) {
    console.error('Error in checkDuplicateDomain:', error)
    return []
  }
}

/**
 * Get all domains and their usage counts
 */
export async function getAllDomainUsage(): Promise<Map<string, number>> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('domain_usage')
      .select('domain')

    if (error) {
      console.error('Error getting all domain usage:', error)
      return new Map()
    }

    const domainMap = new Map<string, number>()

    for (const row of data || []) {
      const count = domainMap.get(row.domain) || 0
      domainMap.set(row.domain, count + 1)
    }

    return domainMap
  } catch (error) {
    console.error('Error in getAllDomainUsage:', error)
    return new Map()
  }
}

// ============================================================================
// Email Usage Tracking
// ============================================================================

/**
 * Extract emails from HTML
 */
export function extractEmailsFromPage(html: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const matches = html.match(emailRegex)

  if (!matches) {
    return []
  }

  // Return unique emails
  return Array.from(new Set(matches.map(e => e.toLowerCase())))
}

/**
 * Track email usage for a scan
 */
export async function trackEmailUsage(
  scanId: string,
  emails: string[]
): Promise<void> {
  try {
    const supabase = getSupabaseClient()

    const records = emails.map(email => ({
      scan_id: scanId,
      email: email.toLowerCase(),
      source_location: 'page_content' // Could be more specific
    }))

    const { error } = await supabase
      .from('email_usage')
      .insert(records)

    if (error) {
      console.error('Error tracking email usage:', error)
    }
  } catch (error) {
    console.error('Error in trackEmailUsage:', error)
  }
}

/**
 * Check for email reuse across scans
 */
export async function checkEmailReuse(emails: string[]): Promise<EmailResult[]> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('email_usage')
      .select('email, source_location, scan_id, created_at')
      .in('email', emails.map(e => e.toLowerCase()))
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error checking email reuse:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Group by email
    const emailGroups = new Map<string, EmailResult>()

    for (const row of data) {
      const existing = emailGroups.get(row.email)

      if (existing) {
        existing.scanCount++
        existing.lastSeen = row.created_at
        existing.scanIds.push(row.scan_id)
        if (row.source_location && !existing.sourceLocations.includes(row.source_location)) {
          existing.sourceLocations.push(row.source_location)
        }
      } else {
        emailGroups.set(row.email, {
          email: row.email,
          sourceLocations: row.source_location ? [row.source_location] : [],
          scanCount: 1,
          firstSeen: row.created_at,
          lastSeen: row.created_at,
          scanIds: [row.scan_id]
        })
      }
    }

    // Return only emails seen in multiple scans
    return Array.from(emailGroups.values())
      .filter(result => result.scanCount > 1)
  } catch (error) {
    console.error('Error in checkEmailReuse:', error)
    return []
  }
}

// ============================================================================
// Cleanup Functions
// ============================================================================

/**
 * Clean up old scan data (older than specified days)
 * Useful for maintaining database size
 */
export async function cleanupOldData(daysToKeep: number = 90): Promise<void> {
  try {
    const supabase = getSupabaseClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    // Delete old image hashes
    const { error: imageError } = await supabase
      .from('image_hashes')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (imageError) {
      console.error('Error cleaning up image hashes:', imageError)
    }

    // Delete old domain usage
    const { error: domainError } = await supabase
      .from('domain_usage')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (domainError) {
      console.error('Error cleaning up domain usage:', domainError)
    }

    // Delete old email usage
    const { error: emailError } = await supabase
      .from('email_usage')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (emailError) {
      console.error('Error cleaning up email usage:', emailError)
    }

    console.log(`Cleaned up data older than ${daysToKeep} days`)
  } catch (error) {
    console.error('Error in cleanupOldData:', error)
  }
}

// ============================================================================
// Statistics Functions
// ============================================================================

/**
 * Get statistics about tracked data
 */
export async function getTrackingStats(): Promise<{
  totalImageHashes: number
  totalDomainUsage: number
  totalEmailUsage: number
  uniqueDomains: number
  uniqueEmails: number
}> {
  try {
    const supabase = getSupabaseClient()

    const [
      { count: imageCount },
      { count: domainCount },
      { count: emailCount }
    ] = await Promise.all([
      supabase.from('image_hashes').select('*', { count: 'exact', head: true }),
      supabase.from('domain_usage').select('*', { count: 'exact', head: true }),
      supabase.from('email_usage').select('*', { count: 'exact', head: true })
    ])

    // Get unique counts
    const { data: domains } = await supabase
      .from('domain_usage')
      .select('domain')

    const { data: emails } = await supabase
      .from('email_usage')
      .select('email')

    const uniqueDomains = new Set(domains?.map(d => d.domain) || []).size
    const uniqueEmails = new Set(emails?.map(e => e.email) || []).size

    return {
      totalImageHashes: imageCount || 0,
      totalDomainUsage: domainCount || 0,
      totalEmailUsage: emailCount || 0,
      uniqueDomains,
      uniqueEmails
    }
  } catch (error) {
    console.error('Error getting tracking stats:', error)
    return {
      totalImageHashes: 0,
      totalDomainUsage: 0,
      totalEmailUsage: 0,
      uniqueDomains: 0,
      uniqueEmails: 0
    }
  }
}
