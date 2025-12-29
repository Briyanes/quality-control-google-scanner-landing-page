-- Quality Control Landing Page Scanner Database Schema

-- Scan history table
CREATE TABLE IF NOT EXISTS scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  final_url TEXT,
  scan_results JSONB NOT NULL,
  score INTEGER,
  grade TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Redirect chains tracking
CREATE TABLE IF NOT EXISTS redirect_chains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  chain JSONB NOT NULL,
  total_redirects INTEGER,
  final_domain TEXT,
  has_third_party_redirect BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content analysis cache
CREATE TABLE IF NOT EXISTS content_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  html_content TEXT,
  text_content TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_url ON scans(url);
CREATE INDEX IF NOT EXISTS idx_redirect_chains_scan_id ON redirect_chains(scan_id);
CREATE INDEX IF NOT EXISTS idx_content_cache_url ON content_cache(url);

-- Enable Row Level Security
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE redirect_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scans
CREATE POLICY "Allow public read access" ON scans FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON scans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON scans FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON scans FOR DELETE USING (true);

-- RLS Policies for redirect_chains
CREATE POLICY "Allow public read access" ON redirect_chains FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON redirect_chains FOR INSERT WITH CHECK (true);

-- RLS Policies for content_cache
CREATE POLICY "Allow public read access" ON content_cache FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON content_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON content_cache FOR UPDATE USING (true);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_scans_updated_at ON scans;
CREATE TRIGGER update_scans_updated_at BEFORE UPDATE ON scans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Suspension Analysis Tables
-- ============================================================================

-- Image hashes tracking for detecting duplicate images across scans
CREATE TABLE IF NOT EXISTS image_hashes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  perceptual_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Domain usage tracking for detecting multi-account abuse
CREATE TABLE IF NOT EXISTS domain_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  business_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email usage tracking for detecting multi-account abuse
CREATE TABLE IF NOT EXISTS email_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  source_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for suspension analysis tables
CREATE INDEX IF NOT EXISTS idx_image_hashes_hash ON image_hashes(perceptual_hash);
CREATE INDEX IF NOT EXISTS idx_image_hashes_url ON image_hashes(image_url);
CREATE INDEX IF NOT EXISTS idx_image_hashes_scan_id ON image_hashes(scan_id);
CREATE INDEX IF NOT EXISTS idx_domain_usage_domain ON domain_usage(domain);
CREATE INDEX IF NOT EXISTS idx_domain_usage_scan_id ON domain_usage(scan_id);
CREATE INDEX IF NOT EXISTS idx_email_usage_email ON email_usage(email);
CREATE INDEX IF NOT EXISTS idx_email_usage_scan_id ON email_usage(scan_id);

-- Enable Row Level Security for new tables
ALTER TABLE image_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for image_hashes
CREATE POLICY "Allow public read access" ON image_hashes FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON image_hashes FOR INSERT WITH CHECK (true);

-- RLS Policies for domain_usage
CREATE POLICY "Allow public read access" ON domain_usage FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON domain_usage FOR INSERT WITH CHECK (true);

-- RLS Policies for email_usage
CREATE POLICY "Allow public read access" ON email_usage FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON email_usage FOR INSERT WITH CHECK (true);
