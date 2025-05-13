
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

// Database model interfaces
export interface DatabasePipeline {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  // Note: stages is stored as a JSONB column in Postgres
  stages?: PipelineStage[]; // Make stages optional since it might not be recognized by TypeScript
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

export interface DatabaseDeal {
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

export interface PipelinesContextType {
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
