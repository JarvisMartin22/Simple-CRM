import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePipelines } from '@/contexts/PipelinesContext';
import { Pipeline, PipelineStage } from '@/types/pipeline.types';
import { FormField } from './FormField';

interface CreatePipelineFormProps {
  open?: boolean;
  onClose: () => void;
}

export const CreatePipelineForm: React.FC<CreatePipelineFormProps> = ({ open = false, onClose }) => {
  const { createPipeline, createStage } = usePipelines();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stages, setStages] = useState<PipelineStage[]>([
    { id: uuidv4(), name: 'Lead', position: 1 },
    { id: uuidv4(), name: 'Qualified', position: 2 },
    { id: uuidv4(), name: 'Proposal', position: 3 },
    { id: uuidv4(), name: 'Negotiation', position: 4 },
    { id: uuidv4(), name: 'Closed Won', position: 5 }
  ]);
  
  const [errors, setErrors] = useState<{
    name?: string;
    stages?: string;
  }>({});
  
  const [submitting, setSubmitting] = useState(false);

  const addStage = () => {
    const newStage: PipelineStage = {
      id: uuidv4(),
      name: '',
      position: stages.length + 1
    };
    setStages([...stages, newStage]);
  };

  const removeStage = (id: string) => {
    if (stages.length > 1) {
      setStages(stages.filter(stage => stage.id !== id));
    }
  };

  const updateStageName = (id: string, newName: string) => {
    setStages(stages.map(stage => 
      stage.id === id ? { ...stage, name: newName } : stage
    ));
  };

  const validate = (): boolean => {
    const newErrors: {name?: string; stages?: string} = {};
    
    if (!name.trim()) {
      newErrors.name = 'Pipeline name is required';
    }
    
    // Check if any stage has an empty name
    const hasEmptyStage = stages.some(stage => !stage.name.trim());
    if (hasEmptyStage) {
      newErrors.stages = 'All stages must have a name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setSubmitting(true);
    
    try {
      // First create the pipeline without stages
      const newPipeline = {
        name,
        description: description || null,
      };
      
      const result = await createPipeline(newPipeline);
      if (result) {
        // Then create the stages for the new pipeline
        const stagePromises = stages.map((stage, index) => 
          createStage({
            name: stage.name,
            position: index + 1,
            pipeline_id: result.id
          })
        );
        
        await Promise.all(stagePromises);
        
        // Reset form
        setName('');
        setDescription('');
        setStages([
          { id: uuidv4(), name: 'Lead', position: 1 },
          { id: uuidv4(), name: 'Qualified', position: 2 },
          { id: uuidv4(), name: 'Proposal', position: 3 },
          { id: uuidv4(), name: 'Negotiation', position: 4 },
          { id: uuidv4(), name: 'Closed Won', position: 5 }
        ]);
        setErrors({});
        
        onClose();
      }
    } catch (error) {
      console.error('Error creating pipeline:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to render form fields
  function renderFormFields() {
    return (
      <>
        <FormField 
          id="pipeline-name" 
          label="Pipeline Name" 
          required 
          error={errors.name}
        >
          <Input
            id="pipeline-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Sales Pipeline"
            disabled={submitting}
          />
        </FormField>
        
        <FormField
          id="pipeline-description"
          label="Description"
        >
          <Textarea
            id="pipeline-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description of this pipeline"
            disabled={submitting}
          />
        </FormField>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">
              Pipeline Stages <span className="text-red-500">*</span>
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addStage}
              disabled={submitting}
            >
              <Plus size={16} className="mr-1" /> Add Stage
            </Button>
          </div>
          
          {errors.stages && (
            <p className="text-red-500 text-sm mb-2">{errors.stages}</p>
          )}
          
          <div className="space-y-2">
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center gap-2">
                <Input
                  placeholder={`Stage ${index + 1}`}
                  value={stage.name}
                  onChange={(e) => updateStageName(stage.id, e.target.value)}
                  disabled={submitting}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeStage(stage.id)}
                  disabled={stages.length <= 1 || submitting}
                >
                  <Trash2 size={18} className="text-gray-500 hover:text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Only render the Dialog form and don't render anything when not open
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Pipeline</DialogTitle>
          <DialogDescription>
            Set up your sales pipeline with customized stages.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {renderFormFields()}
          
          <div className="flex justify-end mt-4 space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Pipeline'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
