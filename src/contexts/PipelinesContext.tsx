import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Pipeline {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  stages?: PipelineStage[]; // Add stages to Pipeline interface
}

interface PipelineStage {
  id: string;
  name: string;
  position: number;
  pipeline_id: string;
  created_at: string;
  updated_at: string;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  stage_id: string;
  pipeline_id: string;
  contact_id?: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

// Extended interface for component compatibility
export interface Opportunity extends Deal {
  name: string; // mapped from title
  stage: string; // mapped from stage_id
  probability?: number;
  expected_close_date?: string;
  details?: string;
}

interface PipelinesContextType {
  pipelines: Pipeline[];
  stages: PipelineStage[];
  deals: Deal[];
  opportunities: Opportunity[]; // mapped deals for component compatibility
  currentPipeline: Pipeline | null;
  isLoading: boolean;
  loading: boolean; // alias for isLoading
  createPipeline: (data: Partial<Pipeline>) => Promise<Pipeline>;
  updatePipeline: (id: string, data: Partial<Pipeline>) => Promise<Pipeline>;
  deletePipeline: (id: string) => Promise<void>;
  createStage: (data: Partial<PipelineStage>) => Promise<PipelineStage>;
  updateStage: (id: string, data: Partial<PipelineStage>) => Promise<PipelineStage>;
  deleteStage: (id: string) => Promise<void>;
  createDeal: (data: Partial<Deal>) => Promise<Deal>;
  updateDeal: (id: string, data: Partial<Deal>) => Promise<Deal>;
  deleteDeal: (id: string) => Promise<void>;
  addOpportunity: (data: any) => Promise<Deal>;
  updateOpportunity: (data: any) => Promise<Deal>;
  deleteOpportunity: (id: string) => Promise<void>;
  refreshPipelines: () => Promise<void>;
  setCurrentPipeline: (pipeline: Pipeline) => void;
}

export const PipelinesContext = createContext<PipelinesContextType | undefined>(undefined);

export function PipelinesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [currentPipeline, setCurrentPipeline] = useState<Pipeline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const refreshPipelines = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch pipeline stages first
      const { data: stagesData, error: stagesError } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('position', { ascending: true });

      if (stagesError) {
        throw new Error(`Error fetching pipeline stages: ${stagesError.message}`);
      }

      setStages(stagesData || []);

      // Then fetch pipelines
      const { data: pipelinesData, error: pipelinesError } = await supabase
        .from('pipelines')
        .select('*')
        .order('created_at', { ascending: false });

      if (pipelinesError) {
        throw new Error(`Error fetching pipelines: ${pipelinesError.message}`);
      }

      // Attach stages to each pipeline
      const pipelinesWithStages = (pipelinesData || []).map(pipeline => ({
        ...pipeline,
        stages: (stagesData || []).filter(stage => stage.pipeline_id === pipeline.id)
      }));

      setPipelines(pipelinesWithStages);

      // Set current pipeline to the first one if none is selected
      if (pipelinesWithStages.length > 0 && !currentPipeline) {
        setCurrentPipeline(pipelinesWithStages[0]);
      }

      // Finally fetch deals
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (dealsError) {
        throw new Error(`Error fetching deals: ${dealsError.message}`);
      }

      setDeals(dealsData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching pipeline data",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, currentPipeline]);

  const createPipeline = useCallback(async (data: Partial<Pipeline>): Promise<Pipeline> => {
    if (!user) throw new Error('User not authenticated');
    
    const { data: pipeline, error } = await supabase
      .from('pipelines')
      .insert([{ ...data, user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating pipeline",
        description: error.message,
      });
      throw error;
    }

    setPipelines(prev => [pipeline, ...prev]);
    
    toast({
      title: "Pipeline created",
      description: "The pipeline has been created successfully",
    });

    // Refresh pipelines to get the complete data with stages
    await refreshPipelines();

    return pipeline;
  }, [user, toast, refreshPipelines]);

  const updatePipeline = useCallback(async (id: string, data: Partial<Pipeline>): Promise<Pipeline> => {
    const { data: pipeline, error } = await supabase
      .from('pipelines')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating pipeline",
        description: error.message,
      });
      throw error;
    }

    setPipelines(prev => prev.map(p => p.id === id ? pipeline : p));
    
    toast({
      title: "Pipeline updated",
      description: "The pipeline has been updated successfully",
    });

    return pipeline;
  }, [toast]);

  const deletePipeline = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('pipelines')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting pipeline",
        description: error.message,
      });
      throw error;
    }

    setPipelines(prev => prev.filter(p => p.id !== id));
    
    toast({
      title: "Pipeline deleted",
      description: "The pipeline has been deleted successfully",
    });
  }, [toast]);

  const createStage = useCallback(async (data: Partial<PipelineStage>): Promise<PipelineStage> => {
    // Get the current stages for the pipeline to determine the next position
    const { data: currentStages, error: fetchError } = await supabase
      .from('pipeline_stages')
      .select('position')
      .eq('pipeline_id', data.pipeline_id)
      .order('position', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    // Calculate the next position (either 1 or last position + 1)
    const nextPosition = currentStages && currentStages.length > 0 
      ? currentStages[0].position + 1 
      : 1;

    // Create the new stage with the calculated position
    const { data: stage, error } = await supabase
      .from('pipeline_stages')
      .insert([{ ...data, position: nextPosition }])
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating pipeline stage",
        description: error.message,
      });
      throw error;
    }

    setStages(prev => [...prev, stage]);
    
    toast({
      title: "Pipeline stage created",
      description: "The pipeline stage has been created successfully",
    });

    return stage;
  }, [toast]);

  const updateStage = useCallback(async (id: string, data: Partial<PipelineStage>): Promise<PipelineStage> => {
    const { data: stage, error } = await supabase
      .from('pipeline_stages')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating pipeline stage",
        description: error.message,
      });
      throw error;
    }

    setStages(prev => prev.map(s => s.id === id ? stage : s));
    
    toast({
      title: "Pipeline stage updated",
      description: "The pipeline stage has been updated successfully",
    });

    return stage;
  }, [toast]);

  const deleteStage = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('pipeline_stages')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting pipeline stage",
        description: error.message,
      });
      throw error;
    }

    setStages(prev => prev.filter(s => s.id !== id));
    
    toast({
      title: "Pipeline stage deleted",
      description: "The pipeline stage has been deleted successfully",
    });
  }, [toast]);

  const createDeal = useCallback(async (data: Partial<Deal>): Promise<Deal> => {
    const { data: deal, error } = await supabase
      .from('deals')
      .insert([data])
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating deal",
        description: error.message,
      });
      throw error;
    }

    setDeals(prev => [deal, ...prev]);
    
    toast({
      title: "Deal created",
      description: "The deal has been created successfully",
    });

    return deal;
  }, [toast]);

  const updateDeal = useCallback(async (id: string, data: Partial<Deal>): Promise<Deal> => {
    const { data: deal, error } = await supabase
      .from('deals')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating deal",
        description: error.message,
      });
      throw error;
    }

    setDeals(prev => prev.map(d => d.id === id ? deal : d));
    
    toast({
      title: "Deal updated",
      description: "The deal has been updated successfully",
    });

    return deal;
  }, [toast]);

  const deleteDeal = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting deal",
        description: error.message,
      });
      throw error;
    }

    setDeals(prev => prev.filter(d => d.id !== id));
    
    toast({
      title: "Deal deleted",
      description: "The deal has been deleted successfully",
    });
  }, [toast]);

  // Opportunity aliases with field mapping
  const addOpportunity = useCallback(async (data: any): Promise<Deal> => {
    if (!user) throw new Error('User not authenticated');
    
    // Map opportunity fields to deal fields (database schema)
    const dealData = {
      name: data.name, // database uses 'name' not 'title'
      stage_id: data.stage,
      value: data.value,
      probability: data.probability,
      close_date: data.expected_close_date, // database uses 'close_date' not 'expected_close_date'
      pipeline_id: data.pipeline_id,
      contact_id: data.contact_id,
      company_id: data.company_id,
      notes: data.details, // database uses 'notes' not 'details'
      user_id: user.id,
    };
    
    const { data: deal, error } = await supabase
      .from('deals')
      .insert([dealData])
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating deal",
        description: error.message,
      });
      throw error;
    }

    // Convert database result back to Deal interface (for our context)
    const convertedDeal: Deal = {
      id: deal.id,
      title: deal.name, // map 'name' back to 'title' for our Deal interface
      value: deal.value || 0,
      stage_id: deal.stage_id,
      pipeline_id: deal.pipeline_id,
      contact_id: deal.contact_id,
      company_id: deal.company_id,
      created_at: deal.created_at,
      updated_at: deal.updated_at,
    };

    setDeals(prev => [convertedDeal, ...prev]);
    
    toast({
      title: "Deal created",
      description: "The deal has been created successfully",
    });

    return convertedDeal;
  }, [user, toast]);

  const updateOpportunity = useCallback(async (data: any): Promise<Deal> => {
    if (!user) throw new Error('User not authenticated');
    
    // Map opportunity fields to deal fields (database schema)
    const dealData = {
      name: data.name, // database uses 'name' not 'title'
      stage_id: data.stage,
      value: data.value,
      probability: data.probability,
      close_date: data.expected_close_date, // database uses 'close_date' not 'expected_close_date'
      pipeline_id: data.pipeline_id,
      contact_id: data.contact_id,
      company_id: data.company_id,
      notes: data.details, // database uses 'notes' not 'details'
    };
    
    const { data: deal, error } = await supabase
      .from('deals')
      .update(dealData)
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating deal",
        description: error.message,
      });
      throw error;
    }

    // Convert database result back to Deal interface (for our context)
    const convertedDeal: Deal = {
      id: deal.id,
      title: deal.name, // map 'name' back to 'title' for our Deal interface
      value: deal.value || 0,
      stage_id: deal.stage_id,
      pipeline_id: deal.pipeline_id,
      contact_id: deal.contact_id,
      company_id: deal.company_id,
      created_at: deal.created_at,
      updated_at: deal.updated_at,
    };

    setDeals(prev => prev.map(d => d.id === data.id ? convertedDeal : d));
    
    toast({
      title: "Deal updated",
      description: "The deal has been updated successfully",
    });

    return convertedDeal;
  }, [user, toast]);

  React.useEffect(() => {
    if (user) {
      refreshPipelines();
    }
  }, [user, refreshPipelines]);

  const value = React.useMemo(() => ({
    pipelines,
    stages,
    deals,
    opportunities: deals.map(deal => ({
      ...deal,
      name: deal.title,
      stage: deal.stage_id,
      probability: undefined, // Will be fetched from database when needed
      expected_close_date: undefined, // Will be fetched from database when needed
      details: undefined, // Will be fetched from database when needed
    })), // mapped deals for component compatibility
    currentPipeline,
    isLoading,
    loading: isLoading, // alias for isLoading
    createPipeline,
    updatePipeline,
    deletePipeline,
    createStage,
    updateStage,
    deleteStage,
    createDeal,
    updateDeal,
    deleteDeal,
    addOpportunity,
    updateOpportunity,
    deleteOpportunity: deleteDeal, // alias for deleteDeal
    refreshPipelines,
    setCurrentPipeline,
  }), [
    pipelines,
    stages,
    deals,
    currentPipeline,
    isLoading,
    createPipeline,
    updatePipeline,
    deletePipeline,
    createStage,
    updateStage,
    deleteStage,
    createDeal,
    updateDeal,
    deleteDeal,
    addOpportunity,
    updateOpportunity,
    deleteDeal,
    refreshPipelines,
    setCurrentPipeline,
  ]);

  return (
    <PipelinesContext.Provider value={value}>
      {children}
    </PipelinesContext.Provider>
  );
}

export function usePipelines() {
  const context = useContext(PipelinesContext);
  if (context === undefined) {
    throw new Error('usePipelines must be used within a PipelinesProvider');
  }
  return context;
}
