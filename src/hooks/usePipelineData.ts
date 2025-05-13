import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Pipeline, 
  PipelineStage, 
  Opportunity, 
  DatabasePipeline, 
  DatabaseDeal 
} from '@/types/pipeline.types';

export const usePipelineData = () => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [currentPipeline, setCurrentPipeline] = useState<Pipeline | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPipelines = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Ensure each pipeline has the correct structure with stages
      const formattedPipelines: Pipeline[] = (data as DatabasePipeline[]).map(pipeline => ({
        ...pipeline,
        stages: ((pipeline as any).stages as PipelineStage[]) || [],
      }));

      setPipelines(formattedPipelines);
      if (formattedPipelines.length > 0 && !currentPipeline) {
        setCurrentPipeline(formattedPipelines[0]);
      }
    } catch (err: any) {
      console.error('Error fetching pipelines:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to fetch pipelines',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOpportunities = async (pipelineId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Direct query from deals table - removed the problematic RPC attempt
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('created_at', { ascending: false });
          
      if (error) {
        throw new Error(error.message);
      }

      // Map deals to opportunities with proper type checking
      const mappedOpportunities = (data as DatabaseDeal[]).map(deal => ({
        id: deal.id,
        name: deal.name,
        pipeline_id: deal.pipeline_id,
        stage: deal.stage_id || '', 
        value: deal.value || null,
        probability: deal.probability || null,
        expected_close_date: deal.close_date || null,
        company_id: deal.company_id || null,
        contact_id: deal.contact_id || null,
        details: deal.notes || null,
        custom_fields: {},
        created_at: deal.created_at,
        updated_at: deal.updated_at,
        user_id: deal.user_id
      }));

      setOpportunities(mappedOpportunities);
    } catch (err: any) {
      console.error('Error fetching opportunities:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to fetch opportunities',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    pipelines,
    setPipelines,
    currentPipeline,
    setCurrentPipeline,
    opportunities,
    setOpportunities,
    loading,
    error,
    setError,
    fetchPipelines,
    fetchOpportunities,
    toast
  };
};
