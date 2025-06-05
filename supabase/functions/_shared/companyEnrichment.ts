interface CompanyEnrichmentResult {
  company_name: string | null;
  website: string | null;
  is_generic: boolean;
  confidence: 'high' | 'medium' | 'low';
  source: 'heuristic' | 'ai';
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
  ['salesforce.com', 'Salesforce'],
  ['opendoor.com', 'Opendoor'],
  ['zillow.com', 'Zillow'],
  ['redfin.com', 'Redfin']
]);

// Enhanced heuristic analysis
export function analyzeCompanyDomain(domain: string): CompanyEnrichmentResult {
  const normalizedDomain = domain.toLowerCase().trim();
  
  // Check if it's a generic domain
  if (GENERIC_DOMAINS.has(normalizedDomain)) {
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
    if (normalizedDomain.includes(pattern) || normalizedDomain === pattern) {
      return {
        company_name: name,
        website: `https://${normalizedDomain}`,
        is_generic: false,
        confidence: 'high',
        source: 'heuristic'
      };
    }
  }

  // Extract company name from domain using enhanced rules
  const companyName = extractCompanyNameFromDomain(normalizedDomain);
  
  // Determine confidence based on domain characteristics
  const confidence = assessHeuristicConfidence(normalizedDomain, companyName);
  
  return {
    company_name: companyName,
    website: companyName ? `https://${normalizedDomain}` : null,
    is_generic: !companyName,
    confidence,
    source: 'heuristic'
  };
}

// Enhanced company name extraction
function extractCompanyNameFromDomain(domain: string): string | null {
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
  
  // Handle special cases with better word separation
  const specialCases = new Map([
    ['zillowhomeloans', 'Zillow Home Loans'],
    ['quickenloans', 'Quicken Loans'],
    ['bettermortgage', 'Better Mortgage'],
    ['lendingclub', 'Lending Club'],
    ['creditkarma', 'Credit Karma'],
    ['opensea', 'OpenSea'],
    ['doordash', 'DoorDash'],
    ['grubhub', 'GrubHub'],
    ['postmates', 'Postmates'],
    ['instacart', 'Instacart'],
    ['airbnb', 'Airbnb'],
    ['venmo', 'Venmo'],
    ['paypal', 'PayPal'],
    ['squareup', 'Square'],
    ['stripe', 'Stripe'],
    ['plaid', 'Plaid'],
    ['segment', 'Segment'],
    ['mixpanel', 'Mixpanel'],
    ['amplitude', 'Amplitude']
  ]);
  
  // Check for special cases first
  if (specialCases.has(name.toLowerCase())) {
    return specialCases.get(name.toLowerCase()) || null;
  }
  
  // Try to detect compound words (like "zillowhomeloans")
  const compoundWords = detectCompoundWords(name);
  if (compoundWords.length > 1) {
    return compoundWords
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Capitalize and join meaningful parts
  const cleanedParts = parts
    .filter(part => part.length > 1)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
  
  return cleanedParts.length > 0 ? cleanedParts.join(' ') : null;
}

// Simple compound word detection
function detectCompoundWords(word: string): string[] {
  // Common business word patterns
  const businessWords = [
    'home', 'house', 'real', 'estate', 'loan', 'loans', 'mortgage', 'credit',
    'bank', 'finance', 'capital', 'invest', 'wealth', 'money', 'pay', 'payment',
    'tech', 'soft', 'ware', 'data', 'cloud', 'web', 'app', 'mobile', 'digital',
    'market', 'shop', 'store', 'buy', 'sell', 'trade', 'commerce', 'retail',
    'food', 'delivery', 'logistics', 'transport', 'travel', 'booking',
    'health', 'care', 'medical', 'pharma', 'bio', 'life', 'insurance',
    'energy', 'solar', 'green', 'clean', 'auto', 'car', 'vehicle'
  ];
  
  const lowerWord = word.toLowerCase();
  const foundWords: string[] = [];
  let remaining = lowerWord;
  
  // Try to find business words within the compound word
  for (const businessWord of businessWords.sort((a, b) => b.length - a.length)) {
    const index = remaining.indexOf(businessWord);
    if (index !== -1) {
      // Add the word before the business word (if any)
      if (index > 0) {
        foundWords.push(remaining.substring(0, index));
      }
      foundWords.push(businessWord);
      remaining = remaining.substring(index + businessWord.length);
      break; // Only find the first match to avoid over-segmentation
    }
  }
  
  // Add any remaining part
  if (remaining.length > 0) {
    foundWords.push(remaining);
  }
  
  // If no business words found, just return the original word
  return foundWords.length > 1 ? foundWords : [word];
}

// Assess confidence in heuristic analysis
function assessHeuristicConfidence(domain: string, companyName: string | null): 'high' | 'medium' | 'low' {
  if (!companyName) return 'high'; // High confidence it's not a company
  
  // High confidence indicators
  if (KNOWN_COMPANY_PATTERNS.has(domain)) return 'high';
  if (domain.includes('corp') || domain.includes('inc') || domain.includes('llc')) return 'high';
  
  // Low confidence indicators (would benefit from AI)
  if (domain.includes('group') || domain.includes('mail') || domain.includes('list')) return 'low';
  if (companyName.split(' ').length > 3) return 'low'; // Complex names
  if (domain.length > 20) return 'low'; // Very long domains
  
  return 'medium';
}

// Legacy function for backward compatibility
export function isCommonEmailDomain(domain: string): boolean {
  return GENERIC_DOMAINS.has(domain.toLowerCase());
}

// Enhanced version of the old function
export function extractCompanyNameFromDomainLegacy(domain: string): string {
  const result = analyzeCompanyDomain(domain);
  return result.company_name || domain.split('.')[0];
}

export type { CompanyEnrichmentResult }; 