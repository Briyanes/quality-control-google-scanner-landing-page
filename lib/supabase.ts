import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Scan {
  id: string
  url: string
  final_url: string | null
  scan_results: any
  score: number | null
  grade: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface RedirectChain {
  id: string
  scan_id: string
  chain: any
  total_redirects: number | null
  final_domain: string | null
  has_third_party_redirect: boolean
  created_at: string
}

export interface ContentCache {
  id: string
  url: string
  html_content: string | null
  text_content: string | null
  analyzed_at: string
  expires_at: string
}
