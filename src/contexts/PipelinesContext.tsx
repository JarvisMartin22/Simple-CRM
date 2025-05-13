
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

      const formattedPipelines = data.map(pipeline => ({
        ...pipeline,
        stages: pipeline.stages || []
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
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setOpportunities(data);
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
      const { data, error } = await supabase
        .from('pipelines')
        .insert([pipeline])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setPipelines(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Pipeline created successfully',
      });
      return data;
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

      const { data, error } = await supabase
        .from('pipelines')
        .update(pipeline)
        .eq('id', pipeline.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setPipelines(prev => prev.map(item => (item.id === pipeline.id ? { ...item, ...data } : item)));
      if (currentPipeline && currentPipeline.id === pipeline.id) {
        setCurrentPipeline({ ...currentPipeline, ...data });
      }

      toast({
        title: 'Success',
        description: 'Pipeline updated successfully',
      });
      return data;
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
      const { data, error } = await supabase
        .from('opportunities')
        .insert([opportunity])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setOpportunities(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Opportunity created successfully',
      });
      return data;
    } catch (err: any) {
      console.error('Error adding opportunity:', err);
      toast({
        title: 'Error',
        description: 'Failed to create opportunity',
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

      const { data, error } = await supabase
        .from('opportunities')
        .update(opportunity)
        .eq('id', opportunity.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setOpportunities(prev => 
        prev.map(item => (item.id === opportunity.id ? { ...item, ...data } : item))
      );

      toast({
        title: 'Success',
        description: 'Opportunity updated successfully',
      });
      return data;
    } catch (err: any) {
      console.error('Error updating opportunity:', err);
      toast({
        title: 'Error',
        description: 'Failed to update opportunity',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteOpportunity = async (id: string) => {
    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      setOpportunities(prev => prev.filter(o => o.id !== id));
      toast({
        title: 'Success',
        description: 'Opportunity deleted successfully',
      });
      return true;
    } catch (err: any) {
      console.error('Error deleting opportunity:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete opportunity',
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
      
      const { error } = await supabase
        .from('pipelines')
        .update({ stages: newStages })
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
      
      const { error } = await supabase
        .from('pipelines')
        .update({ stages: newStages })
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
      
      const { error } = await supabase
        .from('pipelines')
        .update({ stages: newStages })
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
