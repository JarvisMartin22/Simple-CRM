import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TestTube, Play, Loader2 } from 'lucide-react';
import { useCompanyEnrichment } from '@/hooks/useCompanyEnrichment';
import type { CompanyEnrichmentResult } from '@/services/companyEnrichment';

interface TestResult extends CompanyEnrichmentResult {
  domain: string;
  processing_time: number;
}

export const CompanyEnrichmentTest: React.FC = () => {
  const [testDomain, setTestDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  
  const { enrichDomain, isInitialized } = useCompanyEnrichment();

  const exampleDomains = [
    'zillowhomeloans.com',
    'opendoor.com', 
    'googlegroups.com',
    'quickenloans.com',
    'gmail.com',
    'microsoft.com',
    'stripe.com',
    'doordash.com',
    'lendingclub.com',
    'creditkarma.com'
  ];

  const handleTestDomain = async (domain: string) => {
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      const result = await enrichDomain(domain);
      const endTime = Date.now();
      
      if (result) {
        const testResult: TestResult = {
          ...result,
          domain,
          processing_time: endTime - startTime
        };
        
        setResults(prev => [testResult, ...prev.slice(0, 9)]); // Keep last 10 results
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestCustomDomain = () => {
    if (testDomain.trim()) {
      handleTestDomain(testDomain.trim());
      setTestDomain('');
    }
  };

  const handleTestAllExamples = async () => {
    setIsLoading(true);
    
    for (const domain of exampleDomains) {
      await handleTestDomain(domain);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsLoading(false);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'heuristic': return 'bg-blue-100 text-blue-800';
      case 'ai': return 'bg-purple-100 text-purple-800';
      case 'cached': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Company Enrichment Testing
          </CardTitle>
          <CardDescription>
            Test the company enrichment service with real domains to see how it handles different cases.
            {!isInitialized && " (Currently using heuristics only - add OpenAI API key for AI enhancement)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Custom Domain Test */}
          <div className="space-y-2">
            <Label htmlFor="testDomain">Test Custom Domain</Label>
            <div className="flex gap-2">
              <Input
                id="testDomain"
                value={testDomain}
                onChange={(e) => setTestDomain(e.target.value)}
                placeholder="e.g. company.com"
                onKeyPress={(e) => e.key === 'Enter' && handleTestCustomDomain()}
              />
              <Button 
                onClick={handleTestCustomDomain}
                disabled={!testDomain.trim() || isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Test
              </Button>
            </div>
          </div>

          <Separator />

          {/* Example Domains */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Example Domains</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleTestAllExamples}
                disabled={isLoading}
              >
                Test All Examples
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {exampleDomains.map((domain) => (
                <Button
                  key={domain}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestDomain(domain)}
                  disabled={isLoading}
                >
                  {domain}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Latest enrichment results (showing last 10 tests)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={`${result.domain}-${index}`} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{result.domain}</span>
                    <div className="flex gap-2">
                      <Badge className={getSourceColor(result.source)}>
                        {result.source}
                      </Badge>
                      <Badge className={getConfidenceColor(result.confidence)}>
                        {result.confidence}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {result.processing_time}ms
                      </Badge>
                    </div>
                  </div>
                  
                  {result.is_generic ? (
                    <p className="text-sm text-muted-foreground">
                      ❌ Identified as generic domain (not a company)
                    </p>
                  ) : (
                    <div className="text-sm space-y-1">
                      <p><strong>Company:</strong> {result.company_name}</p>
                      {result.website && (
                        <p><strong>Website:</strong> 
                          <a href={result.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                            {result.website}
                          </a>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 