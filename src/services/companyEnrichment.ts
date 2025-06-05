import OpenAI from 'openai';

interface CompanyEnrichmentResult {
  company_name: string | null;
  website: string | null;
  is_generic: boolean;
  confidence: 'high' | 'medium' | 'low';
  source: 'heuristic' | 'ai' | 'cached';
}

interface CachedResult extends CompanyEnrichmentResult {
  timestamp: number;
  domain: string;
}

// Common domains that should not be treated as companies
const GENERIC_DOMAINS = new Set([
  // Email providers
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'icloud.com', 'protonmail.com', 'mail.com', 'zoho.com', 'yandex.com',
  'gmx.com', 'live.com', 'me.com', 'inbox.com', 'fastmail.com',
  
  // Groups and mailing lists
  'googlegroups.com', 'groups.google.com', 'groups.yahoo.com',
  'mailchimp.com', 'constantcontact.com', 'mailerlite.com',
  
  // Government and education (generic)
  'gov', 'edu', 'org', 'mil',
  
  // Temp/disposable email
  'tempmail.com', '10minutemail.com', 'guerrillamail.com',
  'mailinator.com', 'throwaway.email'
]);

// Domains that are obviously companies (for heuristic fast-path)
const KNOWN_COMPANY_PATTERNS = new Map([
  // Common business patterns
  ['corp.com', 'Corporation'],
  ['inc.com', 'Inc.'],
  ['llc.com', 'LLC'],
  ['ltd.com', 'Ltd.'],
  ['co.com', 'Company'],
  // Tech companies (add more as needed)
  ['microsoft.com', 'Microsoft'],
  ['google.com', 'Google'],
  ['apple.com', 'Apple'],
  ['amazon.com', 'Amazon'],
  ['meta.com', 'Meta'],
  ['salesforce.com', 'Salesforce']
]);

class CompanyEnrichmentService {
  private openai: OpenAI | null = null;
  private cache = new Map<string, CachedResult>();
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(openaiApiKey?: string) {
    if (openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: openaiApiKey,
        dangerouslyAllowBrowser: true // For client-side usage
      });
    }
  }

  // Main enrichment method
  async enrichDomain(domain: string): Promise<CompanyEnrichmentResult> {
    const normalizedDomain = domain.toLowerCase().trim();
    
    // Check cache first
    const cached = this.getCachedResult(normalizedDomain);
    if (cached) {
      return { ...cached, source: 'cached' };
    }

    // Try heuristic approach first
    const heuristicResult = this.analyzeWithHeuristics(normalizedDomain);
    if (heuristicResult.confidence === 'high') {
      this.cacheResult(normalizedDomain, heuristicResult);
      return heuristicResult;
    }

    // Fall back to AI if available and heuristic is uncertain
    if (this.openai && (heuristicResult.confidence === 'medium' || heuristicResult.confidence === 'low')) {
      try {
        const aiResult = await this.analyzeWithAI(normalizedDomain);
        this.cacheResult(normalizedDomain, aiResult);
        return aiResult;
      } catch (error) {
        console.warn('AI enrichment failed, using heuristic result:', error);
        this.cacheResult(normalizedDomain, heuristicResult);
        return heuristicResult;
      }
    }

    // Return heuristic result as fallback
    this.cacheResult(normalizedDomain, heuristicResult);
    return heuristicResult;
  }

  // Heuristic analysis (fast and free)
  private analyzeWithHeuristics(domain: string): CompanyEnrichmentResult {
    // Check if it's a generic domain
    if (GENERIC_DOMAINS.has(domain)) {
      return {
        company_name: null,
        website: null,
        is_generic: true,
        confidence: 'high',
        source: 'heuristic'
      };
    }

    // Check known company patterns
    for (const [pattern, name] of KNOWN_COMPANY_PATTERNS) {
      if (domain.includes(pattern) || domain === pattern) {
        return {
          company_name: name,
          website: `https://${domain}`,
          is_generic: false,
          confidence: 'high',
          source: 'heuristic'
        };
      }
    }

    // Extract company name from domain using simple rules
    const companyName = this.extractCompanyNameFromDomain(domain);
    
    // Determine confidence based on domain characteristics
    const confidence = this.assessHeuristicConfidence(domain, companyName);
    
    return {
      company_name: companyName,
      website: companyName ? `https://${domain}` : null,
      is_generic: !companyName,
      confidence,
      source: 'heuristic'
    };
  }

  // AI analysis using OpenAI
  private async analyzeWithAI(domain: string): Promise<CompanyEnrichmentResult> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const prompt = `
Analyze the email domain "${domain}" and provide information about whether it represents a real company.

Return a JSON object with these exact fields:
- "company_name": The proper company name (or null if not a real company)
- "website": The official website URL (or null if not a real company)  
- "is_generic": true if this is a generic/group/mailing list domain, false if it's a real company
- "confidence": "high", "medium", or "low" based on your certainty

Examples:
- "zillowhomeloans.com" → {"company_name": "Zillow Home Loans", "website": "https://zillowhomeloans.com", "is_generic": false, "confidence": "high"}
- "googlegroups.com" → {"company_name": null, "website": null, "is_generic": true, "confidence": "high"}
- "opendoor.com" → {"company_name": "Opendoor", "website": "https://opendoor.com", "is_generic": false, "confidence": "high"}

Focus on:
1. Is this a real business domain?
2. What's the proper company name (handle word separation, capitalization)?
3. Filter out mailing lists, groups, generic services

Domain to analyze: ${domain}
`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini", // Using mini for cost efficiency
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, // Low temperature for consistent results
      max_tokens: 300
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      const result = JSON.parse(content);
      return {
        company_name: result.company_name,
        website: result.website,
        is_generic: result.is_generic,
        confidence: result.confidence || 'medium',
        source: 'ai'
      };
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${content}`);
    }
  }

  // Helper method to extract company name using simple rules
  private extractCompanyNameFromDomain(domain: string): string | null {
    // Remove common TLDs
    let name = domain.split('.')[0];
    
    // Skip very short names (likely not companies)
    if (name.length < 3) return null;
    
    // Split by common separators and take meaningful parts
    const parts = name.split(/[-_]+/);
    
    // Skip domains that look like email services or technical
    const technicalPatterns = /^(mail|email|smtp|pop|imap|www|ftp|api|cdn|static|assets|images|blog|news|support|help|docs|admin|portal|app|web|mobile|dev|test|staging|prod|beta|alpha)$/i;
    if (parts.some(part => technicalPatterns.test(part))) {
      return null;
    }
    
    // Capitalize and join meaningful parts
    const cleanedParts = parts
      .filter(part => part.length > 1)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
    
    return cleanedParts.length > 0 ? cleanedParts.join(' ') : null;
  }

  // Assess confidence in heuristic analysis
  private assessHeuristicConfidence(domain: string, companyName: string | null): 'high' | 'medium' | 'low' {
    if (!companyName) return 'high'; // High confidence it's not a company
    
    // High confidence indicators
    if (KNOWN_COMPANY_PATTERNS.has(domain)) return 'high';
    if (domain.includes('corp') || domain.includes('inc') || domain.includes('llc')) return 'high';
    
    // Low confidence indicators (needs AI)
    if (domain.includes('group') || domain.includes('mail') || domain.includes('list')) return 'low';
    if (companyName.split(' ').length > 3) return 'low'; // Complex names
    if (domain.length > 20) return 'low'; // Very long domains
    
    return 'medium';
  }

  // Cache management
  private getCachedResult(domain: string): CachedResult | null {
    const cached = this.cache.get(domain);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached;
    }
    if (cached) {
      this.cache.delete(domain); // Remove expired cache
    }
    return null;
  }

  private cacheResult(domain: string, result: CompanyEnrichmentResult): void {
    this.cache.set(domain, {
      ...result,
      domain,
      timestamp: Date.now()
    });
  }

  // Batch processing for multiple domains
  async enrichDomains(domains: string[]): Promise<Map<string, CompanyEnrichmentResult>> {
    const results = new Map<string, CompanyEnrichmentResult>();
    
    // Process in parallel with some rate limiting
    const batchSize = 5; // Process 5 at a time to respect API limits
    
    for (let i = 0; i < domains.length; i += batchSize) {
      const batch = domains.slice(i, i + batchSize);
      const batchPromises = batch.map(async domain => {
        try {
          const result = await this.enrichDomain(domain);
          results.set(domain, result);
        } catch (error) {
          console.error(`Failed to enrich domain ${domain}:`, error);
          // Add fallback result
          results.set(domain, {
            company_name: this.extractCompanyNameFromDomain(domain),
            website: null,
            is_generic: true,
            confidence: 'low',
            source: 'heuristic'
          });
        }
      });
      
      await Promise.all(batchPromises);
      
      // Small delay between batches to be respectful to APIs
      if (i + batchSize < domains.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  // Clear cache (useful for testing or manual refresh)
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance (will be initialized with API key when available)
export const companyEnrichmentService = new CompanyEnrichmentService();

// Export method to initialize with API key
export const initializeCompanyEnrichment = (openaiApiKey: string) => {
  return new CompanyEnrichmentService(openaiApiKey);
};

export type { CompanyEnrichmentResult }; 