
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';
import { Pipeline } from '@/types/pipeline.types';

interface PipelineTableSearchProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStage: string;
  setFilterStage: (value: string) => void;
  currentPipeline: Pipeline | null;
}

export const PipelineTableSearch: React.FC<PipelineTableSearchProps> = ({
  searchTerm,
  setSearchTerm,
  filterStage,
  setFilterStage,
  currentPipeline
}) => {
  return (
    <div className="flex items-center space-x-2 w-full sm:w-auto">
      <div className="relative w-full sm:w-[300px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search deals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            <span>Filter</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60">
          <div className="space-y-2">
            <h4 className="font-medium mb-2">Filter by Stage</h4>
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger>
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Stages</SelectItem>
                {currentPipeline?.stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
