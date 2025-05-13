
import React, { createContext, useState, useContext, useEffect } from 'react';
import { usePipelineData } from '@/hooks/usePipelineData';
import { pipelineService } from '@/services/pipelineService';
import { 
  Pipeline, 
  PipelineStage, 
  Opportunity, 
  PipelinesContextType 
} from '@/types/pipeline.types';

const PipelinesContext = createContext<PipelinesContextType | undefined>(undefined);

export const PipelinesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    pipelines,
    setPipelines,
    currentPipeline,
    setCurrentPipeline,
    opportunities,
    setOpportunities,
    loading,
    error,
    fetchPipelines,
    fetchOpportunities,
    toast
  } = usePipelineData();

  const addPipeline = async (pipeline: Partial<Pipeline>) => {
    const newPipeline = await pipelineService.addPipeline(pipeline);
    if (newPipeline) {
      setPipelines(prev => [newPipeline, ...prev]);
      toast({
        title: 'Success',
        description: 'Pipeline created successfully',
      });
      return newPipeline;
    }
    toast({
      title: 'Error',
      description: 'Failed to create pipeline',
      variant: 'destructive',
    });
    return null;
  };

  const updatePipeline = async (pipeline: Partial<Pipeline>) => {
    const updatedPipeline = await pipelineService.updatePipeline(pipeline);
    if (updatedPipeline) {
      setPipelines(prev => 
        prev.map(item => (item.id === pipeline.id ? updatedPipeline : item))
      );
      
      if (currentPipeline && currentPipeline.id === pipeline.id) {
        setCurrentPipeline(updatedPipeline);
      }

      toast({
        title: 'Success',
        description: 'Pipeline updated successfully',
      });
      return updatedPipeline;
    }
    toast({
      title: 'Error',
      description: 'Failed to update pipeline',
      variant: 'destructive',
    });
    return null;
  };

  const deletePipeline = async (id: string) => {
    const success = await pipelineService.deletePipeline(id);
    if (success) {
      setPipelines(prev => prev.filter(p => p.id !== id));
      if (currentPipeline && currentPipeline.id === id) {
        setCurrentPipeline(pipelines.find(p => p.id !== id) || null);
      }

      toast({
        title: 'Success',
        description: 'Pipeline deleted successfully',
      });
      return true;
    }
    toast({
      title: 'Error',
      description: 'Failed to delete pipeline',
      variant: 'destructive',
    });
    return false;
  };

  const addOpportunity = async (opportunity: Partial<Opportunity>) => {
    const newOpportunity = await pipelineService.addOpportunity(opportunity);
    if (newOpportunity) {
      setOpportunities(prev => [newOpportunity, ...prev]);
      toast({
        title: 'Success',
        description: 'Deal created successfully',
      });
      return newOpportunity;
    }
    toast({
      title: 'Error',
      description: 'Failed to create deal',
      variant: 'destructive',
    });
    return null;
  };

  const updateOpportunity = async (opportunity: Partial<Opportunity>) => {
    const updatedOpportunity = await pipelineService.updateOpportunity(opportunity);
    if (updatedOpportunity) {
      setOpportunities(prev => 
        prev.map(item => (item.id === opportunity.id ? {
          ...item,
          ...updatedOpportunity
        } : item))
      );

      toast({
        title: 'Success',
        description: 'Deal updated successfully',
      });
      return updatedOpportunity;
    }
    toast({
      title: 'Error',
      description: 'Failed to update deal',
      variant: 'destructive',
    });
    return null;
  };

  const deleteOpportunity = async (id: string) => {
    const success = await pipelineService.deleteOpportunity(id);
    if (success) {
      setOpportunities(prev => prev.filter(o => o.id !== id));
      toast({
        title: 'Success',
        description: 'Deal deleted successfully',
      });
      return true;
    }
    toast({
      title: 'Error',
      description: 'Failed to delete deal',
      variant: 'destructive',
    });
    return false;
  };

  const addStage = async (pipelineId: string, stage: PipelineStage) => {
    const success = await pipelineService.addStage(pipelineId, stage);
    if (success) {
      setPipelines(prev => 
        prev.map(p => {
          if (p.id === pipelineId) {
            return { ...p, stages: [...p.stages, stage] };
          }
          return p;
        })
      );

      if (currentPipeline && currentPipeline.id === pipelineId) {
        setCurrentPipeline({ 
          ...currentPipeline, 
          stages: [...currentPipeline.stages, stage] 
        });
      }

      toast({
        title: 'Success',
        description: 'Stage added successfully',
      });
      return true;
    }
    toast({
      title: 'Error',
      description: 'Failed to add stage',
      variant: 'destructive',
    });
    return false;
  };

  const updateStage = async (pipelineId: string, stage: PipelineStage) => {
    const success = await pipelineService.updateStage(pipelineId, stage);
    if (success) {
      setPipelines(prev => 
        prev.map(p => {
          if (p.id === pipelineId) {
            return {
              ...p, 
              stages: p.stages.map(s => s.id === stage.id ? stage : s)
            };
          }
          return p;
        })
      );

      if (currentPipeline && currentPipeline.id === pipelineId) {
        setCurrentPipeline({
          ...currentPipeline,
          stages: currentPipeline.stages.map(s => s.id === stage.id ? stage : s)
        });
      }

      toast({
        title: 'Success',
        description: 'Stage updated successfully',
      });
      return true;
    }
    toast({
      title: 'Error',
      description: 'Failed to update stage',
      variant: 'destructive',
    });
    return false;
  };

  const deleteStage = async (pipelineId: string, stageId: string) => {
    const success = await pipelineService.deleteStage(pipelineId, stageId, opportunities);
    if (success) {
      setPipelines(prev => 
        prev.map(p => {
          if (p.id === pipelineId) {
            return {
              ...p,
              stages: p.stages.filter(s => s.id !== stageId)
            };
          }
          return p;
        })
      );

      if (currentPipeline && currentPipeline.id === pipelineId) {
        setCurrentPipeline({
          ...currentPipeline,
          stages: currentPipeline.stages.filter(s => s.id !== stageId)
        });
      }

      toast({
        title: 'Success',
        description: 'Stage deleted successfully',
      });
      return true;
    }
    toast({
      title: 'Error',
      description: 'Failed to delete stage',
      variant: 'destructive',
    });
    return false;
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

export type { Pipeline, PipelineStage, Opportunity };
