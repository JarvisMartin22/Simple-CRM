
import React, { useState } from 'react';
import { Settings, Plus, BarChart3, Table as TableIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PipelineStagesEditor } from '@/components/pipelines/PipelineStagesEditor';
import { PipelineTableView } from '@/components/pipelines/PipelineTableView';
import { PipelinesProvider, usePipelines } from '@/contexts/PipelinesContext';

const PipelinesContent: React.FC = () => {
  const { pipelines, currentPipeline, setCurrentPipeline } = usePipelines();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table');
  const [stagesEditorOpen, setStagesEditorOpen] = useState(false);

  const handlePipelineChange = (pipelineId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId);
    if (pipeline) {
      setCurrentPipeline(pipeline);
    }
  };

  if (!currentPipeline) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading pipelines...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-h1 font-medium">Pipelines</h1>
          <p className="text-gray-500 mt-1">Manage and track your sales pipeline</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button className="bg-primary" onClick={() => setStagesEditorOpen(true)}>
            <Settings size={16} className="mr-2" />
            <span>Manage Stages</span>
          </Button>
        </div>
      </div>
      
      <Tabs 
        defaultValue={currentPipeline?.id} 
        value={currentPipeline?.id}
        onValueChange={handlePipelineChange}
        className="space-y-4"
      >
        <div className="flex justify-between items-center">
          <TabsList>
            {pipelines.map(pipeline => (
              <TabsTrigger key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'kanban' | 'table')}>
            <ToggleGroupItem value="table">
              <TableIcon className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="kanban">
              <BarChart3 className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {pipelines.map(pipeline => (
          <TabsContent key={pipeline.id} value={pipeline.id} className="mt-0">
            <Card className="shadow-sm p-6">
              {viewMode === 'table' ? (
                <PipelineTableView />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Kanban view is not implemented in this version
                </div>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <PipelineStagesEditor 
        open={stagesEditorOpen} 
        onClose={() => setStagesEditorOpen(false)}
      />
    </div>
  );
};

const PipelinesPage: React.FC = () => {
  return (
    <PipelinesProvider>
      <PipelinesContent />
    </PipelinesProvider>
  );
};

export default PipelinesPage;
