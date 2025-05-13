
import { supabase } from '@/integrations/supabase/client';
import { 
  Pipeline, 
  PipelineStage, 
  Opportunity,
  DatabasePipeline, 
  DatabaseDeal 
} from '@/types/pipeline.types';

export const pipelineService = {
  async addPipeline(pipeline: Partial<Pipeline>): Promise<Pipeline | null> {
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
        .insert([pipelineData])
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

      return formattedPipeline;
    } catch (err: any) {
      console.error('Error adding pipeline:', err);
      return null;
    }
  },

  async updatePipeline(pipeline: Partial<Pipeline>): Promise<Pipeline | null> {
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
        stages: pipeline.stages || []
      };

      return formattedPipeline;
    } catch (err: any) {
      console.error('Error updating pipeline:', err);
      return null;
    }
  },

  async deletePipeline(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pipelines')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (err: any) {
      console.error('Error deleting pipeline:', err);
      return false;
    }
  },

  async addOpportunity(opportunity: Partial<Opportunity>): Promise<Opportunity | null> {
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

      // Convert back to opportunity format using DatabaseDeal type
      const dbDeal = data as DatabaseDeal;
      const newOpportunity: Opportunity = {
        id: dbDeal.id,
        name: dbDeal.name,
        pipeline_id: dbDeal.pipeline_id,
        stage: dbDeal.stage_id || '',
        value: dbDeal.value || null,
        probability: dbDeal.probability || null,
        expected_close_date: dbDeal.close_date || null,
        company_id: dbDeal.company_id || null,
        contact_id: dbDeal.contact_id || null,
        details: dbDeal.notes || null,
        custom_fields: {},
        created_at: dbDeal.created_at,
        updated_at: dbDeal.updated_at,
        user_id: dbDeal.user_id
      };

      return newOpportunity;
    } catch (err: any) {
      console.error('Error adding opportunity:', err);
      return null;
    }
  },

  async updateOpportunity(opportunity: Partial<Opportunity>): Promise<Opportunity | null> {
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

      // Need to convert the data back to opportunity format using DatabaseDeal type
      const dbDeal = data as DatabaseDeal;
      return {
        id: dbDeal.id,
        name: dbDeal.name,
        pipeline_id: dbDeal.pipeline_id,
        stage: dbDeal.stage_id || '',
        value: dbDeal.value || null,
        probability: dbDeal.probability || null,
        expected_close_date: dbDeal.close_date || null,
        company_id: dbDeal.company_id || null,
        contact_id: dbDeal.contact_id || null,
        details: dbDeal.notes || null,
        custom_fields: {},
        created_at: dbDeal.created_at,
        updated_at: dbDeal.updated_at,
        user_id: dbDeal.user_id
      };
    } catch (err: any) {
      console.error('Error updating opportunity:', err);
      return null;
    }
  },

  async deleteOpportunity(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (err: any) {
      console.error('Error deleting opportunity:', err);
      return false;
    }
  },

  async addStage(pipelineId: string, stage: PipelineStage): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('pipelines')
        .select('*')
        .eq('id', pipelineId)
        .single();
      
      if (!data) {
        throw new Error('Pipeline not found');
      }

      const pipeline = data as unknown as DatabasePipeline;
      const currentStages = ((pipeline as any).stages || []) as PipelineStage[];
      const newStages = [...currentStages, stage];
      
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

      return true;
    } catch (err: any) {
      console.error('Error adding stage:', err);
      return false;
    }
  },

  async updateStage(pipelineId: string, stage: PipelineStage): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('pipelines')
        .select('*')
        .eq('id', pipelineId)
        .single();
      
      if (!data) {
        throw new Error('Pipeline not found');
      }

      const pipeline = data as unknown as DatabasePipeline;
      const currentStages = ((pipeline as any).stages || []) as PipelineStage[];
      const newStages = currentStages.map(s => 
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

      return true;
    } catch (err: any) {
      console.error('Error updating stage:', err);
      return false;
    }
  },

  async deleteStage(pipelineId: string, stageId: string, opportunities: Opportunity[]): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('pipelines')
        .select('*')
        .eq('id', pipelineId)
        .single();
      
      if (!data) {
        throw new Error('Pipeline not found');
      }

      // Check if there are opportunities in this stage
      const stageOpportunities = opportunities.filter(o => o.stage === stageId);
      if (stageOpportunities.length > 0) {
        throw new Error('Cannot delete stage with opportunities. Please move or delete the opportunities first.');
      }

      const pipeline = data as unknown as DatabasePipeline;
      const currentStages = ((pipeline as any).stages || []) as PipelineStage[];
      const newStages = currentStages.filter(s => s.id !== stageId);
      
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

      return true;
    } catch (err: any) {
      console.error('Error deleting stage:', err);
      return false;
    }
  }
};
