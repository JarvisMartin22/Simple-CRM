
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface PipelineStage {
  name: string;
  count: number;
  value: number;
}

interface PipelineOverviewProps {
  stages: PipelineStage[];
  onViewPipelineClick: () => void;
}

const PipelineOverview: React.FC<PipelineOverviewProps> = ({ stages, onViewPipelineClick }) => {
  const pipelineTotal = stages.reduce((sum, stage) => sum + stage.value, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle>Pipeline Overview</CardTitle>
        <CardDescription>Current deals by stage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage) => (
            <div key={stage.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{stage.name}</span>
                <span className="text-gray-500">{stage.count} deals · ${stage.value.toLocaleString()}</span>
              </div>
              <Progress value={(stage.value / pipelineTotal) * 100} className="h-1.5" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="link" className="ml-auto" onClick={onViewPipelineClick}>View Pipeline</Button>
      </CardFooter>
    </Card>
  );
};

export default PipelineOverview;
