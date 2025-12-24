import { AIAnalysisResult } from './types'

export async function analyzeWithAI(
  html: string,
  url: string,
  apiKey: string,
  apiUrl: string
): Promise<AIAnalysisResult | null> {
  try {
    const text = extractTextContent(html)

    const prompt = `
Analyze this landing page for Google Ads compliance and quality:

URL: ${url}

Content Preview (first 5000 characters):
${text.substring(0, 5000)}

Please analyze and provide a JSON response with the following structure:

{
  "contentOriginality": {
    "score": 0-100,
    "isUnique": true/false,
    "similarityScore": 0-100
  },
  "contentQuality": {
    "score": 0-100,
    "hasValue": true/false,
    "isArbitrage": true/false
  },
  "structureAnalysis": {
    "hasFooter": true/false,
    "hasCompanyInfo": true/false,
    "hasPolicyLinks": true/false,
    "hasEmbeddedForms": true/false
  },
  "recommendations": ["specific recommendation 1", "specific recommendation 2"]
}

Focus on:
1. Content originality - is it unique or scraped/mirrored?
2. Content quality - does it provide value or just display ads?
3. Structure - proper footer, company info, policy links?
4. Actionable recommendations for improvement
`

    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a Google Ads Landing Page Quality Analyst. Analyze landing pages for compliance with Google Ads policies. Provide objective, constructive feedback.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      console.error('AI API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content

      // Try to parse JSON from response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError)
      }
    }

    return null
  } catch (error) {
    console.error('AI analysis error:', error)
    return null
  }
}

function extractTextContent(html: string): string {
  // Remove script and style tags
  let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // Remove HTML tags
  content = content.replace(/<[^>]+>/g, ' ')

  // Remove extra whitespace
  content = content.replace(/\s+/g, ' ').trim()

  return content
}
