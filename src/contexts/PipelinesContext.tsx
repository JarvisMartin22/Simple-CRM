
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface PipelineStage {
  id: string;
  name: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  stages: PipelineStage[];
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Define the shape of the database pipeline object
interface DatabasePipeline {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  // Note: stages is stored as a JSONB column in Postgres, but not recognized by TypeScript
}

export interface Opportunity {
  id: string;
  name: string;
  pipeline_id: string;
  stage: string;
  value: number | null;
  probability: number | null;
  expected_close_date: string | null;
  company_id: string | null;
  contact_id: string | null;
  details: string | null;
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Define the shape of the database deal object (for opportunities)
interface DatabaseDeal {
  id: string;
  name: string;
  pipeline_id: string;
  stage_id?: string;
  value?: number | null;
  probability?: number | null;
  close_date?: string | null;
  company_id?: string | null;
  contact_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  status?: string | null;
}

interface PipelinesContextType {
  pipelines: Pipeline[];
  currentPipeline: Pipeline | null;
  opportunities: Opportunity[];
  loading: boolean;
  error: string | null;
  fetchPipelines: () => Promise<void>;
  fetchOpportunities: (pipelineId: string) => Promise<void>;
  setCurrentPipeline: (pipeline: Pipeline) => void;
  addPipeline: (pipeline: Partial<Pipeline>) => Promise<Pipeline | null>;
  updatePipeline: (pipeline: Partial<Pipeline>) => Promise<Pipeline | null>;
  deletePipeline: (id: string) => Promise<boolean>;
  addOpportunity: (opportunity: Partial<Opportunity>) => Promise<Opportunity | null>;
  updateOpportunity: (opportunity: Partial<Opportunity>) => Promise<Opportunity | null>;
  deleteOpportunity: (id: string) => Promise<boolean>;
  addStage: (pipelineId: string, stage: PipelineStage) => Promise<boolean>;
  updateStage: (pipelineId: string, stage: PipelineStage) => Promise<boolean>;
  deleteStage: (pipelineId: string, stageId: string) => Promise<boolean>;
}

const PipelinesContext = createContext<PipelinesContextType | undefined>(undefined);

export const PipelinesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
        stages: (pipeline as any).stages || [],
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
      // First attempt using RPC if configured
      try {
        const { data, error } = await supabase.rpc('get_opportunities_by_pipeline', {
          p_pipeline_id: pipelineId
        });
        
        if (!error && data) {
          // Map the data to our Opportunity interface
          const mappedOpportunities = (data as any[]).map(item => ({
            id: item.id,
            name: item.name,
            pipeline_id: item.pipeline_id,
            stage: item.stage_id || item.stage, // Handle either format
            value: item.value,
            probability: item.probability,
            expected_close_date: item.close_date || item.expected_close_date,
            company_id: item.company_id,
            contact_id: item.contact_id,
            details: item.notes || item.details,
            custom_fields: item.custom_fields || {},
            created_at: item.created_at,
            updated_at: item.updated_at,
            user_id: item.user_id
          }));
          
          setOpportunities(mappedOpportunities);
          return;
        }
      } catch (rpcError) {
        console.log('RPC not available, falling back to direct query', rpcError);
      }

      // Fallback to direct query from deals table
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('created_at', { ascending: false });
          
      if (error) {
        throw new Error(error.message);
      }

      // Map deals to opportunities
      const mappedOpportunities = (data as DatabaseDeal[]).map(deal => ({
        id: deal.id,
        name: deal.name,
        pipeline_id: deal.pipeline_id,
        stage: deal.stage_id || '', // Use stage_id from deal
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

  const addPipeline = async (pipeline: Partial<Pipeline>) => {
    try {
      if (!pipeline.name) {
        throw new Error('Pipeline name is required');
      }
      
      // Add the user_id to the pipeline data
      const pipelineData = {
        name: pipeline.name,
        description: pipeline.description || null,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      };

      const { data, error } = await supabase
        .from('pipelines')
        .insert([pipelineData as any])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Ensure the returned data has the correct structure
      const formattedPipeline: Pipeline = {
        ...data as DatabasePipeline,
        stages: (pipeline.stages || []) as PipelineStage[]
      };

      setPipelines(prev => [formattedPipeline, ...prev]);
      toast({
        title: 'Success',
        description: 'Pipeline created successfully',
      });
      return formattedPipeline;
    } catch (err: any) {
      console.error('Error adding pipeline:', err);
      toast({
        title: 'Error',
        description: 'Failed to create pipeline',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updatePipeline = async (pipeline: Partial<Pipeline>) => {
    try {
      if (!pipeline.id) {
        throw new Error('Pipeline ID is required');
      }

      // Prepare data for update - remove stages as they're handled separately
      const updateData = {
        name: pipeline.name,
        description: pipeline.description
      };

      const { data, error } = await supabase
        .from('pipelines')
        .update(updateData)
        .eq('id', pipeline.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Ensure the returned data has the correct structure
      const formattedPipeline: Pipeline = {
        ...data as DatabasePipeline,
        stages: pipeline.stages || (currentPipeline?.id === pipeline.id ? currentPipeline.stages : [])
      };

      setPipelines(prev => 
        prev.map(item => (item.id === pipeline.id ? formattedPipeline : item))
      );
      
      if (currentPipeline && currentPipeline.id === pipeline.id) {
        setCurrentPipeline(formattedPipeline);
      }

      toast({
        title: 'Success',
        description: 'Pipeline updated successfully',
      });
      return formattedPipeline;
    } catch (err: any) {
      console.error('Error updating pipeline:', err);
      toast({
        title: 'Error',
        description: 'Failed to update pipeline',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deletePipeline = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pipelines')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      setPipelines(prev => prev.filter(p => p.id !== id));
      if (currentPipeline && currentPipeline.id === id) {
        setCurrentPipeline(pipelines.find(p => p.id !== id) || null);
      }

      toast({
        title: 'Success',
        description: 'Pipeline deleted successfully',
      });
      return true;
    } catch (err: any) {
      console.error('Error deleting pipeline:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete pipeline',
        variant: 'destructive',
      });
      return false;
    }
  };

  const addOpportunity = async (opportunity: Partial<Opportunity>) => {
    try {
      if (!opportunity.name) {
        throw new Error('Opportunity name is required');
      }
      
      if (!opportunity.pipeline_id) {
        throw new Error('Pipeline ID is required');
      }
      
      if (!opportunity.stage) {
        throw new Error('Stage is required');
      }
      
      // Convert to deal format for database
      const dealData = {
        name: opportunity.name,
        pipeline_id: opportunity.pipeline_id,
        stage_id: opportunity.stage,
        value: opportunity.value,
        probability: opportunity.probability,
        close_date: opportunity.expected_close_date,
        company_id: opportunity.company_id,
        contact_id: opportunity.contact_id,
        notes: opportunity.details,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      };

      // Insert into deals table
      const { data, error } = await supabase
        .from('deals')
        .insert([dealData])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Convert back to opportunity format
      const newOpportunity: Opportunity = {
        id: data.id,
        name: data.name,
        pipeline_id: data.pipeline_id,
        stage: data.stage_id,
        value: data.value,
        probability: data.probability,
        expected_close_date: data.close_date,
        company_id: data.company_id,
        contact_id: data.contact_id,
        details: data.notes,
        custom_fields: {},
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id
      };

      setOpportunities(prev => [newOpportunity, ...prev]);
      toast({
        title: 'Success',
        description: 'Deal created successfully',
      });
      return newOpportunity;
    } catch (err: any) {
      console.error('Error adding opportunity:', err);
      toast({
        title: 'Error',
        description: 'Failed to create deal',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateOpportunity = async (opportunity: Partial<Opportunity>) => {
    try {
      if (!opportunity.id) {
        throw new Error('Opportunity ID is required');
      }

      // Convert to deal format for database
      const dealData: any = {};
      if (opportunity.name) dealData.name = opportunity.name;
      if (opportunity.stage) dealData.stage_id = opportunity.stage;
      if (opportunity.value !== undefined) dealData.value = opportunity.value;
      if (opportunity.probability !== undefined) dealData.probability = opportunity.probability;
      if (opportunity.expected_close_date !== undefined) dealData.close_date = opportunity.expected_close_date;
      if (opportunity.company_id !== undefined) dealData.company_id = opportunity.company_id;
      if (opportunity.contact_id !== undefined) dealData.contact_id = opportunity.contact_id;
      if (opportunity.details !== undefined) dealData.notes = opportunity.details;

      // Update the deal
      const { data, error } = await supabase
        .from('deals')
        .update(dealData)
        .eq('id', opportunity.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Convert back to opportunity format for state update
      const updatedOpportunity: Opportunity = {
        ...opportunities.find(o => o.id === opportunity.id)!,
        ...opportunity
      } as Opportunity;

      setOpportunities(prev => 
        prev.map(item => (item.id === opportunity.id ? updatedOpportunity : item))
      );

      toast({
        title: 'Success',
        description: 'Deal updated successfully',
      });
      return updatedOpportunity;
    } catch (err: any) {
      console.error('Error updating opportunity:', err);
      toast({
        title: 'Error',
        description: 'Failed to update deal',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteOpportunity = async (id: string) => {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      setOpportunities(prev => prev.filter(o => o.id !== id));
      toast({
        title: 'Success',
        description: 'Deal deleted successfully',
      });
      return true;
    } catch (err: any) {
      console.error('Error deleting opportunity:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete deal',
        variant: 'destructive',
      });
      return false;
    }
  };

  const addStage = async (pipelineId: string, stage: PipelineStage) => {
    try {
      const pipeline = pipelines.find(p => p.id === pipelineId);
      if (!pipeline) {
        throw new Error('Pipeline not found');
      }

      const newStages = [...pipeline.stages, stage];
      
      // Update the pipeline in the database
      const updateData = {
        stages: newStages
      };
      
      const { error } = await supabase
        .from('pipelines')
        .update(updateData as any)
        .eq('id', pipelineId);

      if (error) {
        throw new Error(error.message);
      }

      setPipelines(prev => 
        prev.map(p => p.id === pipelineId ? { ...p, stages: newStages } : p)
      );

      if (currentPipeline && currentPipeline.id === pipelineId) {
        setCurrentPipeline({ ...currentPipeline, stages: newStages });
      }

      toast({
        title: 'Success',
        description: 'Stage added successfully',
      });
      return true;
    } catch (err: any) {
      console.error('Error adding stage:', err);
      toast({
        title: 'Error',
        description: 'Failed to add stage',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateStage = async (pipelineId: string, stage: PipelineStage) => {
    try {
      const pipeline = pipelines.find(p => p.id === pipelineId);
      if (!pipeline) {
        throw new Error('Pipeline not found');
      }

      const newStages = pipeline.stages.map(s => 
        s.id === stage.id ? stage : s
      );
      
      // Update the pipeline in the database
      const updateData = {
        stages: newStages
      };
      
      const { error } = await supabase
        .from('pipelines')
        .update(updateData as any)
        .eq('id', pipelineId);

      if (error) {
        throw new Error(error.message);
      }

      setPipelines(prev => 
        prev.map(p => p.id === pipelineId ? { ...p, stages: newStages } : p)
      );

      if (currentPipeline && currentPipeline.id === pipelineId) {
        setCurrentPipeline({ ...currentPipeline, stages: newStages });
      }

      toast({
        title: 'Success',
        description: 'Stage updated successfully',
      });
      return true;
    } catch (err: any) {
      console.error('Error updating stage:', err);
      toast({
        title: 'Error',
        description: 'Failed to update stage',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteStage = async (pipelineId: string, stageId: string) => {
    try {
      const pipeline = pipelines.find(p => p.id === pipelineId);
      if (!pipeline) {
        throw new Error('Pipeline not found');
      }

      // Check if there are opportunities in this stage
      const stageOpportunities = opportunities.filter(o => o.stage === stageId);
      if (stageOpportunities.length > 0) {
        throw new Error('Cannot delete stage with opportunities. Please move or delete the opportunities first.');
      }

      const newStages = pipeline.stages.filter(s => s.id !== stageId);
      
      // Update the pipeline in the database
      const updateData = {
        stages: newStages
      };
      
      const { error } = await supabase
        .from('pipelines')
        .update(updateData as any)
        .eq('id', pipelineId);

      if (error) {
        throw new Error(error.message);
      }

      setPipelines(prev => 
        prev.map(p => p.id === pipelineId ? { ...p, stages: newStages } : p)
      );

      if (currentPipeline && currentPipeline.id === pipelineId) {
        setCurrentPipeline({ ...currentPipeline, stages: newStages });
      }

      toast({
        title: 'Success',
        description: 'Stage deleted successfully',
      });
      return true;
    } catch (err: any) {
      console.error('Error deleting stage:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete stage',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchPipelines();
  }, []);

  useEffect(() => {
    if (currentPipeline) {
      fetchOpportunities(currentPipeline.id);
    }
  }, [currentPipeline]);

  return (
    <PipelinesContext.Provider
      value={{
        pipelines,
        currentPipeline,
        opportunities,
        loading,
        error,
        fetchPipelines,
        fetchOpportunities,
        setCurrentPipeline,
        addPipeline,
        updatePipeline,
        deletePipeline,
        addOpportunity,
        updateOpportunity,
        deleteOpportunity,
        addStage,
        updateStage,
        deleteStage,
      }}
    >
      {children}
    </PipelinesContext.Provider>
  );
};

export const usePipelines = () => {
  const context = useContext(PipelinesContext);
  if (context === undefined) {
    throw new Error('usePipelines must be used within a PipelinesProvider');
  }
  return context;
};
