# Quality Control Landing Page Scanner

A powerful tool for validating landing pages against Google Ads requirements. Built with Next.js 14, TypeScript, and AI-powered analysis.

## Features

- ✅ **Domain & Redirect Analysis** - Checks for third-party redirects and URL consistency
- ✅ **Content Originality Check** - AI-powered analysis to detect duplicate/scraped content
- ✅ **Form Integration Validation** - Ensures forms are embedded, not redirected
- ✅ **Footer & Company Info** - Validates presence of required policy links
- ✅ **Instant Scoring** - Get a 0-100 score with letter grade (A-F)
- ✅ **Detailed Recommendations** - Actionable feedback for each requirement
- ✅ **Scan History** - Track previous scans via Supabase

## Tech Stack

- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase
- **AI**: Z.ai API for content analysis
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase project configured
- Z.ai API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd qc-scanning-landing-page
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
Z_AI_API_KEY=your-zai-api-key
Z_AI_API_URL=https://api.z.ai/api/paas/v4
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

Run the SQL schema in `/supabase/schema.sql` in your Supabase SQL Editor:

```sql
-- See schema.sql file
```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy!

## Usage

1. Enter a landing page URL
2. Click "Scan Now"
3. View the detailed results with:
   - Overall score (0-100)
   - Letter grade (A-F)
   - Category breakdowns
   - Specific recommendations
4. Review scan history

## Project Structure

```
├── app/
│   ├── scanner/page.tsx    # Main scanner UI
│   ├── api/
│   │   ├── scan/           # Scan endpoint
│   │   └── history/        # History CRUD
│   └── layout.tsx          # Root layout
├── lib/
│   ├── lpScanner.ts        # Main scanner logic
│   ├── redirectChecker.ts  # Redirect analysis
│   ├── htmlParser.ts       # HTML parsing
│   ├── contentAnalyzer.ts  # Content analysis
│   ├── aiAnalyzer.ts       # AI integration
│   └── supabase.ts         # Database client
├── supabase/
│   └── schema.sql          # Database schema
└── public/
    └── logo/               # Logos and assets
```

## License

© 2025 Hadona Digital Media. All rights reserved.
