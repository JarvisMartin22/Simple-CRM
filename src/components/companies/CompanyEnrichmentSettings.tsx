import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Zap, RefreshCw, BarChart3, Info } from 'lucide-react';
import { useCompanyEnrichment } from '@/hooks/useCompanyEnrichment';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CompanyEnrichmentTest } from './CompanyEnrichmentTest';

interface CompanyEnrichmentSettingsProps {
  onClose?: () => void;
}

export const CompanyEnrichmentSettings: React.FC<CompanyEnrichmentSettingsProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    isInitialized,
    initializeWithApiKey,
    clearCache,
    getCacheStats
  } = useCompanyEnrichment();

  const cacheStats = getCacheStats();

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    
    setIsLoading(true);
    try {
      initializeWithApiKey(apiKey.trim());
      setApiKey(''); // Clear the input for security
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = () => {
    clearCache();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Company Enrichment Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure AI-powered company data enrichment
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        )}
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Enrichment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant={isInitialized ? "default" : "secondary"}>
              {isInitialized ? "AI Enabled" : "Heuristics Only"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {isInitialized 
                ? "Using OpenAI for intelligent company detection"
                : "Using basic rules for company detection"
              }
            </span>
          </div>
        </CardContent>
      </Card>

      {/* API Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>OpenAI API Key</CardTitle>
          <CardDescription>
            Enter your OpenAI API key to enable AI-powered company enrichment. 
            This will improve accuracy for complex domains like "zillowhomeloans.com" → "Zillow Home Loans".
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={isInitialized ? "API key configured" : "sk-..."}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={handleSaveApiKey}
                disabled={!apiKey.trim() || isLoading}
              >
                {isLoading ? "Saving..." : (isInitialized ? "Update" : "Save")}
              </Button>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your API key is stored locally and used for real-time company enrichment. 
              Typical cost: ~$0.001 per domain analyzed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Cache Management
          </CardTitle>
          <CardDescription>
            Manage cached enrichment results to improve performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cached Domains</p>
                <p className="text-sm text-muted-foreground">
                  {cacheStats.size} domain{cacheStats.size !== 1 ? 's' : ''} cached
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearCache}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
            </div>
            
            {cacheStats.size > 0 && (
              <div>
                <Separator className="my-2" />
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    View cached domains ({cacheStats.size})
                  </summary>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-1">
                      {cacheStats.entries.map((domain) => (
                        <Badge key={domain} variant="outline" className="text-xs">
                          {domain}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Heuristic Analysis</p>
                <p className="text-sm text-muted-foreground">
                  First, we use fast rules to identify obvious cases (Gmail → ignore, Microsoft.com → Microsoft)
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">AI Enhancement</p>
                <p className="text-sm text-muted-foreground">
                  For complex cases, AI analyzes the domain and provides proper company names and websites
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Smart Caching</p>
                <p className="text-sm text-muted-foreground">
                  Results are cached for 7 days to minimize API calls and costs
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing Component */}
      <CompanyEnrichmentTest />
    </div>
  );
}; 