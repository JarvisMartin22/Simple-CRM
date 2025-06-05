import { useState, useCallback, useRef } from 'react';
import { initializeCompanyEnrichment, companyEnrichmentService, type CompanyEnrichmentResult } from '@/services/companyEnrichment';
import { useToast } from '@/components/ui/use-toast';

interface UseCompanyEnrichmentResult {
  enrichDomain: (domain: string) => Promise<CompanyEnrichmentResult | null>;
  enrichDomains: (domains: string[]) => Promise<Map<string, CompanyEnrichmentResult>>;
  isInitialized: boolean;
  initializeWithApiKey: (apiKey: string) => void;
  clearCache: () => void;
  getCacheStats: () => { size: number; entries: string[] };
}

export function useCompanyEnrichment(): UseCompanyEnrichmentResult {
  const [isInitialized, setIsInitialized] = useState(false);
  const enrichmentServiceRef = useRef(companyEnrichmentService);
  const { toast } = useToast();

  const initializeWithApiKey = useCallback((apiKey: string) => {
    try {
      enrichmentServiceRef.current = initializeCompanyEnrichment(apiKey);
      setIsInitialized(true);
      toast({
        title: "AI Enrichment Enabled",
        description: "Company enrichment is now powered by AI for better accuracy.",
      });
    } catch (error) {
      console.error('Failed to initialize company enrichment:', error);
      toast({
        variant: "destructive",
        title: "Initialization Failed",
        description: "Failed to initialize AI enrichment. Using heuristics only.",
      });
    }
  }, [toast]);

  const enrichDomain = useCallback(async (domain: string): Promise<CompanyEnrichmentResult | null> => {
    try {
      return await enrichmentServiceRef.current.enrichDomain(domain);
    } catch (error) {
      console.error('Company enrichment failed:', error);
      toast({
        variant: "destructive",
        title: "Enrichment Failed",
        description: `Failed to enrich domain: ${domain}`,
      });
      return null;
    }
  }, [toast]);

  const enrichDomains = useCallback(async (domains: string[]): Promise<Map<string, CompanyEnrichmentResult>> => {
    try {
      return await enrichmentServiceRef.current.enrichDomains(domains);
    } catch (error) {
      console.error('Batch enrichment failed:', error);
      toast({
        variant: "destructive",
        title: "Batch Enrichment Failed",
        description: "Failed to enrich multiple domains.",
      });
      return new Map();
    }
  }, [toast]);

  const clearCache = useCallback(() => {
    enrichmentServiceRef.current.clearCache();
    toast({
      title: "Cache Cleared",
      description: "Company enrichment cache has been cleared.",
    });
  }, [toast]);

  const getCacheStats = useCallback(() => {
    return enrichmentServiceRef.current.getCacheStats();
  }, []);

  return {
    enrichDomain,
    enrichDomains,
    isInitialized,
    initializeWithApiKey,
    clearCache,
    getCacheStats
  };
} 