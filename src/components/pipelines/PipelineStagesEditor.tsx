
import React, { useState } from 'react';
import { Pencil, Plus, Trash, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PipelineStage, usePipelines } from '@/contexts/PipelinesContext';

interface PipelineStagesEditorProps {
  open: boolean;
  onClose: () => void;
}

export const PipelineStagesEditor: React.FC<PipelineStagesEditorProps> = ({ open, onClose }) => {
  const { currentPipeline, updateStage, addStage, deleteStage } = usePipelines();
  const [stages, setStages] = useState<PipelineStage[]>(
    currentPipeline?.stages || []
  );
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [newStageName, setNewStageName] = useState<string>('');

  // Reset stages when dialog opens with current pipeline stages
  React.useEffect(() => {
    if (open && currentPipeline) {
      setStages(currentPipeline.stages);
      setEditingStage(null);
      setNewStageName('');
    }
  }, [open, currentPipeline]);

  const handleStartEdit = (stageId: string, currentName: string) => {
    setEditingStage(stageId);
    setNewStageName(currentName);
  };

  const handleSaveEdit = async (stageId: string) => {
    if (newStageName.trim() === '') return;
    
    const updatedStage = {
      id: stageId,
      name: newStageName.trim()
    };
    
    if (currentPipeline) {
      const success = await updateStage(currentPipeline.id, updatedStage);
      if (success) {
        setStages(prev => 
          prev.map(stage => stage.id === stageId ? { ...stage, name: newStageName.trim() } : stage)
        );
        setEditingStage(null);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingStage(null);
    setNewStageName('');
  };

  const handleAddStage = async () => {
    if (newStageName.trim() === '' || !currentPipeline) return;
    
    // Generate a simple ID from the name
    const newStageId = newStageName.trim().toLowerCase().replace(/\s+/g, '-');
    
    const newStage: PipelineStage = {
      id: newStageId,
      name: newStageName.trim()
    };
    
    const success = await addStage(currentPipeline.id, newStage);
    if (success) {
      setNewStageName('');
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!currentPipeline) return;
    
    const success = await deleteStage(currentPipeline.id, stageId);
    if (success) {
      setStages(prev => prev.filter(stage => stage.id !== stageId));
    }
  };

  if (!currentPipeline) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pipeline Stages</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {currentPipeline.stages.map((stage) => (
              <div key={stage.id} className="flex items-center justify-between space-x-2">
                {editingStage === stage.id ? (
                  <>
                    <Input 
                      value={newStageName} 
                      onChange={(e) => setNewStageName(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(stage.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 truncate">{stage.name}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleStartEdit(stage.id, stage.name)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteStage(stage.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex space-x-2">
            <Input 
              placeholder="New stage name" 
              value={newStageName} 
              onChange={(e) => setNewStageName(e.target.value)} 
              className="flex-1"
            />
            <Button onClick={handleAddStage}>
              <Plus className="h-4 w-4 mr-2" />
              Add Stage
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
